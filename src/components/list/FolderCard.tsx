import React, { useState } from 'react';
import { Folder, Edit2, Trash2, ExternalLink, FolderInput } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { parseDragPayload, getDropPosition, DropPosition } from '../../utils/dragDrop';

interface FolderCardProps {
  folder: BookmarkNode;
  itemCount: number;
  subfolderCount?: number;
  isSelected?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onOpen: (id: string) => void;
  onEdit: (folder: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onMoveFolder?: (folder: BookmarkNode) => void;
  onOpenInNewWindow?: (id: string) => void;
  onDropBookmark?: (bookmarkId: string, targetFolderId: string) => void;
  onMoveToTarget?: (
    sourceIds: string[],
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => void;
  onContextMenu?: (e: React.MouseEvent, folder: BookmarkNode) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  itemCount,
  subfolderCount = 0,
  isSelected = false,
  selectedIds,
  onToggleSelect,
  onOpen,
  onEdit,
  onDelete,
  onMoveFolder,
  onOpenInNewWindow,
  onDropBookmark,
  onMoveToTarget,
  onContextMenu,
}) => {
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    if (isSelected && selectedIds && selectedIds.size > 1) {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ type: 'multiple', ids: Array.from(selectedIds) })
      );
      e.dataTransfer.setData('text/plain', `${selectedIds.size} itens selecionados`);
    } else {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ type: 'folder', id: folder.id })
      );
      e.dataTransfer.setData('text/plain', folder.title);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const pos = getDropPosition(e, true);
    if (dropPosition !== pos) {
      setDropPosition(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalPos = dropPosition || 'inside';
    setDropPosition(null);

    const payload = parseDragPayload(e);
    if (!payload || payload.ids.length === 0) return;
    if (payload.ids.includes(folder.id) && finalPos === 'inside') return;

    if (onMoveToTarget) {
      onMoveToTarget(payload.ids, folder.id, finalPos);
    } else if (onDropBookmark) {
      onDropBookmark(payload.ids[0], folder.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
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
      className={`group relative p-3 border rounded-xl transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
        isSelected
          ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/40'
          : dropPosition === 'inside'
          ? 'bg-sky-100/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/40 scale-[1.02]'
          : 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40'
      }`}
    >
      {/* Reordering indicator lines */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500 rounded-t-xl z-10 shadow-xs shadow-sky-500/50" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-b-xl z-10 shadow-xs shadow-sky-500/50" />
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(folder.id)}
              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 shrink-0 cursor-pointer"
              title={isSelected ? 'Desmarcar pasta' : 'Selecionar pasta'}
            />
          )}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs mb-1 transition-colors ${
              dropPosition === 'inside'
                ? 'bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Folder className="w-4 h-4 fill-current/20" />
          </div>
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
          {onMoveFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveFolder(folder);
              }}
              title="Mover pasta para outro local"
              className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" />
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
          {dropPosition === 'inside'
            ? 'Solte o favorito aqui'
            : `${itemCount > 0 ? `${itemCount} fav.` : '0 itens'}${
                subfolderCount > 0 ? ` • ${subfolderCount} sub.` : ''
              }`}
        </span>
      </div>
    </div>
  );
};
