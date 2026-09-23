import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Folder,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  Trash2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { BookmarkNode } from '../../types/bookmarks';
import { FolderOption } from '../../hooks/useBookmarks';
import { checkOllamaConnection, DEFAULT_OLLAMA_CONFIG } from '../../ai/ollama';
import { generateAiPlan } from '../../ai/classifier';
import { AiProposedPlan, OllamaConfig } from '../../ai/types';
import { createLocalSnapshot } from '../../services/backup';

interface AiOrganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToOrganize: BookmarkNode[];
  allFolders: FolderOption[];
  parentPathMap?: Map<string, string>;
  onApplyPlan: (
    plan: AiProposedPlan,
    onProgress?: (current: number, total: number, percentage: number) => void,
    cleanEmptyFolders?: boolean,
    sortAlphabetical?: boolean
  ) => Promise<{ createdFoldersCount: number; movedCount: number; skippedCount: number; prunedFoldersCount: number } | void>;
}

interface HierarchicalSubgroup {
  subfolderName: string;
  fullPath: string;
  items: AiProposedPlan['moves'];
}

interface HierarchicalMasterGroup {
  masterCategory: string;
  totalItems: number;
  subfolders: HierarchicalSubgroup[];
}

export const AiOrganizeModal: React.FC<AiOrganizeModalProps> = ({
  isOpen,
  onClose,
  itemsToOrganize,
  allFolders,
  parentPathMap,
  onApplyPlan,
}) => {
  const [selectedEngine, setSelectedEngine] = useState<'semantic' | 'ollama'>('semantic');
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(DEFAULT_OLLAMA_CONFIG);
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected: boolean;
    models: string[];
    checking: boolean;
  }>({
    connected: false,
    models: [],
    checking: false,
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<{ current: number; total: number } | null>(null);
  const [plan, setPlan] = useState<AiProposedPlan | null>(null);
  const [usedOllama, setUsedOllama] = useState(false);
  const [analysisDuration, setAnalysisDuration] = useState<number | null>(null);

  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [cleanEmptyFolders, setCleanEmptyFolders] = useState<boolean>(true);
  const [sortAlphabetical, setSortAlphabetical] = useState<boolean>(true);
  const [completedResult, setCompletedResult] = useState<{
    movedCount: number;
    prunedFoldersCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track collapsed master categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // Check Ollama connection on open
  useEffect(() => {
    if (isOpen) {
      checkConnection();
      setPlan(null);
      setError(null);
      setAnalyzeProgress(null);
      setApplyProgress(null);
      setAnalysisDuration(null);
    }
  }, [isOpen]);

  const checkConnection = async () => {
    setOllamaStatus((prev) => ({ ...prev, checking: true }));
    const res = await checkOllamaConnection(ollamaConfig.endpoint);
    setOllamaStatus({
      connected: res.connected,
      models: res.models,
      checking: false,
    });
    if (res.connected && res.models.length > 0 && !res.models.includes(ollamaConfig.model)) {
      setOllamaConfig((prev) => ({ ...prev, model: res.models[0] }));
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalyzeProgress(null);
    const startTime = Date.now();

    try {
      const existingNames = new Set(allFolders.map((f) => f.title.toLowerCase()));
      const itemsPayload = itemsToOrganize.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url || '',
        folderPath: item.parentId && parentPathMap ? parentPathMap.get(item.parentId) : undefined,
      }));

      const result = await generateAiPlan(
        itemsPayload,
        existingNames,
        selectedEngine === 'ollama' && ollamaStatus.connected ? ollamaConfig : undefined,
        selectedEngine,
        (current, total) => {
          setAnalyzeProgress({ current, total });
        }
      );

      setPlan(result.plan);
      setUsedOllama(result.usedOllama);
      setAnalysisDuration(Date.now() - startTime);
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar proposta de organização');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!plan) return;
    try {
      setApplying(true);
      setApplyProgress({ current: 0, total: plan.moves.length, percent: 0 });
      setCompletedResult(null);

      // Auto snapshot before mass changes
      await createLocalSnapshot('Snapshot prévio à Organização com IA');

      const res = await onApplyPlan(
        plan,
        (current, total, percentage) => {
          setApplyProgress({ current, total, percent: percentage });
        },
        cleanEmptyFolders,
        sortAlphabetical
      );

      if (res) {
        setCompletedResult({
          movedCount: res.movedCount,
          prunedFoldersCount: res.prunedFoldersCount,
        });
      }

      // Close modal after brief feedback
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Falha ao aplicar mudanças');
    } finally {
      setApplying(false);
    }
  };

  // Hierarchical groupings: Master Category -> Subfolders -> Bookmarks
  const hierarchicalPreview = useMemo<HierarchicalMasterGroup[]>(() => {
    if (!plan) return [];

    const masterMap = new Map<string, Map<string, typeof plan.moves>>();

    for (const move of plan.moves) {
      const parts = move.targetFolder.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
      const master = parts[0] || 'Outros & Geral';
      const sub = parts.length > 1 ? parts.slice(1).join(' / ') : '';

      if (!masterMap.has(master)) {
        masterMap.set(master, new Map());
      }
      const subMap = masterMap.get(master)!;
      const subKey = sub || '(Geral)';
      if (!subMap.has(subKey)) {
        subMap.set(subKey, []);
      }
      subMap.get(subKey)!.push(move);
    }

    return Array.from(masterMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
      .map(([masterCategory, subMap]) => {
        let totalItems = 0;
        const subfolders: HierarchicalSubgroup[] = Array.from(subMap.entries())
          .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
          .map(([subfolderName, items]) => {
            totalItems += items.length;
            const fullPath = subfolderName === '(Geral)' ? masterCategory : `${masterCategory} / ${subfolderName}`;
            return { subfolderName, fullPath, items };
          });

        return { masterCategory, totalItems, subfolders };
      });
  }, [plan]);

  const isLargeBatch = itemsToOrganize.length > 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🤖 Organizar Favoritos com IA Inteligente" maxWidth="lg">
      <div className="space-y-4 text-xs">
        {/* Engine selector tabs */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setSelectedEngine('semantic')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              selectedEngine === 'semantic'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Motor Semântico Ultrarrápido</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold ml-1">
              Instantâneo (&lt; 0.2s)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEngine('ollama')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              selectedEngine === 'ollama'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-violet-500" />
            <span>Ollama IA Local (LLM)</span>
            {ollamaStatus.connected ? (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                Online
              </span>
            ) : (
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.2 rounded-full font-bold">
                Offline
              </span>
            )}
          </button>
        </div>

        {/* Engine status banner */}
        {selectedEngine === 'semantic' ? (
          <div className="p-3 rounded-xl border bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 flex items-start space-x-2.5">
            <Zap className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-[12px]">Classificação Semântica de Alta Performance</span>
              <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                Algoritmo treinado e calibrado especificamente com mais de 3.500 favoritos reais. Separa com precisão cirúrgica <strong>Games, Filmes e Músicas</strong>, unifica <strong>Programação e IA</strong> e cria subpastas ricas como <em>Sony, Nintendo, Xbox, Cursos e Livros</em> em <strong>menos de 1 segundo</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              ollamaStatus.connected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-semibold">
                  {ollamaStatus.connected
                    ? `Ollama Conectado (${ollamaConfig.endpoint})`
                    : 'Ollama Offline'}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {ollamaStatus.connected
                    ? `Modelo em uso: ${ollamaConfig.model}. Processamento em lotes de 20 itens.`
                    : 'Inicie seu Ollama no terminal ou use o Motor Semântico Ultrarrápido acima.'}
                </p>
              </div>
            </div>

            <button
              onClick={checkConnection}
              disabled={ollamaStatus.checking}
              className="p-1.5 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
              title="Verificar conexão com Ollama"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${ollamaStatus.checking ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        )}

        {/* Large batch recommendation alert */}
        {selectedEngine === 'ollama' && isLargeBatch && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-300 text-[11px] flex items-center space-x-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Você possui <strong>{itemsToOrganize.length} favoritos</strong>. Processar milhares de links através de um LLM local pode demorar vários minutos. Recomendamos usar o <strong>Motor Semântico Ultrarrápido</strong> para resposta imediata.
            </span>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Model & Endpoint Settings (if Ollama selected and connected) */}
        {selectedEngine === 'ollama' && ollamaStatus.connected && ollamaStatus.models.length > 0 && (
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 font-medium">Modelo Ollama:</span>
            <select
              value={ollamaConfig.model}
              onChange={(e) => setOllamaConfig({ ...ollamaConfig, model: e.target.value })}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {ollamaStatus.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Analyzing progress bar */}
        {analyzing && (
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
            <div className="flex justify-between text-[11px] font-semibold text-sky-800 dark:text-sky-200">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>Classificando favoritos...</span>
              </span>
              <span>
                {analyzeProgress
                  ? `${analyzeProgress.current} / ${analyzeProgress.total}`
                  : `0 / ${itemsToOrganize.length}`}
              </span>
            </div>
            <div className="w-full bg-sky-200 dark:bg-sky-900/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-600 h-2 rounded-full transition-all duration-150"
                style={{
                  width: `${
                    analyzeProgress
                      ? Math.round((analyzeProgress.current / analyzeProgress.total) * 100)
                      : 25
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action / Analyze trigger */}
        {!plan && !analyzing && (
          <div className="text-center py-6 space-y-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Organizar {itemsToOrganize.length} favoritos com Subpastas Inteligentes
              </h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                O sistema separará <strong>Jogos, Filmes e Músicas</strong>, unificará <strong>Programação, Dev & IA</strong> em uma pasta só,
                e criará subpastas como <em>Sony, Nintendo, Xbox, PC, Mods, Cursos, Livros, Eletroeletrônica e Mecânica</em>.
              </p>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 inline-flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Proposta de Subpastas Instantaneamente</span>
            </button>
          </div>
        )}

        {/* Applying moves progress bar */}
        {applying && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
            <div className="flex justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
              <span className="flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>Movendo favoritos para as novas subpastas (lotes paralelos)...</span>
              </span>
              <span>
                {applyProgress
                  ? `${applyProgress.percent}% (${applyProgress.current}/${applyProgress.total})`
                  : 'Iniciando...'}
              </span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-900/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150"
                style={{ width: `${applyProgress ? applyProgress.percent : 5}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
              Execução otimizada em lotes paralelos de alta velocidade. Aguarde a conclusão.
            </p>
          </div>
        )}

        {/* Plan Preview */}
        {plan && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Proposta Hierárquica ({plan.moves.length} favoritos distribuídos em {hierarchicalPreview.length} temas)
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                {analysisDuration !== null && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({(analysisDuration / 1000).toFixed(2)}s)
                  </span>
                )}
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-medium">
                  {usedOllama ? 'Via Ollama LLM' : 'Via Motor Semântico'}
                </span>
              </div>
            </div>

            {/* Hierarchical Tree Preview Box */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
              {hierarchicalPreview.map((masterGroup) => {
                const isCollapsed = collapsedCategories.has(masterGroup.masterCategory);

                return (
                  <div
                    key={masterGroup.masterCategory}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/70 overflow-hidden shadow-xs"
                  >
                    {/* Master Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(masterGroup.masterCategory)}
                      className="w-full px-3 py-2 bg-slate-100/60 dark:bg-slate-750 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[12px]">
                          {masterGroup.masterCategory}
                        </span>
                      </div>
                      <span className="text-[10px] bg-sky-100 dark:bg-sky-900/70 text-sky-700 dark:text-sky-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        {masterGroup.totalItems} {masterGroup.totalItems === 1 ? 'item' : 'itens'}
                      </span>
                    </button>

                    {/* Subfolders and items container */}
                    {!isCollapsed && (
                      <div className="p-2 space-y-2">
                        {masterGroup.subfolders.map((subgroup) => (
                          <div key={subgroup.fullPath} className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900/60">
                            {/* Subfolder header */}
                            <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-1">
                              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-[11px]">{subgroup.subfolderName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({subgroup.items.length})
                              </span>
                            </div>

                            {/* Bookmarks in this subfolder */}
                            <div className="pl-4 space-y-1">
                              {subgroup.items.slice(0, 8).map((item) => (
                                <div
                                  key={item.bookmarkId}
                                  className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300 truncate"
                                >
                                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.bookmarkTitle || item.url}</span>
                                </div>
                              ))}
                              {subgroup.items.length > 8 && (
                                <div className="text-[10px] text-slate-400 italic pl-5">
                                  + {subgroup.items.length - 8} outros favoritos...
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Alphabetical sort toggle */}
            <div className="flex items-center space-x-2.5 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="sortAlphabeticalToggle"
                checked={sortAlphabetical}
                onChange={(e) => setSortAlphabetical(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="sortAlphabeticalToggle" className="text-slate-700 dark:text-slate-200 cursor-pointer select-none text-[11px] font-medium flex items-center space-x-1.5 flex-1">
                <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>
                  <strong>Classificar todas as pastas, subpastas e favoritos em ordem alfabética (A-Z)</strong>.
                </span>
              </label>
            </div>

            {/* Empty folder cleanup toggle */}
            <div className="flex items-center space-x-2.5 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="cleanEmptyFoldersToggle"
                checked={cleanEmptyFolders}
                onChange={(e) => setCleanEmptyFolders(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="cleanEmptyFoldersToggle" className="text-slate-700 dark:text-slate-200 cursor-pointer select-none text-[11px] font-medium flex items-center space-x-1.5 flex-1">
                <Trash2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  <strong>Apagar pastas que ficarem vazias</strong> após mover os favoritos (exclui com segurança apenas pastas 100% vazias).
                </span>
              </label>
            </div>

            {/* Safety guarantee */}
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-lg flex items-center space-x-2 text-[11px] text-sky-800 dark:text-sky-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>
                Um snapshot de segurança será gravado automaticamente antes de criar as pastas e mover os favoritos.
              </span>
            </div>

            {/* Completion feedback */}
            {completedResult && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Concluído! {completedResult.movedCount} favoritos organizados
                  {completedResult.prunedFoldersCount > 0
                    ? ` e ${completedResult.prunedFoldersCount} pastas vazias apagadas com sucesso.`
                    : '.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          {plan && (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || applying}
                className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Refazer Análise
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center space-x-2"
              >
                {applying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {applying
                    ? `Movendo... ${applyProgress ? `${applyProgress.percent}%` : ''}`
                    : 'Aplicar Organização com Subpastas'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
