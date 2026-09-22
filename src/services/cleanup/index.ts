import { BookmarkNode, CleanupReport } from '../../types/bookmarks';
import { isValidUrl } from '../../utils/url';
import { findDuplicates } from '../duplicates';

export function analyzeCleanup(tree: BookmarkNode[]): CleanupReport {
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

  const duplicates = findDuplicates(tree);

  return {
    emptyFolders,
    missingTitles,
    invalidUrls,
    duplicateCount: duplicates.reduce((acc, g) => acc + g.items.length, 0),
  };
}
