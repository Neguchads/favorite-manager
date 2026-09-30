import React, { useState, useEffect, useRef } from 'react';
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
  Laptop,
  Sun,
  Moon,
  Monitor,
  UploadCloud,
  Globe,
  Radio,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { ViewMode } from '../../types/bookmarks';
import { ThemePreference } from '../../hooks/useTheme';
import { useTranslation } from '../../i18n';
import { useSync } from '../../hooks/useSync';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme?: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
  isNative: boolean;
  onOpenCreateBookmark: () => void;
  onOpenCreateFolder: () => void;
  onOpenAiOrganize: () => void;
  onOpenWorkspaceTabs?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenImport?: () => void;
  onOpenSync?: () => void;
  isSidePanel?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  theme = 'system',
  onThemeChange,
  isNative,
  onOpenCreateBookmark,
  onOpenCreateFolder,
  onOpenAiOrganize,
  onOpenWorkspaceTabs,
  onOpenCommandPalette,
  onOpenImport,
  onOpenSync,
  isSidePanel = false,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const { status: syncStatus, peers: syncPeers, hasLegacyKey: syncLegacyKey } = useSync();
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [autoOrganize, setAutoOrganize] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsOpen]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['autoOrganizeOnCreate'], (res) => {
        setAutoOrganize(res.autoOrganizeOnCreate === true);
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
                  Favorite Manager
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
                {t('header.subtitle')}
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
              placeholder={t('header.searchPlaceholder')}
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
                title={t('header.commandPaletteTooltip')}
                className="absolute right-8 hidden sm:flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                ⌘K
              </button>
            )}
            <button
              onClick={() => setShowSearchHelp(!showSearchHelp)}
              title={t('header.searchTooltip')}
              className="absolute right-2 p-1 text-slate-400 hover:text-sky-500"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Help Dropdown */}
          {showSearchHelp && (
            <div className="absolute left-0 right-0 top-full mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-40 text-xs space-y-2">
              <div className="flex justify-between items-center font-semibold text-slate-700 dark:text-slate-200">
                <span>{t('header.filterTitle')}</span>
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
                  — {t('header.filterDomainDesc')}
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400 font-mono">
                    folder:IA
                  </code>{' '}
                  — {t('header.filterFolderDesc')}
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400 font-mono">
                    title:Claude
                  </code>{' '}
                  — {t('header.filterWordsDesc')}
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Actions — Streamlined & Decluttered */}
        <div className="flex items-center justify-end space-x-1.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('list')}
              title={t('header.viewList')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              title={t('header.viewCards')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Action: New Bookmark */}
          <button
            onClick={onOpenCreateBookmark}
            title={t('action.newBookmark')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('header.bookmark')}</span>
          </button>

          {/* Highlight Action: AI Organize Button */}
          <button
            onClick={onOpenAiOrganize}
            title="Organizar favoritos com IA local (Ollama)"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('header.aiOrganize')}</span>
          </button>

          {/* Decluttered Secondary Tools & Settings Popover Dropdown */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              title="Mais ferramentas e preferências"
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isToolsOpen
                  ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden lg:inline">Mais</span>
              {syncStatus === 'connected' && syncPeers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-850 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {/* Section: Ações Rápidas */}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Gerenciamento
                </div>
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenCreateFolder();
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('action.newFolder')}</span>
                </button>

                {onOpenImport && (
                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenImport();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{t('header.import')}</span>
                  </button>
                )}

                {onOpenWorkspaceTabs && (
                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenWorkspaceTabs();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <Laptop className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{t('header.workspaceTabs')}</span>
                  </button>
                )}

                {/* Section: Sincronização & Automação */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Sincronização & IA
                </div>

                {onOpenSync && (
                  <button
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenSync();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Radio className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="truncate">Sincronização Edge ⇄ Chrome</span>
                    </div>
                    {syncLegacyKey && (
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold shrink-0"
                        title={t('nav.syncLegacyKey')}
                      >
                        {t('nav.syncLegacyKey')}
                      </span>
                    )}
                    {syncStatus === 'connected' && syncPeers.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold shrink-0">
                        Ativa
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={toggleAutoOrganize}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Zap className={`w-4 h-4 ${autoOrganize ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <span className="truncate">Auto-organizar no Ctrl+D</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold shrink-0 ${
                    autoOrganize
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {autoOrganize ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Section: Preferências de Aparência & Idioma */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Preferências
                </div>

                {onThemeChange && (
                  <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-200">
                    <span className="text-xs">Tema:</span>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => onThemeChange('light')}
                        title={t('header.themeLight')}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                          theme === 'light' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onThemeChange('dark')}
                        title={t('header.themeDark')}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                          theme === 'dark' ? 'bg-white dark:bg-slate-700 text-sky-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onThemeChange('system')}
                        title={t('header.themeSystem')}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                          theme === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-200">
                  <span className="text-xs">Idioma:</span>
                  <button
                    type="button"
                    onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                    className="flex items-center space-x-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                  >
                    <Globe className="w-3 h-3 text-sky-500" />
                    <span>{language === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Full Tab Button (Side Panel only) */}
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
