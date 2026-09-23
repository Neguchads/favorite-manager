import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookmarkNode, NavigationSection, SortField, SortDirection, ViewMode } from '../types/bookmarks';
import { bookmarksService, pruneEmptyFolders, sortFoldersAlphabetically } from '../services/bookmarks';
import { parseSearchQuery, matchesSearch } from '../utils/search';
import { extractDomain } from '../utils/url';
import { findDuplicates } from '../services/duplicates';
import { analyzeCleanup } from '../services/cleanup';
import { createLocalSnapshot } from '../services/backup';

export interface FolderOption {
  id: string;
  title: string;
  path: string;
  level: number;
}

export interface BreadcrumbNode {
  id: string;
  title: string;
}

const VIRTUAL_SECTIONS = new Set(['all', 'recent', 'duplicates', 'cleanup', 'stats', 'backups', 'settings']);

export function useBookmarks() {
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavigationSection | string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<BookmarkNode | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Load tree
  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookmarksService.getTree();
      setTree(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading bookmarks:', err);
      setError(err?.message || 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Bug 6 Fix: Debounce tree reloads on bookmark changes to group mass operations
  useEffect(() => {
    loadTree();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = bookmarksService.subscribe(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadTree();
      }, 300);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [loadTree]);

  // Flatten nodes map for fast lookup and folder path tracking
  const {
    nodeMap,
    parentPathMap,
    allBookmarks,
    allFolders,
    folderItemCount,
    folderDirectCount,
    folderSubfolderCount,
  } = useMemo(() => {
    const nMap = new Map<string, BookmarkNode>();
    const pMap = new Map<string, string>();
    const bookmarks: BookmarkNode[] = [];
    const folders: FolderOption[] = [];
    const recursiveCountMap: Record<string, number> = {};
    const directCountMap: Record<string, number> = {};
    const subfolderCountMap: Record<string, number> = {};

    function countNodes(node: BookmarkNode): number {
      if (node.url) {
        return 1;
      }
      let bookmarksTotal = 0;
      let directBookmarks = 0;
      let subfolders = 0;

      if (node.children) {
        for (const child of node.children) {
          if (child.url) {
            directBookmarks++;
            bookmarksTotal++;
          } else {
            subfolders++;
            bookmarksTotal += countNodes(child);
          }
        }
      }

      recursiveCountMap[node.id] = bookmarksTotal;
      directCountMap[node.id] = directBookmarks;
      subfolderCountMap[node.id] = subfolders;
      return bookmarksTotal;
    }

    function traverse(node: BookmarkNode, currentPath: string, level: number) {
      nMap.set(node.id, node);
      pMap.set(node.id, currentPath);

      if (node.url) {
        bookmarks.push(node);
      } else {
        // Folder
        const folderTitle =
          node.id === '1'
            ? 'Barra de favoritos'
            : node.id === '2'
            ? 'Outros favoritos'
            : node.id === '3'
            ? 'Favoritos móveis'
            : node.title;

        if (node.id !== '0') {
          folders.push({
            id: node.id,
            title: folderTitle,
            path: currentPath ? `${currentPath} / ${folderTitle}` : folderTitle,
            level,
          });
        }

        const nextPath = currentPath ? `${currentPath} / ${folderTitle}` : folderTitle;
        if (node.children) {
          for (const child of node.children) {
            traverse(child, nextPath, level + 1);
          }
        }
      }
    }

    if (tree.length > 0) {
      for (const root of tree) {
        countNodes(root);
        traverse(root, '', 0);
      }
    }

    return {
      nodeMap: nMap,
      parentPathMap: pMap,
      allBookmarks: bookmarks,
      allFolders: folders,
      folderItemCount: recursiveCountMap,
      folderDirectCount: directCountMap,
      folderSubfolderCount: subfolderCountMap,
    };
  }, [tree]);

  // Parsed search query
  const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  // Duplicates & Cleanup analysis
  const duplicates = useMemo(() => findDuplicates(tree), [tree]);
  const cleanupReport = useMemo(() => analyzeCleanup(tree), [tree]);

  // Calculate statistics
  const stats = useMemo(() => {
    const domains = new Set<string>();
    allBookmarks.forEach((b) => {
      const d = extractDomain(b.url);
      if (d) domains.add(d);
    });

    return {
      totalBookmarks: allBookmarks.length,
      totalFolders: allFolders.length,
      totalDomains: domains.size,
      duplicateCount: duplicates.reduce((acc, g) => acc + g.items.length, 0),
      emptyFoldersCount: cleanupReport.emptyFolders.length,
      missingTitlesCount: cleanupReport.missingTitles.length,
      invalidUrlsCount: cleanupReport.invalidUrls.length,
    };
  }, [allBookmarks, allFolders, duplicates, cleanupReport]);

  // Current folder name for title and breadcrumbs
  const currentFolderName = useMemo(() => {
    if (activeSection === 'all') return 'Todos os favoritos';
    if (activeSection === 'bookmarks_bar') return 'Barra de favoritos';
    if (activeSection === 'other') return 'Outros favoritos';
    if (activeSection === 'recent') return 'Adicionados Recentemente';
    if (activeSection === 'duplicates') return 'Favoritos Duplicados';
    if (activeSection === 'cleanup') return 'Central de Limpeza';
    if (activeSection === 'stats') return 'Estatísticas';
    if (activeSection === 'backups') return 'Backups & Snapshots';
    if (activeSection === 'settings') return 'Configurações';

    const node = nodeMap.get(activeSection);
    return node?.title || 'Pasta';
  }, [activeSection, nodeMap]);

  // Hierarchical breadcrumbs trail (like native edge://favorites/)
  const breadcrumbs = useMemo<BreadcrumbNode[]>(() => {
    if (activeSection === 'all') return [{ id: 'all', title: 'Todos os favoritos' }];
    if (activeSection === 'bookmarks_bar') return [{ id: 'bookmarks_bar', title: 'Barra de favoritos' }];
    if (activeSection === 'other') return [{ id: 'other', title: 'Outros favoritos' }];
    if (activeSection === 'recent') return [{ id: 'recent', title: 'Adicionados Recentemente' }];
    if (activeSection === 'duplicates') return [{ id: 'duplicates', title: 'Favoritos Duplicados' }];
    if (activeSection === 'cleanup') return [{ id: 'cleanup', title: 'Central de Limpeza' }];
    if (activeSection === 'stats') return [{ id: 'stats', title: 'Estatísticas' }];
    if (activeSection === 'backups') return [{ id: 'backups', title: 'Backups & Snapshots' }];

    const crumbs: BreadcrumbNode[] = [];
    let currId: string | undefined = activeSection;

    while (currId && currId !== '0') {
      const node = nodeMap.get(currId);
      if (!node) break;
      let title = node.title;
      let targetSectionId = node.id;
      if (node.id === '1') {
        title = 'Barra de favoritos';
        targetSectionId = 'bookmarks_bar';
      } else if (node.id === '2') {
        title = 'Outros favoritos';
        targetSectionId = 'other';
      } else if (node.id === '3') {
        title = 'Favoritos móveis';
      }

      crumbs.unshift({ id: targetSectionId, title });
      currId = node.parentId && node.parentId !== '0' ? node.parentId : undefined;
    }

    return crumbs.length > 0 ? crumbs : [{ id: activeSection, title: currentFolderName }];
  }, [activeSection, nodeMap, currentFolderName]);

  // Subfolders under current folder (like real edge://favorites/)
  const currentSubfolders = useMemo<BookmarkNode[]>(() => {
    if (searchQuery.trim()) return [];

    let targetNode: BookmarkNode | undefined;
    if (activeSection === 'bookmarks_bar') {
      targetNode = nodeMap.get('1');
    } else if (activeSection === 'other') {
      targetNode = nodeMap.get('2');
    } else if (!VIRTUAL_SECTIONS.has(activeSection)) {
      targetNode = nodeMap.get(activeSection);
    }

    if (targetNode?.children) {
      return targetNode.children.filter((b) => !b.url);
    }
    return [];
  }, [activeSection, searchQuery, nodeMap]);

  // Items to display based on active section and search
  const displayedItems = useMemo(() => {
    let items: BookmarkNode[] = [];

    if (searchQuery.trim()) {
      // Global search across all bookmarks
      items = allBookmarks.filter((b) => {
        const folderPath = b.parentId ? parentPathMap.get(b.parentId) : '';
        return matchesSearch(b, parsedQuery, folderPath);
      });
    } else {
      // Section based items
      if (activeSection === 'all') {
        items = [...allBookmarks];
      } else if (activeSection === 'bookmarks_bar') {
        const barNode = nodeMap.get('1');
        items = (barNode?.children || []).filter((b) => Boolean(b.url));
      } else if (activeSection === 'other') {
        const otherNode = nodeMap.get('2');
        items = (otherNode?.children || []).filter((b) => Boolean(b.url));
      } else if (activeSection === 'recent') {
        items = [...allBookmarks].sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)).slice(0, 50);
      } else if (activeSection === 'duplicates') {
        items = duplicates.flatMap((g) => g.items);
      } else if (activeSection === 'cleanup') {
        items = [...cleanupReport.missingTitles, ...cleanupReport.invalidUrls];
      } else {
        // Specific folder by ID
        const targetNode = nodeMap.get(activeSection);
        if (targetNode?.children) {
          items = targetNode.children.filter((b) => Boolean(b.url));
        }
      }
    }

    // Sort items
    items.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'domain') {
        const dA = extractDomain(a.url);
        const dB = extractDomain(b.url);
        comparison = dA.localeCompare(dB);
      } else if (sortField === 'dateAdded') {
        comparison = (a.dateAdded || 0) - (b.dateAdded || 0);
      } else if (sortField === 'url') {
        comparison = (a.url || '').localeCompare(b.url || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [
    activeSection,
    searchQuery,
    parsedQuery,
    allBookmarks,
    nodeMap,
    parentPathMap,
    duplicates,
    cleanupReport,
    sortField,
    sortDirection,
  ]);

  // Recursively collect all bookmarks in a given folder
  const getBookmarksRecursively = useCallback(
    (folderId: string): BookmarkNode[] => {
      const results: BookmarkNode[] = [];
      const root = nodeMap.get(folderId);

      function collect(node: BookmarkNode) {
        if (node.url) {
          results.push(node);
        }
        if (node.children) {
          for (const child of node.children) {
            collect(child);
          }
        }
      }

      if (root) collect(root);
      return results;
    },
    [nodeMap]
  );

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((items: BookmarkNode[]) => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const invertSelection = useCallback((items: BookmarkNode[]) => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      items.forEach((item) => {
        if (!prev.has(item.id)) {
          next.add(item.id);
        }
      });
      return next;
    });
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return current;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  // Helper: Resolve a safe valid parent folder ID (Bug 4 fix)
  const resolveSafeParentId = useCallback(
    (candidateId?: string): string => {
      if (candidateId && !VIRTUAL_SECTIONS.has(candidateId) && nodeMap.has(candidateId)) {
        return candidateId;
      }
      if (activeSection === 'bookmarks_bar') return '1';
      if (activeSection === 'other') return '2';
      if (!VIRTUAL_SECTIONS.has(activeSection) && nodeMap.has(activeSection)) {
        return activeSection;
      }
      return '1'; // Default: Bookmarks Bar
    },
    [activeSection, nodeMap]
  );

  // CRUD actions (Bug 4 fix applied)
  const createBookmark = useCallback(
    async (title: string, url: string, parentId?: string) => {
      const targetParent = resolveSafeParentId(parentId);
      const created = await bookmarksService.create({
        parentId: targetParent,
        title,
        url,
      });
      await loadTree();
      return created;
    },
    [loadTree, resolveSafeParentId]
  );

  const createFolder = useCallback(
    async (title: string, parentId?: string) => {
      const targetParent = resolveSafeParentId(parentId);
      const created = await bookmarksService.create({
        parentId: targetParent,
        title,
      });
      await loadTree();
      return created;
    },
    [loadTree, resolveSafeParentId]
  );

  const updateBookmark = useCallback(
    async (id: string, title: string, url?: string) => {
      const updated = await bookmarksService.update(id, { title, url });
      await loadTree();
      if (selectedItem?.id === id) {
        setSelectedItem(updated);
      }
      return updated;
    },
    [loadTree, selectedItem]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      await createLocalSnapshot('Exclusão de Favorito');
      await bookmarksService.remove(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      await loadTree();
    },
    [loadTree, selectedItem]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await createLocalSnapshot('Exclusão de Pasta');
      await bookmarksService.removeTree(id);
      if (activeSection === id) {
        setActiveSection('1');
      }
      await loadTree();
    },
    [activeSection, loadTree]
  );

  const deleteMultiple = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await createLocalSnapshot(`Exclusão em massa (${ids.length} itens)`);
      for (const id of ids) {
        try {
          await bookmarksService.remove(id);
        } catch (e) {
          console.warn(`Failed to delete bookmark ${id}:`, e);
        }
      }
      clearSelection();
      if (selectedItem && ids.includes(selectedItem.id)) {
        setSelectedItem(null);
      }
      await loadTree();
    },
    [clearSelection, loadTree, selectedItem]
  );

  const deleteDuplicates = useCallback(
    async (ids: string[], groupCount?: number) => {
      if (ids.length === 0) return;
      await createLocalSnapshot(
        `Remoção de ${ids.length} duplicados em 1 clique${groupCount ? ` (${groupCount} grupos)` : ''}`
      );
      for (const id of ids) {
        try {
          await bookmarksService.remove(id);
        } catch (e) {
          console.warn(`Failed to delete duplicate bookmark ${id}:`, e);
        }
      }
      clearSelection();
      if (selectedItem && ids.includes(selectedItem.id)) {
        setSelectedItem(null);
      }
      await loadTree();
    },
    [clearSelection, loadTree, selectedItem]
  );

  const moveBookmark = useCallback(
    async (id: string, targetParentId: string) => {
      await bookmarksService.move(id, { parentId: targetParentId });
      await loadTree();
    },
    [loadTree]
  );

  const moveMultiple = useCallback(
    async (ids: string[], targetParentId: string) => {
      if (ids.length === 0) return;
      await createLocalSnapshot(`Movimentação em massa (${ids.length} itens)`);
      for (const id of ids) {
        try {
          await bookmarksService.move(id, { parentId: targetParentId });
        } catch (e) {
          console.warn(`Failed to move bookmark ${id}:`, e);
        }
      }
      clearSelection();
      await loadTree();
    },
    [clearSelection, loadTree]
  );

  const pruneEmptyFoldersAction = useCallback(async () => {
    await createLocalSnapshot('Limpeza de Pastas Vazias');
    const count = await pruneEmptyFolders();
    await loadTree();
    return count;
  }, [loadTree]);

  const sortAlphabetically = useCallback(
    async (targetFolderId?: string, recursive: boolean = true) => {
      const targetId =
        targetFolderId ||
        (activeSection === 'all' ? 'all' : resolveSafeParentId());
      await createLocalSnapshot('Organização alfabética A-Z (pastas e favoritos)');
      const res = await sortFoldersAlphabetically(targetId, recursive);
      await loadTree();
      return res;
    },
    [activeSection, loadTree, resolveSafeParentId]
  );

  return {
    tree,
    loading,
    error,
    isNative: bookmarksService.isNative(),
    activeSection,
    setActiveSection,
    searchQuery,
    setSearchQuery,
    selectedIds,
    selectedItem,
    setSelectedItem,
    toggleSelect,
    selectAll,
    clearSelection,
    invertSelection,
    viewMode,
    setViewMode,
    sortField,
    sortDirection,
    toggleSort,
    displayedItems,
    currentSubfolders,
    currentFolderName,
    breadcrumbs,
    allFolders,
    allBookmarks,
    folderItemCount,
    folderDirectCount,
    folderSubfolderCount,
    duplicates,
    cleanupReport,
    stats,
    resolveSafeParentId,
    getBookmarksRecursively,
    createBookmark,
    createFolder,
    updateBookmark,
    deleteBookmark,
    deleteFolder,
    deleteMultiple,
    deleteDuplicates,
    moveBookmark,
    moveMultiple,
    refreshTree: loadTree,
    parentPathMap,
    pruneEmptyFolders: pruneEmptyFoldersAction,
    sortAlphabetically,
  };
}
