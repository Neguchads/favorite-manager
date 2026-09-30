import { AiProposedPlan } from '../../ai/types';
import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from './index';

export const PROTECTED_FOLDER_IDS = new Set(['0', '1', '2', '3', 'mobile', 'synced']);

export type SystemRootId = '1' | '2' | '3';

/** Nomes das raízes do navegador (pt-BR e inglês), em minúsculas. */
export const SYSTEM_ROOT_NAMES = new Set([
  'barra de favoritos',
  'outros favoritos',
  'favoritos móveis',
  'favoritos moveis',
  'bookmarks bar',
  'other bookmarks',
  'mobile bookmarks',
  'bookmarks toolbar',
  'favorites bar',
  'other favorites',
  'mobile favorites',
]);

/** Id da raiz de sistema pelo nome ('1' barra, '2' outros, '3' móveis), ou null se não for raiz. */
export function systemRootIdFromName(name: string): SystemRootId | null {
  const n = name.toLowerCase().trim();
  if (!SYSTEM_ROOT_NAMES.has(n)) return null;
  if (n === 'outros favoritos' || n === 'other bookmarks' || n === 'other favorites') return '2';
  if (n.includes('móveis') || n.includes('moveis') || n.includes('mobile')) return '3';
  return '1';
}

/**
 * Ensures that a multi-level folder path (e.g. "Jogos & Games / Sony & PlayStation")
 * exists under rootParentId ('1' = Barra de favoritos).
 * Reuses existing folders whenever possible to avoid duplicate folder creation.
 * Indexed by `parentId:folderTitle.toLowerCase()` to prevent cross-root or subfolder duplication.
 */
export async function ensureHierarchicalFolder(
  pathString: string,
  rootParentId: string = '1',
  existingFolderMap: Map<string, string>,
  onFolderCreated?: (folderId: string) => void
): Promise<string> {
  const parts = pathString
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  let currentParentId = rootParentId;

  for (const part of parts) {
    const key = `${currentParentId}:${part.toLowerCase()}`;

    if (existingFolderMap.has(key)) {
      currentParentId = existingFolderMap.get(key)!;
    } else {
      // Create folder under currentParentId
      const created = await bookmarksService.create({
        parentId: currentParentId,
        title: part,
      });
      existingFolderMap.set(key, created.id);
      currentParentId = created.id;
      if (onFolderCreated) {
        onFolderCreated(created.id);
      }
    }
  }

  return currentParentId;
}

/**
 * Builds a lookup map of existing folders in the browser tree.
 * Maps `${parentId}:${folderTitle.toLowerCase()}` -> `folderId`
 * ensuring exact parent-child matching without title collisions or root prefix issues.
 */
export function buildExistingFolderMap(tree: BookmarkNode[]): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(nodes: BookmarkNode[], parentId?: string) {
    for (const node of nodes) {
      if (node.children || !node.url) {
        const effectiveParentId = node.parentId || parentId;
        if (effectiveParentId) {
          map.set(`${effectiveParentId}:${node.title.toLowerCase()}`, node.id);
        }
        if (node.children) {
          traverse(node.children, node.id);
        }
      }
    }
  }

  traverse(tree, undefined);
  return map;
}

/**
 * Recursively scans the tree and deletes folders that have ZERO bookmarks and ZERO subfolders.
 * Operates bottom-up (leaves first) so that if all children are pruned, the parent can also be pruned if empty.
 * Never touches system root folders (0, 1, 2, 3, mobile, synced).
 * If `candidateFolderIds` is provided, only removes folders that are in the candidate set.
 */
export async function pruneEmptyFolders(
  tree?: BookmarkNode[],
  protectedIds: Set<string> = PROTECTED_FOLDER_IDS,
  candidateFolderIds?: Set<string>
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
    const isCandidate = !candidateFolderIds || candidateFolderIds.has(node.id);

    if (isEmpty && isCandidate) {
      try {
        await bookmarksService.remove(node.id);
        prunedCount++;
        return true;
      } catch (err) {
        // remove() só falha se a pasta ganhou itens depois da leitura: manter a pasta
        console.warn(`Pasta [${node.id}] ${node.title} não está vazia; mantida.`, err);
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
 * Sorts child folders, subfolders and all bookmarks under parentId in alphabetical order (A-Z).
 * Folders are placed first in alphabetical order, followed by bookmarks in alphabetical order.
 * Recursively sorts subfolders and all bookmarks inside them if recursive is true.
 */
export async function sortFoldersAlphabetically(
  parentId: string = '1',
  recursive: boolean = true
): Promise<{ sortedFoldersCount: number; sortedBookmarksCount: number }> {
  let sortedFoldersCount = 0;
  let sortedBookmarksCount = 0;

  if (parentId === 'all') {
    const res1 = await sortFoldersAlphabetically('1', recursive);
    const res2 = await sortFoldersAlphabetically('2', recursive);
    return {
      sortedFoldersCount: res1.sortedFoldersCount + res2.sortedFoldersCount,
      sortedBookmarksCount: res1.sortedBookmarksCount + res2.sortedBookmarksCount,
    };
  }

  try {
    const subTree = await bookmarksService.getSubTree(parentId);
    if (!subTree || subTree.length === 0 || !subTree[0].children) {
      return { sortedFoldersCount: 0, sortedBookmarksCount: 0 };
    }

    const children = subTree[0].children;

    // Separate folders and bookmarks
    const folders = children.filter((c) => !c.url);
    const bookmarks = children.filter((c) => Boolean(c.url));

    // Sort folders alphabetically (A-Z) using pt-BR natural collation
    folders.sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base', numeric: true })
    );

    // Sort bookmarks alphabetically (A-Z) using pt-BR natural collation
    bookmarks.sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base', numeric: true })
    );

    const sortedChildren = [...folders, ...bookmarks];

    // Ordem atual real, atualizada a cada move (o node.index lido antes fica velho)
    const currentOrder = [...children].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((c) => c.id);

    for (let i = 0; i < sortedChildren.length; i++) {
      const node = sortedChildren[i];
      const from = currentOrder.indexOf(node.id);
      // Index diffing: skip the API call if the item is already in the correct position
      if (from === i) continue;
      try {
        // Sempre sobe (from > i): as posições < i já estão finais
        await bookmarksService.move(node.id, { parentId, index: i });
        currentOrder.splice(from, 1);
        currentOrder.splice(i, 0, node.id);
      } catch (err) {
        console.warn(`Erro ao reordenar item [${node.id}] ${node.title}:`, err);
      }
    }

    sortedFoldersCount += folders.length;
    sortedBookmarksCount += bookmarks.length;

    if (recursive) {
      for (const folder of folders) {
        const subRes = await sortFoldersAlphabetically(folder.id, true);
        sortedFoldersCount += subRes.sortedFoldersCount;
        sortedBookmarksCount += subRes.sortedBookmarksCount;
      }
    }
  } catch (err) {
    console.warn(`Erro ao ordenar pastas sob [${parentId}]:`, err);
  }

  return { sortedFoldersCount, sortedBookmarksCount };
}

/**
 * Executes an AI plan with full hierarchy support, creating master and subfolders
 * and moving bookmarks into their designated targets with high-performance concurrent chunking.
 * Automatically prunes any folders that become empty as a result of the moves (selective pruning).
 * Optionally sorts folders and subfolders in alphabetical order (A-Z).
 */
export async function executeAiPlanWithHierarchy(
  plan: AiProposedPlan,
  tree: BookmarkNode[],
  rootParentId: string = '1',
  onProgress?: ProgressCallback,
  cleanEmptyFolders: boolean = true,
  sortAlphabetical: boolean = true
): Promise<{ createdFoldersCount: number; movedCount: number; skippedCount: number; prunedFoldersCount: number }> {
  const existingFolderMap = buildExistingFolderMap(tree);
  const targetFolderIdMap = new Map<string, string>();

  // Map each existing bookmark to its current parent folder
  const currentParentMap = new Map<string, string>();
  const parentLookup = new Map<string, string>();

  function mapTree(nodes: BookmarkNode[], pid?: string) {
    for (const node of nodes) {
      const effectiveParentId = node.parentId || pid;
      if (effectiveParentId) {
        parentLookup.set(node.id, effectiveParentId);
        if (node.url) {
          currentParentMap.set(node.id, effectiveParentId);
        }
      }
      if (node.children) {
        mapTree(node.children, node.id);
      }
    }
  }
  mapTree(tree);

  let createdFoldersCount = 0;

  // 1. Resolve or create all target folders (sorted alphabetically A-Z)
  const sortedFolders = [...plan.suggestedFolders].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );
  for (const folderPath of sortedFolders) {
    const key = folderPath.toLowerCase();
    if (!targetFolderIdMap.has(key)) {
      const folderId = await ensureHierarchicalFolder(
        folderPath,
        rootParentId,
        existingFolderMap,
        () => {
          createdFoldersCount++;
        }
      );
      targetFolderIdMap.set(key, folderId);
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

  // 4. Safely prune ONLY folders that became empty as a result of moving out bookmarks (Bug 5 fix)
  let prunedFoldersCount = 0;
  if (cleanEmptyFolders && movesToExecute.length > 0) {
    const candidateIds = new Set<string>();

    for (const move of movesToExecute) {
      const sourceParentId = currentParentMap.get(move.bookmarkId);
      if (sourceParentId) {
        let curr: string | undefined = sourceParentId;
        while (curr && !PROTECTED_FOLDER_IDS.has(curr)) {
          candidateIds.add(curr);
          curr = parentLookup.get(curr);
        }
      }
    }

    if (candidateIds.size > 0) {
      prunedFoldersCount = await pruneEmptyFolders(undefined, PROTECTED_FOLDER_IDS, candidateIds);
    }
  }

  // 5. Reorder folders and subfolders alphabetically (A-Z) under rootParentId
  if (sortAlphabetical) {
    await sortFoldersAlphabetically(rootParentId, true);
  }

  return { createdFoldersCount, movedCount, skippedCount, prunedFoldersCount };
}
