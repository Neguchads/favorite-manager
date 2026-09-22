import React, { useState, useEffect } from 'react';
import { useBookmarks } from './hooks/useBookmarks';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainContent } from './components/layout/MainContent';
import { RightInspector } from './components/layout/RightInspector';
import { BatchActionBar } from './components/actionbar/BatchActionBar';
import { CreateBookmarkModal } from './components/modals/CreateBookmarkModal';
import { CreateFolderModal } from './components/modals/CreateFolderModal';
import { EditItemModal } from './components/modals/EditItemModal';
import { MoveItemsModal } from './components/modals/MoveItemsModal';
import { AiOrganizeModal } from './components/modals/AiOrganizeModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { BookmarkNode } from './types/bookmarks';
import { downloadJsonFile, exportBookmarksToJson } from './services/backup';
import { downloadMarkdownAwesomeList } from './services/backup/markdownExporter';
import { AiProposedPlan } from './ai/types';
import { executeAiPlanWithHierarchy } from './services/bookmarks';

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
    currentFolderName,
    allFolders,
    allBookmarks,
    folderItemCount,
    duplicates,
    cleanupReport,
    stats,
    createBookmark,
    createFolder,
    updateBookmark,
    deleteBookmark,
    deleteMultiple,
    moveMultiple,
    pruneEmptyFolders,
    parentPathMap,
    refreshTree,
  } = useBookmarks();

  // Modals state
  const [isCreateBookmarkOpen, setIsCreateBookmarkOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookmarkNode | null>(null);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isAiOrganizeOpen, setIsAiOrganizeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global keyboard shortcuts (Ctrl+K and Ctrl+Shift+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.hash === '#palette') {
      setIsCommandPaletteOpen(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Confirm delete dialog state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    ids: string[];
    title: string;
    message: string;
  }>({
    isOpen: false,
    ids: [],
    title: '',
    message: '',
  });

  // Edit handler
  const handleOpenEdit = (item: BookmarkNode) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  // Delete single handler
  const handlePromptDelete = (id: string) => {
    setConfirmDelete({
      isOpen: true,
      ids: [id],
      title: 'Excluir Favorito',
      message: 'Tem certeza que deseja remover este item? Um snapshot de segurança será gravado antes.',
    });
  };

  // Delete multiple handler
  const handlePromptDeleteMultiple = () => {
    const ids = Array.from(selectedIds);
    setConfirmDelete({
      isOpen: true,
      ids,
      title: 'Excluir Itens Selecionados',
      message: `Tem certeza que deseja excluir ${ids.length} itens selecionados? Você poderá restaurar a partir dos snapshots se necessário.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.ids.length === 1) {
      await deleteBookmark(confirmDelete.ids[0]);
    } else if (confirmDelete.ids.length > 1) {
      await deleteMultiple(confirmDelete.ids);
    }
  };

  // Export selected to JSON
  const handleExportSelected = () => {
    const selectedItems = displayedItems.filter((i) => selectedIds.has(i.id));
    const jsonStr = exportBookmarksToJson(selectedItems);
    downloadJsonFile(jsonStr, `favoritos-selecionados-${Date.now()}.json`);
  };

  // Apply AI Plan (create master folders and subfolders, then move bookmarks)
  const handleApplyAiPlan = async (
    plan: AiProposedPlan,
    onProgress?: (current: number, total: number, percentage: number) => void,
    cleanEmptyFolders: boolean = true
  ) => {
    const res = await executeAiPlanWithHierarchy(plan, tree, '1', onProgress, cleanEmptyFolders);
    await refreshTree();
    return res;
  };

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
        isNative={isNative}
        onOpenCreateBookmark={() => setIsCreateBookmarkOpen(true)}
        onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
        onOpenAiOrganize={() => setIsAiOrganizeOpen(true)}
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
        />

        {/* Central Content */}
        <MainContent
          activeSection={activeSection}
          currentFolderName={currentFolderName}
          items={displayedItems}
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
          onRefresh={refreshTree}
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
        onInvertSelection={() => invertSelection(displayedItems)}
        onOpenMoveModal={() => setIsMoveOpen(true)}
        onDeleteSelected={handlePromptDeleteMultiple}
        onExportSelected={handleExportSelected}
        onAiAnalyzeSelected={() => setIsAiOrganizeOpen(true)}
      />

      {/* Modals */}
      <CreateBookmarkModal
        isOpen={isCreateBookmarkOpen}
        onClose={() => setIsCreateBookmarkOpen(false)}
        folders={allFolders}
        defaultParentId={activeSection.length > 2 ? activeSection : '1'}
        onCreate={createBookmark}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        folders={allFolders}
        defaultParentId={activeSection.length > 2 ? activeSection : '1'}
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

      <MoveItemsModal
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        itemIds={Array.from(selectedIds)}
        folders={allFolders}
        onMove={moveMultiple}
      />

      <AiOrganizeModal
        isOpen={isAiOrganizeOpen}
        onClose={() => setIsAiOrganizeOpen(false)}
        itemsToOrganize={
          selectedIds.size > 0
            ? displayedItems.filter((i) => selectedIds.has(i.id))
            : displayedItems
        }
        allFolders={allFolders}
        onApplyPlan={handleApplyAiPlan}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={allBookmarks}
        parentPathMap={parentPathMap}
        onSelectBookmark={setSelectedItem}
        onSelectSection={setActiveSection}
        onOpenAiOrganize={() => setIsAiOrganizeOpen(true)}
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
