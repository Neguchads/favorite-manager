import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createLocalSnapshot,
  listSnapshots,
  getSnapshotById,
  deleteSnapshot,
  __resetSnapshotStateForTests,
} from '../src/services/backup';
import { bookmarksService } from '../src/services/bookmarks';

// chrome.storage.local falso, no estilo callback usado pelo módulo
function createFakeStorage() {
  const store: Record<string, any> = {};
  const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const local = {
    get(keys: string | string[] | null, cb: (res: Record<string, any>) => void) {
      const list = keys === null ? Object.keys(store) : Array.isArray(keys) ? keys : [keys];
      const res: Record<string, any> = {};
      for (const k of list) if (k in store) res[k] = clone(store[k]);
      // Assíncrono de verdade, para expor condições de corrida
      setTimeout(() => cb(res), 0);
    },
    set(items: Record<string, any>, cb?: () => void) {
      setTimeout(() => {
        for (const [k, v] of Object.entries(items)) store[k] = clone(v);
        cb?.();
      }, 0);
    },
    remove(keys: string | string[], cb?: () => void) {
      setTimeout(() => {
        for (const k of Array.isArray(keys) ? keys : [keys]) delete store[k];
        cb?.();
      }, 0);
    },
  };
  return { store, local };
}

const treeKeys = (store: Record<string, any>) => Object.keys(store).filter((k) => k.startsWith('efm_snapshot_'));

describe('snapshots particionados (chrome.storage.local)', () => {
  let fake: ReturnType<typeof createFakeStorage>;

  beforeEach(() => {
    fake = createFakeStorage();
    (globalThis as any).chrome = { storage: { local: fake.local } };
    __resetSnapshotStateForTests();
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
  });

  it('mantém só os 15 mais novos e remove as árvores excedentes', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 17; i++) ids.push(await createLocalSnapshot(`s${i}`));

    const list = await listSnapshots();
    expect(list).toHaveLength(15);
    expect(list.map((s) => s.label)).toEqual(Array.from({ length: 15 }, (_, i) => `s${16 - i}`));
    expect(treeKeys(fake.store)).toHaveLength(15);
    expect(fake.store[`efm_snapshot_${ids[0]}`]).toBeUndefined();
    expect(fake.store[`efm_snapshot_${ids[1]}`]).toBeUndefined();
    // A lista não carrega árvores
    expect((list[0] as any).data).toBeUndefined();
    expect(fake.store.efm_snapshots_index.every((m: any) => m.data === undefined)).toBe(true);
  });

  it('duas criações concorrentes entram no índice', async () => {
    const [a, b] = await Promise.all([createLocalSnapshot('A'), createLocalSnapshot('B')]);
    expect(a).not.toBe(b);
    const list = await listSnapshots();
    expect(list.map((s) => s.id).sort()).toEqual([a, b].sort());
    expect(treeKeys(fake.store)).toHaveLength(2);
  });

  it('getSnapshotById devolve a árvore', async () => {
    const id = await createLocalSnapshot('com árvore');
    const record = await getSnapshotById(id);
    expect(record?.label).toBe('com árvore');
    expect(Array.isArray(record?.data)).toBe(true);
    expect(record!.data.length).toBeGreaterThan(0);
    expect(await getSnapshotById('inexistente')).toBeNull();
  });

  it('deleteSnapshot remove índice e árvore', async () => {
    const id = await createLocalSnapshot('apagar');
    await deleteSnapshot(id);
    expect(await listSnapshots()).toEqual([]);
    expect(treeKeys(fake.store)).toHaveLength(0);
  });

  it('migra o array legado para o novo layout', async () => {
    const tree = [{ id: '0', title: '', children: [{ id: '1', title: 'Barra', children: [] }] }];
    fake.store.efm_snapshots = [
      { id: 'snapshot_2', timestamp: 2, label: 'novo', totalBookmarks: 1, totalFolders: 1, data: tree },
      { id: 'snapshot_1', timestamp: 1, label: 'velho', totalBookmarks: 0, totalFolders: 1, data: tree },
    ];

    const list = await listSnapshots();
    expect(list.map((s) => s.id)).toEqual(['snapshot_2', 'snapshot_1']);
    expect((list[0] as any).data).toBeUndefined();
    expect(fake.store.efm_snapshots_index.every((m: any) => m.data === undefined)).toBe(true);
    expect(treeKeys(fake.store).sort()).toEqual(['efm_snapshot_snapshot_1', 'efm_snapshot_snapshot_2']);
    expect(fake.store.efm_snapshots).toBeUndefined();

    const record = await getSnapshotById('snapshot_1');
    expect(record?.data).toEqual(tree);
    expect(record?.label).toBe('velho');
  });

  it('refaz a migração de árvore que falhou e só remove o legado depois', async () => {
    const tree = [{ id: '0', title: '', children: [{ id: '1', title: 'Barra', children: [] }] }];
    fake.store.efm_snapshots = [
      { id: 'snapshot_2', timestamp: 2, label: 'novo', totalBookmarks: 1, totalFolders: 1, data: tree },
      { id: 'snapshot_1', timestamp: 1, label: 'velho', totalBookmarks: 0, totalFolders: 1, data: tree },
    ];
    // Falha uma única vez ao gravar a árvore de snapshot_1
    let failOnce = true;
    const originalSet = fake.local.set;
    (globalThis as any).chrome.runtime = { lastError: undefined };
    fake.local.set = (items: Record<string, any>, cb?: () => void) => {
      if (failOnce && 'efm_snapshot_snapshot_1' in items) {
        failOnce = false;
        setTimeout(() => {
          (globalThis as any).chrome.runtime.lastError = { message: 'falha simulada' };
          cb?.();
          (globalThis as any).chrome.runtime.lastError = undefined;
        }, 0);
        return;
      }
      originalSet(items, cb);
    };

    await listSnapshots();
    expect(fake.store.efm_snapshot_snapshot_1).toBeUndefined();
    expect(fake.store.efm_snapshots).toBeDefined();
    // Enquanto pendente, a árvore ainda sai do array legado
    expect((await getSnapshotById('snapshot_1'))?.data).toEqual(tree);

    const list = await listSnapshots();
    expect(list.map((s) => s.id)).toEqual(['snapshot_2', 'snapshot_1']);
    expect(fake.store.efm_snapshot_snapshot_1).toEqual(tree);
    expect(fake.store.efm_snapshots).toBeUndefined();
    expect((await getSnapshotById('snapshot_1'))?.data).toEqual(tree);
  });

  it('snapshot apagado não reaparece enquanto o legado existe', async () => {
    const tree = [{ id: '0', title: '', children: [] }];
    fake.store.efm_snapshots = [
      { id: 'snapshot_2', timestamp: 2, label: 'novo', totalBookmarks: 0, totalFolders: 0, data: tree },
      { id: 'snapshot_1', timestamp: 1, label: 'velho', totalBookmarks: 0, totalFolders: 0, data: tree },
    ];
    // Todas as gravações de árvore de snapshot_1 falham: o legado continua existindo
    const originalSet = fake.local.set;
    (globalThis as any).chrome.runtime = { lastError: undefined };
    fake.local.set = (items: Record<string, any>, cb?: () => void) => {
      if ('efm_snapshot_snapshot_1' in items) {
        setTimeout(() => {
          (globalThis as any).chrome.runtime.lastError = { message: 'falha simulada' };
          cb?.();
          (globalThis as any).chrome.runtime.lastError = undefined;
        }, 0);
        return;
      }
      originalSet(items, cb);
    };

    expect((await listSnapshots()).map((s) => s.id)).toEqual(['snapshot_2', 'snapshot_1']);
    expect(fake.store.efm_snapshots).toBeDefined();
    await deleteSnapshot('snapshot_1');
    expect((await listSnapshots()).map((s) => s.id)).toEqual(['snapshot_2']);
    expect((await listSnapshots()).map((s) => s.id)).toEqual(['snapshot_2']);
    expect(await getSnapshotById('snapshot_1')).toBeNull();
  });

  it('remove árvores órfãs e mantém as referenciadas', async () => {
    const kept = await createLocalSnapshot('mantida');
    __resetSnapshotStateForTests();
    fake.store.efm_snapshot_snapshot_orfao = [{ id: '0', title: '', children: [] }];
    fake.store.efm_snapshots_index_extra = 'não é árvore';

    const created = await createLocalSnapshot('nova');
    expect(fake.store.efm_snapshot_snapshot_orfao).toBeUndefined();
    expect(fake.store[`efm_snapshot_${kept}`]).toBeDefined();
    expect(fake.store[`efm_snapshot_${created}`]).toBeDefined();
    expect(fake.store.efm_snapshots_index_extra).toBe('não é árvore');
    expect((await listSnapshots()).map((s) => s.id).sort()).toEqual([kept, created].sort());
  });

  it('serializa entre contextos com navigator.locks', async () => {
    const request = vi.fn((_name: string, fn: () => Promise<unknown>) => fn());
    vi.stubGlobal('navigator', { locks: { request } });
    try {
      await createLocalSnapshot('com trava');
      expect(request).toHaveBeenCalled();
      expect(request.mock.calls.every(([name]) => name === 'efm_snapshots')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('funciona sem navigator.locks (fila em memória)', async () => {
    vi.stubGlobal('navigator', undefined);
    try {
      const [a, b] = await Promise.all([createLocalSnapshot('A'), createLocalSnapshot('B')]);
      expect((await listSnapshots()).map((s) => s.id).sort()).toEqual([a, b].sort());
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('snapshots no fallback localStorage', () => {
  let store: Record<string, string>;
  let quota: number;

  beforeEach(() => {
    store = {};
    quota = Infinity;
    (globalThis as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        const used = Object.entries(store)
          .filter(([key]) => key !== k)
          .reduce((n, [, val]) => n + val.length, 0);
        if (used + v.length > quota) {
          const err = new Error('quota');
          err.name = 'QuotaExceededError';
          throw err;
        }
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    __resetSnapshotStateForTests();
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  it('usa o mesmo layout particionado', async () => {
    const id = await createLocalSnapshot('local');
    expect(store[`efm_snapshot_${id}`]).toBeDefined();
    expect(JSON.parse(store.efm_snapshots_index)[0].data).toBeUndefined();
    expect((await getSnapshotById(id))?.label).toBe('local');
  });

  it('descarta os mais antigos quando estoura a cota e nunca lança', async () => {
    const first = await createLocalSnapshot('1');
    const oneTree = store[`efm_snapshot_${first}`].length;
    // Cabe cerca de duas árvores
    quota = oneTree * 2 + 2000;
    await createLocalSnapshot('2');
    const third = await createLocalSnapshot('3');

    const list = await listSnapshots();
    expect(list[0].id).toBe(third);
    expect(list.map((s) => s.label)).not.toContain('1');
    expect(store[`efm_snapshot_${first}`]).toBeUndefined();

    // Cota menor que uma árvore: não lança
    quota = 10;
    await expect(createLocalSnapshot('4')).resolves.toMatch(/^snapshot_/);
  });

  it('não apaga os snapshots antigos se a nova árvore não cabe nem sozinha', async () => {
    const smallTree = [{ id: '0', title: '', children: [] }];
    const index = [
      { id: 'snapshot_2', timestamp: 2, label: 'dois', totalBookmarks: 0, totalFolders: 0 },
      { id: 'snapshot_1', timestamp: 1, label: 'um', totalBookmarks: 0, totalFolders: 0 },
    ];
    store.efm_snapshots_index = JSON.stringify(index);
    store.efm_snapshot_snapshot_1 = JSON.stringify(smallTree);
    store.efm_snapshot_snapshot_2 = JSON.stringify(smallTree);

    // Qualquer gravação maior que N falha; a árvore nova sozinha passa de N
    const newTreeSize = JSON.stringify(await bookmarksService.getTree()).length;
    const maxWrite = Math.floor(newTreeSize / 2);
    expect(maxWrite).toBeGreaterThan(JSON.stringify(index).length + 200);
    const ls = (globalThis as any).localStorage;
    const baseSet = ls.setItem;
    ls.setItem = (k: string, v: string) => {
      if (v.length > maxWrite) {
        const err = new Error('quota');
        err.name = 'QuotaExceededError';
        throw err;
      }
      baseSet(k, v);
    };

    const id = await createLocalSnapshot('grande');
    const list = await listSnapshots();
    expect(list.map((s) => s.id)).toEqual(['snapshot_2', 'snapshot_1']);
    expect(store[`efm_snapshot_${id}`]).toBeUndefined();
    expect((await getSnapshotById('snapshot_1'))?.data).toEqual(smallTree);
    expect((await getSnapshotById('snapshot_2'))?.data).toEqual(smallTree);
  });
});

describe('snapshots sem armazenamento algum', () => {
  it('não lança sem chrome e sem localStorage', async () => {
    __resetSnapshotStateForTests();
    await expect(createLocalSnapshot('nada')).resolves.toMatch(/^snapshot_/);
    await expect(listSnapshots()).resolves.toEqual([]);
  });
});
