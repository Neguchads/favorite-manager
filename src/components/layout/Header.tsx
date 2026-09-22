import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FolderPlus,
  Sparkles,
  List,
  LayoutGrid,
  ExternalLink,
  X,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { ViewMode } from '../../types/bookmarks';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isNative: boolean;
  onOpenCreateBookmark: () => void;
  onOpenCreateFolder: () => void;
  onOpenAiOrganize: () => void;
  onOpenCommandPalette?: () => void;
  isSidePanel?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isNative,
  onOpenCreateBookmark,
  onOpenCreateFolder,
  onOpenAiOrganize,
  onOpenCommandPalette,
  isSidePanel = false,
}) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [autoOrganize, setAutoOrganize] = useState(true);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['autoOrganizeOnCreate'], (res) => {
        if (res.autoOrganizeOnCreate !== undefined) {
          setAutoOrganize(res.autoOrganizeOnCreate);
        }
      });
    }
  }, []);

  const toggleAutoOrganize = () => {
    const next = !autoOrganize;
    setAutoOrganize(next);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ autoOrganizeOnCreate: next });
    }
  };

  const handleOpenFullTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.origin + '/index.html', '_blank');
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-30 px-4 py-2.5 transition-colors">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Brand & Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                  Edge Favorite Manager
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isNative
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                  title={
                    isNative
                      ? 'Conectado à API oficial chrome.bookmarks do Microsoft Edge'
                      : 'Ambiente de desenvolvimento local (Mock Provider ativo)'
                  }
                >
                  {isNative ? 'Edge API' : 'Dev Mock'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Organização avançada, limpeza e IA
              </p>
            </div>
          </div>

          {isSidePanel && (
            <button
              onClick={handleOpenFullTab}
              title="Abrir gerenciador em tela cheia"
              className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar favoritos... (ex: domain:github.com, folder:IA)"
              className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-lg border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-7 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                title="Abrir busca rápida e comandos (Ctrl+K / Ctrl+Shift+F)"
                className="absolute right-8 hidden sm:flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                ⌘K
              </button>
            )}
            <button
              onClick={() => setShowSearchHelp(!showSearchHelp)}
              title="Ajuda de filtros de pesquisa"
              className="absolute right-2 p-1 text-slate-400 hover:text-sky-500"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Help Dropdown */}
          {showSearchHelp && (
            <div className="absolute left-0 right-0 top-full mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-40 text-xs space-y-2">
              <div className="flex justify-between items-center font-semibold text-slate-700 dark:text-slate-200">
                <span>Filtros avançados de pesquisa:</span>
                <button
                  onClick={() => setShowSearchHelp(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                <li>
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400 font-mono">
                    domain:github.com
                  </code>{' '}
                  — filtra por domínio do site
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400 font-mono">
                    folder:IA
                  </code>{' '}
                  — filtra por nome da pasta
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400 font-mono">
                    title:Claude
                  </code>{' '}
                  — filtra por palavras no título
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end space-x-1.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('list')}
              title="Visualização em Lista"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              title="Visualização em Cartões"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto-Organize on Bookmark Creation Toggle */}
          <button
            onClick={toggleAutoOrganize}
            title={
              autoOrganize
                ? 'Auto-Organização ativa: links novos salvos no Edge (Ctrl+D) são organizados automaticamente em subpastas inteligentes'
                : 'Auto-Organização desativada: clique para ativar'
            }
            className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoOrganize
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoOrganize ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span>Auto-Organizar: {autoOrganize ? 'ON' : 'OFF'}</span>
          </button>

          {/* New Bookmark */}
          <button
            onClick={onOpenCreateBookmark}
            title="Novo favorito"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Favorito</span>
          </button>

          {/* New Folder */}
          <button
            onClick={onOpenCreateFolder}
            title="Nova pasta"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Pasta</span>
          </button>

          {/* AI Organize Button */}
          <button
            onClick={onOpenAiOrganize}
            title="Organizar favoritos com IA local (Ollama)"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizar com IA</span>
          </button>

          {/* Full Tab Button */}
          {isSidePanel && (
            <button
              onClick={handleOpenFullTab}
              title="Abrir em aba completa"
              className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:block"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
