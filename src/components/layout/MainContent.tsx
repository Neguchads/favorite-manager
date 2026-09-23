import React, { useState } from 'react';
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
import { BreadcrumbNode } from '../../hooks/useBookmarks';
import { openUrlInNewTab, openUrlInNewWindow } from '../../services/tabs/workspaceTabs';

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
  onOpenMoveModal?: (item: BookmarkNode) => void;
  onMoveBookmark?: (id: string, targetParentId: string) => Promise<void>;
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
  onOpenMoveModal,
  onMoveBookmark,
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
  onSortAlphabetically,
}) => {
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
        `${res.sortedBookmarksCount} favoritos e ${res.sortedFoldersCount} pastas organizados de A-Z com sucesso!`
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

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const someSelected = items.some((i) => selectedIds.has(i.id));
  const allSubfoldersExpanded = subfolders.length > 0 && expandedFolderIds.size === subfolders.length;

  // Renders the internal content of any expanded folder (both subfolders and internal bookmarks)
  const renderFolderInternalContent = (folderNode: BookmarkNode) => {
    const childFolders = (folderNode.children || []).filter((c) => !c.url);
    const childBookmarks = (folderNode.children || []).filter((c) => Boolean(c.url));
    const isEmpty = childFolders.length === 0 && childBookmarks.length === 0;

    if (isEmpty) {
      return (
        <div className="text-xs text-slate-400 italic py-2 pl-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg">
          Esta pasta está vazia (nenhum favorito ou subpasta).
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
            onToggleExpand={handleToggleExpandFolder}
            onOpen={onNavigateToFolder}
            onEdit={onEditFolder}
            onDelete={onDeleteFolder}
            onMoveFolder={onMoveFolder}
            onOpenInNewWindow={onOpenFolderInNewWindow}
            onDropBookmark={onMoveBookmark}
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
            isInspected={selectedItem?.id === bookmark.id}
            onToggleSelect={onToggleSelect}
            onInspect={onInspect}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onOpenMoveModal}
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
        <BackupView tree={tree} onRefresh={onRefresh} />
      </main>
    );
  }

  const isFolderEmpty = items.length === 0 && subfolders.length === 0;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors relative">
      {/* Sub-header / Toolbar */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50 text-xs">
        {/* Title & selection checkbox + Breadcrumbs */}
        <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
          <button
            onClick={() => {
              if (allSelected) onClearSelection();
              else onSelectAll(items);
            }}
            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
            title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
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
                Resultados da busca: "{searchQuery}"
              </h2>
            ) : breadcrumbs && breadcrumbs.length > 0 ? (
              <div className="flex items-center space-x-1 overflow-x-auto py-0.5 max-w-full">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id + idx}>
                      {idx > 0 && (
                        <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <button
                        onClick={() => !isLast && onNavigateToFolder(crumb.id)}
                        disabled={isLast}
                        className={`text-xs rounded px-1.5 py-0.5 transition-colors shrink-0 flex items-center space-x-1 ${
                          isLast
                            ? 'font-bold text-slate-800 dark:text-slate-100 cursor-default'
                            : 'font-medium text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer'
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

            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
              ({items.length} {items.length === 1 ? 'favorito' : 'favoritos'}
              {subfolders.length > 0 && ` • ${subfolders.length} ${subfolders.length === 1 ? 'pasta' : 'pastas'}`})
            </span>
          </div>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Ordenar:</span>
          <button
            onClick={() => onToggleSort('title')}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
              sortField === 'title'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Nome</span>
            {sortField === 'title' && (
              <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>

          <button
            onClick={() => onToggleSort('domain')}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
              sortField === 'domain'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Domínio</span>
            {sortField === 'domain' && (
              <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>

          <button
            onClick={() => onToggleSort('dateAdded')}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
              sortField === 'dateAdded'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Data</span>
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
                title="Classificar definitivamente todas as pastas, subpastas e favoritos em ordem alfabética (A-Z)"
                className="px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                {isSortingAZ ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                )}
                <span>{isSortingAZ ? 'Ordenando...' : 'Organizar Tudo A-Z'}</span>
              </button>
            </>
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
          <span>Link copiado para a área de transferência!</span>
        </div>
      )}

      {/* Items Container with Context Menu on background */}
      <div
        onContextMenu={handleBackgroundContextMenu}
        className="flex-1 overflow-y-auto"
      >
        {/* Subfolders Section with Expand All toggle (Visualizador de pastas estilo edge://favorites/) */}
        {subfolders.length > 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pastas ({subfolders.length})
              </div>

              {/* Expand / Collapse All Toggle Button */}
              {viewMode === 'list' && (
                <button
                  onClick={handleToggleExpandAll}
                  className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium flex items-center space-x-1 cursor-pointer transition-colors px-2 py-0.5 rounded hover:bg-sky-50 dark:hover:bg-sky-950/40"
                  title="Expandir ou recolher todas as pastas para ver o conteúdo interno"
                >
                  <ChevronsUpDown className="w-3 h-3" />
                  <span>
                    {allSubfoldersExpanded
                      ? 'Recolher Todas as Pastas'
                      : 'Expandir Todas e Ver Conteúdo'}
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
                      onToggleExpand={handleToggleExpandFolder}
                      onOpen={onNavigateToFolder}
                      onEdit={onEditFolder}
                      onDelete={onDeleteFolder}
                      onMoveFolder={onMoveFolder}
                      onOpenInNewWindow={onOpenFolderInNewWindow}
                      onDropBookmark={onMoveBookmark}
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
                    onOpen={onNavigateToFolder}
                    onEdit={onEditFolder}
                    onDelete={onDeleteFolder}
                    onMoveFolder={onMoveFolder}
                    onOpenInNewWindow={onOpenFolderInNewWindow}
                    onDropBookmark={onMoveBookmark}
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
              {searchQuery ? 'Nenhum favorito encontrado' : 'Esta pasta está vazia'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1 mb-4">
              {searchQuery
                ? 'Tente ajustar os termos ou filtros de pesquisa (ex: domain:, folder:)'
                : 'Arraste favoritos para cá ou use o botão abaixo para adicionar.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenCreateBookmark}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Favorito Aqui</span>
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {items.map((item) => {
              const folderPath = item.parentId ? parentPathMap.get(item.parentId) : '';
              return (
                <BookmarkItemRow
                  key={item.id}
                  item={item}
                  folderPath={folderPath}
                  isSelected={selectedIds.has(item.id)}
                  isInspected={selectedItem?.id === item.id}
                  onToggleSelect={onToggleSelect}
                  onInspect={onInspect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onOpenMoveModal}
                  onContextMenu={handleBookmarkContextMenu}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const folderPath = item.parentId ? parentPathMap.get(item.parentId) : '';
              return (
                <BookmarkCard
                  key={item.id}
                  item={item}
                  folderPath={folderPath}
                  isSelected={selectedIds.has(item.id)}
                  isInspected={selectedItem?.id === item.id}
                  onToggleSelect={onToggleSelect}
                  onInspect={onInspect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onOpenMoveModal}
                  onContextMenu={handleBookmarkContextMenu}
                />
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
