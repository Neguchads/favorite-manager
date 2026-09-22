import React from 'react';
import { Folder, ChevronRight, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';

interface FolderItemRowProps {
  folder: BookmarkNode;
  itemCount: number;
  onOpen: (id: string) => void;
  onEdit: (folder: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onOpenInNewWindow?: (id: string) => void;
}

export const FolderItemRow: React.FC<FolderItemRowProps> = ({
  folder,
  itemCount,
  onOpen,
  onEdit,
  onDelete,
  onOpenInNewWindow,
}) => {
  return (
    <div
      onClick={() => onOpen(folder.id)}
      className="group flex items-center justify-between px-4 py-2.5 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl transition-all cursor-pointer shadow-xs mb-1.5"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
          <Folder className="w-4 h-4 fill-amber-500/20" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
              {folder.title || 'Nova Pasta'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-medium shrink-0">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Pasta • Clique para abrir
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        {onOpenInNewWindow && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenInNewWindow(folder.id);
            }}
            title="Abrir todas as guias em nova janela (Workspace)"
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(folder);
          }}
          title="Renomear Pasta"
          className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder.id);
          }}
          title="Excluir Pasta"
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="p-1 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
