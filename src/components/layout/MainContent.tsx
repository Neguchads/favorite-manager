import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Folder,
  Plus,
  CheckSquare,
  Square,
  ArrowDownAZ,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Laptop,
} from 'lucide-react';
import {
  BookmarkDuplicateGroup,
  BookmarkNode,
  CleanupReport,
  SortField,
  SortDirection,
  ViewMode,
} from '../../types/bookmarks';
import { BookmarkItemRow } from '../list/BookmarkItemRow';
import { BookmarkCard } from '../list/BookmarkCard';
import { FolderItemRow } from '../list/FolderItemRow';
import { FolderCard } from '../list/FolderCard';
import { DuplicatesView } from '../duplicates/DuplicatesView';
import { CleanupView } from '../cleanup/CleanupView';
import { StatsView } from '../stats/StatsView';
import { BackupView } from '../backup/BackupView';
import { ContextMenu, ContextMenuState } from '../common/ContextMenu';
import { BreadcrumbNode, FolderOption } from '../../hooks/useBookmarks';
import { openUrlInNewTab, openUrlInNewWindow } from '../../services/tabs/workspaceTabs';
import { useTranslation } from '../../i18n';

interface MainContentProps {
  activeSection: string;
  currentFolderName: string;
  breadcrumbs?: BreadcrumbNode[];
  items: BookmarkNode[];
  subfolders?: BookmarkNode[];
  folderItemCount?: Record<string, number>;
  folderSubfolderCount?: Record<string, number>;
  onNavigateToFolder?: (folderId: string) => void;
  onEditFolder?: (folder: BookmarkNode) => void;
  onDeleteFolder?: (folderId: string) => void;
  onMoveFolder?: (folder: BookmarkNode) => void;
  onOpenFolderInNewWindow?: (folderId: string) => void;
  onOpenFolderInIncognito?: (folderId: string) => void;
  selectedIds: Set<string>;
  selectedItem: BookmarkNode | null;
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  onToggleSort: (field: SortField) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (items: BookmarkNode[]) => void;
  onClearSelection: () => void;
  onInspect: (item: BookmarkNode) => void;
  onEdit: (item: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onOpenCreateBookmark: () => void;
  onOpenCreateFolder?: () => void;
  onOpenWorkspaceTabs?: () => void;
  onOpenMoveModal?: (item: BookmarkNode) => void;
  onMoveBookmark?: (id: string, targetParentId: string) => Promise<void>;
  onMoveToTarget?: (
    sourceIds: string[],
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => Promise<void> | void;
  parentPathMap: Map<string, string>;
  searchQuery: string;
  duplicates: BookmarkDuplicateGroup[];
  cleanupReport: CleanupReport;
  stats: any;
  tree: BookmarkNode[];
  allBookmarks: BookmarkNode[];
  onDeleteAllEmptyFolders?: () => void;
  onUpdateBookmark?: (id: string, title: string, url?: string) => Promise<any>;
  onDeleteMultiple?: (ids: string[]) => Promise<void>;
  onDeleteDuplicates?: (ids: string[], groupCount?: number) => Promise<void>;
  onRefresh?: () => Promise<void>;
  folders?: FolderOption[];
  onSortAlphabetically?: (
    targetFolderId?: string,
    recursive?: boolean
  ) => Promise<{ sortedFoldersCount: number; sortedBookmarksCount: number }>;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeSection,
  currentFolderName,
  breadcrumbs = [],
  items,
  subfolders = [],
  folderItemCount = {},
  folderSubfolderCount = {},
  onNavigateToFolder = () => {},
  onEditFolder = () => {},
  onDeleteFolder = () => {},
  onMoveFolder,
  onOpenFolderInNewWindow,
  onOpenFolderInIncognito,
  selectedIds,
  selectedItem,
  viewMode,
  sortField,
  sortDirection,
  onToggleSort,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onInspect,
  onEdit,
  onDelete,
  onOpenCreateBookmark,
  onOpenCreateFolder,
  onOpenWorkspaceTabs,
  onOpenMoveModal,
  onMoveBookmark,
  onMoveToTarget,
  parentPathMap,
  searchQuery,
  duplicates,
  cleanupReport,
  stats,
  tree,
  allBookmarks,
  onDeleteAllEmptyFolders,
  onUpdateBookmark,
  onDeleteMultiple,
  onDeleteDuplicates,
  onRefresh,
  folders = [],
  onSortAlphabetically,
}) => {
  const { t, language } = useTranslation();
  const [isSortingAZ, setIsSortingAZ] = useState(false);
  const [sortSuccessMessage, setSortSuccessMessage] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Track expanded folder IDs to reveal internal content inline (like native tree)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'background',
  });

  const handleToggleExpandFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (expandedFolderIds.size === subfolders.length && subfolders.length > 0) {
      setExpandedFolderIds(new Set());
    } else {
      setExpandedFolderIds(new Set(subfolders.map((f) => f.id)));
    }
  };

  const handleBookmarkContextMenu = (e: React.MouseEvent, item: BookmarkNode) => {
    setContextMenuState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'bookmark',
      item,
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: BookmarkNode) => {
    setContextMenuState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'folder',
      folder,
    });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'background',
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToast(true);
    setTimeout(() => {
      setCopiedToast(false);
    }, 2500);
  };

  const handleSortAlphabetically = async () => {
    if (!onSortAlphabetically || isSortingAZ) return;
    try {
      setIsSortingAZ(true);
      setSortSuccessMessage(null);
      let targetId: string = activeSection;
      if (activeSection === 'bookmarks_bar') targetId = '1';
      else if (activeSection === 'other') targetId = '2';
      else if (activeSection === 'all') targetId = 'all';

      const res = await onSortAlphabetically(targetId, true);
      setSortSuccessMessage(
        language === 'pt'
          ? `${res.sortedBookmarksCount} favoritos e ${res.sortedFoldersCount} pastas organizados de A-Z com sucesso!`
          : `${res.sortedBookmarksCount} bookmarks and ${res.sortedFoldersCount} folders organized A-Z successfully!`
      );
      setTimeout(() => {
        setSortSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Erro ao ordenar A-Z:', err);
    } finally {
      setIsSortingAZ(false);
    }
  };

  const allCurrentSelectable = useMemo<BookmarkNode[]>(() => {
    return [...subfolders, ...items];
  }, [subfolders, items]);

  const allSelected =
    allCurrentSelectable.length > 0 &&
    allCurrentSelectable.every((i: BookmarkNode) => selectedIds.has(i.id));
  const someSelected = allCurrentSelectable.some((i: BookmarkNode) => selectedIds.has(i.id));
  const allSubfoldersExpanded = subfolders.length > 0 && expandedFolderIds.size === subfolders.length;

  // Scroll container and subfolders measurement for virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  const subfoldersRef = useRef<HTMLDivElement>(null);
  const [subfoldersHeight, setSubfoldersHeight] = useState(0);

  useEffect(() => {
    if (subfoldersRef.current && subfolders.length > 0) {
      setSubfoldersHeight(subfoldersRef.current.offsetHeight);
    } else {
      setSubfoldersHeight(0);
    }
  }, [subfolders.length, viewMode, allSubfoldersExpanded, expandedFolderIds]);

  // Responsive column count for grid virtualization
  const [gridCols, setGridCols] = useState(3);
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const updateCols = () => {
      const w = el.clientWidth;
      if (w >= 1024) setGridCols(4);
      else if (w >= 768) setGridCols(3);
      else if (w >= 640) setGridCols(2);
      else setGridCols(1);
    };
    updateCols();
    const ro = new ResizeObserver(updateCols);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Grid rows chunked by column count
  const gridRows = useMemo(() => {
    if (viewMode !== 'cards') return [];
    const rows: BookmarkNode[][] = [];
    for (let i = 0; i < items.length; i += gridCols) {
      rows.push(items.slice(i, i + gridCols));
    }
    return rows;
  }, [items, gridCols, viewMode]);

  // Row virtualizer for list mode (44px estimated row height)
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
    scrollMargin: subfoldersHeight,
  });

  // Row virtualizer for grid mode (140px estimated card row height)
  const gridVirtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
    scrollMargin: subfoldersHeight,
  });

  // Renders the internal content of any expanded folder (both subfolders and internal bookmarks)
  const renderFolderInternalContent = (folderNode: BookmarkNode) => {
    const childFolders = (folderNode.children || []).filter((c) => !c.url);
    const childBookmarks = (folderNode.children || []).filter((c) => Boolean(c.url));
    const isEmpty = childFolders.length === 0 && childBookmarks.length === 0;

    if (isEmpty) {
      return (
        <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2 pl-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg">
          {t('main.emptyFolderInline')}
        </div>
      );
    }

    return (
      <div className="space-y-1 py-1">
        {/* Sub-subfolders */}
        {childFolders.map((sub) => (
          <FolderItemRow
            key={sub.id}
            folder={sub}
            itemCount={folderItemCount[sub.id] || 0}
            subfolderCount={folderSubfolderCount[sub.id] || 0}
            isExpanded={expandedFolderIds.has(sub.id)}
            isSelected={selectedIds.has(sub.id)}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleExpand={handleToggleExpandFolder}
            onOpen={onNavigateToFolder}
            onEdit={onEditFolder}
            onDelete={onDeleteFolder}
            onMoveFolder={onMoveFolder}
            onOpenInNewWindow={onOpenFolderInNewWindow}
            onDropBookmark={onMoveBookmark}
            onMoveToTarget={onMoveToTarget}
            onContextMenu={handleFolderContextMenu}
          >
            {expandedFolderIds.has(sub.id) && renderFolderInternalContent(sub)}
          </FolderItemRow>
        ))}

        {/* Bookmarks inside this folder */}
        {childBookmarks.map((bookmark) => (
          <BookmarkItemRow
            key={bookmark.id}
            item={bookmark}
            folderPath={parentPathMap.get(bookmark.parentId || '')}
            isSelected={selectedIds.has(bookmark.id)}
            selectedIds={selectedIds}
            isInspected={selectedItem?.id === bookmark.id}
            onToggleSelect={onToggleSelect}
            onInspect={onInspect}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onOpenMoveModal}
            onMoveToTarget={onMoveToTarget}
            onContextMenu={handleBookmarkContextMenu}
          />
        ))}
      </div>
    );
  };

  // Render specialized maintenance screens
  if (activeSection === 'duplicates') {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
        <DuplicatesView
          duplicates={duplicates}
          parentPathMap={parentPathMap}
          onDeleteBookmark={onDelete}
          onDeleteMultiple={onDeleteMultiple}
          onDeleteDuplicates={onDeleteDuplicates}
          onInspect={onInspect}
          onRefresh={onRefresh}
        />
      </main>
    );
  }

  if (activeSection === 'cleanup') {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
        <CleanupView
          report={cleanupReport}
          allItems={allBookmarks}
          parentPathMap={parentPathMap}
          onDeleteFolder={onDeleteFolder}
          onDeleteAllEmptyFolders={onDeleteAllEmptyFolders}
          onDeleteBookmark={onDelete}
          onEditBookmark={onEdit}
          onUpdateBookmark={onUpdateBookmark}
          onDeleteMultiple={onDeleteMultiple}
          onRefresh={onRefresh}
        />
      </main>
    );
  }

  if (activeSection === 'stats') {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
        <StatsView stats={stats} />
      </main>
    );
  }

  if (activeSection === 'backups') {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
        <BackupView tree={tree} onRefresh={onRefresh} folders={folders} />
      </main>
    );
  }

  const isFolderEmpty = items.length === 0 && subfolders.length === 0;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors relative">
      {/* Sub-header / Toolbar */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/90 text-xs">
        {/* Title & selection checkbox + Breadcrumbs */}
        <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
          <button
            onClick={() => {
              if (allSelected) onClearSelection();
              else onSelectAll(allCurrentSelectable);
            }}
            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
            title={allSelected ? t('main.unselectAll') : t('main.selectAll')}
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            ) : someSelected ? (
              <div className="w-4 h-4 rounded border border-sky-600 bg-sky-100 flex items-center justify-center">
                <div className="w-2 h-0.5 bg-sky-600 rounded" />
              </div>
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          {/* Breadcrumbs Trail (like native edge://favorites/) */}
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            {searchQuery ? (
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {t('main.searchResults')} "{searchQuery}"
              </h2>
            ) : breadcrumbs && breadcrumbs.length > 0 ? (
              <div className="flex items-center space-x-1 overflow-x-auto py-0.5 max-w-full">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id + idx}>
                      {idx > 0 && (
                        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <button
                        onClick={() => !isLast && onNavigateToFolder(crumb.id)}
                        disabled={isLast}
                        className={`text-xs rounded px-1.5 py-0.5 transition-colors shrink-0 flex items-center space-x-1 ${
                          isLast
                            ? 'font-bold text-slate-800 dark:text-slate-100 cursor-default'
                            : 'font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 cursor-pointer'
                        }`}
                      >
                        {idx === 0 && (
                          <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0 inline mr-0.5" />
                        )}
                        <span className="truncate max-w-[140px]">{crumb.title}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {currentFolderName}
              </h2>
            )}

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-medium shrink-0">
              {items.length} {items.length === 1 ? t('main.bookmarkSingle') : t('main.bookmarkPlural')}
              {subfolders.length > 0 && ` • ${subfolders.length} ${subfolders.length === 1 ? t('main.folderSingle') : t('main.folderPlural')}`}
            </span>
          </div>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] mr-1 hidden sm:inline">{t('main.sort')}</span>
          <button
            onClick={() => onToggleSort('title')}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
              sortField === 'title'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span>{t('main.sortName')}</span>
            {sortField === 'title' && (
              <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>

          <button
            onClick={() => onToggleSort('domain')}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
              sortField === 'domain'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span>{t('main.sortDomain')}</span>
            {sortField === 'domain' && (
              <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>

          <button
            onClick={() => onToggleSort('dateAdded')}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
              sortField === 'dateAdded'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span>{t('main.sortDate')}</span>
            {sortField === 'dateAdded' && (
              <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>

          {onSortAlphabetically && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                onClick={handleSortAlphabetically}
                disabled={isSortingAZ}
                title={t('main.sortAZTooltip')}
                className="px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                {isSortingAZ ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                )}
                <span>{isSortingAZ ? t('main.sortingAZ') : t('main.organizeAZ')}</span>
              </button>
            </>
          )}

          {onOpenWorkspaceTabs && (
            <button
              onClick={onOpenWorkspaceTabs}
              title={t('main.workspaceTabsTooltip')}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t('main.workspaceTabs')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success feedback */}
      {sortSuccessMessage && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 transition-all">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sortSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSortSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Copied to clipboard Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center space-x-2 text-xs backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Copy className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('main.copiedToast')}</span>
        </div>
      )}

      {/* Items Container with Context Menu on background */}
      <div
        ref={parentRef}
        onContextMenu={handleBackgroundContextMenu}
        className="flex-1 overflow-y-auto"
      >
        {/* Subfolders Section with Expand All toggle (Visualizador de pastas estilo edge://favorites/) */}
        {subfolders.length > 0 && (
          <div ref={subfoldersRef} className="p-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('main.foldersSection')} ({subfolders.length})
              </div>

              {/* Expand / Collapse All Toggle Button */}
              {viewMode === 'list' && (
                <button
                  onClick={handleToggleExpandAll}
                  className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium flex items-center space-x-1 cursor-pointer transition-colors px-2 py-0.5 rounded hover:bg-sky-50 dark:hover:bg-sky-950/40"
                  title={t('main.expandAllTooltip')}
                >
                  <ChevronsUpDown className="w-3 h-3" />
                  <span>
                    {allSubfoldersExpanded
                      ? t('main.collapseAll')
                      : t('main.expandAll')}
                  </span>
                </button>
              )}
            </div>

            {viewMode === 'list' ? (
              <div className="space-y-1">
                {subfolders.map((folder) => {
                  const isExpanded = expandedFolderIds.has(folder.id);
                  return (
                    <FolderItemRow
                      key={folder.id}
                      folder={folder}
                      itemCount={folderItemCount[folder.id] || 0}
                      subfolderCount={folderSubfolderCount[folder.id] || 0}
                      isExpanded={isExpanded}
                      isSelected={selectedIds.has(folder.id)}
                      selectedIds={selectedIds}
                      onToggleSelect={onToggleSelect}
                      onToggleExpand={handleToggleExpandFolder}
                      onOpen={onNavigateToFolder}
                      onEdit={onEditFolder}
                      onDelete={onDeleteFolder}
                      onMoveFolder={onMoveFolder}
                      onOpenInNewWindow={onOpenFolderInNewWindow}
                      onDropBookmark={onMoveBookmark}
                      onMoveToTarget={onMoveToTarget}
                      onContextMenu={handleFolderContextMenu}
                    >
                      {isExpanded && renderFolderInternalContent(folder)}
                    </FolderItemRow>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {subfolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    itemCount={folderItemCount[folder.id] || 0}
                    subfolderCount={folderSubfolderCount[folder.id] || 0}
                    isSelected={selectedIds.has(folder.id)}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onOpen={onNavigateToFolder}
                    onEdit={onEditFolder}
                    onDelete={onDeleteFolder}
                    onMoveFolder={onMoveFolder}
                    onOpenInNewWindow={onOpenFolderInNewWindow}
                    onDropBookmark={onMoveBookmark}
                    onMoveToTarget={onMoveToTarget}
                    onContextMenu={handleFolderContextMenu}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isFolderEmpty ? (
          <div className="flex flex-col items-center justify-center h-80 text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Folder className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {searchQuery ? t('main.noResults') : t('main.emptyFolder')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-4">
              {searchQuery
                ? t('main.noResultsSub')
                : t('main.emptyFolderSub')}
            </p>
            {!searchQuery && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={onOpenCreateBookmark}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('main.addBookmarkHere')}</span>
                </button>
                {onOpenWorkspaceTabs && (
                  <button
                    onClick={onOpenWorkspaceTabs}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-sm shadow-indigo-500/20"
                    title={t('main.captureWorkspaceTooltip')}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{t('main.captureWorkspaceTabs')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index];
              if (!item) return null;
              const folderPath = item.parentId ? parentPathMap.get(item.parentId) : '';
              return (
                <div
                  key={item.id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start - (rowVirtualizer.options.scrollMargin || 0)}px)`,
                  }}
                >
                  <BookmarkItemRow
                    item={item}
                    folderPath={folderPath}
                    isSelected={selectedIds.has(item.id)}
                    selectedIds={selectedIds}
                    isInspected={selectedItem?.id === item.id}
                    onToggleSelect={onToggleSelect}
                    onInspect={onInspect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMove={onOpenMoveModal}
                    onMoveToTarget={onMoveToTarget}
                    onContextMenu={handleBookmarkContextMenu}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="p-4"
            style={{
              height: `${gridVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {gridVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = gridRows[virtualRow.index];
              if (!row) return null;
              return (
                <div
                  key={virtualRow.index}
                  ref={gridVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start - (gridVirtualizer.options.scrollMargin || 0)}px)`,
                  }}
                >
                  <div
                    className="grid gap-3 pb-3"
                    style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                  >
                    {row.map((item) => {
                      const folderPath = item.parentId ? parentPathMap.get(item.parentId) : '';
                      return (
                        <BookmarkCard
                          key={item.id}
                          item={item}
                          folderPath={folderPath}
                          isSelected={selectedIds.has(item.id)}
                          selectedIds={selectedIds}
                          isInspected={selectedItem?.id === item.id}
                          onToggleSelect={onToggleSelect}
                          onInspect={onInspect}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onMove={onOpenMoveModal}
                          onMoveToTarget={onMoveToTarget}
                          onContextMenu={handleBookmarkContextMenu}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Edge-style Context Menu */}
      <ContextMenu
        state={contextMenuState}
        onClose={() => setContextMenuState((prev) => ({ ...prev, isOpen: false }))}
        onOpenInNewTab={(url) => openUrlInNewTab(url)}
        onOpenInNewWindow={(url) => openUrlInNewWindow(url, false)}
        onOpenInIncognito={(url) => openUrlInNewWindow(url, true)}
        onOpenFolderInNewWindow={onOpenFolderInNewWindow}
        onOpenFolderInIncognito={onOpenFolderInIncognito}
        onCopyUrl={handleCopyUrl}
        onEdit={(item) => onEdit(item)}
        onMove={onOpenMoveModal}
        onDelete={(id) => onDelete(id)}
        onDeleteFolder={(id) => onDeleteFolder(id)}
        onCreateBookmark={onOpenCreateBookmark}
        onCreateFolder={onOpenCreateFolder}
        onSortAZ={handleSortAlphabetically}
        onRefresh={onRefresh}
      />
    </main>
  );
};
