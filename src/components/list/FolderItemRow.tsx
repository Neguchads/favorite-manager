import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Edit2,
  Trash2,
  ExternalLink,
  FolderInput,
  GripVertical,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { parseDragPayload, getDropPosition, DropPosition } from '../../utils/dragDrop';

interface FolderItemRowProps {
  folder: BookmarkNode;
  itemCount: number;
  subfolderCount?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleExpand?: (id: string) => void;
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
  children?: React.ReactNode;
}

export const FolderItemRow: React.FC<FolderItemRowProps> = ({
  folder,
  itemCount,
  subfolderCount = 0,
  isExpanded = false,
  isSelected = false,
  selectedIds,
  onToggleSelect,
  onToggleExpand,
  onOpen,
  onEdit,
  onDelete,
  onMoveFolder,
  onOpenInNewWindow,
  onDropBookmark,
  onMoveToTarget,
  onContextMenu,
  children,
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
    <div className="mb-1.5">
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={() => {
          if (onToggleExpand) {
            onToggleExpand(folder.id);
          } else {
            onOpen(folder.id);
          }
        }}
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
        className={`group relative flex items-center justify-between px-3 py-2 border rounded-xl transition-all cursor-pointer shadow-xs ${
          isSelected
            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/40'
            : dropPosition === 'inside'
            ? 'bg-sky-100/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/40 scale-[1.01]'
            : isExpanded
            ? 'bg-amber-100/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm'
            : 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40'
        }`}
      >
        {/* Reordering indicator lines */}
        {dropPosition === 'before' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full z-10 shadow-xs shadow-sky-500/50" />
        )}
        {dropPosition === 'after' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full z-10 shadow-xs shadow-sky-500/50" />
        )}

        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Grip handle */}
          <span title="Arrastar pasta para mover ou reordenar" className="shrink-0 -ml-1">
            <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
          </span>
          {/* Selection Checkbox */}
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(folder.id)}
              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 shrink-0 cursor-pointer mr-0.5"
              title={isSelected ? 'Desmarcar pasta' : 'Selecionar pasta'}
            />
          )}

          {/* Expand/Collapse Chevron */}
          {onToggleExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(folder.id);
              }}
              className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded transition-transform"
              title={isExpanded ? 'Recolher pasta' : 'Expandir e ver favoritos internos'}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-150 ${
                  isExpanded ? 'rotate-90 text-amber-600 dark:text-amber-400' : ''
                }`}
              />
            </button>
          )}

          {/* Folder Icon */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-colors ${
              dropPosition === 'inside'
                ? 'bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300'
                : isExpanded
                ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 fill-current/20" />
            ) : (
              <Folder className="w-4 h-4 fill-current/20" />
            )}
          </div>

          {/* Title & Badge */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
                {folder.title || 'Nova Pasta'}
              </span>

              {/* Informative Items and Subfolders Badge */}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-950/80 border border-amber-300/60 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 font-semibold shrink-0">
                {itemCount > 0 ? `${itemCount} fav.` : '0 itens'}
                {subfolderCount > 0 && ` • ${subfolderCount} sub.`}
              </span>
            </div>

            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
              {dropPosition === 'inside'
                ? 'Solte para mover aqui'
                : isExpanded
                ? 'Conteúdo interno expandido • Clique para recolher'
                : 'Clique para expandir conteúdo ou duplo clique para abrir'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-0.5 shrink-0 ml-2">
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

          {onMoveFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveFolder(folder);
              }}
              title="Mover pasta para outro destino"
              className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(folder.id);
            }}
            title="Entrar nesta pasta"
            className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Internal Content */}
      {isExpanded && children && (
        <div className="pl-5 border-l-2 border-amber-300 dark:border-amber-800/80 ml-4 mt-1.5 mb-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};
