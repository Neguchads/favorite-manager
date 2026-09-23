import React, { useState, useEffect } from 'react';
import { Star, Check, Folder, Trash2, ExternalLink } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { FolderOption } from '../../hooks/useBookmarks';
import { extractDomain, getFaviconUrl } from '../../utils/url';

interface SaveCurrentTabCardProps {
  allBookmarks: BookmarkNode[];
  allFolders: FolderOption[];
  activeSection: string;
  onCreateBookmark: (title: string, url: string, parentId?: string) => Promise<any>;
  onDeleteBookmark: (id: string) => Promise<any>;
  onMoveBookmark: (id: string, targetFolderId: string) => Promise<any>;
  onOpenFolderTree?: () => void;
}

interface TabInfo {
  id?: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

export const SaveCurrentTabCard: React.FC<SaveCurrentTabCardProps> = ({
  allBookmarks,
  allFolders,
  activeSection,
  onCreateBookmark,
  onDeleteBookmark,
  onMoveBookmark,
  onOpenFolderTree,
}) => {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [loadingTab, setLoadingTab] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('1');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isChangingFolder, setIsChangingFolder] = useState(false);

  // Detect current active tab in Edge
  useEffect(() => {
    async function fetchTab() {
      setLoadingTab(true);
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            setTabInfo({
              id: tab.id,
              title: tab.title || '',
              url: tab.url,
              favIconUrl: tab.favIconUrl,
            });
            setCustomTitle(tab.title || '');
          }
        } catch (e) {
          console.warn('Não foi possível obter a aba ativa:', e);
        }
      } else {
        // Fallback for dev / browser testing
        setTabInfo({
          title: document.title || 'Microsoft Edge',
          url: window.location.href || 'https://www.microsoft.com/edge',
        });
        setCustomTitle(document.title || 'Microsoft Edge');
      }
      setLoadingTab(false);
    }

    fetchTab();
  }, []);

  // Update target folder default based on current section if it's a real folder
  useEffect(() => {
    if (activeSection && !['all', 'recent', 'duplicates', 'cleanup', 'stats', 'backups', 'settings'].includes(activeSection)) {
      if (activeSection === 'bookmarks_bar') {
        setSelectedFolderId('1');
      } else if (activeSection === 'other') {
        setSelectedFolderId('2');
      } else {
        setSelectedFolderId(activeSection);
      }
    }
  }, [activeSection]);

  if (loadingTab || !tabInfo) {
    return null;
  }

  // Check if current tab is a valid saveable URL
  const isSaveable =
    tabInfo.url.startsWith('http://') ||
    tabInfo.url.startsWith('https://') ||
    tabInfo.url.startsWith('edge://') ||
    tabInfo.url.startsWith('chrome://') ||
    tabInfo.url.startsWith('file://');

  if (!isSaveable) {
    return null;
  }

  // Check if current URL already exists in bookmarks
  const existingBookmark = allBookmarks.find((b) => b.url === tabInfo.url);
  const existingFolder = existingBookmark?.parentId
    ? allFolders.find((f) => f.id === existingBookmark.parentId)
    : null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tabInfo.url || isSaving) return;

    try {
      setIsSaving(true);
      const titleToSave = customTitle.trim() || tabInfo.title || tabInfo.url;
      await onCreateBookmark(titleToSave, tabInfo.url, selectedFolderId);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar favorito:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveExisting = async (newFolderId: string) => {
    if (!existingBookmark) return;
    try {
      await onMoveBookmark(existingBookmark.id, newFolderId);
      setIsChangingFolder(false);
    } catch (err) {
      console.error('Erro ao mover favorito existente:', err);
    }
  };

  const handleDelete = async () => {
    if (!existingBookmark) return;
    try {
      await onDeleteBookmark(existingBookmark.id);
    } catch (err) {
      console.error('Erro ao remover favorito:', err);
    }
  };

  const favicon = tabInfo.favIconUrl || getFaviconUrl(tabInfo.url);
  const domain = extractDomain(tabInfo.url);

  // If already bookmarked
  if (existingBookmark) {
    return (
      <div className="p-2.5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-850 dark:to-slate-800 border-b border-sky-100 dark:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-500 shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Página já favoritada
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
                  Salva
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center space-x-1">
                <Folder className="w-3 h-3 text-amber-500 shrink-0 inline" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {existingFolder?.title || 'Barra de favoritos'}
                </span>
                {existingFolder?.path && (
                  <span className="text-[9px] text-slate-400 truncate">
                    ({existingFolder.path})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsChangingFolder(!isChangingFolder)}
              className="px-2 py-1 bg-white dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-650 rounded text-[10px] font-medium transition-colors"
              title="Trocar pasta deste favorito"
            >
              Mover
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
              title="Remover dos favoritos"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isChangingFolder && (
          <div className="mt-2 pt-2 border-t border-sky-100 dark:border-slate-700 flex items-center space-x-2">
            <span className="text-[10px] text-slate-500 shrink-0">Mover para:</span>
            <select
              value={existingBookmark.parentId || '1'}
              onChange={(e) => handleMoveExisting(e.target.value)}
              className="flex-1 text-[11px] px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {allFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path || f.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // Not bookmarked yet: quick save form
  return (
    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/90 border-b border-slate-200 dark:border-slate-800 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
          <Star className="w-3.5 h-3.5 text-sky-500" />
          <span>Salvar guia atual nos favoritos</span>
        </div>
        {justSaved ? (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Salvo!</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
            {domain}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-1.5">
        <div className="flex items-center space-x-2">
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
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Nome do favorito..."
            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 pt-0.5">
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full pl-2 pr-6 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 truncate"
              title="Pasta de destino"
            >
              {allFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path || f.title}
                </option>
              ))}
            </select>
          </div>

          {onOpenFolderTree && (
            <button
              type="button"
              onClick={onOpenFolderTree}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition-colors shrink-0 flex items-center space-x-1"
              title="Navegar e escolher na árvore de pastas"
            >
              <Folder className="w-3 h-3 text-amber-500" />
              <span>Árvore</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded text-[11px] transition-colors shrink-0 flex items-center space-x-1 shadow-xs disabled:opacity-50"
          >
            <Star className="w-3 h-3 fill-white" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
