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
 * Checks if a needle fuzzy-matches any word or substring within haystack.
 * Fast path: exact substring check runs first (O(n) via indexOf).
 * Levenshtein is only engaged for needles with 4+ characters to avoid
 * costly matrix allocations on every keystroke for common short queries.
 */
export function fuzzyContains(needle: string, haystack: string, threshold = 0.72): boolean {
  const n = needle.trim().toLowerCase();
  const h = haystack.toLowerCase();

  if (!n) return true;
  // Fast O(n) substring check — covers the vast majority of queries
  if (h.includes(n)) return true;

  // Short tokens (< 4 chars) require exact substring — skip costly Levenshtein
  if (n.length < 4) return false;

  // Break haystack into words — only reached for 4+ char needles that aren't substrings
  const words = h
    .replace(/[/\-_.:?=&+]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const word of words) {
    // Only compare words of similar length to avoid false positives and skip obvious misses
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

/**
 * Calculates a BM25-inspired relevance score for search ranking.
 * Higher score = more relevant result.
 * Priorities:
 * 1. Exact title match or title starts with query (Prefix match)
 * 2. Exact domain match or domain starts with query (e.g. "github" -> github.com)
 * 3. Title contains term as word boundary
 * 4. Title contains term as substring
 * 5. URL and folder matches
 * 6. Recency bonus for recently added bookmarks
 */
export function scoreSearchRelevance(
  node: BookmarkNode,
  query: SearchQuery,
  folderPath?: string
): number {
  if (!query.raw) return 0;

  const textQuery = (query.text || query.raw).toLowerCase().trim();
  if (!textQuery) return 0;

  const title = (node.title || '').toLowerCase().trim();
  const url = (node.url || '').toLowerCase().trim();
  const domain = extractDomain(node.url).toLowerCase().trim();
  const folder = (folderPath || '').toLowerCase().trim();

  let score = 0;

  // 1. Title matching
  if (title === textQuery) {
    score += 160;
  } else if (title.startsWith(textQuery)) {
    score += 110;
  } else if (title.includes(` ${textQuery}`) || title.includes(`-${textQuery}`) || title.includes(`/${textQuery}`)) {
    score += 75;
  } else if (title.includes(textQuery)) {
    score += 45;
  }

  // 2. Domain matching
  if (domain === textQuery || domain === `www.${textQuery}` || domain.startsWith(`${textQuery}.`)) {
    score += 100;
  } else if (domain.includes(textQuery)) {
    score += 55;
  }

  // 3. Multi-token query weighting (BM25 term coverage)
  const tokens = textQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    let matchedTokens = 0;
    for (const token of tokens) {
      if (title.startsWith(token)) score += 30;
      else if (title.includes(token)) score += 15;
      if (domain.includes(token)) score += 20;
      if (url.includes(token)) score += 10;
      if (folder.includes(token)) score += 5;
      if (title.includes(token) || domain.includes(token) || url.includes(token)) {
        matchedTokens++;
      }
    }
    if (matchedTokens === tokens.length) {
      score += 40;
    }
  }

  // 4. Explicit token filters bonus
  if (query.domain && domain.includes(query.domain)) score += 50;
  if (query.title && title.includes(query.title)) score += 50;
  if (query.folder && folder.includes(query.folder)) score += 30;

  // 5. Recency tie-breaker (max 10 points)
  if (node.dateAdded) {
    const ageDays = (Date.now() - node.dateAdded) / (1000 * 60 * 60 * 24);
    if (ageDays < 30) {
      score += Math.max(0, 10 - Math.floor(ageDays / 3));
    }
  }

  return score;
}
