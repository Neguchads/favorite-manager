import React, { useState, useEffect, useMemo } from 'react';
import {
  Laptop,
  Layers,
  Globe,
  CheckSquare,
  Square,
  Sparkles,
  FolderPlus,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { FolderOption } from '../../hooks/useBookmarks';
import {
  getOpenWindowsAndTabs,
  OpenWindowGroup,
  OpenTab,
  saveTabsAsBookmarks,
} from '../../services/tabs/workspaceTabs';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { BookmarkNode } from '../../types/bookmarks';

interface WorkspaceTabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderOption[];
  defaultParentId: string;
  onSaved: (folderId: string) => Promise<void>;
  onOrganizeTabsWithAi?: (tabsAsBookmarks: BookmarkNode[]) => void;
}

export const WorkspaceTabsModal: React.FC<WorkspaceTabsModalProps> = ({
  isOpen,
  onClose,
  folders,
  defaultParentId,
  onSaved,
  onOrganizeTabsWithAi,
}) => {
  const [windows, setWindows] = useState<OpenWindowGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWindowId, setSelectedWindowId] = useState<number | 'all'>('all');
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [folderTitle, setFolderTitle] = useState('');
  const [targetParentId, setTargetParentId] = useState(defaultParentId || '1');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTabs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getOpenWindowsAndTabs();
      setWindows(data);

      // Auto-select tabs from current window
      const currentWin = data.find((w) => w.isCurrent) || data[0];
      if (currentWin) {
        setSelectedWindowId(currentWin.id);
        setSelectedTabIds(new Set(currentWin.tabs.map((t) => t.id)));
      }

      // Default folder title
      const now = new Date();
      const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setFolderTitle(`Workspace - ${dateFormatted}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao carregar guias abertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTabs();
      setTargetParentId(defaultParentId || '1');
      setSuccessMsg(null);
    }
  }, [isOpen, defaultParentId]);

  // Displayed tabs based on window selection
  const displayedTabs = useMemo<OpenTab[]>(() => {
    if (selectedWindowId === 'all') {
      return windows.flatMap((w) => w.tabs);
    }
    const win = windows.find((w) => w.id === selectedWindowId);
    return win?.tabs || [];
  }, [windows, selectedWindowId]);

  // Toggle single tab
  const toggleTab = (id: number) => {
    setSelectedTabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all / Deselect all
  const allSelected = displayedTabs.length > 0 && displayedTabs.every((t) => selectedTabIds.has(t.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTabIds((prev) => {
        const next = new Set(prev);
        displayedTabs.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedTabIds((prev) => {
        const next = new Set(prev);
        displayedTabs.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  // Switch window tab filter
  const handleSelectWindow = (id: number | 'all') => {
    setSelectedWindowId(id);
    const tabsForWin = id === 'all' ? windows.flatMap((w) => w.tabs) : (windows.find((w) => w.id === id)?.tabs || []);
    setSelectedTabIds(new Set(tabsForWin.map((t) => t.id)));
  };

  // Save selected tabs as bookmarks in a new folder
  const handleSaveToFolder = async () => {
    const selected = displayedTabs.filter((t) => selectedTabIds.has(t.id));
    if (selected.length === 0) {
      setErrorMsg('Selecione pelo menos uma guia para salvar.');
      return;
    }
    if (!folderTitle.trim()) {
      setErrorMsg('Digite um nome para a pasta de favoritos.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      const res = await saveTabsAsBookmarks(
        selected.map((t) => ({ title: t.title, url: t.url })),
        folderTitle.trim(),
        targetParentId
      );
      await onSaved(res.folderId);
      setSuccessMsg(`${res.createdCount} guias salvas com sucesso em: ${folderTitle}`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao salvar guias.');
    } finally {
      setSaving(false);
    }
  };

  // Save and send directly to AI Organize modal
  const handleSaveAndOrganizeWithAi = () => {
    const selected = displayedTabs.filter((t) => selectedTabIds.has(t.id));
    if (selected.length === 0) {
      setErrorMsg('Selecione pelo menos uma guia para organizar.');
      return;
    }

    const pseudoBookmarks: BookmarkNode[] = selected.map((t, index) => ({
      id: `tab_${Date.now()}_${index}`,
      title: t.title,
      url: t.url,
      dateAdded: Date.now(),
      parentId: targetParentId,
    }));

    if (onOrganizeTabsWithAi) {
      onClose();
      onOrganizeTabsWithAi(pseudoBookmarks);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Favoritar Guias Abertas / Workspaces do Edge"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Banner */}
        <div className="p-3 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-200 dark:border-sky-800/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">
                Capturar Sessão do Microsoft Edge
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Favorite todas as guias abertas da sua janela ou Workspace com 1 clique.
              </p>
            </div>
          </div>

          <button
            onClick={fetchTabs}
            disabled={loading}
            title="Atualizar lista de guias"
            className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Window Selector Tabs */}
        {windows.length > 1 && (
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto scrollbar-none">
            {windows.map((win) => (
              <button
                key={win.id}
                onClick={() => handleSelectWindow(win.id)}
                className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors shrink-0 flex items-center space-x-1.5 ${
                  selectedWindowId === win.id
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Layers className="w-3 h-3 text-sky-500" />
                <span>{win.isCurrent ? 'Janela Atual' : `Janela #${win.id}`}</span>
                <span className="text-[10px] text-slate-400 font-normal">({win.tabs.length})</span>
              </button>
            ))}
            <button
              onClick={() => handleSelectWindow('all')}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors shrink-0 ${
                selectedWindowId === 'all'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Todas as Janelas ({windows.reduce((acc, w) => acc + w.tabs.length, 0)})
            </button>
          </div>
        )}

        {/* Tabs List Header & Select All */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {allSelected ? 'Desmarcar todas' : 'Selecionar todas'} ({displayedTabs.length} guias)
            </span>
          </button>

          <span className="text-[11px] text-slate-400">
            {displayedTabs.filter((t) => selectedTabIds.has(t.id)).length} selecionadas
          </span>
        </div>

        {/* Tabs List */}
        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850">
          {loading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
              <span>Lendo guias abertas do Edge...</span>
            </div>
          ) : displayedTabs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhuma guia web encontrada nesta janela.
            </div>
          ) : (
            displayedTabs.map((tab) => {
              const isSelected = selectedTabIds.has(tab.id);
              const domain = extractDomain(tab.url);
              const favicon = tab.favIconUrl || getFaviconUrl(tab.url);

              return (
                <div
                  key={tab.id}
                  onClick={() => toggleTab(tab.id)}
                  className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50/50 dark:bg-sky-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="mr-3 text-slate-400">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>

                  <div className="w-4 h-4 flex items-center justify-center shrink-0 mr-2.5">
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

                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate text-xs">
                      {tab.title || '(Sem título)'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">
                      {domain || tab.url}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Destination folder configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
              Nome da Nova Pasta <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              placeholder="Ex: Workspace - Faculdade"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
              Salvar dentro de
            </label>
            <select
              value={targetParentId}
              onChange={(e) => setTargetParentId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path || f.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors order-last sm:order-first"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2">
            {onOrganizeTabsWithAi && (
              <button
                type="button"
                onClick={handleSaveAndOrganizeWithAi}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Salvar & Organizar com IA</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveToFolder}
              disabled={saving || displayedTabs.filter((t) => selectedTabIds.has(t.id)).length === 0}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar em Pasta'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
