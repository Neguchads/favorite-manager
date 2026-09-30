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

// Fila em memória: serializa leitura-modificação-escrita do índice neste contexto
let indexQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = indexQueue.then(task, task);
  indexQueue = run.catch(() => undefined);
  return run;
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

/** Só para testes: zera a fila e o gerador de ids. */
export function __resetSnapshotStateForTests(): void {
  indexQueue = Promise.resolve();
  lastIdTimestamp = 0;
  idSequence = 0;
}

/**
 * Lê o índice e, se ainda existir o array legado, divide-o no novo layout.
 * Deve rodar dentro da fila. A chave legada só é removida se tudo foi gravado.
 */
async function readIndex(storage: SnapshotStorage): Promise<SnapshotMetadata[]> {
  const res = await storage.get([STORAGE_INDEX_KEY, LEGACY_SNAPSHOTS_KEY]);
  const index: SnapshotMetadata[] = Array.isArray(res[STORAGE_INDEX_KEY]) ? res[STORAGE_INDEX_KEY] : [];
  const legacy: any[] | undefined = res[LEGACY_SNAPSHOTS_KEY];
  if (!Array.isArray(legacy)) return index;

  const known = new Set(index.map((m) => m.id));
  const merged = [...index];
  let complete = true;
  for (const item of legacy) {
    if (!item || typeof item.id !== 'string' || known.has(item.id)) continue;
    // Entra no índice mesmo se a árvore falhar: getSnapshotById recorre ao array legado
    merged.push(toMetadata(item));
    known.add(item.id);
    try {
      if (item.data) await storage.set({ [treeKey(item.id)]: item.data });
    } catch (e) {
      complete = false;
      console.warn('Não foi possível migrar o snapshot legado', item.id, e);
    }
  }

  merged.sort((a, b) => b.timestamp - a.timestamp);
  const dropped = merged.splice(MAX_SNAPSHOTS);
  try {
    await storage.set({ [STORAGE_INDEX_KEY]: merged });
    await storage.remove(dropped.map((m) => treeKey(m.id)));
    if (complete) await storage.remove([LEGACY_SNAPSHOTS_KEY]);
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

      // Árvore antes do índice: o índice nunca aponta para uma árvore inexistente
      for (;;) {
        try {
          await storage.set({ [treeKey(snapshotId)]: tree, [STORAGE_INDEX_KEY]: index });
          break;
        } catch (e) {
          if (!isQuotaError(e) || index.length <= 1) {
            // Desiste: apaga a árvore gravada pela metade e salva o índice sem o novo snapshot
            await storage.remove([treeKey(snapshotId)]);
            await storage.set({ [STORAGE_INDEX_KEY]: index.slice(1) }).catch(() => undefined);
            await storage.remove(trimmed.map((m) => treeKey(m.id)));
            throw e;
          }
          // Sem espaço: descarta o snapshot mais antigo e tenta de novo
          const oldest = index.pop()!;
          trimmed.push(oldest);
          await storage.remove([treeKey(oldest.id)]);
        }
      }
      await storage.remove(trimmed.map((m) => treeKey(m.id)));
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

