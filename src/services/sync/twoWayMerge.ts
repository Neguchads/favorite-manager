import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import { buildExistingFolderMap, ensureHierarchicalFolder } from '../bookmarks/hierarchy';
import { createLocalSnapshot } from '../backup';
import { SyncCatalogItem, MergeResult } from './types';

/**
 * Normalizes URL for consistent cross-browser comparison (handles trailing slashes, protocol variations)
 */
export function normalizeSyncUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    let pathname = url.pathname.replace(/\/+$/, '');
    if (!pathname) pathname = '';
    return `${url.protocol.toLowerCase()}//${url.hostname.toLowerCase()}${url.port ? `:${url.port}` : ''}${pathname}${url.search}`;
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Extracts a flat catalog of bookmarks with their hierarchical folder path from a tree
 */
export function extractCatalogFromTree(tree: BookmarkNode[]): SyncCatalogItem[] {
  const items: SyncCatalogItem[] = [];

  function traverse(nodes: BookmarkNode[], currentPath: string[]) {
    for (const node of nodes) {
      if (node.url) {
        items.push({
          title: node.title || 'Sem título',
          url: node.url,
          folderPath: currentPath.join(' / '),
          dateAdded: node.dateAdded,
        });
      } else if (node.children) {
        // Skip root container node '0' in display path
        const nextPath = node.id === '0' ? [] : [...currentPath, node.title];
        traverse(node.children, nextPath);
      }
    }
  }

  traverse(tree, []);
  return items;
}

/**
 * Merges remote catalog items into local bookmarks tree.
 * Creates any missing bookmarks and folders without duplicating existing ones.
 * Automatically takes a safety snapshot before mutating the tree.
 */
export async function applyRemoteCatalogMerge(
  remoteItems: SyncCatalogItem[],
  onProgress?: (current: number, total: number) => void
): Promise<MergeResult> {
  if (!remoteItems || remoteItems.length === 0) {
    return { localAdded: 0, remoteAdded: 0, itemsProcessed: 0 };
  }

  // 1. Take safety snapshot before performing merge
  await createLocalSnapshot('Snapshot Pré-Sincronização entre Navegadores');

  // Acquire session mutex to suppress background auto-organization during batch sync
  if (typeof chrome !== 'undefined' && chrome.storage?.session) {
    try {
      await chrome.storage.session.set({ isBulkOperating: true });
    } catch {}
  }

  // 2. Fetch current tree and build lookup sets
  const currentTree = await bookmarksService.getTree();
  const localCatalog = extractCatalogFromTree(currentTree);

  // Set of normalized URLs existing locally
  const localUrlSet = new Set<string>();
  for (const item of localCatalog) {
    if (item.url) {
      localUrlSet.add(normalizeSyncUrl(item.url));
    }
  }

  // Map of existing folders for safe hierarchical creation
  const existingFolderMap = buildExistingFolderMap(currentTree);

  let localAdded = 0;
  let itemsProcessed = 0;

  try {
    for (const remoteItem of remoteItems) {
      itemsProcessed++;
      if (onProgress) {
        onProgress(itemsProcessed, remoteItems.length);
      }

      if (!remoteItem.url) continue;

      const normalizedRemote = normalizeSyncUrl(remoteItem.url);

      // If already exists locally, skip to avoid duplicates
      if (localUrlSet.has(normalizedRemote)) {
        continue;
      }

      // Determine target folder
      const folderPath = remoteItem.folderPath?.trim() || 'Barra de favoritos';
      const targetFolderId = await ensureHierarchicalFolder(folderPath, '1', existingFolderMap);

      // Create bookmark locally
      await bookmarksService.create({
        parentId: targetFolderId,
        title: remoteItem.title || remoteItem.url,
        url: remoteItem.url,
      });

      localUrlSet.add(normalizedRemote);
      localAdded++;
    }

    return {
      localAdded,
      remoteAdded: 0,
      itemsProcessed,
    };
  } finally {
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      try {
        await chrome.storage.session.set({ isBulkOperating: false });
      } catch {}
    }
  }
}
