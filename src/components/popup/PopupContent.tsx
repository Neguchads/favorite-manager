import React, { useState } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useTheme } from '../../hooks/useTheme';
import {
  Search,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Maximize2,
  Sidebar as SidebarIcon,
  Folder,
  FolderTree,
  List,
  X,
  FolderPlus,
  ChevronRight,
} from 'lucide-react';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { CreateBookmarkModal } from '../modals/CreateBookmarkModal';
import { CreateFolderModal } from '../modals/CreateFolderModal';
import { SaveCurrentTabCard } from './SaveCurrentTabCard';
import { PopupFolderTree } from './PopupFolderTree';
import { useTranslation } from '../../i18n';

export const PopupContent: React.FC = () => {
  // Sync dark/light theme
  useTheme();
  const { t, language, setLanguage } = useTranslation();

  const {
    tree,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    displayedItems,
    currentSubfolders,
    currentFolderName,
    allFolders,
    allBookmarks,
    folderItemCount,
    activeSection,
    setActiveSection,
    createBookmark,
    createFolder,
    deleteBookmark,
    moveBookmark,
    stats,
  } = useBookmarks();

  // Navigation tab inside popup: 'bookmarks' (list) or 'tree' (hierarchical folder tree)
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'tree'>('bookmarks');

  // Modals state
  const [isCreateBookmarkOpen, setIsCreateBookmarkOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [targetParentFolderId, setTargetParentFolderId] = useState<string>('1');

  const handleOpenFullTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open('/index.html', '_blank');
    }
  };

  const handleOpenSidePanel = async () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && 'open' in chrome.sidePanel) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await (chrome.sidePanel as any).open({ tabId: tab.id });
          window.close();
          return;
        }
      } catch (err) {
        console.warn('Could not open side panel programmatically:', err);
      }
    }
    // Fallback: Open in full tab
    handleOpenFullTab();
  };

  const handleSelectFolderFromTree = (folderId: string) => {
    setActiveSection(folderId);
    setActiveTab('bookmarks'); // Switch to bookmarks view to see its contents
  };

  const handleSaveActiveTabToFolder = async (folderId: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          await createBookmark(tab.title || tab.url, tab.url, folderId);
          setActiveSection(folderId);
          setActiveTab('bookmarks');
        }
      } catch (e) {
        console.warn('Erro ao salvar aba na pasta:', e);
      }
    }
  };

  const handleOpenCreateFolderModal = (parentId: string = '1') => {
    setTargetParentFolderId(parentId);
    setIsCreateFolderOpen(true);
  };

  // Determine if activeSection is a specific folder
  const isSpecificFolderActive =
    activeSection !== 'all' &&
    activeSection !== 'recent' &&
    activeSection !== 'duplicates' &&
    activeSection !== 'cleanup' &&
    activeSection !== 'stats' &&
    activeSection !== 'backups' &&
    activeSection !== 'settings';

  return (
    <div className="w-[440px] h-[600px] flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Top Header */}
      <header className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-2">
          <img src="icons/icon32.png" alt="" className="w-6 h-6 shrink-0" />
          <div>
            <h1 className="font-bold text-xs tracking-tight text-white leading-none">
              Favorite Manager
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {stats.totalBookmarks} {t('popup.favoritesCount')} {stats.totalFolders} {t('popup.foldersCount')}
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Language Toggle in Popup */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
            className="flex items-center space-x-1 px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-colors text-[10px] font-semibold cursor-pointer"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            <span>{language === 'pt' ? 'PT' : 'EN'}</span>
          </button>

          <button
            onClick={handleOpenSidePanel}
            title={t('popup.sidebarTooltip')}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-colors text-[11px] cursor-pointer"
          >
            <SidebarIcon className="w-3 h-3 text-sky-400" />
            <span>{t('popup.sidebar')}</span>
          </button>

          <button
            onClick={handleOpenFullTab}
            title={t('popup.fullTabTooltip')}
            className="flex items-center space-x-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-md transition-colors text-[11px] shadow-xs cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{t('popup.fullTab')}</span>
          </button>
        </div>
      </header>

      {/* Save Active Tab Component (Direct bookmarking of current page into any folder) */}
      <SaveCurrentTabCard
        allBookmarks={allBookmarks}
        allFolders={allFolders}
        activeSection={activeSection}
        onCreateBookmark={createBookmark}
        onDeleteBookmark={deleteBookmark}
        onMoveBookmark={moveBookmark}
        onOpenFolderTree={() => setActiveTab('tree')}
      />

      {/* Main View Switcher: Favoritos vs Árvore de Pastas */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{t('popup.tabBookmarks')}</span>
          </button>

          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('popup.tabTree')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
              {allFolders.length}
            </span>
          </button>
        </div>

        {/* Quick button to add folder */}
        <button
          onClick={() => handleOpenCreateFolderModal(isSpecificFolderActive ? activeSection : '1')}
          className="flex items-center space-x-1 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
          title={t('popup.newFolderTooltip')}
        >
          <FolderPlus className="w-3 h-3" />
          <span>{t('popup.newFolder')}</span>
        </button>
      </div>

      {error && (
        <div className="px-3 py-1.5 bg-rose-500 text-white text-[11px] flex items-center justify-between shrink-0">
          <span>{error}</span>
        </div>
      )}

      {/* VIEW 1: BOOKMARKS LIST */}
      {activeTab === 'bookmarks' && (
        <>
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('popup.searchPlaceholder')}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Folder Quick Filter & Section Tabs */}
          <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            {/* Quick Section Chips */}
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
              <button
                onClick={() => setActiveSection('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  activeSection === 'all'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {t('popup.all')} ({stats.totalBookmarks})
              </button>
              <button
                onClick={() => setActiveSection('bookmarks_bar')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  activeSection === 'bookmarks_bar' || activeSection === '1'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {t('popup.bookmarksBar')}
              </button>
              <button
                onClick={() => setActiveSection('recent')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  activeSection === 'recent'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.recent')}
              </button>
              <button
                onClick={() => setActiveSection('duplicates')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  activeSection === 'duplicates'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.duplicates')} {stats.duplicateCount > 0 && `(${stats.duplicateCount})`}
              </button>
            </div>

            {/* Folder Filter Dropdown */}
            <div className="shrink-0">
              <select
                value={isSpecificFolderActive ? activeSection : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setActiveSection(e.target.value);
                  } else {
                    setActiveSection('all');
                  }
                }}
                className="text-[11px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 max-w-[130px] truncate focus:outline-none focus:border-sky-500 cursor-pointer"
                title={t('popup.filterFolder')}
              >
                <option value="">📁 {t('popup.filterFolder')}</option>
                {allFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.path || f.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Folder Banner (When browsing a specific folder) */}
          {isSpecificFolderActive && (
            <div className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-100 dark:border-sky-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold text-sky-900 dark:text-sky-200 truncate text-[11px]">
                  {currentFolderName}
                </span>
                <span className="text-[10px] text-sky-700 dark:text-sky-300 shrink-0">
                  ({displayedItems.length} {displayedItems.length === 1 ? 'item' : 'itens'})
                </span>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <button
                  onClick={() => handleOpenCreateFolderModal(activeSection)}
                  className="px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded transition-colors"
                  title="Criar subpasta aqui"
                >
                  + Subpasta
                </button>
                <button
                  onClick={() => setActiveSection('all')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title="Limpar filtro e ver todos"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Subfolders shortcuts (if active folder has subfolders) */}
          {isSpecificFolderActive && currentSubfolders.length > 0 && (
            <div className="px-2.5 py-1 bg-slate-50/50 dark:bg-slate-850/40 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[10px] text-slate-400 shrink-0">Subpastas:</span>
              {currentSubfolders.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSection(sub.id)}
                  className="flex items-center space-x-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[10px] shrink-0 transition-colors"
                >
                  <Folder className="w-2.5 h-2.5 text-amber-500" />
                  <span className="truncate max-w-[100px]">{sub.title}</span>
                  <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Bookmarks List Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span>Carregando favoritos...</span>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  Nenhum favorito encontrado
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {searchQuery ? 'Tente outros termos de busca' : 'Esta pasta está vazia'}
                </p>
              </div>
            ) : (
              displayedItems.map((item) => {
                const domain = extractDomain(item.url);
                const favicon = getFaviconUrl(item.url);
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2 text-left"
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {favicon ? (
                          <img
                            src={favicon}
                            alt=""
                            className="w-3.5 h-3.5 rounded object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {item.title || '(Sem título)'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                          {domain || item.url}
                        </span>
                      </div>
                    </a>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => deleteBookmark(item.id)}
                        title="Excluir"
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* VIEW 2: HIERARCHICAL FOLDER TREE (Directly in Popup!) */}
      {activeTab === 'tree' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <PopupFolderTree
            tree={tree}
            activeFolderId={activeSection}
            folderItemCount={folderItemCount}
            onSelectFolder={handleSelectFolderFromTree}
            onSaveToFolder={handleSaveActiveTabToFolder}
            onCreateFolder={handleOpenCreateFolderModal}
          />
        </div>
      )}

      {/* Footer Controls */}
      <footer className="px-3 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsCreateBookmarkOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md transition-colors text-[11px] font-medium shadow-2xs"
          >
            <Plus className="w-3 h-3 text-sky-500" />
            <span>+ Favorito</span>
          </button>

          <button
            onClick={() => handleOpenCreateFolderModal(isSpecificFolderActive ? activeSection : '1')}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md transition-colors text-[11px] font-medium shadow-2xs"
          >
            <FolderPlus className="w-3 h-3 text-amber-500" />
            <span>+ Pasta</span>
          </button>
        </div>

        <button
          onClick={handleOpenFullTab}
          className="flex items-center space-x-1 text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-medium"
        >
          <Sparkles className="w-3 h-3" />
          <span>Organizador IA</span>
        </button>
      </footer>

      {/* Modals */}
      <CreateBookmarkModal
        isOpen={isCreateBookmarkOpen}
        onClose={() => setIsCreateBookmarkOpen(false)}
        folders={allFolders}
        defaultParentId={isSpecificFolderActive ? activeSection : '1'}
        onCreate={createBookmark}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        folders={allFolders}
        defaultParentId={targetParentFolderId}
        onCreate={createFolder}
      />
    </div>
  );
};
