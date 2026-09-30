import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useBookmarks } from './hooks/useBookmarks';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainContent } from './components/layout/MainContent';
import { RightInspector } from './components/layout/RightInspector';
import { BatchActionBar } from './components/actionbar/BatchActionBar';
import { CreateBookmarkModal } from './components/modals/CreateBookmarkModal';
import { CreateFolderModal } from './components/modals/CreateFolderModal';
import { EditItemModal } from './components/modals/EditItemModal';
import { BatchEditModal } from './components/modals/BatchEditModal';
import { MoveItemsModal } from './components/modals/MoveItemsModal';
import { AiOrganizeModal } from './components/modals/AiOrganizeModal';
import { WorkspaceTabsModal } from './components/modals/WorkspaceTabsModal';
import { ImportBookmarksModal } from './components/modals/ImportBookmarksModal';
import { CrossBrowserSyncModal } from './components/sync/CrossBrowserSyncModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { BookmarkNode } from './types/bookmarks';
import { downloadJsonFile, exportBookmarksToJson } from './services/backup';
import { downloadMarkdownAwesomeList } from './services/backup/markdownExporter';
import { AiProposedPlan } from './ai/types';
import { executeAiPlanWithHierarchy } from './services/bookmarks';
import { openUrlInNewTab, openUrlsInNewWindow, openUrlsInIncognitoWindow } from './services/tabs/workspaceTabs';
import { shouldHandleListShortcut, parseSearchHash } from './utils/keyboard';

export const App: React.FC = () => {
  const {
    tree,
    loading,
    error,
    isNative,
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
    moveItemsToTarget,
    pruneEmptyFolders,
    parentPathMap,
    refreshTree,
    sortAlphabetically,
    nodeMap,
  } = useBookmarks();

  // Dark mode & browser theme synchronization
  const { theme, setTheme } = useTheme();

  // Modals state
  const [isCreateBookmarkOpen, setIsCreateBookmarkOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookmarkNode | null>(null);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isAiOrganizeOpen, setIsAiOrganizeOpen] = useState(false);
  const [isWorkspaceTabsOpen, setIsWorkspaceTabsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Custom items for AI organization (e.g. from open tabs/workspaces)
  const [customAiItems, setCustomAiItems] = useState<BookmarkNode[] | null>(null);

  // Confirm delete dialog state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    ids: string[];
    isFolder?: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    ids: [],
    isFolder: false,
    title: '',
    message: '',
  });

  // Undo Toast state for instant single-item deletions
  type UndoItem = { title: string; url: string; parentId: string; index?: number };
  const [undoToast, setUndoToast] = useState<{
    isOpen: boolean;
    item: UndoItem;
  } | null>(null);

  const undoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerUndoToast = (item: UndoItem) => {
    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
    setUndoToast({ isOpen: true, item });
    undoToastTimerRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 6000);
  };

  const handleUndoDelete = async () => {
    if (!undoToast?.item) return;
    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
    const { title, url, parentId, index } = undoToast.item;
    setUndoToast(null);
    try {
      // Volta para a mesma posição que ocupava na pasta
      await createBookmark(title, url, parentId, index);
    } catch (err) {
      if (index === undefined) {
        console.error('Erro ao desfazer exclusão:', err);
        return;
      }
      // A pasta encolheu enquanto o aviso estava aberto: recria no fim para não perder o favorito
      try {
        await createBookmark(title, url, parentId);
      } catch (retryErr) {
        console.error('Erro ao desfazer exclusão:', retryErr);
      }
    }
  };

  // Edit handler
  const handleOpenEdit = (item: BookmarkNode) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  // Delete single bookmark handler — Instant Action + Undo Toast for individual links; modal for folders
  const handlePromptDelete = async (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return;

    if (!node.url) {
      // It's a folder -> keep confirmation dialog
      setConfirmDelete({
        isOpen: true,
        ids: [id],
        isFolder: true,
        title: 'Excluir Pasta',
        message: 'Tem certeza que deseja excluir esta pasta e todo o seu conteúdo? Um snapshot de segurança será gravado antes.',
      });
      return;
    }

    // Single bookmark item -> Instant Action + Undo Toast (6s)
    const backupItem: UndoItem = {
      title: node.title,
      url: node.url,
      parentId: node.parentId || '1',
      index: node.index,
    };

    // Execute immediately without blocking modal
    await deleteBookmark(id);

    // Trigger floating Undo Toast
    triggerUndoToast(backupItem);
  };

  // Delete folder handler
  const handlePromptDeleteFolder = (id: string) => {
    setConfirmDelete({
      isOpen: true,
      ids: [id],
      isFolder: true,
      title: 'Excluir Pasta',
      message: 'Tem certeza que deseja excluir esta pasta e todo o seu conteúdo? Um snapshot de segurança será gravado antes.',
    });
  };

  // Delete multiple handler
  const handlePromptDeleteMultiple = () => {
    const ids = Array.from(selectedIds);
    setConfirmDelete({
      isOpen: true,
      ids,
      isFolder: false,
      title: 'Excluir Itens Selecionados',
      message: `Tem certeza que deseja excluir ${ids.length} itens selecionados? Você poderá restaurar a partir dos snapshots se necessário.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.isFolder && confirmDelete.ids.length > 0) {
      await deleteFolder(confirmDelete.ids[0]);
    } else if (confirmDelete.ids.length === 1) {
      const node = nodeMap.get(confirmDelete.ids[0]);
      if (node && !node.url) {
        await deleteFolder(confirmDelete.ids[0]);
      } else {
        await deleteBookmark(confirmDelete.ids[0]);
      }
    } else if (confirmDelete.ids.length > 1) {
      await deleteMultiple(confirmDelete.ids);
    }
  };

  // Omnibox "fav <termo>" abre index.html#search=<termo>: preenche a busca
  // Também escuta hashchange: se index.html já está aberto, o omnibox só troca o hash
  useEffect(() => {
    const applySearchHash = () => {
      const term = parseSearchHash(window.location.hash);
      if (term !== null) setSearchQuery(term);
    };
    applySearchHash();
    window.addEventListener('hashchange', applySearchHash);
    return () => window.removeEventListener('hashchange', applySearchHash);
  }, []);

  // Global Edge-style keyboard shortcuts (Ctrl+K, Ctrl+Shift+F, Ctrl+A, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Com modal ou menu de contexto aberto, atalhos da lista (Delete, setas, Ctrl+A, Ctrl+Z) ficam desligados;
      // em campos de texto e (para Enter/Espaço) em botões e links, a tecla fica com o elemento focado
      const handleList = shouldHandleListShortcut({
        tagName: target?.tagName,
        isContentEditable: target?.isContentEditable,
        role: target?.getAttribute?.('role'),
        key: e.key,
        overlayOpen: document.querySelector('[aria-modal="true"], [role="menu"]') !== null,
        // Esc que fechou um menu/modal já chega com preventDefault; não deve limpar a seleção
        defaultPrevented: e.defaultPrevented,
      });

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // Em campo de texto, Ctrl+Z desfaz o texto, não a exclusão
        if (undoToast?.isOpen && handleList) {
          e.preventDefault();
          handleUndoDelete();
          return;
        }
      }

      if (handleList) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          selectAll(displayedItems);
        } else if (e.key === 'Delete' && selectedIds.size > 0) {
          e.preventDefault();
          handlePromptDeleteMultiple();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (displayedItems.length === 0) return;
          const currentIndex = selectedItem ? displayedItems.findIndex((i) => i.id === selectedItem.id) : -1;
          const nextIndex = currentIndex < displayedItems.length - 1 ? currentIndex + 1 : 0;
          setSelectedItem(displayedItems[nextIndex]);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (displayedItems.length === 0) return;
          const currentIndex = selectedItem ? displayedItems.findIndex((i) => i.id === selectedItem.id) : 0;
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : displayedItems.length - 1;
          setSelectedItem(displayedItems[prevIndex]);
        } else if (e.key === 'Enter' && selectedItem?.url) {
          e.preventDefault();
          if (e.shiftKey) {
            openUrlsInNewWindow([selectedItem.url]);
          } else {
            openUrlInNewTab(selectedItem.url);
          }
        } else if (e.key === ' ' && displayedItems.length > 0) {
          e.preventDefault();
          if (!selectedItem) {
            setSelectedItem(displayedItems[0]);
          } else {
            setSelectedItem(null);
          }
        } else if (e.key === 'Escape') {
          if (selectedIds.size > 0 || selectedItem) {
            e.preventDefault();
            clearSelection();
            setSelectedItem(null);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.hash === '#palette') {
      setIsCommandPaletteOpen(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedItems, selectedIds, selectedItem, selectAll, clearSelection, setSelectedItem, undoToast, handleUndoDelete]);

  // Export selected to JSON
  const handleExportSelected = () => {
    const selectedItems = displayedItems.filter((i) => selectedIds.has(i.id));
    const jsonStr = exportBookmarksToJson(selectedItems);
    downloadJsonFile(jsonStr, `favoritos-selecionados-${Date.now()}.json`);
  };

  // Open all bookmarks in a folder in a brand new window (Workspace restoration)
  const handleOpenFolderInNewWindow = async (folderId: string) => {
    const bookmarks = getBookmarksRecursively(folderId);
    const urls = bookmarks.map((b) => b.url).filter(Boolean) as string[];
    if (urls.length > 0) {
      await openUrlsInNewWindow(urls);
    }
  };

  // Open all bookmarks in a folder in an InPrivate window
  const handleOpenFolderInIncognito = async (folderId: string) => {
    const bookmarks = getBookmarksRecursively(folderId);
    const urls = bookmarks.map((b) => b.url).filter(Boolean) as string[];
    if (urls.length > 0) {
      await openUrlsInIncognitoWindow(urls);
    }
  };

  // Open move modal directly for a single item
  const handleOpenMoveForItem = (item: BookmarkNode) => {
    clearSelection();
    toggleSelect(item.id);
    setIsMoveOpen(true);
  };

  // Apply AI Plan (create master folders and subfolders, then move bookmarks)
  const handleApplyAiPlan = async (
    plan: AiProposedPlan,
    onProgress?: (current: number, total: number, percentage: number) => void,
    cleanEmptyFolders: boolean = true,
    sortAlphabetical: boolean = true
  ) => {
    const res = await executeAiPlanWithHierarchy(
      plan,
      tree,
      '1',
      onProgress,
      cleanEmptyFolders,
      sortAlphabetical
    );
    await refreshTree();
    return res;
  };

  // Resolve items for AI organization (handles recursive subfolders when in a folder or custom tabs)
  const itemsForAiOrganize = React.useMemo(() => {
    if (customAiItems && customAiItems.length > 0) {
      return customAiItems;
    }
    if (selectedIds.size > 0) {
      return displayedItems.filter((i) => selectedIds.has(i.id));
    }
    if (activeSection === 'bookmarks_bar') {
      return getBookmarksRecursively('1');
    }
    if (activeSection === 'other') {
      return getBookmarksRecursively('2');
    }
    if (
      activeSection !== 'all' &&
      activeSection !== 'recent' &&
      !['duplicates', 'cleanup', 'stats', 'backups', 'settings'].includes(activeSection)
    ) {
      return getBookmarksRecursively(activeSection);
    }
    return allBookmarks;
  }, [customAiItems, selectedIds, displayedItems, activeSection, getBookmarksRecursively, allBookmarks]);

  if (loading && tree.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Carregando favoritos do Microsoft Edge...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onThemeChange={setTheme}
        isNative={isNative}
        onOpenCreateBookmark={() => setIsCreateBookmarkOpen(true)}
        onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
        onOpenAiOrganize={() => {
          setCustomAiItems(null);
          setIsAiOrganizeOpen(true);
        }}
        onOpenWorkspaceTabs={() => setIsWorkspaceTabsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {error && (
        <div className="bg-rose-500 text-white text-xs px-4 py-2 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          tree={tree}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          folderItemCount={folderItemCount}
          totalBookmarks={stats.totalBookmarks}
          duplicateCount={stats.duplicateCount}
          cleanupCount={stats.emptyFoldersCount + stats.missingTitlesCount}
          onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
          onOpenSync={() => setIsSyncModalOpen(true)}
          onDropBookmark={moveBookmark}
          onMoveToTarget={moveItemsToTarget}
        />

        {/* Central Content (Visualizador com subpastas estilo edge://favorites/) */}
        <MainContent
          activeSection={activeSection}
          currentFolderName={currentFolderName}
          breadcrumbs={breadcrumbs}
          items={displayedItems}
          subfolders={currentSubfolders}
          folderItemCount={folderItemCount}
          folderSubfolderCount={folderSubfolderCount}
          onNavigateToFolder={setActiveSection}
          onEditFolder={handleOpenEdit}
          onDeleteFolder={handlePromptDeleteFolder}
          onMoveFolder={handleOpenMoveForItem}
          onOpenFolderInNewWindow={handleOpenFolderInNewWindow}
          onOpenFolderInIncognito={handleOpenFolderInIncognito}
          onOpenWorkspaceTabs={() => setIsWorkspaceTabsOpen(true)}
          selectedIds={selectedIds}
          selectedItem={selectedItem}
          viewMode={viewMode}
          sortField={sortField}
          sortDirection={sortDirection}
          onToggleSort={toggleSort}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onInspect={setSelectedItem}
          onEdit={handleOpenEdit}
          onDelete={handlePromptDelete}
          onOpenCreateBookmark={() => setIsCreateBookmarkOpen(true)}
          onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
          onOpenMoveModal={handleOpenMoveForItem}
          onMoveBookmark={moveBookmark}
          onMoveToTarget={moveItemsToTarget}
          parentPathMap={parentPathMap}
          searchQuery={searchQuery}
          duplicates={duplicates}
          cleanupReport={cleanupReport}
          stats={stats}
          tree={tree}
          allBookmarks={allBookmarks}
          onDeleteAllEmptyFolders={pruneEmptyFolders}
          onUpdateBookmark={updateBookmark}
          onDeleteMultiple={deleteMultiple}
          onDeleteDuplicates={deleteDuplicates}
          onRefresh={refreshTree}
          folders={allFolders}
          onSortAlphabetically={sortAlphabetically}
        />

        {/* Right Inspector Drawer */}
        <RightInspector
          item={selectedItem}
          folderPath={selectedItem?.parentId ? parentPathMap.get(selectedItem.parentId) : ''}
          onClose={() => setSelectedItem(null)}
          onEdit={handleOpenEdit}
          onDelete={handlePromptDelete}
        />
      </div>

      {/* Floating Bottom Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onInvertSelection={() => invertSelection([...currentSubfolders, ...displayedItems])}
        onOpenMoveModal={() => setIsMoveOpen(true)}
        onEditSelected={() => {
          if (selectedIds.size === 1) {
            const singleId = Array.from(selectedIds)[0];
            const item = nodeMap.get(singleId);
            if (item) handleOpenEdit(item);
          } else if (selectedIds.size > 1) {
            setIsBatchEditOpen(true);
          }
        }}
        onDeleteSelected={handlePromptDeleteMultiple}
        onExportSelected={handleExportSelected}
        onAiAnalyzeSelected={() => {
          setCustomAiItems(null);
          setIsAiOrganizeOpen(true);
        }}
      />

      {/* Modals - Bug 4 Fix: defaultParentId is always a valid folder ID */}
      <CreateBookmarkModal
        isOpen={isCreateBookmarkOpen}
        onClose={() => setIsCreateBookmarkOpen(false)}
        folders={allFolders}
        defaultParentId={resolveSafeParentId()}
        onCreate={createBookmark}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        folders={allFolders}
        defaultParentId={resolveSafeParentId()}
        onCreate={createFolder}
      />

      <EditItemModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={updateBookmark}
      />

      <BatchEditModal
        isOpen={isBatchEditOpen}
        onClose={() => setIsBatchEditOpen(false)}
        selectedItems={Array.from(selectedIds)
          .map((id) => nodeMap.get(id))
          .filter(Boolean) as BookmarkNode[]}
        onSaveBatch={async (updates) => {
          for (const u of updates) {
            await updateBookmark(u.id, u.title);
          }
          clearSelection();
        }}
      />

      <MoveItemsModal
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        itemIds={Array.from(selectedIds)}
        folders={allFolders}
        onMove={moveMultiple}
      />

      <AiOrganizeModal
        isOpen={isAiOrganizeOpen}
        onClose={() => {
          setIsAiOrganizeOpen(false);
          setCustomAiItems(null);
        }}
        itemsToOrganize={itemsForAiOrganize}
        allFolders={allFolders}
        parentPathMap={parentPathMap}
        onApplyPlan={handleApplyAiPlan}
      />

      <WorkspaceTabsModal
        isOpen={isWorkspaceTabsOpen}
        onClose={() => setIsWorkspaceTabsOpen(false)}
        folders={allFolders}
        defaultParentId={resolveSafeParentId()}
        onSaved={async (folderId) => {
          await refreshTree();
          setActiveSection(folderId);
        }}
        onOrganizeTabsWithAi={(tabsAsBookmarks) => {
          setCustomAiItems(tabsAsBookmarks);
          setIsAiOrganizeOpen(true);
        }}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={allBookmarks}
        parentPathMap={parentPathMap}
        onSelectBookmark={setSelectedItem}
        onSelectSection={setActiveSection}
        onOpenAiOrganize={() => {
          setCustomAiItems(null);
          setIsAiOrganizeOpen(true);
        }}
        onPruneEmptyFolders={pruneEmptyFolders}
        onExportMarkdown={() => downloadMarkdownAwesomeList(tree)}
      />

      <ImportBookmarksModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        folders={allFolders}
        onRefreshTree={refreshTree}
      />

      <CrossBrowserSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={confirmDelete.title}
        message={confirmDelete.message}
        isDestructive={true}
        confirmLabel="Excluir"
      />

      {/* Instant Action + Undo Toast (Ctrl+Z) */}
      {undoToast?.isOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-850 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-center space-x-3 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[320px]">
            Favorito <strong className="font-semibold text-slate-100">&quot;{undoToast.item.title}&quot;</strong> excluído.
          </span>
          <div className="h-4 w-px bg-slate-700 shrink-0" />
          <button
            onClick={handleUndoDelete}
            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Desfazer</span>
            <kbd className="hidden sm:inline text-[10px] font-mono bg-sky-700/80 px-1 py-0.2 rounded ml-1">Ctrl+Z</kbd>
          </button>
          <button
            onClick={() => setUndoToast(null)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
