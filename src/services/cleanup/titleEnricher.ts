import { BookmarkNode } from '../../types/bookmarks';

const GENERIC_TITLES = new Set([
  'nova guia',
  'new tab',
  'início',
  'inicio',
  'home',
  'homepage',
  'untitled',
  'sem título',
  'sem titulo',
  'página inicial',
  'pagina inicial',
  'login',
  'entrar',
  'sign in',
  'sign up',
  'cadastro',
  '404 not found',
  'not found',
  'default',
  'document',
  'index',
]);

/**
 * Checks whether a bookmark title is considered missing, raw URL, or generic placeholder
 */
export function isGenericOrMissingTitle(title: string | undefined, url: string | undefined): boolean {
  if (!title || !title.trim()) return true;
  const cleanTitle = title.trim().toLowerCase();

  // If title is identical or very similar to raw URL
  if (url && (cleanTitle === url.toLowerCase() || cleanTitle.startsWith('http://') || cleanTitle.startsWith('https://'))) {
    return true;
  }

  // Exact generic matches
  if (GENERIC_TITLES.has(cleanTitle)) {
    return true;
  }

  // Very short non-descriptive numeric titles or file extensions
  if (/^[0-9\-_.]+$/.test(cleanTitle)) {
    return true;
  }

  return false;
}

/**
 * Finds all bookmarks needing title enrichment
 */
export function findBookmarksWithGenericTitles(bookmarks: BookmarkNode[]): BookmarkNode[] {
  return bookmarks.filter((b) => b.url && isGenericOrMissingTitle(b.title, b.url));
}

/**
 * Fetches page title using background worker (CORS-free) or direct fetch
 */
export async function fetchTitleForUrl(url: string): Promise<string | null> {
  // Try background message first
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_PAGE_TITLE',
        url,
      });
      if (response && response.success && response.title) {
        return response.title;
      }
    } catch {
      // background might not be ready, try direct fetch
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1].trim()) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  } catch {
    // Ignore network failures for title fetch
  }

  return null;
}
