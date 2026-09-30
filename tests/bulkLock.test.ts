import { it, expect, beforeEach, afterEach } from 'vitest';
import { withBulkOperation, isBulkLockActive, BULK_RELEASE_GRACE_MS } from '../src/services/bookmarks/bulkLock';

const store: Record<string, unknown> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) store[k] = undefined;
  (globalThis as any).chrome = {
    storage: {
      session: {
        set: async (o: Record<string, unknown>) => Object.assign(store, o),
      },
    },
  };
});

afterEach(() => {
  (globalThis as any).chrome = undefined;
});

it('liga a trava durante a operação e devolve o resultado', async () => {
  const result = await withBulkOperation(async () => {
    expect(store.isBulkOperating).toBe(true);
    return 42;
  });
  expect(result).toBe(42);
  expect(store.isBulkOperating).toBe(false);
});

it('libera a trava mesmo com erro e registra quando soltou', async () => {
  const before = Date.now();
  await expect(
    withBulkOperation(async () => {
      expect(store.isBulkOperating).toBe(true);
      throw new Error('falhou no meio');
    })
  ).rejects.toThrow('falhou no meio');
  expect(store.isBulkOperating).toBe(false);
  expect(store.bulkReleasedAt as number).toBeGreaterThanOrEqual(before);
});

it('service worker ainda respeita a trava logo depois de soltar (eventos atrasados)', () => {
  const now = 1_000_000;
  expect(isBulkLockActive({ isBulkOperating: true }, now)).toBe(true);
  expect(isBulkLockActive({ isBulkOperating: false, bulkReleasedAt: now - 100 }, now)).toBe(true);
  expect(isBulkLockActive({ isBulkOperating: false, bulkReleasedAt: now - BULK_RELEASE_GRACE_MS - 1 }, now)).toBe(false);
  expect(isBulkLockActive({}, now)).toBe(false);
});

it('operações sobrepostas não soltam a trava no meio', async () => {
  let finishSecond!: () => void;
  const second = withBulkOperation(() => new Promise<void>((r) => (finishSecond = r)));
  await withBulkOperation(async () => undefined);
  expect(store.isBulkOperating).toBe(true); // a segunda ainda roda

  finishSecond();
  await second;
  expect(store.isBulkOperating).toBe(false);
});
