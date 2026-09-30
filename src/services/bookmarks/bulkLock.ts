// Trava lida pelo service worker (onCreated) durante operações em massa,
// para a auto-organização não mexer nos favoritos que estão sendo criados em lote.

/** Janela depois de soltar a trava em que o service worker ainda a respeita (eventos onCreated atrasados). */
export const BULK_RELEASE_GRACE_MS = 1500;

// Operações em massa em andamento nesta página: a trava só solta quando a última termina
let activeOperations = 0;

async function setState(state: { isBulkOperating: boolean; bulkReleasedAt?: number }) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      await chrome.storage.session.set(state);
    }
  } catch {}
}

/** Executa fn com a trava ligada e sempre a libera no fim, mesmo com erro. */
export async function withBulkOperation<T>(fn: () => Promise<T>): Promise<T> {
  activeOperations++;
  await setState({ isBulkOperating: true });
  try {
    return await fn();
  } finally {
    activeOperations--;
    if (activeOperations === 0) {
      // Grava quando soltou em vez de agendar um timer: se a aba fechar, a trava não fica presa
      await setState({ isBulkOperating: false, bulkReleasedAt: Date.now() });
    }
  }
}

/** Usado pelo service worker com o conteúdo de chrome.storage.session. */
export function isBulkLockActive(
  state: { isBulkOperating?: unknown; bulkReleasedAt?: unknown },
  now: number = Date.now()
): boolean {
  if (state.isBulkOperating === true) return true;
  return typeof state.bulkReleasedAt === 'number' && now - state.bulkReleasedAt < BULK_RELEASE_GRACE_MS;
}
