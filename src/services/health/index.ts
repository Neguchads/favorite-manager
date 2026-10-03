import { BookmarkNode } from '../../types/bookmarks';

export type LinkHealthStatus =
  | 'ok'
  | 'redirected'
  | 'broken_404'
  | 'broken_server'
  | 'timeout'
  | 'network_error';

export interface LinkHealthResult {
  bookmark: BookmarkNode;
  status: LinkHealthStatus;
  httpCode?: number;
  error?: string;
  waybackUrl: string;
  redirected?: boolean;
  finalUrl?: string;
}

export function getWaybackUrl(url: string): string {
  return `https://web.archive.org/web/*/${url}`;
}

type UrlCheckResult = {
  status: LinkHealthStatus;
  httpCode?: number;
  error?: string;
  redirected?: boolean;
  finalUrl?: string;
};

const ALIVE_STATUSES = new Set([401, 403, 405, 429]);

// Mesma regra para a resposta do service worker e para o fetch direto
function classifyCheck(
  url: string,
  res: { ok?: boolean; status?: number; redirected?: boolean; finalUrl?: string; error?: string }
): UrlCheckResult {
  const status = res.status || 0;
  if (res.redirected && res.finalUrl && res.finalUrl !== url) {
    return {
      status: 'redirected',
      httpCode: status || 301,
      redirected: true,
      finalUrl: res.finalUrl,
    };
  }
  // 401/403/405/429: o site pede login, recusa robôs/HEAD ou limita requisições, mas a página existe
  if (res.ok || ALIVE_STATUSES.has(status)) {
    return { status: 'ok', httpCode: status || 200 };
  }
  // 404 e 410 (removida de vez): o link está quebrado
  if (status === 404 || status === 410) {
    return { status: 'broken_404', httpCode: status };
  }
  if (status >= 500) {
    return { status: 'broken_server', httpCode: status };
  }
  if (res.error === 'timeout') {
    return { status: 'timeout' };
  }
  return { status: 'network_error', httpCode: status || undefined, error: res.error };
}

/**
 * Checks a single URL status using background service worker or direct fetch.
 * Handles 403/405 gracefully to avoid false broken link reports (Bug 7 fix).
 * Detects 301/302 redirects with final destination URL.
 */
export async function checkSingleUrlStatus(url: string): Promise<UrlCheckResult> {
  // If chrome.runtime sendMessage available, use background to avoid CORS
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'CHECK_LINK_STATUS',
        url,
      });

      if (res) {
        return classifyCheck(url, res);
      }
    } catch {
      // Background message error, fallback to direct fetch
    }
  }

  // Fallback: direct fetch with fallback for HEAD rejection.
  // Sem 'no-cors': as páginas da extensão têm host_permissions e leem o status real.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
    } catch (headErr: any) {
      if (headErr?.name === 'AbortError') throw headErr;
      // Retry with GET
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
    }
    // Resposta opaca não tem status: não dá para afirmar que o link está ok
    if (response.type === 'opaque') {
      return { status: 'network_error', error: 'opaque' };
    }
    return classifyCheck(url, {
      ok: response.ok,
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { status: 'timeout', error: 'Timeout de conexão (6s)' };
    }
    return { status: 'network_error', error: err?.message || 'Falha de rede' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Scans an array of bookmarks in parallel batches with live progress updates
 */
export async function checkBookmarksHealth(
  bookmarks: BookmarkNode[],
  onProgress?: (checkedCount: number, total: number, latestResult?: LinkHealthResult) => void,
  concurrency: number = 10,
  abortSignal?: AbortSignal
): Promise<LinkHealthResult[]> {
  const validBookmarks = bookmarks.filter((b) => b.url && b.url.startsWith('http'));
  const results: LinkHealthResult[] = [];
  let checkedCount = 0;

  for (let i = 0; i < validBookmarks.length; i += concurrency) {
    if (abortSignal?.aborted) break;

    const chunk = validBookmarks.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (bm) => {
      if (abortSignal?.aborted) return null;
      const res = await checkSingleUrlStatus(bm.url!);
      const healthResult: LinkHealthResult = {
        bookmark: bm,
        status: res.status,
        httpCode: res.httpCode,
        error: res.error,
        waybackUrl: getWaybackUrl(bm.url!),
        redirected: res.redirected,
        finalUrl: res.finalUrl,
      };
      checkedCount++;
      if (onProgress) {
        onProgress(checkedCount, validBookmarks.length, healthResult);
      }
      return healthResult;
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const r of chunkResults) {
      if (r) results.push(r);
    }
  }

  return results;
}
