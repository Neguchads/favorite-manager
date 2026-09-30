import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import {
  buildExistingFolderMap,
  ensureHierarchicalFolder,
  systemRootIdFromName,
  SystemRootId,
} from '../bookmarks/hierarchy';
import { createLocalSnapshot } from '../backup';
import { withBulkOperation } from '../bookmarks/bulkLock';
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
const ROOT_IDS = new Set<string>(['1', '2', '3']);

export function extractCatalogFromTree(tree: BookmarkNode[]): SyncCatalogItem[] {
  const items: SyncCatalogItem[] = [];

  function traverse(nodes: BookmarkNode[], currentPath: string[], rootId?: SystemRootId) {
    for (const node of nodes) {
      if (node.url) {
        items.push({
          title: node.title || 'Sem título',
          url: node.url,
          rootId,
          folderPath: currentPath.join(' / '),
          dateAdded: node.dateAdded,
        });
      } else if (node.children) {
        if (node.id === '0') {
          traverse(node.children, [], undefined);
        } else if (!rootId && ROOT_IDS.has(node.id)) {
          // O nome da raiz muda com o idioma do navegador: vai no rootId, não no caminho
          traverse(node.children, [], node.id as SystemRootId);
        } else {
          traverse(node.children, [...currentPath, node.title], rootId);
        }
      }
    }
  }

  traverse(tree, []);
  return items;
}

/**
 * Decide em qual raiz e caminho um item remoto deve ser criado.
 * Aceita o formato antigo (sem rootId, com o nome da raiz no início do caminho).
 */
export function resolveRemoteTarget(
  item: Pick<SyncCatalogItem, 'rootId' | 'folderPath'>
): { rootId: SystemRootId; path: string } {
  const parts = (item.folderPath || '')
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (item.rootId && ROOT_IDS.has(item.rootId)) {
    return { rootId: item.rootId, path: parts.join(' / ') };
  }

  const rootFromName = parts.length > 0 ? systemRootIdFromName(parts[0]) : null;
  if (rootFromName) {
    return { rootId: rootFromName, path: parts.slice(1).join(' / ') };
  }
  return { rootId: '1', path: parts.join(' / ') };
}

/**
 * Merges remote catalog items into local bookmarks tree.
 * Creates any missing bookmarks and folders without duplicating existing ones.
 * Automatically takes a safety snapshot before mutating the tree.
 */
export async function applyRemoteCatalogMerge(
  remoteItems: SyncCatalogItem[],
  onProgress?: (current: number, total: number) => void,
  options: { takeSnapshot?: boolean } = {}
): Promise<MergeResult> {
  if (!remoteItems || remoteItems.length === 0) {
    return { localAdded: 0, remoteAdded: 0, itemsProcessed: 0 };
  }

  // 1. Take safety snapshot before performing merge
  if (options.takeSnapshot !== false) {
    await createLocalSnapshot('Snapshot Pré-Sincronização entre Navegadores');
  }

  // Trava de sessão: a auto-organização do service worker não mexe nos itens sincronizados
  return withBulkOperation(async () => {
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

      // Determine target folder (caminho vazio = a própria raiz)
      const { rootId, path } = resolveRemoteTarget(remoteItem);
      const targetFolderId = await ensureHierarchicalFolder(path, rootId, existingFolderMap);

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
  });
}
