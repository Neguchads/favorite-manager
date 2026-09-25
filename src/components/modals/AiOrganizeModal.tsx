import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Send,
  Terminal,
  AlertCircle,
  XOctagon,
  FolderTree,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { BookmarkNode } from '../../types/bookmarks';
import { FolderOption } from '../../hooks/useBookmarks';
import { checkOllamaConnection, chatWithOllama, DEFAULT_OLLAMA_CONFIG } from '../../ai/ollama';
import { generateAiPlan, capitalizeFolderWords } from '../../ai/classifier';
import { AiProposedPlan, OllamaConfig, ChatMessage } from '../../ai/types';
import { MINI_AGENT_SYSTEM_PROMPT, MINI_AGENT_QUICK_CHIPS } from '../../ai/prompts';
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

const STORAGE_KEY_ENGINE = 'fav_manager_ai_engine';
const STORAGE_KEY_MODEL = 'fav_manager_ai_model';

export const AiOrganizeModal: React.FC<AiOrganizeModalProps> = ({
  isOpen,
  onClose,
  itemsToOrganize,
  allFolders,
  parentPathMap,
  onApplyPlan,
}) => {
  // Main view tab: 'organize' or 'chat_agent'
  const [activeTab, setActiveTab] = useState<'organize' | 'chat_agent'>('organize');

  // Engine & Model selection (with persistence)
  const [selectedEngine, setSelectedEngine] = useState<'semantic' | 'ollama'>('semantic');
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(DEFAULT_OLLAMA_CONFIG);
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected: boolean;
    models: string[];
    checking: boolean;
    latencyMs?: number;
    isCorsForbidden?: boolean;
    error?: string;
  }>({
    connected: false,
    models: [],
    checking: false,
    isCorsForbidden: false,
  });

  // CORS command copied feedback
  const [corsCopied, setCorsCopied] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<{ current: number; total: number } | null>(null);
  const [plan, setPlan] = useState<AiProposedPlan | null>(null);
  const [usedOllama, setUsedOllama] = useState(false);
  const [analysisDuration, setAnalysisDuration] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Execution state
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [cleanEmptyFolders, setCleanEmptyFolders] = useState<boolean>(true);
  const [sortAlphabetical, setSortAlphabetical] = useState<boolean>(true);
  const [completedResult, setCompletedResult] = useState<{
    movedCount: number;
    prunedFoldersCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mini-Agent Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou seu Mini-Agente de IA local. Posso te ajudar a planejar a estrutura das suas pastas, criar regras personalizadas para extensões e favoritos ou tirar dúvidas. Como posso te ajudar?',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Track collapsed master categories in preview
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Copy feedback state for chat
  const [copiedChat, setCopiedChat] = useState(false);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null);

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // Load persisted engine and model preferences
  useEffect(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([STORAGE_KEY_ENGINE, STORAGE_KEY_MODEL], (data) => {
          if (data[STORAGE_KEY_ENGINE]) setSelectedEngine(data[STORAGE_KEY_ENGINE]);
          if (data[STORAGE_KEY_MODEL]) {
            setOllamaConfig((prev) => ({ ...prev, model: data[STORAGE_KEY_MODEL] }));
          }
        });
      } else {
        const savedEngine = localStorage.getItem(STORAGE_KEY_ENGINE);
        const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
        if (savedEngine === 'semantic' || savedEngine === 'ollama') setSelectedEngine(savedEngine);
        if (savedModel) setOllamaConfig((prev) => ({ ...prev, model: savedModel }));
      }
    } catch {}
  }, []);

  const handleSelectEngine = (engine: 'semantic' | 'ollama') => {
    setSelectedEngine(engine);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_KEY_ENGINE]: engine });
      } else {
        localStorage.setItem(STORAGE_KEY_ENGINE, engine);
      }
    } catch {}
  };

  const handleSelectModel = (model: string) => {
    setOllamaConfig((prev) => ({ ...prev, model }));
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_KEY_MODEL]: model });
      } else {
        localStorage.setItem(STORAGE_KEY_MODEL, model);
      }
    } catch {}
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
    setOllamaStatus((prev) => ({ ...prev, checking: true, error: undefined }));
    const res = await checkOllamaConnection(ollamaConfig.endpoint);
    setOllamaStatus({
      connected: res.connected,
      models: res.models,
      checking: false,
      latencyMs: res.latencyMs,
      isCorsForbidden: res.isCorsForbidden,
      error: res.error,
    });
    if (res.connected && res.models.length > 0) {
      if (!ollamaConfig.model || !res.models.includes(ollamaConfig.model)) {
        handleSelectModel(res.models[0]);
      }
    }
  };

  const copyCorsCommand = () => {
    const cmd = 'setx OLLAMA_ORIGINS "chrome-extension://*"';
    navigator.clipboard.writeText(cmd);
    setCorsCopied(true);
    setTimeout(() => setCorsCopied(false), 2500);
  };

  const handleCancelAnalyze = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setAnalyzing(false);
      setError('Organização cancelada pelo usuário.');
    }
  };

  const handleAnalyze = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setAnalyzing(true);
    setError(null);
    setAnalyzeProgress({ current: 0, total: itemsToOrganize.length });
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
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        setPlan(result.plan);
        setUsedOllama(result.usedOllama);
        setAnalysisDuration(Date.now() - startTime);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err?.message || 'Erro ao gerar proposta de organização');
      }
    } finally {
      setAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleApply = async () => {
    if (!plan) return;
    try {
      setApplying(true);
      setApplyProgress({ current: 0, total: plan.moves.length, percent: 0 });
      setCompletedResult(null);

      // Snapshot before applying mass moves
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

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Falha ao aplicar mudanças');
    } finally {
      setApplying(false);
    }
  };

  function generateSmartAssistantAnswer(query: string): string {
    const q = query.toLowerCase();

    if (/organiz|redund[aâ]ncia|pasta|nicho|estrutur|t[ií]tulo|mai[uú]scul|f[aá]ceis|ortografia/i.test(q)) {
      return `### 📁 Proposta de Organização Inteligente e Sem Redundâncias

Com base nas suas preferências, aqui está uma arquitetura com **Title Case** (cada palavra iniciando com maiúscula), nomes concisos, sem redundâncias e no máximo 2 níveis:

- 💻 **Dev & IA**
  - ├─ Inteligência Artificial
  - ├─ Repositórios
  - ├─ Documentação
  - └─ Ferramentas
- 🎮 **Jogos**
  - ├─ PC
  - ├─ PlayStation
  - ├─ Nintendo
  - ├─ Xbox
  - ├─ Mods
  - └─ Wikis & Guias
- 💼 **Negócios & Finanças**
  - ├─ Investimentos & Bancos
  - └─ Empreendedorismo & Marcas
- 🏛️ **Governo**
  - ├─ Serviços Públicos
  - └─ Trânsito & Detran
- ✈️ **Viagens & Turismo**
- 🛒 **Compras**
  - ├─ Hardware & Informática
  - └─ Cupons & Comparadores
- 📚 **Estudos**
  - ├─ Concursos & Cursos
  - └─ Livros & Artigos
- 🎬 **Filmes & Séries**
  - ├─ Streaming
  - └─ Animes
- ⚡ **Tecnologia**
  - ├─ Android
  - └─ Hardware

✨ **Dica prática**: Você pode ir na aba **"Organizar Favoritos"** e clicar em **"Gerar Proposta de Organização"** usando o **Motor Semântico Ultrarrápido** (instantâneo e sem necessidade de GPU) ou com o seu **Ollama Local**.`;
    }

    if (/jogos|games|playstation|steam|mods|emulad/i.test(q)) {
      return `🎮 **Estrutura recomendada para Jogos**:
- **Jogos / PC** (Steam, Epic Games, GOG, Riot)
- **Jogos / PlayStation** (exclusivos, ISOs, PS3/PS4/PS5)
- **Jogos / Nintendo** (Switch, emuladores e ROMs)
- **Jogos / Xbox** (Game Pass, consoles)
- **Jogos / Mods** (Nexus Mods, CurseForge, Modrinth)
- **Jogos / Wikis & Guias** (bases de dados, builds, mapas)`;
    }

    if (/dev|program|c[oó]digo|ia|intelig[eê]ncia/i.test(q)) {
      return `💻 **Estrutura recomendada para Dev & IA**:
- **Dev & IA / Inteligência Artificial** (Claude, ChatGPT, Ollama, Perplexity)
- **Dev & IA / Repositórios** (GitHub, GitLab, Bitbucket)
- **Dev & IA / Documentação** (MDN, Microsoft Learn, W3Schools)
- **Dev & IA / Ferramentas** (Docker, Supabase, Vercel, NPM)
- **Dev & IA / Comunidade & Dúvidas** (Stack Overflow, fóruns)`;
    }

    if (/faculdade|curso|estudo|concurso/i.test(q)) {
      return `📚 **Estrutura recomendada para Estudos**:
- **Estudos / Concursos & Cursos** (QConcursos, Gran, Alura, Udemy)
- **Estudos / Livros & Artigos** (SciELO, Google Scholar, Wikipedia, PDFs)
- **Estudos / Faculdades & EAD** (portais de alunos, graduação)
- **Estudos / Idiomas** (Duolingo, vocabulário, pronúncia)
- **Estudos / Ciências Exatas** (matemática, física, calculadoras)`;
    }

    return `Entendido! Para organizar seus favoritos de forma profissional:
1. **Sem Redundâncias**: Use nomes limpos como "Jogos", "Governo", "Dev & IA", "Estudos" e "Compras".
2. **Title Case**: Todas as palavras iniciam com maiúsculas para manter a barra elegante e legível.
3. **Subpastas Diretas**: Sem pastas genéricas como "/ Geral". Os itens vão direto para a categoria raiz ou para a subpasta correspondente.

Você pode clicar na aba **"Organizar Favoritos"** a qualquer momento para gerar e revisar o plano antes de aplicar!`;
  }

  // Mini-Agent Chat Handler
  const handleSendChatMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim() || isChatting) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsChatting(true);

    try {
      if (ollamaStatus.connected) {
        const fullMessages: ChatMessage[] = [
          { role: 'system', content: MINI_AGENT_SYSTEM_PROMPT },
          ...chatMessages.filter((m) => m.role !== 'system'),
          userMsg,
        ];
        const responseText = await chatWithOllama(fullMessages, ollamaConfig);
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: responseText, timestamp: Date.now() },
        ]);
      } else {
        const simulated = generateSmartAssistantAnswer(textToSend);
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: simulated, timestamp: Date.now() },
        ]);
      }
    } catch (err: any) {
      const isCors = err?.message?.includes('403') || err?.message?.includes('CORS');
      const simulated = generateSmartAssistantAnswer(textToSend);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `${simulated}\n\n---\n*ℹ️ Nota do Sistema: ${isCors ? 'Ollama respondeu com 403 (CORS). A resposta acima foi gerada pelo assistente semântico embutido.' : err?.message || 'Servidor Ollama indisponível.'}*`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleCopyEntireChat = async () => {
    try {
      const formatted = chatMessages
        .map(
          (m) =>
            `${m.role === 'user' ? 'Você' : `Mini-Agente IA (${ollamaStatus.connected ? ollamaConfig.model : 'Heurístico'})`}:\n${m.content}`
        )
        .join('\n\n---\n\n');
      await navigator.clipboard.writeText(formatted);
      setCopiedChat(true);
      setTimeout(() => setCopiedChat(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgIndex(index);
      setTimeout(() => setCopiedMsgIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExecuteDirectFromChat = async () => {
    if (applying || analyzing) return;
    try {
      setApplying(true);
      setError(null);

      // 1. Generate plan if not already present
      let activePlan = plan;
      if (!activePlan) {
        setAnalyzing(true);
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
          selectedEngine
        );
        activePlan = result.plan;
        setPlan(activePlan);
        setAnalyzing(false);
      }

      if (activePlan) {
        setApplyProgress({ current: 0, total: activePlan.moves.length, percent: 0 });
        await createLocalSnapshot('Snapshot prévio à Organização via Mini-Agente');

        const res = await onApplyPlan(
          activePlan,
          (current, total, percentage) => {
            setApplyProgress({ current, total, percent: percentage });
          },
          cleanEmptyFolders,
          sortAlphabetical
        );

        if (res) {
          const successMsg: ChatMessage = {
            role: 'assistant',
            content: `✅ **Organização aplicada com sucesso nos favoritos!**\n\n- **${res.movedCount}** favoritos organizados e movidos\n- **${res.createdFoldersCount}** pastas e subpastas criadas/reutilizadas\n- **${res.prunedFoldersCount}** pastas vazias limpas\n\nSeus favoritos no Microsoft Edge já estão organizados e sincronizados! 🎉`,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, successMsg]);
          setCompletedResult({
            movedCount: res.movedCount,
            prunedFoldersCount: res.prunedFoldersCount,
          });
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao aplicar organização diretamente do chat');
    } finally {
      setApplying(false);
      setAnalyzing(false);
    }
  };

  const handleApplyFromChat = () => {
    setActiveTab('organize');
    if (!plan && !analyzing) {
      handleAnalyze();
    }
  };

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatting]);

  // Hierarchical groupings: Master Category -> Subfolders -> Bookmarks
  const hierarchicalPreview = useMemo<HierarchicalMasterGroup[]>(() => {
    if (!plan) return [];

    const masterMap = new Map<string, Map<string, typeof plan.moves>>();

    for (const move of plan.moves) {
      const parts = move.targetFolder.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
      const rawMaster = parts[0] || 'Outros';
      const master = capitalizeFolderWords(rawMaster);
      const sub = parts.length > 1 ? capitalizeFolderWords(parts.slice(1).join(' / ')) : '';

      if (!masterMap.has(master)) {
        masterMap.set(master, new Map());
      }
      const subMap = masterMap.get(master)!;
      const subKey = sub || '(Pasta Principal)';
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
            const fullPath =
              subfolderName === '(Pasta Principal)'
                ? masterCategory
                : `${masterCategory} / ${subfolderName}`;
            return { subfolderName, fullPath, items };
          });

        return { masterCategory, totalItems, subfolders };
      });
  }, [plan]);

  const renderOllamaBar = () => {
    const availableModels =
      ollamaStatus.models.length > 0
        ? ollamaStatus.models
        : [ollamaConfig.model, 'qwen3.5:9b', 'llama3', 'mistral', 'gemma2'].filter(
            (val, idx, arr) => arr.indexOf(val) === idx
          );

    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-850/90 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              IA Local (Ollama)
            </span>

            {/* Status Pill */}
            {ollamaStatus.checking ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center space-x-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Verificando...</span>
              </span>
            ) : ollamaStatus.connected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online {ollamaStatus.latencyMs ? `(${ollamaStatus.latencyMs}ms)` : ''}</span>
              </span>
            ) : ollamaStatus.isCorsForbidden ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center space-x-1">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>CORS Bloqueado (403)</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Offline
              </span>
            )}
          </div>

          {/* Test Button */}
          <button
            type="button"
            onClick={checkConnection}
            disabled={ollamaStatus.checking}
            className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Testar conexão com o servidor local Ollama"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-violet-500 ${ollamaStatus.checking ? 'animate-spin' : ''}`} />
            <span>Testar Conexão com IA Local</span>
          </button>
        </div>

        {/* Model Selector & Context specs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Modelo da IA:</span>
            <select
              value={ollamaConfig.model}
              onChange={(e) => handleSelectModel(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 cursor-pointer font-medium focus:outline-none focus:border-violet-500"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m} {ollamaStatus.connected && ollamaStatus.models.includes(m) ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[10px] text-slate-400">
            Lotes de 10 itens com num_ctx 8192 • {ollamaConfig.endpoint}
          </span>
        </div>

        {/* CORS 403 Alert with 1-click copy */}
        {ollamaStatus.isCorsForbidden && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg space-y-1.5 text-amber-900 dark:text-amber-200 text-[11px]">
            <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Ollama bloqueado por CORS (HTTP 403)</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Para liberar o acesso no Windows PowerShell ou Prompt de Comando com 1 clique:
            </p>
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded border border-amber-200 dark:border-amber-900">
              <Terminal className="w-3 h-3 text-slate-400 shrink-0" />
              <code className="flex-1 font-mono text-[10px] text-slate-800 dark:text-slate-200 select-all">
                setx OLLAMA_ORIGINS &quot;chrome-extension://*&quot;
              </code>
              <button
                type="button"
                onClick={copyCorsCommand}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[10px] flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
              >
                {corsCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{corsCopied ? 'Copiado!' : 'Copiar Comando'}</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-300">
              Após rodar o comando, reinicie o Ollama. A extensão também possui regras automáticas de redirecionamento.
            </p>
          </div>
        )}
      </div>
    );
  };

  const modalFooter = (
    <div className="flex justify-between items-center w-full">
      <button
        type="button"
        onClick={onClose}
        disabled={applying}
        className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 text-xs font-semibold"
      >
        Fechar
      </button>

      {activeTab === 'organize' && (
        <div className="flex items-center space-x-2">
          {plan ? (
            <>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || applying}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 text-xs font-medium"
              >
                Refazer Análise
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center space-x-2 text-xs"
              >
                {applying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {applying
                    ? `Movendo... ${applyProgress ? `${applyProgress.percent}%` : ''}`
                    : 'Aplicar Organização com Subpastas'}
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center space-x-2 text-xs"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analisando Favoritos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Plano de Organização</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {activeTab === 'chat_agent' && (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyEntireChat}
            className="px-3 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center space-x-1.5"
            title="Copiar toda a conversa"
          >
            {copiedChat ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedChat ? 'Copiado!' : 'Copiar Conversa'}</span>
          </button>

          <button
            type="button"
            onClick={handleExecuteDirectFromChat}
            disabled={analyzing || applying}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center space-x-2 text-xs"
          >
            {applying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Aplicando... {applyProgress ? `${applyProgress.percent}%` : ''}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Aplicar Organização Agora</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Organização Inteligente de Favoritos & Mini-Agente IA"
      maxWidth="2xl"
      footer={modalFooter}
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-700 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('organize')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'organize'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizar Favoritos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat_agent')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'chat_agent'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mini-Agente IA (Chat Local)</span>
            {ollamaStatus.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* TAB 1: ORGANIZE FAVORITES */}
        {activeTab === 'organize' && (
          <div className="space-y-4">
            {/* Engine Selector */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleSelectEngine('semantic')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  selectedEngine === 'semantic'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Motor Semântico Ultrarrápido</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold ml-1">
                  Instantâneo (&lt; 0.1s)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectEngine('ollama')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  selectedEngine === 'ollama'
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-violet-500" />
                <span>Ollama IA Local (LLM)</span>
                {ollamaStatus.connected ? (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                    Online ({ollamaConfig.model})
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.2 rounded-full font-bold">
                    Offline
                  </span>
                )}
              </button>
            </div>

            {/* Engine status banner / Ollama controls */}
            {selectedEngine === 'semantic' ? (
              !plan && (
                <div className="p-3 rounded-xl border bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 flex items-start space-x-2.5">
                  <Zap className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[12px]">Classificação Semântica Direta e Sem Redundâncias</span>
                    <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                      Usa nomes limpos e padronizados com <strong>Title Case (ex: Jogos, Governo, Dev & IA, Estudos, Compras, Viagens & Turismo)</strong>. Adapta-se automaticamente às suas pastas e elimina redundâncias.
                    </p>
                  </div>
                </div>
              )
            ) : (
              renderOllamaBar()
            )}

            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* Analyzing Progress Bar with Cancel Button */}
            {analyzing && (
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-sky-800 dark:text-sky-200">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                    <span>Classificando favoritos...</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span>
                      {analyzeProgress
                        ? `${analyzeProgress.current} / ${analyzeProgress.total}`
                        : `0 / ${itemsToOrganize.length}`}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelAnalyze}
                      className="px-2 py-0.5 text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 rounded transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <XOctagon className="w-3 h-3" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
                <div className="w-full bg-sky-200 dark:bg-sky-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 rounded-full transition-all duration-150"
                    style={{
                      width: `${
                        analyzeProgress
                          ? Math.round((analyzeProgress.current / (analyzeProgress.total || 1)) * 100)
                          : 25
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Trigger Button if no plan yet */}
            {!plan && !analyzing && (
              <div className="text-center py-6 space-y-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Organizar {itemsToOrganize.length} favoritos sem redundâncias
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Cria pastas limpas (<em>Jogos, Governo, Dev & IA, Estudos</em>), mapeia para suas pastas existentes e preserva a organização.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 inline-flex items-center space-x-2 cursor-pointer text-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Proposta de Organização</span>
                </button>
              </div>
            )}

            {/* Applying Progress Bar */}
            {applying && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <div className="flex justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                  <span className="flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    <span>Movendo favoritos para as novas subpastas...</span>
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
              </div>
            )}

            {/* Plan Preview */}
            {plan && (
              <div className="space-y-3">
                {/* Plan Header & Breakdown Statistics */}
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        Proposta Gerada ({plan.moves.length} favoritos em {hierarchicalPreview.length} temas)
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                        {usedOllama ? 'Via Ollama IA' : 'Via Regras & Heurística'}
                      </span>
                    </div>
                    {analysisDuration !== null && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({(analysisDuration / 1000).toFixed(2)}s)
                      </span>
                    )}
                  </div>

                  {/* Plan stats breakdown badge */}
                  {plan.stats && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded font-medium">
                        🏷️ {plan.stats.viaDomain} via Regras de Domínio
                      </span>
                      {plan.stats.viaOllama > 0 && (
                        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded font-medium">
                          🤖 {plan.stats.viaOllama} via IA Local ({ollamaConfig.model})
                        </span>
                      )}
                      {plan.stats.viaHeuristic > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                          ⚡ {plan.stats.viaHeuristic} via Heurística Semântica
                        </span>
                      )}
                      {plan.stats.failedBatches > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-medium">
                          ⚠️ {plan.stats.failedBatches} lotes com fallback automático
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hierarchical Tree Preview */}
                <div className="max-h-60 sm:max-h-68 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                  {hierarchicalPreview.map((masterGroup) => {
                    const isCollapsed = collapsedCategories.has(masterGroup.masterCategory);

                    return (
                      <div
                        key={masterGroup.masterCategory}
                        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/70 overflow-hidden shadow-xs"
                      >
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
                              {capitalizeFolderWords(masterGroup.masterCategory)}
                            </span>
                          </div>
                          <span className="text-[10px] bg-sky-100 dark:bg-sky-900/70 text-sky-700 dark:text-sky-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                            {masterGroup.totalItems} {masterGroup.totalItems === 1 ? 'item' : 'itens'}
                          </span>
                        </button>

                        {!isCollapsed && (
                          <div className="p-2 space-y-2">
                            {masterGroup.subfolders.map((subgroup) => (
                              <div key={subgroup.fullPath} className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900/60">
                                <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="text-[11px]">
                                    {subgroup.subfolderName === '(Pasta Principal)'
                                      ? `(Raiz de ${capitalizeFolderWords(masterGroup.masterCategory)})`
                                      : capitalizeFolderWords(subgroup.subfolderName)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({subgroup.items.length})
                                  </span>
                                </div>

                                <div className="pl-4 space-y-1">
                                  {subgroup.items.slice(0, 8).map((item) => (
                                    <div
                                      key={item.bookmarkId}
                                      className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 gap-2"
                                    >
                                      <div className="flex items-center space-x-1.5 truncate">
                                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{item.bookmarkTitle || item.url}</span>
                                      </div>
                                      {item.source && (
                                        <span className="text-[9px] px-1 py-0.2 rounded font-mono shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-500">
                                          {item.source === 'domain'
                                            ? 'Regra'
                                            : item.source === 'ollama'
                                            ? 'IA'
                                            : 'Heurística'}
                                        </span>
                                      )}
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
          </div>
        )}

        {/* TAB 2: MINI-AGENT CHAT */}
        {activeTab === 'chat_agent' && (
          <div className="space-y-3">
            {renderOllamaBar()}

            {/* Quick prompts & Copy Entire Chat */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar flex-1 min-w-[200px]">
                <span className="text-slate-400 shrink-0 font-medium">Perguntas rápidas:</span>
                {MINI_AGENT_QUICK_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendChatMessage(chip)}
                    disabled={isChatting}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-950/60 text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 rounded-full transition-colors shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyEntireChat}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-2xs"
                title="Copiar toda a conversa"
              >
                {copiedChat ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Conversa</span>
                  </>
                )}
              </button>
            </div>

            {/* Chat Box */}
            <div className="h-72 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1 opacity-80 text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        {msg.role === 'user' ? (
                          <span>Você</span>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-violet-500" />
                            <span>Mini-Agente IA ({ollamaStatus.connected ? ollamaConfig.model : 'Heurístico'})</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, index)}
                        className={`text-[10px] flex items-center space-x-1 transition-colors cursor-pointer ${
                          msg.role === 'user'
                            ? 'text-sky-200 hover:text-white'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Copiar mensagem"
                      >
                        {copiedMsgIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.role === 'assistant' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleExecuteDirectFromChat}
                            disabled={applying || analyzing}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {applying ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Aplicando... {applyProgress ? `${applyProgress.percent}%` : ''}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>⚡ Aplicar Organização Agora</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyFromChat}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-[11px] transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <FolderTree className="w-3.5 h-3.5 text-sky-500" />
                            <span>Revisar na Árvore</span>
                          </button>
                        </div>

                        <span className="text-[10px] text-slate-400">
                          {applying
                            ? `Movendo ${applyProgress?.current || 0}/${applyProgress?.total || 0}...`
                            : 'Aplica as subpastas nos seus favoritos'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-slate-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    <span>Mini-Agente pensando...</span>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pergunte como organizar favoritos, estruturar extensões..."
                disabled={isChatting}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatting}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
};
