import React, { useState } from 'react';
import { Folder, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';

interface FolderCardProps {
  folder: BookmarkNode;
  itemCount: number;
  onOpen: (id: string) => void;
  onEdit: (folder: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onOpenInNewWindow?: (id: string) => void;
  onDropBookmark?: (bookmarkId: string, targetFolderId: string) => void;
  onContextMenu?: (e: React.MouseEvent, folder: BookmarkNode) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  itemCount,
  onOpen,
  onEdit,
  onDelete,
  onOpenInNewWindow,
  onDropBookmark,
  onContextMenu,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    if (rawData && onDropBookmark) {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'bookmark' && parsed.id) {
          onDropBookmark(parsed.id, folder.id);
        }
      } catch (err) {
        console.warn('Erro ao processar item arrastado:', err);
      }
    }
  };

  return (
    <div
      onClick={() => onOpen(folder.id)}
      onDoubleClick={() => onOpen(folder.id)}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, folder);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group p-3 border rounded-xl transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
        isDragOver
          ? 'bg-sky-100/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/40 scale-[1.02]'
          : 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs mb-2 transition-colors ${
            isDragOver
              ? 'bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300'
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
          }`}
        >
          <Folder className="w-5 h-5 fill-current/20" />
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
          {isDragOver ? 'Solte o favorito aqui' : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
        </span>
      </div>
    </div>
  );
};
