import React from 'react';
import { Copy, Trash2, ExternalLink, Folder } from 'lucide-react';
import { BookmarkDuplicateGroup, BookmarkNode } from '../../types/bookmarks';
import { formatDateShort } from '../../utils/date';

interface DuplicatesViewProps {
  duplicates: BookmarkDuplicateGroup[];
  parentPathMap: Map<string, string>;
  onDeleteBookmark: (id: string) => void;
  onInspect: (item: BookmarkNode) => void;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  duplicates,
  parentPathMap,
  onDeleteBookmark,
  onInspect,
}) => {
  if (duplicates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <Copy className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Nenhum favorito duplicado encontrado!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Todos os seus favoritos possuem links únicos e normalizados.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
        <div>
          <span className="font-semibold">
            {duplicates.length} grupos de links duplicados detectados.
          </span>{' '}
          A extensão normaliza URLs (removendo parâmetros de tracking e barras finais) para encontrar cópias em pastas diferentes.
        </div>
      </div>

      <div className="space-y-3">
        {duplicates.map((group, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-lg">
                {group.normalizedUrl}
              </div>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                {group.items.length} ocorrências ({group.reason === 'exact' ? 'Exato' : 'Normalizado'})
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {group.items.map((item, itemIdx) => {
                const folderPath = item.parentId ? parentPathMap.get(item.parentId) : '';
                return (
                  <div
                    key={item.id}
                    onClick={() => onInspect(item)}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-700/40 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {item.title || '(Sem título)'}
                        </span>
                        {itemIdx === 0 && (
                          <span className="text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-1.5 py-0.2 rounded font-semibold">
                            Cópia mais antiga
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Folder className="w-3 h-3 text-amber-500" />
                          <span className="truncate max-w-[200px]">{folderPath || 'Raiz'}</span>
                        </span>
                        <span>•</span>
                        <span>Adicionado em {formatDateShort(item.dateAdded)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-sky-500 rounded"
                        title="Abrir"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBookmark(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                        title="Excluir esta cópia"
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
    </div>
  );
};
