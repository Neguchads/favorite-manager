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
  const [selectedWindowIds, setSelectedWindowIds] = useState<Set<number>>(new Set());
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

      // Select all windows and their tabs by default
      const allWinIds = new Set(data.map((w) => w.id));
      setSelectedWindowIds(allWinIds);
      setSelectedTabIds(new Set(data.flatMap((w) => w.tabs).map((t) => t.id)));

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

  // Total tabs across all detected windows
  const totalAvailableTabs = useMemo(() => {
    return windows.reduce((acc, w) => acc + w.tabs.length, 0);
  }, [windows]);

  // Are all windows currently checked?
  const allWindowsSelected = windows.length > 0 && windows.every((w) => selectedWindowIds.has(w.id));

  // Toggle selecting/deselecting all windows
  const toggleSelectAllWindows = () => {
    if (allWindowsSelected) {
      // Unselect all windows and all tabs
      setSelectedWindowIds(new Set());
      setSelectedTabIds(new Set());
    } else {
      // Select all windows and all tabs
      const allIds = new Set(windows.map((w) => w.id));
      setSelectedWindowIds(allIds);
      setSelectedTabIds(new Set(windows.flatMap((w) => w.tabs).map((t) => t.id)));
    }
  };

  // Toggle single window in/out of selection
  const toggleWindow = (winId: number) => {
    const win = windows.find((w) => w.id === winId);
    if (!win) return;

    setSelectedWindowIds((prev) => {
      const next = new Set(prev);
      if (next.has(winId)) {
        next.delete(winId);
        // Remove tabs of unselected window
        setSelectedTabIds((prevTabs) => {
          const nextTabs = new Set(prevTabs);
          win.tabs.forEach((t) => nextTabs.delete(t.id));
          return nextTabs;
        });
      } else {
        next.add(winId);
        // Add tabs of selected window
        setSelectedTabIds((prevTabs) => {
          const nextTabs = new Set(prevTabs);
          win.tabs.forEach((t) => nextTabs.add(t.id));
          return nextTabs;
        });
      }
      return next;
    });
  };

  // Displayed tabs based on checked windows
  const displayedTabs = useMemo<OpenTab[]>(() => {
    return windows
      .filter((w) => selectedWindowIds.has(w.id))
      .flatMap((w) => w.tabs);
  }, [windows, selectedWindowIds]);

  // Toggle single tab
  const toggleTab = (id: number) => {
    setSelectedTabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all / Deselect all displayed tabs
  const allTabsSelected = displayedTabs.length > 0 && displayedTabs.every((t) => selectedTabIds.has(t.id));
  const toggleSelectAllTabs = () => {
    if (allTabsSelected) {
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

  const selectedTabsCount = displayedTabs.filter((t) => selectedTabIds.has(t.id)).length;

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
                Favorite as guias abertas de todas as janelas ou selecione janelas específicas.
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

        {/* Window Selector with Checkboxes */}
        {windows.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Checkbox: Selecionar Todas as Janelas */}
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allWindowsSelected}
                  onChange={toggleSelectAllWindows}
                  className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-4 h-4"
                />
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  <span>Selecionar Todas as Janelas</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  ({windows.length} {windows.length === 1 ? 'janela' : 'janelas'}, {totalAvailableTabs} guias no total)
                </span>
              </label>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {selectedWindowIds.size} de {windows.length} janelas marcadas
              </span>
            </div>

            {/* Individual Window Checkboxes */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              {windows.map((win) => {
                const isSelected = selectedWindowIds.has(win.id);
                return (
                  <label
                    key={win.id}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-300 dark:border-sky-600 text-sky-800 dark:text-sky-200 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWindow(win.id)}
                      className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>{win.isCurrent ? 'Janela Atual' : `Janela #${win.id}`}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                      {win.tabs.length}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs List Header & Select All */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={toggleSelectAllTabs}
            disabled={displayedTabs.length === 0}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium disabled:opacity-50 cursor-pointer"
          >
            {allTabsSelected ? (
              <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {allTabsSelected ? 'Desmarcar todas' : 'Selecionar todas'} ({displayedTabs.length} guias)
            </span>
          </button>

          <span className="text-[11px] text-slate-500 font-medium">
            {selectedTabsCount} selecionadas
          </span>
        </div>

        {/* Tabs List */}
        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850">
          {loading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
              <span>Lendo guias abertas do Edge...</span>
            </div>
          ) : selectedWindowIds.size === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma janela marcada. Marque uma ou mais janelas acima para visualizar suas guias.
            </div>
          ) : displayedTabs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma guia web encontrada nas janelas selecionadas.
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
                    <div className="flex items-center space-x-1.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate text-xs flex-1">
                        {tab.title || '(Sem título)'}
                      </p>
                      {windows.length > 1 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                          {tab.windowId === windows.find((w) => w.isCurrent)?.id
                            ? 'Janela Atual'
                            : `Janela #${tab.windowId}`}
                        </span>
                      )}
                    </div>
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
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
              Salvar dentro de
            </label>
            <select
              value={targetParentId}
              onChange={(e) => setTargetParentId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
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
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors order-last sm:order-first cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2">
            {onOrganizeTabsWithAi && (
              <button
                type="button"
                onClick={handleSaveAndOrganizeWithAi}
                disabled={selectedTabsCount === 0}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Salvar & Organizar com IA ({selectedTabsCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveToFolder}
              disabled={saving || selectedTabsCount === 0}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : `Salvar ${selectedTabsCount} em Pasta`}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
