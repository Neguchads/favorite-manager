import React, { useState, useEffect } from 'react';
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
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { BookmarkNode } from './types/bookmarks';
import { downloadJsonFile, exportBookmarksToJson } from './services/backup';
import { downloadMarkdownAwesomeList } from './services/backup/markdownExporter';
import { AiProposedPlan } from './ai/types';
import { executeAiPlanWithHierarchy } from './services/bookmarks';
import { openUrlsInNewWindow, openUrlsInIncognitoWindow } from './services/tabs/workspaceTabs';

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

  // Edit handler
  const handleOpenEdit = (item: BookmarkNode) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  // Delete single bookmark handler
  const handlePromptDelete = (id: string) => {
    setConfirmDelete({
      isOpen: true,
      ids: [id],
      isFolder: false,
      title: 'Excluir Favorito',
      message: 'Tem certeza que deseja remover este item? Um snapshot de segurança será gravado antes.',
    });
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

  // Global Edge-style keyboard shortcuts (Ctrl+K, Ctrl+Shift+F, Ctrl+A, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

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

      if (!isInput) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          selectAll(displayedItems);
        } else if (e.key === 'Delete' && selectedIds.size > 0) {
          e.preventDefault();
          handlePromptDeleteMultiple();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.hash === '#palette') {
      setIsCommandPaletteOpen(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedItems, selectedIds, selectAll]);

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
          onDropBookmark={moveBookmark}
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

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={confirmDelete.title}
        message={confirmDelete.message}
        isDestructive={true}
        confirmLabel="Excluir"
      />
    </div>
  );
};

export default App;
