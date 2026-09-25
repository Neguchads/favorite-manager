import { BookmarkNode, CleanupReport } from '../../types/bookmarks';
import { isValidUrl } from '../../utils/url';

/**
 * Analyzes the bookmark tree for cleanup issues.
 * @param tree - Root bookmark tree
 * @param precomputedDuplicateCount - Pre-computed duplicate count from findDuplicates().
 *   Pass 0 if not yet computed. The caller (useBookmarks) should supply this to avoid
 *   a redundant full-tree traversal.
 */
export function analyzeCleanup(tree: BookmarkNode[], precomputedDuplicateCount = 0): CleanupReport {
  const emptyFolders: BookmarkNode[] = [];
  const missingTitles: BookmarkNode[] = [];
  const invalidUrls: BookmarkNode[] = [];

  function traverse(node: BookmarkNode) {
    // Root or top level bars shouldn't count as user empty folders unless custom
    const isSpecialRoot = node.id === '0' || node.id === '1' || node.id === '2' || node.id === '3';

    if (!node.url && !isSpecialRoot) {
      if (!node.children || node.children.length === 0) {
        emptyFolders.push(node);
      }
    }

    if (node.url) {
      if (!node.title || node.title.trim() === '') {
        missingTitles.push(node);
      }

      if (!isValidUrl(node.url)) {
        invalidUrls.push(node);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const root of tree) {
    traverse(root);
  }

  return {
    emptyFolders,
    missingTitles,
    invalidUrls,
    duplicateCount: precomputedDuplicateCount,
  };
}
