import { BookmarkDuplicateGroup, BookmarkNode } from '../../types/bookmarks';
import { normalizeUrl } from '../../utils/url';

function collectBookmarks(nodes: BookmarkNode[], list: BookmarkNode[] = []): BookmarkNode[] {
  for (const node of nodes) {
    if (node.url) {
      list.push(node);
    }
    if (node.children) {
      collectBookmarks(node.children, list);
    }
  }
  return list;
}

export function findDuplicates(tree: BookmarkNode[]): BookmarkDuplicateGroup[] {
  const allBookmarks = collectBookmarks(tree);
  const groupsByNormalized = new Map<string, BookmarkNode[]>();

  for (const item of allBookmarks) {
    if (!item.url) continue;
    const normalized = normalizeUrl(item.url);
    if (!groupsByNormalized.has(normalized)) {
      groupsByNormalized.set(normalized, []);
    }
    groupsByNormalized.get(normalized)!.push(item);
  }

  const duplicates: BookmarkDuplicateGroup[] = [];

  for (const [normalizedUrl, items] of groupsByNormalized.entries()) {
    if (items.length > 1) {
      // Check if all exact or some normalized
      const firstUrl = items[0].url;
      const isExact = items.every((i) => i.url === firstUrl);

      duplicates.push({
        normalizedUrl,
        items,
        reason: isExact ? 'exact' : 'normalized',
      });
    }
  }

  return duplicates;
}
