import React, { useState } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import {
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Layers,
} from 'lucide-react';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { CreateBookmarkModal } from '../modals/CreateBookmarkModal';
import { AiOrganizeModal } from '../modals/AiOrganizeModal';
import { AiProposedPlan } from '../../ai/types';
import { executeAiPlanWithHierarchy } from '../../services/bookmarks';

export const SidePanelContent: React.FC = () => {
  const {
    tree,
    loading,
    searchQuery,
    setSearchQuery,
    displayedItems,
    allFolders,
    activeSection,
    setActiveSection,
    createBookmark,
    deleteBookmark,
    refreshTree,
    parentPathMap,
  } = useBookmarks();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const handleOpenFullTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open('/index.html', '_blank');
    }
  };

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

  if (loading && tree.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
        <span>Carregando favoritos...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs overflow-hidden">
      {/* Side Panel Header */}
      <header className="px-3 py-2.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight">Favoritos Edge</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsCreateOpen(true)}
            title="Adicionar favorito"
            className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAiOpen(true)}
            title="Organizar com IA"
            className="p-1.5 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenFullTab}
            title="Abrir em aba cheia"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar favoritos..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-transparent focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Quick Folder Chips */}
      <div className="px-2 py-1.5 bg-slate-100/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-1 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-2 py-0.5 rounded-full text-[11px] shrink-0 font-medium ${
            activeSection === 'all'
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setActiveSection('bookmarks_bar')}
          className={`px-2 py-0.5 rounded-full text-[11px] shrink-0 font-medium ${
            activeSection === 'bookmarks_bar'
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Barra
        </button>
        <button
          onClick={() => setActiveSection('other')}
          className={`px-2 py-0.5 rounded-full text-[11px] shrink-0 font-medium ${
            activeSection === 'other'
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Outros
        </button>
        <button
          onClick={() => setActiveSection('recent')}
          className={`px-2 py-0.5 rounded-full text-[11px] shrink-0 font-medium ${
            activeSection === 'recent'
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Recentes
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {displayedItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            Nenhum favorito encontrado nesta pasta.
          </div>
        ) : (
          displayedItems.map((item) => {
            const domain = extractDomain(item.url);
            const favicon = getFaviconUrl(item.url);
            return (
              <div
                key={item.id}
                className="group flex items-center justify-between p-2 hover:bg-white dark:hover:bg-slate-800/80 transition-colors"
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
                        className="w-3.5 h-3.5 rounded-xs object-contain"
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

                <button
                  onClick={() => deleteBookmark(item.id)}
                  title="Excluir"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <CreateBookmarkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        folders={allFolders}
        defaultParentId="1"
        onCreate={createBookmark}
      />

      <AiOrganizeModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        itemsToOrganize={displayedItems}
        allFolders={allFolders}
        parentPathMap={parentPathMap}
        onApplyPlan={handleApplyAiPlan}
      />
    </div>
  );
};
