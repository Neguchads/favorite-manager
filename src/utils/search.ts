import { BookmarkNode, SearchQuery } from '../types/bookmarks';
import { extractDomain } from './url';

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val: number;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Calculates string similarity ratio between 0.0 (completely different) and 1.0 (identical)
 */
export function stringSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return (maxLen - dist) / maxLen;
}

/**
 * Checks if a needle fuzzy-matches any word or substring within haystack
 */
export function fuzzyContains(needle: string, haystack: string, threshold = 0.72): boolean {
  const n = needle.trim().toLowerCase();
  const h = haystack.toLowerCase();

  if (!n) return true;
  if (h.includes(n)) return true;

  // Very short tokens (< 3 chars) require exact substring
  if (n.length < 3) return false;

  // Break haystack into words
  const words = h
    .replace(/[/\-_.:?=&+]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const word of words) {
    // If length is relatively close
    if (Math.abs(word.length - n.length) <= 3) {
      if (stringSimilarity(n, word) >= threshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parses queries like "domain:github.com folder:IA Claude"
 */
export function parseSearchQuery(query: string): SearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return { raw: '', text: '' };
  }

  const result: SearchQuery = {
    raw: trimmed,
    text: '',
  };

  const tokens = trimmed.split(/\s+/);
  const generalTokens: string[] = [];

  for (const token of tokens) {
    if (token.toLowerCase().startsWith('domain:')) {
      result.domain = token.slice(7).toLowerCase();
    } else if (token.toLowerCase().startsWith('folder:')) {
      result.folder = token.slice(7).toLowerCase();
    } else if (token.toLowerCase().startsWith('title:')) {
      result.title = token.slice(6).toLowerCase();
    } else {
      generalTokens.push(token);
    }
  }

  result.text = generalTokens.join(' ').toLowerCase();
  return result;
}

/**
 * Checks if a bookmark node matches parsed search query with Fuzzy Matching support
 */
export function matchesSearch(
  node: BookmarkNode,
  query: SearchQuery,
  folderPath?: string,
  enableFuzzy = true
): boolean {
  if (!query.raw) return true;

  const nodeTitle = (node.title || '').toLowerCase();
  const nodeUrl = (node.url || '').toLowerCase();
  const nodeDomain = extractDomain(node.url).toLowerCase();
  const nodeFolder = (folderPath || '').toLowerCase();

  // Specific token filters
  if (query.domain) {
    const match = enableFuzzy
      ? fuzzyContains(query.domain, nodeDomain, 0.75)
      : nodeDomain.includes(query.domain);
    if (!match) return false;
  }

  if (query.folder) {
    const match = enableFuzzy
      ? fuzzyContains(query.folder, nodeFolder, 0.72)
      : nodeFolder.includes(query.folder);
    if (!match) return false;
  }

  if (query.title) {
    const match = enableFuzzy
      ? fuzzyContains(query.title, nodeTitle, 0.72)
      : nodeTitle.includes(query.title);
    if (!match) return false;
  }

  // General text search: split into search terms, all must match (exact or fuzzy)
  if (query.text) {
    const searchTerms = query.text.split(/\s+/).filter(Boolean);
    const fullHaystack = `${nodeTitle} ${nodeUrl} ${nodeDomain} ${nodeFolder}`;

    for (const term of searchTerms) {
      const termMatches = enableFuzzy
        ? fuzzyContains(term, fullHaystack, 0.72)
        : fullHaystack.includes(term);

      if (!termMatches) return false;
    }
  }

  return true;
}
