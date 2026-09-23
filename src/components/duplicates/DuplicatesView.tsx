import React, { useState, useMemo } from 'react';
import {
  Trash2,
  ExternalLink,
  Folder,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { BookmarkDuplicateGroup, BookmarkNode } from '../../types/bookmarks';
import { formatDateShort } from '../../utils/date';
import { Modal } from '../common/Modal';

interface DuplicatesViewProps {
  duplicates: BookmarkDuplicateGroup[];
  parentPathMap: Map<string, string>;
  onDeleteBookmark: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => Promise<void>;
  onDeleteDuplicates?: (ids: string[], groupCount?: number) => Promise<void>;
  onInspect: (item: BookmarkNode) => void;
  onRefresh?: () => Promise<void>;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  duplicates,
  parentPathMap,
  onDeleteBookmark,
  onDeleteMultiple,
  onDeleteDuplicates,
  onInspect,
  onRefresh,
}) => {
  const [keepStrategy, setKeepStrategy] = useState<'oldest' | 'newest' | 'longest'>('oldest');
  const [customKeepMap, setCustomKeepMap] = useState<Record<string, string>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [requireConfirm, setRequireConfirm] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Analyze each duplicate group to determine which item is kept and which are duplicates
  const groupAnalysis = useMemo(() => {
    return duplicates.map((group, idx) => {
      const key = group.normalizedUrl;

      // Determine which item to keep
      let keptId = customKeepMap[key];
      if (!keptId) {
        if (keepStrategy === 'newest') {
          keptId = group.items[group.items.length - 1]?.id;
        } else if (keepStrategy === 'longest') {
          // Keep item with the longest/most descriptive title
          const sortedByTitle = [...group.items].sort(
            (a, b) => (b.title?.length || 0) - (a.title?.length || 0)
          );
          keptId = sortedByTitle[0]?.id;
        } else {
          keptId = group.items[0]?.id;
        }
      }

      const keptItem = group.items.find((i) => i.id === keptId) || group.items[0];
      const duplicateItems = group.items.filter((i) => i.id !== keptItem?.id);
      const duplicateIds = duplicateItems.map((i) => i.id);

      return {
        group,
        idx,
        key,
        keptItem,
        duplicateItems,
        duplicateIds,
      };
    });
  }, [duplicates, keepStrategy, customKeepMap]);

  // All duplicate IDs across all groups ready for 1-click removal
  const allDuplicateIds = useMemo(() => {
    return groupAnalysis.flatMap((g) => g.duplicateIds);
  }, [groupAnalysis]);

  // Filter groups by user query
  const filteredAnalysis = useMemo(() => {
    if (!searchFilter.trim()) return groupAnalysis;
    const q = searchFilter.toLowerCase();
    return groupAnalysis.filter((g) => {
      if (g.group.normalizedUrl.toLowerCase().includes(q)) return true;
      return g.group.items.some((item) => item.title?.toLowerCase().includes(q));
    });
  }, [groupAnalysis, searchFilter]);

  // Handle setting a custom item to keep for a group
  const handleSetCustomKeep = (groupKey: string, itemId: string) => {
    setCustomKeepMap((prev) => ({
      ...prev,
      [groupKey]: itemId,
    }));
  };

  // Perform deletion of specified duplicate IDs
  const executeDelete = async (ids: string[], groupCount: number, label: string) => {
    if (ids.length === 0 || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (onDeleteDuplicates) {
        await onDeleteDuplicates(ids, groupCount);
      } else if (onDeleteMultiple) {
        await onDeleteMultiple(ids);
      } else {
        for (const id of ids) {
          onDeleteBookmark(id);
        }
      }

      setSuccessMessage(label);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao excluir duplicados.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1-Click: Delete all duplicates
  const handleDeleteAll = () => {
    if (allDuplicateIds.length === 0 || isDeleting) return;

    if (requireConfirm) {
      setConfirmModalOpen(true);
      return;
    }

    executeDelete(
      allDuplicateIds,
      groupAnalysis.length,
      `${allDuplicateIds.length} favoritos duplicados foram excluídos com sucesso com 1 clique! Snapshot de segurança salvo.`
    );
  };

  // 1-Click for a single group
  const handleDeleteGroup = (duplicateIds: string[]) => {
    executeDelete(
      duplicateIds,
      1,
      `${duplicateIds.length} cópia(s) duplicada(s) do grupo removida(s) com sucesso.`
    );
  };

  // Scan / re-analyze duplicate bookmarks across the tree
  const handleScanDuplicates = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (onRefresh) {
        await Promise.all([
          onRefresh(),
          new Promise((resolve) => setTimeout(resolve, 350)),
        ]);
      }
      setSuccessMessage('Pesquisa de duplicações concluída com sucesso!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao pesquisar duplicados.');
    } finally {
      setIsScanning(false);
    }
  };

  // Empty state
  if (duplicates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Nenhum favorito duplicado encontrado!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Todos os seus favoritos possuem links únicos e normalizados.
        </p>

        <button
          type="button"
          onClick={handleScanDuplicates}
          disabled={isScanning}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Pesquisando...' : 'Pesquisar Duplicações'}</span>
        </button>

        {successMessage && (
          <div className="mt-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 1-Click Tool Master Card */}
      <div className="bg-gradient-to-br from-rose-50/70 via-white to-amber-50/60 dark:from-slate-800 dark:via-slate-850 dark:to-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100 dark:border-slate-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Ferramenta de Limpeza em 1 Clique
                </h3>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  {allDuplicateIds.length} cópias excedentes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exclui cópias repetidas instantaneamente mantendo a versão original de cada link.
              </p>
            </div>
          </div>

          {/* Strategy selector & Confirmation toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setKeepStrategy('oldest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  keepStrategy === 'oldest'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Mantém a cópia adicionada primeiro aos favoritos"
              >
                Manter Mais Antigo
              </button>
              <button
                type="button"
                onClick={() => setKeepStrategy('newest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  keepStrategy === 'newest'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Mantém a cópia mais recente adicionada aos favoritos"
              >
                Manter Mais Recente
              </button>
              <button
                type="button"
                onClick={() => setKeepStrategy('longest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  keepStrategy === 'longest'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Mantém a versão com o título mais longo e descritivo"
              >
                Título Mais Completo
              </button>
            </div>

            <label className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none px-2 py-1">
              <input
                type="checkbox"
                checked={requireConfirm}
                onChange={(e) => setRequireConfirm(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500"
              />
              <span>Confirmar antes</span>
            </label>
          </div>
        </div>

        {/* 1-Click Action Bar */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Backup automático criado antes da exclusão. Recuperável na aba <strong>Backups</strong>.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleScanDuplicates}
              disabled={isScanning || isDeleting}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Reanalisa a árvore de favoritos em busca de duplicações"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Pesquisando...' : 'Pesquisar Duplicações'}</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isDeleting || isScanning || allDuplicateIds.length === 0}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Excluindo {allDuplicateIds.length} duplicados...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Apagar Todos os Duplicados ({allDuplicateIds.length}) com 1 Clique</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success / Error Messages */}
        {successMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar grupos por URL ou título..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Exibindo <strong>{filteredAnalysis.length}</strong> de <strong>{duplicates.length}</strong> grupos
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {filteredAnalysis.map(({ group, idx, key, keptItem, duplicateIds }) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs"
          >
            {/* Group Header */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-mono text-slate-700 dark:text-slate-200 truncate max-w-md font-medium">
                {group.normalizedUrl}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  {group.items.length} cópias ({group.reason === 'exact' ? 'Exato' : 'Normalizado'})
                </span>

                {/* 1-Click for this specific group */}
                {duplicateIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(duplicateIds)}
                    disabled={isDeleting}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                    title={`Excluir ${duplicateIds.length} cópias mantendo a selecionada`}
                  >
                    <Zap className="w-3 h-3 text-rose-500" />
                    <span>Limpar grupo ({duplicateIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Items inside group */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {group.items.map((item) => {
                const isKept = item.id === keptItem?.id;
                const folderPath = item.parentId ? parentPathMap.get(item.parentId) : '';

                return (
                  <div
                    key={item.id}
                    onClick={() => onInspect(item)}
                    className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isKept
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.title || '(Sem título)'}
                        </span>

                        {isKept ? (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 shrink-0">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Manter (Original)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-md font-medium shrink-0 flex items-center space-x-1">
                            <Trash2 className="w-2.5 h-2.5 text-rose-500" />
                            <span>Duplicado</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Folder className="w-3 h-3 text-amber-500" />
                          <span className="truncate max-w-[220px]">{folderPath || 'Raiz'}</span>
                        </span>
                        <span>•</span>
                        <span>Adicionado em {formatDateShort(item.dateAdded)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Button to make this item the preserved one instead */}
                      {!isKept && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCustomKeep(key, item.id);
                          }}
                          className="px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md border border-slate-200 dark:border-slate-600 transition-colors"
                          title="Definir este favorito como o que será mantido"
                        >
                          Manter este
                        </button>
                      )}

                      {/* Open Link */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-sky-500 rounded"
                        title="Abrir favorito"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Individual Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBookmark(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                        title="Excluir apenas esta cópia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal if requireConfirm is enabled */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirmar Exclusão de Duplicados"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Você está prestes a apagar {allDuplicateIds.length} favoritos duplicados.
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                A versão <strong>{keepStrategy === 'oldest' ? 'mais antiga' : 'mais recente'}</strong> de cada grupo será preservada.
                Um snapshot de recuperação será salvo automaticamente antes da exclusão.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmModalOpen(false);
                executeDelete(
                  allDuplicateIds,
                  groupAnalysis.length,
                  `${allDuplicateIds.length} favoritos duplicados foram excluídos com sucesso!`
                );
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirmar e Apagar Agora</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
