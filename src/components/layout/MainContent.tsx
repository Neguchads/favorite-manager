import React from 'react';
import {
  Folder,
  Plus,
  CheckSquare,
  Square,
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

interface MainContentProps {
  activeSection: string;
  currentFolderName: string;
  items: BookmarkNode[];
  subfolders?: BookmarkNode[];
  folderItemCount?: Record<string, number>;
  onNavigateToFolder?: (folderId: string) => void;
  onEditFolder?: (folder: BookmarkNode) => void;
  onDeleteFolder?: (folderId: string) => void;
  onOpenFolderInNewWindow?: (folderId: string) => void;
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
  onRefresh?: () => Promise<void>;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeSection,
  currentFolderName,
  items,
  subfolders = [],
  folderItemCount = {},
  onNavigateToFolder = () => {},
  onEditFolder = () => {},
  onDeleteFolder = () => {},
  onOpenFolderInNewWindow,
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
  onRefresh,
}) => {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const someSelected = items.some((i) => selectedIds.has(i.id));

  // Render specialized maintenance screens
  if (activeSection === 'duplicates') {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
        <DuplicatesView
          duplicates={duplicates}
          parentPathMap={parentPathMap}
          onDeleteBookmark={onDelete}
          onInspect={onInspect}
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
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Sub-header / Toolbar */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50 text-xs">
        {/* Title & selection checkbox */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (allSelected) onClearSelection();
              else onSelectAll(items);
            }}
            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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

          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {searchQuery ? `Resultados da busca: "${searchQuery}"` : currentFolderName}
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
              ({items.length} {items.length === 1 ? 'favorito' : 'favoritos'}
              {subfolders.length > 0 && ` • ${subfolders.length} ${subfolders.length === 1 ? 'pasta' : 'pastas'}`})
            </span>
          </div>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center space-x-1">
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
        </div>
      </div>

      {/* Items Container */}
      <div className="flex-1 overflow-y-auto">
        {/* Subfolders Section (Visualizador de pastas estilo edge://favorites/) */}
        {subfolders.length > 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Pastas ({subfolders.length})
            </div>
            {viewMode === 'list' ? (
              <div className="space-y-1">
                {subfolders.map((folder) => (
                  <FolderItemRow
                    key={folder.id}
                    folder={folder}
                    itemCount={folderItemCount[folder.id] || 0}
                    onOpen={onNavigateToFolder}
                    onEdit={onEditFolder}
                    onDelete={onDeleteFolder}
                    onOpenInNewWindow={onOpenFolderInNewWindow}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {subfolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    itemCount={folderItemCount[folder.id] || 0}
                    onOpen={onNavigateToFolder}
                    onEdit={onEditFolder}
                    onDelete={onDeleteFolder}
                    onOpenInNewWindow={onOpenFolderInNewWindow}
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
                : 'Adicione favoritos ou crie pastas para organizá-los.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenCreateBookmark}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors"
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
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
