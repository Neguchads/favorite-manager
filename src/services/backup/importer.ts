import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import { classifyBookmarkIntelligently } from '../../ai/classifier';
import { ensureHierarchicalFolder, buildExistingFolderMap } from '../bookmarks/hierarchy';
import { createLocalSnapshot } from './index';
import { parseNetscapeHtml, ParsedBookmarkItem } from './htmlParser';

export type ImportStrategy = 'preserve' | 'ai_organize';

export interface ImportOptions {
  fileContent: string;
  fileType: 'html' | 'json';
  strategy: ImportStrategy;
  destinationParentId?: string;
  createDedicatedFolder?: boolean;
  dedicatedFolderName?: string;
  onProgress?: (current: number, total: number, currentItemName: string) => void;
  abortSignal?: AbortSignal;
}

export interface ImportResult {
  success: boolean;
  totalBookmarksImported: number;
  totalFoldersCreated: number;
  snapshotId: string;
  error?: string;
}

/**
 * Service to import bookmarks from HTML (Netscape) or JSON backups
 * into Microsoft Edge's bookmark store with real-time progress and safety snapshot.
 */
export async function importBookmarks(options: ImportOptions): Promise<ImportResult> {
  const {
    fileContent,
    fileType,
    strategy,
    destinationParentId = '1',
    createDedicatedFolder = true,
    dedicatedFolderName,
    onProgress,
    abortSignal,
  } = options;

  // 1. Create safety snapshot before touching bookmarks
  const snapshotId = await createLocalSnapshot('Snapshot prévio à Importação de Favoritos');

  let totalBookmarksImported = 0;
  let totalFoldersCreated = 0;

  try {
    let parsedRootNodes: ParsedBookmarkItem[] = [];
    let flatBookmarks: { title: string; url: string; path: string; icon?: string; dateAdded?: number }[] = [];

    // 2. Parse file content
    if (fileType === 'html') {
      const parsed = parseNetscapeHtml(fileContent);
      parsedRootNodes = parsed.rootNodes;
      flatBookmarks = parsed.flatBookmarks;
    } else {
      // JSON backup parse
      const jsonData = JSON.parse(fileContent);
      const rawTree: BookmarkNode[] = Array.isArray(jsonData.tree)
        ? jsonData.tree
        : Array.isArray(jsonData)
        ? jsonData
        : [];

      function flattenJson(nodes: BookmarkNode[], currentPath: string): ParsedBookmarkItem[] {
        return nodes.map((n) => {
          const nextPath = currentPath ? `${currentPath} / ${n.title}` : n.title;
          if (n.url) {
            flatBookmarks.push({
              title: n.title,
              url: n.url,
              path: currentPath,
              dateAdded: n.dateAdded,
            });
          }
          return {
            id: n.id,
            title: n.title,
            url: n.url,
            dateAdded: n.dateAdded,
            path: nextPath,
            children: n.children ? flattenJson(n.children, nextPath) : undefined,
          };
        });
      }

      parsedRootNodes = flattenJson(rawTree, '');
    }

    const totalToProcess = flatBookmarks.length;

    // 3. Execution Strategy: AI Organize vs Preserve Original Structure
    if (strategy === 'ai_organize') {
      // Load current tree to build existing folder map
      const currentTree = await bookmarksService.getTree();
      const existingFolderMap = buildExistingFolderMap(currentTree);

      for (let i = 0; i < flatBookmarks.length; i++) {
        if (abortSignal?.aborted) break;

        const bm = flatBookmarks[i];
        if (!bm.url) continue;

        // Semantic AI classification
        const category = classifyBookmarkIntelligently(bm.title, bm.url);
        const targetCategory = category || 'Outros & Geral';

        // Ensure hierarchical destination folder exists
        const folderId = await ensureHierarchicalFolder(
          targetCategory,
          destinationParentId,
          existingFolderMap,
          () => totalFoldersCreated++
        );

        // Create bookmark in destination folder
        await bookmarksService.create({
          parentId: folderId,
          title: bm.title || bm.url,
          url: bm.url,
        });

        totalBookmarksImported++;

        if (onProgress) {
          onProgress(i + 1, totalToProcess, bm.title || bm.url);
        }
      }
    } else {
      // PRESERVE ORIGINAL STRUCTURE
      let baseTargetParentId = destinationParentId;

      if (createDedicatedFolder) {
        const defaultName = dedicatedFolderName || `Importados (${new Date().toLocaleDateString('pt-BR')})`;
        const dedicatedFolder = await bookmarksService.create({
          parentId: destinationParentId,
          title: defaultName,
        });
        baseTargetParentId = dedicatedFolder.id;
        totalFoldersCreated++;
      }

      let processedCount = 0;

      async function importRecursive(items: ParsedBookmarkItem[], targetParent: string) {
        for (const item of items) {
          if (abortSignal?.aborted) break;

          if (item.url) {
            // Bookmark link
            await bookmarksService.create({
              parentId: targetParent,
              title: item.title,
              url: item.url,
            });
            totalBookmarksImported++;
            processedCount++;
            if (onProgress) {
              onProgress(processedCount, totalToProcess, item.title);
            }
          } else {
            // Folder
            // Skip redundant root names like "Barra de favoritos" if we are already inside a dedicated folder
            const created = await bookmarksService.create({
              parentId: targetParent,
              title: item.title,
            });
            totalFoldersCreated++;

            if (item.children && item.children.length > 0) {
              await importRecursive(item.children, created.id);
            }
          }
        }
      }

      await importRecursive(parsedRootNodes, baseTargetParentId);
    }

    return {
      success: true,
      totalBookmarksImported,
      totalFoldersCreated,
      snapshotId,
    };
  } catch (err: any) {
    console.error('Erro durante importação de favoritos:', err);
    return {
      success: false,
      totalBookmarksImported,
      totalFoldersCreated,
      snapshotId,
      error: err?.message || 'Falha ao processar arquivo de importação',
    };
  }
}
