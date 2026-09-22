import { BookmarkNode } from '../../types/bookmarks';

export type LinkHealthStatus = 'ok' | 'broken_404' | 'broken_server' | 'timeout' | 'network_error';

export interface LinkHealthResult {
  bookmark: BookmarkNode;
  status: LinkHealthStatus;
  httpCode?: number;
  error?: string;
  waybackUrl: string;
}

export function getWaybackUrl(url: string): string {
  return `https://web.archive.org/web/*/${url}`;
}

/**
 * Checks a single URL status using background service worker or direct fetch
 */
export async function checkSingleUrlStatus(url: string): Promise<{ status: LinkHealthStatus; httpCode?: number; error?: string }> {
  // If chrome.runtime sendMessage available, use background to avoid CORS
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'CHECK_LINK_STATUS',
        url,
      });

      if (res) {
        if (res.ok) {
          return { status: 'ok', httpCode: res.status };
        }
        if (res.status === 404) {
          return { status: 'broken_404', httpCode: 404 };
        }
        if (res.status >= 500) {
          return { status: 'broken_server', httpCode: res.status };
        }
        if (res.error === 'timeout') {
          return { status: 'timeout' };
        }
        return { status: 'network_error', httpCode: res.status, error: res.error };
      }
    } catch {
      // Background message error, fallback to direct fetch
    }
  }

  // Fallback: direct fetch
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // In standard web environments where host_permissions are not active
    });
    clearTimeout(timer);
    return { status: 'ok', httpCode: response.status || 200 };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { status: 'timeout', error: 'Timeout de conexão (6s)' };
    }
    return { status: 'network_error', error: err?.message || 'Falha de rede' };
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
