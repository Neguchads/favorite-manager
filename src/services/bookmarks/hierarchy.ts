import { AiProposedPlan } from '../../ai/types';
import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from './index';

export const PROTECTED_FOLDER_IDS = new Set(['0', '1', '2', '3', 'mobile', 'synced']);

/**
 * Ensures that a multi-level folder path (e.g. "Jogos & Games / Sony & PlayStation")
 * exists under rootParentId ('1' = Barra de favoritos).
 * Reuses existing folders whenever possible to avoid duplicate folder creation.
 */
export async function ensureHierarchicalFolder(
  pathString: string,
  rootParentId: string = '1',
  existingPathMap: Map<string, string>
): Promise<string> {
  const parts = pathString
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  let currentParentId = rootParentId;
  let accumulatedPath = '';

  for (const part of parts) {
    accumulatedPath = accumulatedPath ? `${accumulatedPath} / ${part}` : part;
    const key = accumulatedPath.toLowerCase();

    if (existingPathMap.has(key)) {
      currentParentId = existingPathMap.get(key)!;
    } else {
      // Create folder under currentParentId
      const created = await bookmarksService.create({
        parentId: currentParentId,
        title: part,
      });
      existingPathMap.set(key, created.id);
      currentParentId = created.id;
    }
  }

  return currentParentId;
}

/**
 * Builds a lookup map of existing folder paths in the browser tree.
 * Allows matching existing folders like "Jogos & Games" or "Barra de favoritos / GEEK / JOGOS".
 */
export function buildExistingFolderMap(tree: BookmarkNode[]): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(nodes: BookmarkNode[], currentPath: string) {
    for (const node of nodes) {
      if (node.children || !node.url) {
        const path = currentPath ? `${currentPath} / ${node.title}` : node.title;
        map.set(path.toLowerCase(), node.id);
        map.set(node.title.toLowerCase(), node.id);
        if (node.children) {
          traverse(node.children, path);
        }
      }
    }
  }

  traverse(tree, '');
  return map;
}

/**
 * Recursively scans the tree and deletes folders that have ZERO bookmarks and ZERO subfolders.
 * Operates bottom-up (leaves first) so that if all children are pruned, the parent can also be pruned if empty.
 * Never touches system root folders (0, 1, 2, mobile).
 */
export async function pruneEmptyFolders(
  tree?: BookmarkNode[],
  protectedIds: Set<string> = PROTECTED_FOLDER_IDS
): Promise<number> {
  const currentTree = tree || (await bookmarksService.getTree());
  let prunedCount = 0;

  async function processNode(node: BookmarkNode): Promise<boolean> {
    // If it's a bookmark (has URL), it's not a folder and cannot be pruned
    if (node.url) {
      return false;
    }

    // Process children first (bottom-up: leaves first)
    if (node.children && node.children.length > 0) {
      const remainingChildren: BookmarkNode[] = [];
      for (const child of node.children) {
        const wasPruned = await processNode(child);
        if (!wasPruned) {
          remainingChildren.push(child);
        }
      }
      node.children = remainingChildren;
    }

    // Never delete protected system roots (Bookmarks Bar, Other Bookmarks, Mobile)
    if (protectedIds.has(node.id)) {
      return false;
    }

    // Check if truly empty (no bookmarks and no subfolders left)
    const isEmpty = !node.children || node.children.length === 0;
    if (isEmpty) {
      try {
        await bookmarksService.remove(node.id);
        prunedCount++;
        return true;
      } catch (err) {
        console.warn(`Não foi possível remover pasta [${node.id}] ${node.title}:`, err);
        return false;
      }
    }

    return false;
  }

  for (const rootNode of currentTree) {
    await processNode(rootNode);
  }

  return prunedCount;
}

export type ProgressCallback = (current: number, total: number, percentage: number) => void;

/**
 * Executes an AI plan with full hierarchy support, creating master and subfolders
 * and moving bookmarks into their designated targets with high-performance concurrent chunking.
 * Automatically prunes any folders that become empty after the moves.
 */
export async function executeAiPlanWithHierarchy(
  plan: AiProposedPlan,
  tree: BookmarkNode[],
  rootParentId: string = '1',
  onProgress?: ProgressCallback,
  cleanEmptyFolders: boolean = true
): Promise<{ createdFoldersCount: number; movedCount: number; skippedCount: number; prunedFoldersCount: number }> {
  const existingPathMap = buildExistingFolderMap(tree);
  const targetFolderIdMap = new Map<string, string>();

  // Map each existing bookmark to its current parent folder
  const currentParentMap = new Map<string, string>();
  function mapCurrentParents(nodes: BookmarkNode[]) {
    for (const node of nodes) {
      if (node.parentId) {
        currentParentMap.set(node.id, node.parentId);
      }
      if (node.children) {
        mapCurrentParents(node.children);
      }
    }
  }
  mapCurrentParents(tree);

  let createdFoldersCount = 0;

  // 1. Resolve or create all target folders
  for (const folderPath of plan.suggestedFolders) {
    const key = folderPath.toLowerCase();
    if (!targetFolderIdMap.has(key)) {
      const initialMapSize = existingPathMap.size;
      const folderId = await ensureHierarchicalFolder(folderPath, rootParentId, existingPathMap);
      targetFolderIdMap.set(key, folderId);
      if (existingPathMap.size > initialMapSize) {
        createdFoldersCount += existingPathMap.size - initialMapSize;
      }
    }
  }

  // 2. Filter moves: identify which bookmarks actually need to move
  let skippedCount = 0;
  const movesToExecute: typeof plan.moves = [];

  for (const move of plan.moves) {
    const targetFolderId = targetFolderIdMap.get(move.targetFolder.toLowerCase());
    if (!targetFolderId) continue;

    const currentParentId = currentParentMap.get(move.bookmarkId);
    if (currentParentId === targetFolderId) {
      skippedCount++;
    } else {
      movesToExecute.push(move);
    }
  }

  const totalMoves = movesToExecute.length;
  let movedCount = 0;

  // 3. High-performance concurrent batching (chunks of 25)
  if (totalMoves > 0) {
    const CHUNK_SIZE = 25;
    let processed = 0;

    for (let i = 0; i < movesToExecute.length; i += CHUNK_SIZE) {
      const chunk = movesToExecute.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (move) => {
          const targetFolderId = targetFolderIdMap.get(move.targetFolder.toLowerCase())!;
          try {
            await bookmarksService.move(move.bookmarkId, { parentId: targetFolderId });
            movedCount++;
          } catch (err) {
            console.warn(`Erro ao mover favorito ${move.bookmarkId} (${move.bookmarkTitle}):`, err);
          }
        })
      );

      processed += chunk.length;
      if (onProgress) {
        const percent = Math.min(100, Math.round((processed / totalMoves) * 100));
        onProgress(processed, totalMoves, percent);
      }
    }
  } else {
    if (onProgress) onProgress(0, 0, 100);
  }

  // 4. Safely prune folders that became empty as a result of moving
  let prunedFoldersCount = 0;
  if (cleanEmptyFolders) {
    prunedFoldersCount = await pruneEmptyFolders();
  }

  return { createdFoldersCount, movedCount, skippedCount, prunedFoldersCount };
}
