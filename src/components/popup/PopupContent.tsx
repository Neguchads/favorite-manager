import React, { useState } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import {
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Globe,
  Layers,
  Sparkles,
  Maximize2,
  Sidebar as SidebarIcon,
} from 'lucide-react';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { CreateBookmarkModal } from '../modals/CreateBookmarkModal';

export const PopupContent: React.FC = () => {
  const {
    tree,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    displayedItems,
    allFolders,
    activeSection,
    setActiveSection,
    createBookmark,
    deleteBookmark,
    stats,
  } = useBookmarks();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  return (
    <div className="w-[420px] h-[580px] flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Top Header */}
      <header className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="font-bold text-xs tracking-tight text-white leading-none">
              Edge Favorite Manager
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {stats.totalBookmarks} favoritos salvos
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleOpenSidePanel}
            title="Abrir no Painel Lateral do Edge"
            className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-colors text-[11px]"
          >
            <SidebarIcon className="w-3 h-3 text-sky-400" />
            <span>Sidebar</span>
          </button>

          <button
            onClick={handleOpenFullTab}
            title="Abrir Gerenciador Completo em Nova Aba"
            className="flex items-center space-x-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-md transition-colors text-[11px] shadow-xs"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Tela Cheia</span>
          </button>
        </div>
      </header>

      {/* Prominent Callout to Open Full Desktop Manager */}
      <div className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between">
        <span className="text-[11px] text-sky-800 dark:text-sky-300 font-medium truncate">
          Para ver a árvore de pastas e IA, abra em tela cheia:
        </span>
        <button
          onClick={handleOpenFullTab}
          className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center space-x-1 shrink-0 ml-2"
        >
          <span>Abrir</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {error && (
        <div className="px-3 py-1.5 bg-rose-500 text-white text-[11px] flex items-center justify-between shrink-0">
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar favoritos... (ex: github, claude)"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner"
            autoFocus
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-1 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
            activeSection === 'all'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Todos ({stats.totalBookmarks})
        </button>
        <button
          onClick={() => setActiveSection('bookmarks_bar')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
            activeSection === 'bookmarks_bar'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Barra
        </button>
        <button
          onClick={() => setActiveSection('recent')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
            activeSection === 'recent'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Recentes
        </button>
        <button
          onClick={() => setActiveSection('duplicates')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
            activeSection === 'duplicates'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Duplicados {stats.duplicateCount > 0 && `(${stats.duplicateCount})`}
        </button>
      </div>

      {/* Bookmarks List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {loading && tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span>Lendo favoritos...</span>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              Nenhum favorito encontrado
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {searchQuery ? 'Tente outros termos de busca' : 'Esta seção está vazia'}
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

      {/* Footer Controls */}
      <footer className="px-3 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md transition-colors text-[11px] font-medium"
        >
          <Plus className="w-3 h-3 text-sky-500" />
          <span>+ Adicionar Favorito</span>
        </button>

        <button
          onClick={handleOpenFullTab}
          className="flex items-center space-x-1 text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-medium"
        >
          <Sparkles className="w-3 h-3" />
          <span>Abrir Organizador com IA</span>
        </button>
      </footer>

      {/* Modals */}
      <CreateBookmarkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        folders={allFolders}
        defaultParentId="1"
        onCreate={createBookmark}
      />
    </div>
  );
};
