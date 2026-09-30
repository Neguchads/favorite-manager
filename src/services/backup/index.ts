import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import { withBulkOperation } from '../bookmarks/bulkLock';

export interface SnapshotMetadata {
  id: string;
  timestamp: number;
  label: string;
  totalBookmarks: number;
  totalFolders: number;
}

export interface SnapshotRecord extends SnapshotMetadata {
  data: BookmarkNode[];
}

// Layout particionado: um índice pequeno só com metadados e uma chave por árvore
const STORAGE_INDEX_KEY = 'efm_snapshots_index';
// Formato antigo: um único array com todas as árvores (migrado na primeira leitura)
const LEGACY_SNAPSHOTS_KEY = 'efm_snapshots';
const SNAPSHOT_TREE_PREFIX = 'efm_snapshot_';
const MAX_SNAPSHOTS = 15;

const treeKey = (id: string) => `${SNAPSHOT_TREE_PREFIX}${id}`;

interface SnapshotStorage {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string[]): Promise<void>;
  /** Todas as chaves guardadas; usado só na coleta de árvores órfãs. */
  keys(): Promise<string[]>;
}

function chromeStorage(): SnapshotStorage {
  const lastError = () => (typeof chrome !== 'undefined' ? chrome.runtime?.lastError : undefined);
  return {
    get: (keys) =>
      new Promise((resolve) => {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      }),
    set: (items) =>
      new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          const err = lastError();
          if (err) reject(new Error(err.message));
          else resolve();
        });
      }),
    remove: (keys) =>
      new Promise((resolve) => {
        if (keys.length === 0) return resolve();
        chrome.storage.local.remove(keys, () => resolve());
      }),
    keys: () =>
      new Promise((resolve) => {
        const local = chrome.storage.local as any;
        // getKeys (Chrome 130+) evita carregar todas as árvores só para listar chaves
        if (typeof local.getKeys === 'function') {
          local.getKeys((keys: string[] | undefined) => resolve(keys || []));
        } else {
          chrome.storage.local.get(null, (res) => resolve(Object.keys(res || {})));
        }
      }),
  };
}

function webStorage(ls: Storage): SnapshotStorage {
  return {
    async get(keys) {
      const res: Record<string, any> = {};
      for (const k of keys) {
        try {
          const raw = ls.getItem(k);
          if (raw !== null) res[k] = JSON.parse(raw);
        } catch {
          // Valor corrompido é tratado como ausente
        }
      }
      return res;
    },
    // Grava na ordem das chaves; QuotaExceededError sobe para o chamador decidir
    async set(items) {
      for (const [k, v] of Object.entries(items)) ls.setItem(k, JSON.stringify(v));
    },
    async remove(keys) {
      for (const k of keys) {
        try {
          ls.removeItem(k);
        } catch {
          // Ignora: remover é melhor esforço
        }
      }
    },
    async keys() {
      const res: string[] = [];
      try {
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k !== null) res.push(k);
        }
      } catch {
        // Implementação sem key()/length: sem coleta de órfãs
      }
      return res;
    },
  };
}

// Sem chrome.storage nem localStorage (ex.: testes em Node) não há onde guardar
function getStorage(): SnapshotStorage | null {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) return chromeStorage();
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return webStorage(localStorage);
  } catch {
    // Acesso ao localStorage pode lançar (ex.: bloqueado pelo navegador)
  }
  return null;
}

function isQuotaError(e: unknown): boolean {
  const err = e as { name?: string; code?: number; message?: string } | null;
  if (!err) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014 ||
    /quota/i.test(err.message ?? '')
  );
}

function toMetadata(item: any): SnapshotMetadata {
  return {
    id: item.id,
    timestamp: item.timestamp,
    label: item.label,
    totalBookmarks: item.totalBookmarks,
    totalFolders: item.totalFolders,
  };
}

const SNAPSHOT_LOCK_NAME = 'efm_snapshots';

// Popup, side panel e página completa rodam em contextos separados: a Web Locks API
// serializa entre eles. Sem ela (ex.: Node antigo), vale só a fila em memória.
function withCrossContextLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator?.locks : undefined;
  if (locks && typeof locks.request === 'function') {
    return locks.request(SNAPSHOT_LOCK_NAME, task) as Promise<T>;
  }
  return task();
}

// Fila em memória: serializa leitura-modificação-escrita do índice neste contexto
let indexQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const locked = () => withCrossContextLock(task);
  const run = indexQueue.then(locked, locked);
  indexQueue = run.catch(() => undefined);
  return run;
}

// Coleta de órfãs roda no máximo uma vez por contexto (carregamento de página)
let orphanCollectionDone = false;

/**
 * Remove chaves de árvore que nenhum snapshot referencia (ex.: sobra de escrita
 * concorrente ou de falha no meio). Deve rodar dentro da trava, logo após gravar o índice.
 */
async function collectOrphanTrees(storage: SnapshotStorage, index: SnapshotMetadata[]): Promise<void> {
  if (orphanCollectionDone) return;
  orphanCollectionDone = true;
  try {
    const res = await storage.get([LEGACY_SNAPSHOTS_KEY]);
    const referenced = new Set(index.map((m) => treeKey(m.id)));
    // Árvores ainda pendentes de migração continuam protegidas
    if (Array.isArray(res[LEGACY_SNAPSHOTS_KEY])) {
      for (const item of res[LEGACY_SNAPSHOTS_KEY]) {
        if (item && typeof item.id === 'string') referenced.add(treeKey(item.id));
      }
    }
    const orphans = (await storage.keys()).filter(
      (k) => k.startsWith(SNAPSHOT_TREE_PREFIX) && !referenced.has(k)
    );
    await storage.remove(orphans);
  } catch (e) {
    console.warn('Não foi possível limpar árvores órfãs de snapshots:', e);
  }
}

// Ids únicos mesmo com várias criações no mesmo milissegundo
let lastIdTimestamp = 0;
let idSequence = 0;

function nextSnapshotId(now: number): string {
  if (now === lastIdTimestamp) {
    idSequence++;
    return `snapshot_${now}_${idSequence}`;
  }
  lastIdTimestamp = now;
  idSequence = 0;
  return `snapshot_${now}`;
}

/** Só para testes: zera a fila, o gerador de ids e a coleta de órfãs. */
export function __resetSnapshotStateForTests(): void {
  indexQueue = Promise.resolve();
  orphanCollectionDone = false;
  lastIdTimestamp = 0;
  idSequence = 0;
}

/**
 * Lê o índice e, se ainda existir o array legado, divide-o no novo layout.
 * Deve rodar dentro da fila/trava.
 *
 * Regras da migração:
 * - Só semeia o índice com o legado enquanto a chave do índice não existe. Depois disso,
 *   item legado fora do índice foi apagado ou descartado pelo limite e não volta.
 * - O array legado é regravado só com os itens cuja árvore ainda não foi gravada; a chave
 *   legada só some quando toda árvore referenciada pelo índice existir na própria chave.
 */
async function readIndex(storage: SnapshotStorage): Promise<SnapshotMetadata[]> {
  const res = await storage.get([STORAGE_INDEX_KEY, LEGACY_SNAPSHOTS_KEY]);
  const hasIndex = Array.isArray(res[STORAGE_INDEX_KEY]);
  const index: SnapshotMetadata[] = hasIndex ? res[STORAGE_INDEX_KEY] : [];
  const legacy: any[] | undefined = res[LEGACY_SNAPSHOTS_KEY];
  if (!Array.isArray(legacy)) return index;

  const merged = [...index];
  const known = new Set(index.map((m) => m.id));
  const candidates: any[] = [];
  const seen = new Set<string>();
  for (const item of legacy) {
    if (!item || typeof item.id !== 'string' || seen.has(item.id)) continue;
    seen.add(item.id);
    if (known.has(item.id)) {
      candidates.push(item);
    } else if (!hasIndex) {
      // Primeira migração: entra no índice mesmo se a árvore falhar (getSnapshotById recorre ao legado)
      merged.push(toMetadata(item));
      known.add(item.id);
      candidates.push(item);
    }
    // Com índice já existente, item fora dele foi apagado/descartado: não reinsere
  }

  merged.sort((a, b) => b.timestamp - a.timestamp);
  const dropped = merged.splice(MAX_SNAPSHOTS);
  const kept = new Set(merged.map((m) => m.id));

  // Confere quais árvores já existem na própria chave e tenta gravar as que faltam
  const live = candidates.filter((item) => kept.has(item.id));
  const existing = live.length > 0 ? await storage.get(live.map((item) => treeKey(item.id))) : {};
  const pending: any[] = [];
  for (const item of live) {
    if (existing[treeKey(item.id)] !== undefined) continue;
    if (!item.data) continue; // Sem árvore no legado: nada a preservar
    try {
      await storage.set({ [treeKey(item.id)]: item.data });
    } catch (e) {
      pending.push(item);
      console.warn('Não foi possível migrar o snapshot legado', item.id, e);
    }
  }

  try {
    await storage.set({ [STORAGE_INDEX_KEY]: merged });
    await storage.remove(dropped.map((m) => treeKey(m.id)));
    if (pending.length === 0) await storage.remove([LEGACY_SNAPSHOTS_KEY]);
    else if (pending.length < legacy.length) await storage.set({ [LEGACY_SNAPSHOTS_KEY]: pending });
  } catch (e) {
    console.warn('Não foi possível gravar o índice migrado de snapshots:', e);
  }
  return merged;
}

export async function createLocalSnapshot(label: string = 'Snapshot Automático'): Promise<string> {
  const tree = await bookmarksService.getTree();

  let bookmarksCount = 0;
  let foldersCount = 0;

  function count(node: BookmarkNode) {
    if (node.url) bookmarksCount++;
    else if (node.id !== '0') foldersCount++;
    node.children?.forEach(count);
  }
  tree.forEach(count);

  const now = Date.now();
  const snapshotId = nextSnapshotId(now);
  const meta: SnapshotMetadata = {
    id: snapshotId,
    timestamp: now,
    label,
    totalBookmarks: bookmarksCount,
    totalFolders: foldersCount,
  };

  const storage = getStorage();
  if (!storage) return snapshotId;

  try {
    await enqueue(async () => {
      const current = await readIndex(storage);
      const index = [meta, ...current.filter((m) => m.id !== snapshotId)];
      const trimmed = index.splice(MAX_SNAPSHOTS);

      // Árvores antigas liberadas para abrir espaço; guardadas em memória para desfazer
      const evicted: { meta: SnapshotMetadata; tree: unknown }[] = [];
      let lastError: unknown = null;

      for (;;) {
        try {
          // Árvore antes do índice: o índice nunca aponta para uma árvore inexistente
          await storage.set({ [treeKey(snapshotId)]: tree, [STORAGE_INDEX_KEY]: index });
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          // Só vale descartar antigos por falta de espaço e enquanto houver antigos
          if (!isQuotaError(e) || index.length <= 1) break;
          const oldest = index.pop()!;
          const saved = await storage.get([treeKey(oldest.id)]);
          evicted.push({ meta: oldest, tree: saved[treeKey(oldest.id)] });
          await storage.remove([treeKey(oldest.id)]);
        }
      }

      if (lastError) {
        // Falhou: o índice antigo não foi tocado. Remove a árvore nova (sem referência)
        // e devolve as árvores antigas liberadas durante as tentativas.
        await storage.remove([treeKey(snapshotId)]);
        for (const { meta: old, tree: oldTree } of evicted.reverse()) {
          if (oldTree === undefined) continue;
          try {
            await storage.set({ [treeKey(old.id)]: oldTree });
          } catch (e) {
            console.warn('Não foi possível devolver a árvore do snapshot', old.id, e);
          }
        }
        if (isQuotaError(lastError)) {
          console.warn('Snapshot novo não cabe no armazenamento; snapshots existentes mantidos.');
          return;
        }
        throw lastError;
      }

      // Índice gravado: só agora as árvores excedentes podem sumir
      await storage.remove(trimmed.map((m) => treeKey(m.id)));
      await collectOrphanTrees(storage, index);
    });
  } catch (e) {
    // createLocalSnapshot nunca lança: um backup que falha não pode travar a operação que o pediu
    console.warn('Não foi possível salvar o snapshot:', e);
  }

  return snapshotId;
}

export async function listSnapshots(): Promise<SnapshotMetadata[]> {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const index = await enqueue(() => readIndex(storage));
    return index.map(toMetadata);
  } catch (e) {
    console.warn('Não foi possível listar os snapshots:', e);
    return [];
  }
}

export async function getSnapshotById(id: string): Promise<SnapshotRecord | null> {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return await enqueue(async () => {
      const meta = (await readIndex(storage)).find((m) => m.id === id);
      if (!meta) return null;
      const key = treeKey(id);
      const res = await storage.get([key, LEGACY_SNAPSHOTS_KEY]);
      // Se a migração ficou incompleta, a árvore ainda pode estar no array legado
      const data =
        res[key] ??
        (Array.isArray(res[LEGACY_SNAPSHOTS_KEY])
          ? res[LEGACY_SNAPSHOTS_KEY].find((s: any) => s?.id === id)?.data
          : undefined);
      if (!data) return null;
      return { ...toMetadata(meta), data };
    });
  } catch (e) {
    console.warn('Não foi possível ler o snapshot:', e);
    return null;
  }
}

export async function deleteSnapshot(id: string): Promise<void> {
  const storage = getStorage();
  if (!storage) return;
  try {
    await enqueue(async () => {
      const index = (await readIndex(storage)).filter((m) => m.id !== id);
      await storage.set({ [STORAGE_INDEX_KEY]: index });
      await storage.remove([treeKey(id)]);
      await collectOrphanTrees(storage, index);
    });
  } catch (e) {
    console.warn('Não foi possível apagar o snapshot:', e);
  }
}

/**
 * Restores a snapshot into the browser's bookmark tree (Bug 3 Fix).
 * Creates a safety snapshot of the current state before replacing nodes.
 */
export async function restoreSnapshot(snapshotId: string): Promise<boolean> {
  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot || !snapshot.data) {
    throw new Error('Snapshot não encontrado ou dados inválidos');
  }

  // 1. Create safety snapshot of current state before replacing
  await createLocalSnapshot('Snapshot prévio à Restauração');

  function findNodeById(nodes: BookmarkNode[], targetId: string): BookmarkNode | null {
    for (const n of nodes) {
      if (n.id === targetId) return n;
      if (n.children) {
        const found = findNodeById(n.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  // Trava de sessão: sem ela, a auto-organização do service worker mexe nos itens restaurados
  await withBulkOperation(async () => {
    // 2. Clear current bookmarks inside editable roots ('1' Bookmarks Bar, '2' Other, '3' Mobile)
    const currentTree = await bookmarksService.getTree();
    for (const rootId of ['1', '2', '3']) {
      const node = findNodeById(currentTree, rootId);
      if (node && node.children) {
        for (const child of [...node.children]) {
          try {
            if (child.url) {
              await bookmarksService.remove(child.id);
            } else {
              await bookmarksService.removeTree(child.id);
            }
          } catch (err) {
            console.warn(`Aviso ao limpar item ${child.id} antes da restauração:`, err);
          }
        }
      }
    }

    // 3. Helper to recreate children recursively
    async function recreateChildren(children: BookmarkNode[], targetParentId: string) {
      for (const child of children) {
        if (child.url) {
          await bookmarksService.create({
            parentId: targetParentId,
            title: child.title,
            url: child.url,
          });
        } else {
          const createdFolder = await bookmarksService.create({
            parentId: targetParentId,
            title: child.title,
          });
          if (child.children && child.children.length > 0) {
            await recreateChildren(child.children, createdFolder.id);
          }
        }
      }
    }

    // 4. Reconstruct items from snapshot.data under '1', '2', '3'
    const snapshotTree = Array.isArray(snapshot.data) ? snapshot.data : [snapshot.data];
    for (const rootId of ['1', '2', '3']) {
      const rootSnapshotNode = findNodeById(snapshotTree, rootId);
      if (rootSnapshotNode && rootSnapshotNode.children && rootSnapshotNode.children.length > 0) {
        await recreateChildren(rootSnapshotNode.children, rootId);
      }
    }
  });

  return true;
}

export function exportBookmarksToJson(tree: BookmarkNode[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tree,
    },
    null,
    2
  );
}

export function downloadJsonFile(content: string, filename: string = 'edge-bookmarks-backup.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export * from './htmlParser';
export * from './htmlExporter';
export * from './importer';
export * from './markdownExporter';

