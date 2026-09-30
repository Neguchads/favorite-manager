import React, { useState, useMemo } from 'react';
import {
  FolderX,
  FileQuestion,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  History,
  Check,
  ArrowRight,
} from 'lucide-react';
import { BookmarkNode, CleanupReport } from '../../types/bookmarks';
import {
  findBookmarksWithTrackers,
  TrackedBookmark,
} from '../../services/cleanup/trackerSanitizer';
import {
  findBookmarksWithGenericTitles,
  fetchTitleForUrl,
} from '../../services/cleanup/titleEnricher';
import { requestAllSitesAccess, ALL_SITES_DENIED_MESSAGE } from '../../services/permissions';
import {
  checkBookmarksHealth,
  LinkHealthResult,
} from '../../services/health';

interface CleanupViewProps {
  report: CleanupReport;
  allItems: BookmarkNode[];
  parentPathMap: Map<string, string>;
  onDeleteFolder: (id: string) => void;
  onDeleteAllEmptyFolders?: () => void;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (item: BookmarkNode) => void;
  onUpdateBookmark?: (id: string, title: string, url?: string) => Promise<any>;
  onDeleteMultiple?: (ids: string[]) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type CleanupTab = 'folders' | 'trackers' | 'titles' | 'health';

export const CleanupView: React.FC<CleanupViewProps> = ({
  report,
  allItems,
  parentPathMap,
  onDeleteFolder,
  onDeleteAllEmptyFolders,
  onDeleteBookmark,
  onEditBookmark,
  onUpdateBookmark,
  onDeleteMultiple,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<CleanupTab>('folders');

  // Trackers state
  const trackedItems = useMemo(() => findBookmarksWithTrackers(allItems), [allItems]);
  const [cleaningTrackers, setCleaningTrackers] = useState(false);
  const [cleanedCount, setCleanedCount] = useState<number | null>(null);

  // Titles state
  const genericTitleItems = useMemo(
    () => findBookmarksWithGenericTitles(allItems),
    [allItems]
  );
  const [enrichingTitles, setEnrichingTitles] = useState(false);
  const [titleProgress, setTitleProgress] = useState<{ current: number; total: number } | null>(null);

  // Link Health state
  const [isScanningHealth, setIsScanningHealth] = useState(false);
  const [healthProgress, setHealthProgress] = useState<{ current: number; total: number } | null>(null);
  const [healthResults, setHealthResults] = useState<LinkHealthResult[]>([]);
  const [restoredArchiveMap, setRestoredArchiveMap] = useState<Record<string, boolean>>({});
  const [sitesAccessDenied, setSitesAccessDenied] = useState(false);

  const handleRestoreArchiveUrl = async (res: LinkHealthResult) => {
    if (!onUpdateBookmark || !res.waybackUrl) return;
    try {
      await onUpdateBookmark(res.bookmark.id, res.bookmark.title, res.waybackUrl);
      setRestoredArchiveMap((prev) => ({ ...prev, [res.bookmark.id]: true }));
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.warn('Erro ao restaurar link via Wayback Machine:', err);
    }
  };

  // Handler: Clean all trackers
  const handleCleanAllTrackers = async () => {
    if (!onUpdateBookmark || trackedItems.length === 0) return;
    setCleaningTrackers(true);
    let count = 0;
    try {
      for (const item of trackedItems) {
        await onUpdateBookmark(item.bookmark.id, item.bookmark.title, item.cleanUrl);
        count++;
      }
      setCleanedCount(count);
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.warn('Erro ao limpar rastreadores:', e);
    } finally {
      setCleaningTrackers(false);
    }
  };

  // Handler: Clean single tracker
  const handleCleanSingleTracker = async (item: TrackedBookmark) => {
    if (!onUpdateBookmark) return;
    await onUpdateBookmark(item.bookmark.id, item.bookmark.title, item.cleanUrl);
    if (onRefresh) await onRefresh();
  };

  // Handler: Auto-enrich titles
  const handleEnrichTitles = async () => {
    if (!onUpdateBookmark || genericTitleItems.length === 0) return;
    // Primeiro await do clique: o navegador só mostra o pedido de permissão durante o gesto
    if (!(await requestAllSitesAccess())) {
      setSitesAccessDenied(true);
      return;
    }
    setSitesAccessDenied(false);
    setEnrichingTitles(true);
    setTitleProgress({ current: 0, total: genericTitleItems.length });

    try {
      const itemsToProcess = genericTitleItems.slice(0, 50); // Safe batch of 50
      let done = 0;
      for (const bm of itemsToProcess) {
        if (bm.url) {
          const newTitle = await fetchTitleForUrl(bm.url);
          if (newTitle && newTitle !== bm.title) {
            await onUpdateBookmark(bm.id, newTitle, bm.url);
          }
        }
        done++;
        setTitleProgress({ current: done, total: itemsToProcess.length });
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.warn('Erro ao enriquecer títulos:', err);
    } finally {
      setEnrichingTitles(false);
      setTitleProgress(null);
    }
  };

  // Handler: Scan broken links
  const handleStartHealthScan = async () => {
    // Primeiro await do clique: o navegador só mostra o pedido de permissão durante o gesto
    if (!(await requestAllSitesAccess())) {
      setSitesAccessDenied(true);
      return;
    }
    setSitesAccessDenied(false);
    setIsScanningHealth(true);
    setHealthResults([]);
    setHealthProgress({ current: 0, total: Math.min(allItems.length, 300) });

    try {
      // Check first 200-300 or all bookmarks in parallel batches
      const sample = allItems.filter((i) => i.url).slice(0, 300);
      const results = await checkBookmarksHealth(sample, (curr, tot) => {
        setHealthProgress({ current: curr, total: tot });
      });
      setHealthResults(results);
    } catch (err) {
      console.warn('Falha no escaneamento de integridade:', err);
    } finally {
      setIsScanningHealth(false);
    }
  };

  // Handler: Delete all broken links
  const handleDeleteAllBrokenLinks = async () => {
    if (!onDeleteMultiple) return;
    const brokenIds = healthResults
      .filter((r) => r.status === 'broken_404' || r.status === 'broken_server')
      .map((r) => r.bookmark.id);

    if (brokenIds.length === 0) return;
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${brokenIds.length} favoritos quebrados (Erro 404 / Falha no Servidor)? Um snapshot de segurança será criado antes.`
      )
    ) {
      await onDeleteMultiple(brokenIds);
      setHealthResults((prev) => prev.filter((r) => !brokenIds.includes(r.bookmark.id)));
      if (onRefresh) await onRefresh();
    }
  };

  const brokenLinksList = healthResults.filter(
    (r) => r.status === 'broken_404' || r.status === 'broken_server' || r.status === 'network_error'
  );

  const redirectedLinksList = healthResults.filter(
    (r) => r.status === 'redirected' && r.finalUrl
  );

  const handleUpdateRedirected = async (item: LinkHealthResult) => {
    if (!onUpdateBookmark || !item.finalUrl) return;
    try {
      await onUpdateBookmark(item.bookmark.id, item.bookmark.title, item.finalUrl);
      setHealthResults((prev) =>
        prev.map((r) =>
          r.bookmark.id === item.bookmark.id
            ? { ...r, status: 'ok', bookmark: { ...r.bookmark, url: item.finalUrl } }
            : r
        )
      );
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.warn('Erro ao atualizar URL redirecionada:', e);
    }
  };

  const handleUpdateAllRedirected = async () => {
    if (!onUpdateBookmark || redirectedLinksList.length === 0) return;
    try {
      for (const item of redirectedLinksList) {
        if (item.finalUrl) {
          await onUpdateBookmark(item.bookmark.id, item.bookmark.title, item.finalUrl);
        }
      }
      setHealthResults((prev) =>
        prev.map((r) =>
          r.status === 'redirected' && r.finalUrl
            ? { ...r, status: 'ok', bookmark: { ...r.bookmark, url: r.finalUrl } }
            : r
        )
      );
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.warn('Erro ao atualizar URLs redirecionadas em lote:', e);
    }
  };

  return (
    <div className="p-4 space-y-4 text-xs">
      {sitesAccessDenied && (
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
          {ALL_SITES_DENIED_MESSAGE}
        </div>
      )}
      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('folders')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'folders'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <FolderX className="w-3.5 h-3.5" />
          <span>Pastas Vazias ({report.emptyFolders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trackers')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'trackers'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Rastreadores & UTM ({trackedItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('titles')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'titles'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <FileQuestion className="w-3.5 h-3.5 text-indigo-400" />
          <span>Títulos Genéricos ({genericTitleItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'health'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>
            Integridade & Redirecionamentos ({brokenLinksList.length + redirectedLinksList.length})
          </span>
        </button>
      </div>

      {/* TAB 1: PASTAS VAZIAS */}
      {activeTab === 'folders' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Pastas Totalmente Vazias ({report.emptyFolders.length})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pastas sem favoritos e sem subpastas ativas. Raízes do sistema são mantidas protegidas.
              </p>
            </div>
            {onDeleteAllEmptyFolders && report.emptyFolders.length > 0 && (
              <button
                type="button"
                onClick={onDeleteAllEmptyFolders}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Todas as Pastas Vazias</span>
              </button>
            )}
          </div>

          {report.emptyFolders.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Nenhuma pasta vazia encontrada!
              </p>
              <p className="text-[11px] mt-1">Sua árvore de diretórios está perfeitamente limpa.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[500px] overflow-y-auto">
              {report.emptyFolders.map((folder) => {
                const path = folder.parentId ? parentPathMap.get(folder.parentId) : '';
                return (
                  <div
                    key={folder.id}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-700/40"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {folder.title || 'Pasta Sem Nome'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Caminho: {path || 'Barra de favoritos'}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteFolder(folder.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir pasta</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RASTREADORES & UTM */}
      {activeTab === 'trackers' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Higienizador de URLs & Rastreadores ({trackedItems.length})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Remove parâmetros espiões (utm_source, fbclid, gclid, si, etc.) mantendo o link limpo.
              </p>
            </div>
            {trackedItems.length > 0 && (
              <button
                type="button"
                onClick={handleCleanAllTrackers}
                disabled={cleaningTrackers}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {cleaningTrackers ? 'Higienizando URLs...' : 'Limpar Todos os Rastreadores'}
                </span>
              </button>
            )}
          </div>

          {cleanedCount !== null && (
            <div className="mx-4 my-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{cleanedCount} URLs higienizadas com sucesso!</span>
            </div>
          )}

          {trackedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Nenhum parâmetro de rastreamento encontrado!
              </p>
              <p className="text-[11px] mt-1">Todos os seus links estão limpos e diretos.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[500px] overflow-y-auto">
              {trackedItems.map((item) => (
                <div
                  key={item.bookmark.id}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-700/40"
                >
                  <div className="max-w-xl truncate">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.bookmark.title}
                    </p>
                    <p className="text-[11px] text-rose-500 line-through truncate">
                      {item.bookmark.url}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                      {item.cleanUrl}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.removedParams.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded text-[10px]"
                        >
                          -{p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCleanSingleTracker(item)}
                    className="flex items-center space-x-1 px-2.5 py-1 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded transition-colors"
                  >
                    <span>Limpar URL</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TÍTULOS GENÉRICOS */}
      {activeTab === 'titles' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Enriquecedor de Títulos ({genericTitleItems.length})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Identifica links com nomes genéricos (ex: &quot;Nova guia&quot;, URLs cruas) e atualiza para o título real da página.
              </p>
            </div>
            {genericTitleItems.length > 0 && (
              <button
                type="button"
                onClick={handleEnrichTitles}
                disabled={enrichingTitles}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${enrichingTitles ? 'animate-spin' : ''}`} />
                <span>
                  {enrichingTitles
                    ? `Buscando títulos (${titleProgress?.current}/${titleProgress?.total})...`
                    : 'Buscar e Atualizar Títulos'}
                </span>
              </button>
            )}
          </div>

          {genericTitleItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Todos os favoritos possuem títulos descritivos!
              </p>
              <p className="text-[11px] mt-1">Nenhum título vazio ou genérico detectado.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[500px] overflow-y-auto">
              {genericTitleItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-700/40"
                >
                  <div className="max-w-xl truncate">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.title || '(Sem Título)'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{item.url}</p>
                  </div>
                  <button
                    onClick={() => onEditBookmark(item)}
                    className="flex items-center space-x-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LINKS QUEBRADOS & 404 (WAYBACK MACHINE) */}
      {activeTab === 'health' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Verificador de Links Quebrados & Erro 404
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Escaneia requisições em lotes paralelos. Para sites fora do ar, oferece link direto no Wayback Machine (Archive.org).
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {redirectedLinksList.length > 0 && onUpdateBookmark && (
                <button
                  type="button"
                  onClick={handleUpdateAllRedirected}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Atualizar Redirecionados ({redirectedLinksList.length})</span>
                </button>
              )}

              {brokenLinksList.length > 0 && onDeleteMultiple && (
                <button
                  type="button"
                  onClick={handleDeleteAllBrokenLinks}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Links Quebrados ({brokenLinksList.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleStartHealthScan}
                disabled={isScanningHealth}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningHealth ? 'animate-spin' : ''}`} />
                <span>
                  {isScanningHealth
                    ? `Verificando (${healthProgress?.current}/${healthProgress?.total})...`
                    : 'Escanear Favoritos'}
                </span>
              </button>
            </div>
          </div>

          {/* Progress bar during scan */}
          {isScanningHealth && healthProgress && (
            <div className="px-4 py-2 bg-sky-50/50 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-900/50">
              <div className="flex items-center justify-between text-[11px] text-sky-700 dark:text-sky-300 mb-1">
                <span>Verificando status de conectividade...</span>
                <span>
                  {Math.round((healthProgress.current / (healthProgress.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-sky-100 dark:bg-sky-900/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-150"
                  style={{
                    width: `${(healthProgress.current / (healthProgress.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Results list */}
          {healthResults.length === 0 && !isScanningHealth ? (
            <div className="p-8 text-center text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Nenhuma verificação executada ainda.
              </p>
              <p className="text-[11px] mt-1">
                Clique em &quot;Escanear Favoritos&quot; para checar quais links continuam no ar ou foram redirecionados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[500px] overflow-y-auto">
              {brokenLinksList.length === 0 && redirectedLinksList.length === 0 && !isScanningHealth ? (
                <div className="p-8 text-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Nenhum problema encontrado na amostra!</p>
                  <p className="text-xs text-slate-500 mt-1">Todos os sites responderam normalmente sem erros ou redirecionamentos pendentes.</p>
                </div>
              ) : (
                <>
                  {/* Redirected Links Section */}
                  {redirectedLinksList.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300 text-[11px] uppercase tracking-wider">
                          Links com Redirecionamento 301/302 ({redirectedLinksList.length})
                        </span>
                        <span className="text-[10px] text-indigo-500">
                          O destino mudou; atualize a URL para evitar saltos lentos
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {redirectedLinksList.map((res) => (
                          <div
                            key={res.bookmark.id}
                            className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-700/40"
                          >
                            <div className="max-w-xl truncate">
                              <div className="flex items-center space-x-2">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                  {res.httpCode ? `${res.httpCode} Redirecionado` : 'Redirecionado'}
                                </span>
                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {res.bookmark.title}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                                <span className="line-through text-slate-400">{res.bookmark.url}</span>
                                <ArrowRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                  {res.finalUrl}
                                </span>
                              </div>
                            </div>

                            {onUpdateBookmark && (
                              <button
                                onClick={() => handleUpdateRedirected(res)}
                                className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded transition-colors text-[11px] font-medium"
                                title="Atualizar favorito com a nova URL de destino"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Atualizar URL</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Broken Links Section */}
                  {brokenLinksList.length > 0 && (
                    <div>
                      {redirectedLinksList.length > 0 && (
                        <div className="px-4 py-2 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between border-b border-rose-100 dark:border-rose-900/50">
                          <span className="font-semibold text-rose-700 dark:text-rose-300 text-[11px] uppercase tracking-wider">
                            Links Quebrados ({brokenLinksList.length})
                          </span>
                        </div>
                      )}
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {brokenLinksList.map((res) => (
                          <div
                            key={res.bookmark.id}
                            className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-700/40"
                          >
                            <div className="max-w-xl truncate">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    res.status === 'broken_404'
                                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {res.status === 'broken_404'
                                    ? '404 Não Encontrado'
                                    : res.status === 'timeout'
                                    ? 'Timeout (Fora do Ar)'
                                    : `Erro ${res.httpCode || 'Rede'}`}
                                </span>
                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {res.bookmark.title}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {res.bookmark.url}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              {onUpdateBookmark && res.waybackUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreArchiveUrl(res)}
                                  disabled={restoredArchiveMap[res.bookmark.id]}
                                  title="Atualizar URL deste favorito para a versão preservada no Archive.org"
                                  className="flex items-center space-x-1 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 disabled:opacity-60 rounded transition-colors text-[11px] font-medium cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{restoredArchiveMap[res.bookmark.id] ? 'Preservado!' : 'Salvar Snapshot'}</span>
                                </button>
                              )}
                              <a
                                href={res.waybackUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Tentar abrir versão salva no Archive.org"
                                className="flex items-center space-x-1 px-2.5 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors text-[11px]"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>Wayback</span>
                              </a>
                              <button
                                onClick={() => onDeleteBookmark(res.bookmark.id)}
                                className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded"
                                title="Excluir este favorito quebrado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
