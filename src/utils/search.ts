import { BookmarkNode, SearchQuery } from '../types/bookmarks';
import { extractDomain } from './url';

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
 * Checks if a bookmark node matches parsed search query
 */
export function matchesSearch(
  node: BookmarkNode,
  query: SearchQuery,
  folderPath?: string
): boolean {
  if (!query.raw) return true;

  const nodeTitle = (node.title || '').toLowerCase();
  const nodeUrl = (node.url || '').toLowerCase();
  const nodeDomain = extractDomain(node.url).toLowerCase();
  const nodeFolder = (folderPath || '').toLowerCase();

  // Specific token filters
  if (query.domain && !nodeDomain.includes(query.domain)) {
    return false;
  }

  if (query.folder && !nodeFolder.includes(query.folder)) {
    return false;
  }

  if (query.title && !nodeTitle.includes(query.title)) {
    return false;
  }

  // General text search matches either title, url or domain
  if (query.text) {
    const matchesGeneral =
      nodeTitle.includes(query.text) ||
      nodeUrl.includes(query.text) ||
      nodeDomain.includes(query.text) ||
      nodeFolder.includes(query.text);
    if (!matchesGeneral) return false;
  }

  return true;
}
