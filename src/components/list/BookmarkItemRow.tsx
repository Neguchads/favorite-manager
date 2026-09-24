import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2, Globe, FolderInput, GripVertical } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { formatDateShort } from '../../utils/date';
import { parseDragPayload, getDropPosition, DropPosition } from '../../utils/dragDrop';

interface BookmarkItemRowProps {
  item: BookmarkNode;
  folderPath?: string;
  isSelected: boolean;
  selectedIds?: Set<string>;
  isInspected: boolean;
  onToggleSelect: (id: string) => void;
  onInspect: (item: BookmarkNode) => void;
  onEdit: (item: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onMove?: (item: BookmarkNode) => void;
  onMoveToTarget?: (
    sourceIds: string[],
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => void;
  onContextMenu?: (e: React.MouseEvent, item: BookmarkNode) => void;
}

export const BookmarkItemRow: React.FC<BookmarkItemRowProps> = ({
  item,
  folderPath,
  isSelected,
  selectedIds,
  isInspected,
  onToggleSelect,
  onInspect,
  onEdit,
  onDelete,
  onMove,
  onMoveToTarget,
  onContextMenu,
}) => {
  const [imgError, setImgError] = useState(false);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const domain = extractDomain(item.url);
  const favicon = getFaviconUrl(item.url);

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
        JSON.stringify({ type: 'bookmark', id: item.id })
      );
      e.dataTransfer.setData('text/plain', item.url || '');
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Bookmarks can only be reordered 'before' or 'after'
    const pos = getDropPosition(e, false);
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
    const finalPos = dropPosition || 'after';
    setDropPosition(null);

    const payload = parseDragPayload(e);
    if (!payload || payload.ids.length === 0) return;

    if (payload.ids.includes(item.id)) return; // don't drop on self

    if (onMoveToTarget) {
      onMoveToTarget(payload.ids, item.id, finalPos);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onInspect(item)}
      onDoubleClick={() => {
        if (item.url) window.open(item.url, '_blank');
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, item);
        }
      }}
      className={`group relative flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer transition-colors text-xs select-none ${
        isInspected
          ? 'bg-sky-50/80 dark:bg-sky-950/40'
          : isSelected
          ? 'bg-slate-100/70 dark:bg-slate-800/50'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
      }`}
    >
      {/* Reordering indicator lines */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full z-10 shadow-xs shadow-sky-500/50" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full z-10 shadow-xs shadow-sky-500/50" />
      )}

      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        {/* Grip Handle */}
        <span title="Arrastar para reordenar" className="shrink-0 -ml-1">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
        </span>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(item.id);
          }}
          className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 shrink-0 cursor-pointer"
        />

        {/* Favicon / Icon */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {favicon && !imgError ? (
            <img
              src={favicon}
              alt=""
              onError={() => setImgError(true)}
              className="w-4 h-4 rounded-sm object-contain"
              loading="lazy"
            />
          ) : (
            <Globe className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Title & URL preview */}
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center space-x-2">
            <span
              className={`font-medium truncate ${
                item.title
                  ? 'text-slate-800 dark:text-slate-100'
                  : 'text-amber-600 dark:text-amber-400 italic'
              }`}
            >
              {item.title || '(Sem título)'}
            </span>
            {domain && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                {domain}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
            {item.url}
          </p>
        </div>

        {/* Folder tag */}
        {folderPath && (
          <div className="hidden lg:block shrink-0 max-w-[140px] truncate">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80 px-2 py-0.5 rounded-full font-medium">
              {folderPath.split(' / ').pop()}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-400 shrink-0 w-20 text-right">
          {formatDateShort(item.dateAdded)}
        </div>
      </div>

      {/* Action Buttons (visible on hover or inspected) */}
      <div className="flex items-center space-x-1 shrink-0 ml-2 opacity-80 group-hover:opacity-100">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Abrir em nova aba"
          className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          title="Editar favorito"
          className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {onMove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(item);
            }}
            title="Mover para outra pasta"
            className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
          >
            <FolderInput className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          title="Excluir favorito"
          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
