import React from 'react';
import { Folder, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';

interface FolderCardProps {
  folder: BookmarkNode;
  itemCount: number;
  onOpen: (id: string) => void;
  onEdit: (folder: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onOpenInNewWindow?: (id: string) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
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
      className="group p-3 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl transition-all cursor-pointer shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs mb-2">
          <Folder className="w-5 h-5 fill-amber-500/20" />
        </div>

        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOpenInNewWindow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInNewWindow(folder.id);
              }}
              title="Abrir todas as guias em nova janela (Workspace)"
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
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
            className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.id);
            }}
            title="Excluir Pasta"
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate mb-1">
          {folder.title || 'Nova Pasta'}
        </h4>
        <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </span>
      </div>
    </div>
  );
};
