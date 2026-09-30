import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Trash2,
  FileText,
  Copy,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { fuzzyContains } from '../../utils/search';
import { getFaviconUrl } from '../../utils/url';

const BookmarkFavicon: React.FC<{ url?: string }> = ({ url }) => {
  const [error, setError] = useState(false);
  const favicon = url ? getFaviconUrl(url) : null;

  if (favicon && !error) {
    return (
      <img
        src={favicon}
        alt=""
        onError={() => setError(true)}
        className="w-4 h-4 rounded-xs object-contain"
        loading="lazy"
      />
    );
  }
  return <Globe className="w-3.5 h-3.5 text-slate-400" />;
};

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkNode[];
  parentPathMap: Map<string, string>;
  onSelectBookmark: (bm: BookmarkNode) => void;
  onSelectSection: (section: string) => void;
  onOpenAiOrganize: () => void;
  onPruneEmptyFolders: () => void;
  onExportMarkdown: () => void;
}

interface CommandAction {
  id: string;
  type: 'action';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  handler: () => void;
}

interface BookmarkResult {
  id: string;
  type: 'bookmark';
  item: BookmarkNode;
  path: string;
}

type PaletteItem = CommandAction | BookmarkResult;

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  parentPathMap,
  onSelectBookmark,
  onSelectSection,
  onOpenAiOrganize,
  onPruneEmptyFolders,
  onExportMarkdown,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Built-in actions
  const actions: CommandAction[] = [
    {
      id: 'act-ai',
      type: 'action',
      title: 'Organizar Favoritos com IA',
      subtitle: 'Classificação hierárquica automática com subpastas por temas',
      icon: <Sparkles className="w-4 h-4 text-sky-500" />,
      handler: () => {
        onClose();
        onOpenAiOrganize();
      },
    },
    {
      id: 'act-cleanup-empty',
      type: 'action',
      title: 'Excluir Pastas Vazias',
      subtitle: 'Remove com segurança pastas desocupadas pós-organização',
      icon: <Trash2 className="w-4 h-4 text-amber-500" />,
      handler: () => {
        onClose();
        onPruneEmptyFolders();
      },
    },
    {
      id: 'act-health',
      type: 'action',
      title: 'Verificar Links Quebrados & 404',
      subtitle: 'Escanear integridade e conferir links no Wayback Machine',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      handler: () => {
        onClose();
        onSelectSection('cleanup');
      },
    },
    {
      id: 'act-export-md',
      type: 'action',
      title: 'Exportar para Markdown (Awesome List)',
      subtitle: 'Baixar coleção formatada em README.md para GitHub/Notion',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
      handler: () => {
        onClose();
        onExportMarkdown();
      },
    },
    {
      id: 'act-duplicates',
      type: 'action',
      title: 'Gerenciar Duplicados',
      subtitle: 'Identificar e unificar URLs repetidas',
      icon: <Copy className="w-4 h-4 text-indigo-500" />,
      handler: () => {
        onClose();
        onSelectSection('duplicates');
      },
    },
    {
      id: 'act-bookmarks-bar',
      type: 'action',
      title: 'Ir para Barra de Favoritos',
      subtitle: 'Navegar diretamente para a barra principal',
      icon: <FolderOpen className="w-4 h-4 text-amber-400" />,
      handler: () => {
        onClose();
        onSelectSection('bookmarks_bar');
      },
    },
  ];

  // Filter items
  const cleanQ = query.trim().toLowerCase();

  const matchingActions = cleanQ
    ? actions.filter(
        (a) =>
          a.title.toLowerCase().includes(cleanQ) ||
          a.subtitle.toLowerCase().includes(cleanQ) ||
          fuzzyContains(cleanQ, `${a.title} ${a.subtitle}`, 0.72)
      )
    : actions;

  const matchingBookmarks: BookmarkResult[] = cleanQ
    ? bookmarks
        .filter((b) => {
          if (!b.url) return false;
          const text = `${b.title || ''} ${b.url}`;
          return text.toLowerCase().includes(cleanQ) || fuzzyContains(cleanQ, text, 0.72);
        })
        .slice(0, 25)
        .map((b) => ({
          id: b.id,
          type: 'bookmark',
          item: b,
          path: b.parentId ? parentPathMap.get(b.parentId) || '' : '',
        }))
    : [];

  const allItems: PaletteItem[] = [...matchingActions, ...matchingBookmarks];

  // Ensure index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = selectedIndex < allItems.length - 1 ? selectedIndex + 1 : 0;
      setSelectedIndex(next);
      queueMicrotask(() => {
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = selectedIndex > 0 ? selectedIndex - 1 : allItems.length - 1;
      setSelectedIndex(prev);
      queueMicrotask(() => {
        listRef.current?.children[prev]?.scrollIntoView({ block: 'nearest' });
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (!selected) return;

      if (selected.type === 'action') {
        selected.handler();
      } else {
        onClose();
        onSelectBookmark(selected.item);
        if (selected.item.url) {
          window.open(selected.item.url, '_blank');
        }
      }
    } else if (e.key === 'Escape') {
      // Marca a tecla como consumida para o atalho global não limpar a seleção
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-slate-850 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-900/30">
          <Search className="w-5 h-5 text-sky-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar favoritos ou digitar um comando (ex: Organizar, Limpar, Markdown)..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-500 rounded border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
          {matchingActions.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-3 py-1">
                Ações Rápidas
              </div>
              {matchingActions.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={action.handler}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                        {action.icon}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {action.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{action.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {matchingBookmarks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-3 py-1 mt-2">
                Favoritos Encontrados ({matchingBookmarks.length})
              </div>
              {matchingBookmarks.map((bmRes, bIdx) => {
                const overallIdx = matchingActions.length + bIdx;
                const isSelected = overallIdx === selectedIndex;
                return (
                  <div
                    key={bmRes.id}
                    onClick={() => {
                      onClose();
                      onSelectBookmark(bmRes.item);
                      if (bmRes.item.url) window.open(bmRes.item.url, '_blank');
                    }}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center shadow-xs">
                        <BookmarkFavicon url={bmRes.item.url} />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {bmRes.item.title || bmRes.item.url}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {bmRes.path ? `📁 ${bmRes.path}` : bmRes.item.url}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum resultado encontrado para &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 py-0.5 font-mono bg-white dark:bg-slate-800 border rounded">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 font-mono bg-white dark:bg-slate-800 border rounded">↓</kbd>{' '}
              Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border rounded">
                ENTER
              </kbd>{' '}
              Executar / Abrir
            </span>
          </div>
          <span>Atalho global: Ctrl+K / Ctrl+Shift+F</span>
        </div>
      </div>
    </div>
  );
};
