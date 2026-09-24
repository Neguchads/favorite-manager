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
  skipExistingUrls?: boolean;
  onProgress?: (current: number, total: number, currentItemName: string) => void;
  abortSignal?: AbortSignal;
}

export interface ImportResult {
  success: boolean;
  totalBookmarksImported: number;
  totalBookmarksSkipped: number;
  totalFoldersCreated: number;
  snapshotId: string;
  error?: string;
}

function normalizeUrlKey(url: string): string {
  try {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Service to import bookmarks from HTML (Netscape) or JSON backups
 * into Microsoft Edge's bookmark store with real-time progress, deduplication, and safety snapshot.
 */
export async function importBookmarks(options: ImportOptions): Promise<ImportResult> {
  const {
    fileContent,
    fileType,
    strategy,
    destinationParentId = '1',
    createDedicatedFolder = true,
    dedicatedFolderName,
    skipExistingUrls = true,
    onProgress,
    abortSignal,
  } = options;

  // 1. Create safety snapshot before touching bookmarks
  const snapshotId = await createLocalSnapshot('Snapshot prévio à Importação de Favoritos');

  let totalBookmarksImported = 0;
  let totalBookmarksSkipped = 0;
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

    // Load current tree for folder mapping and URL deduplication
    const currentTree = await bookmarksService.getTree();
    const existingFolderMap = buildExistingFolderMap(currentTree);
    const existingUrlsSet = new Set<string>();

    function extractExistingUrls(nodes: BookmarkNode[]) {
      for (const n of nodes) {
        if (n.url) {
          existingUrlsSet.add(normalizeUrlKey(n.url));
        }
        if (n.children) {
          extractExistingUrls(n.children);
        }
      }
    }
    extractExistingUrls(currentTree);

    // 3. Execution Strategy: AI Organize vs Preserve Original Structure
    if (strategy === 'ai_organize') {
      for (let i = 0; i < flatBookmarks.length; i++) {
        if (abortSignal?.aborted) break;

        const bm = flatBookmarks[i];
        if (!bm.url) continue;

        // Deduplication check
        if (skipExistingUrls && existingUrlsSet.has(normalizeUrlKey(bm.url))) {
          totalBookmarksSkipped++;
          if (onProgress) {
            onProgress(i + 1, totalToProcess, `Ignorado (já existe): ${bm.title}`);
          }
          continue;
        }

        // Semantic AI classification with clean taxonomy
        const category = classifyBookmarkIntelligently(bm.title, bm.url);
        const targetCategory = category || 'Outros';

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

        existingUrlsSet.add(normalizeUrlKey(bm.url));
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
            // Deduplication check
            if (skipExistingUrls && existingUrlsSet.has(normalizeUrlKey(item.url))) {
              totalBookmarksSkipped++;
              processedCount++;
              if (onProgress) {
                onProgress(processedCount, totalToProcess, `Ignorado (já existe): ${item.title}`);
              }
              continue;
            }

            // Bookmark link
            await bookmarksService.create({
              parentId: targetParent,
              title: item.title,
              url: item.url,
            });

            existingUrlsSet.add(normalizeUrlKey(item.url));
            totalBookmarksImported++;
            processedCount++;
            if (onProgress) {
              onProgress(processedCount, totalToProcess, item.title);
            }
          } else {
            // Folder
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
      totalBookmarksSkipped,
      totalFoldersCreated,
      snapshotId,
    };
  } catch (err: any) {
    console.error('Erro durante importação de favoritos:', err);
    return {
      success: false,
      totalBookmarksImported,
      totalBookmarksSkipped,
      totalFoldersCreated,
      snapshotId,
      error: err?.message || 'Falha ao processar arquivo de importação',
    };
  }
}
