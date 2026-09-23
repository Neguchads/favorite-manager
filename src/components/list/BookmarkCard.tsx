import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2, Globe, FolderInput } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { formatDateShort } from '../../utils/date';

interface BookmarkCardProps {
  item: BookmarkNode;
  folderPath?: string;
  isSelected: boolean;
  isInspected: boolean;
  onToggleSelect: (id: string) => void;
  onInspect: (item: BookmarkNode) => void;
  onEdit: (item: BookmarkNode) => void;
  onDelete: (id: string) => void;
  onMove?: (item: BookmarkNode) => void;
  onContextMenu?: (e: React.MouseEvent, item: BookmarkNode) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  item,
  folderPath,
  isSelected,
  isInspected,
  onToggleSelect,
  onInspect,
  onEdit,
  onDelete,
  onMove,
  onContextMenu,
}) => {
  const [imgError, setImgError] = useState(false);
  const domain = extractDomain(item.url);
  const favicon = getFaviconUrl(item.url);

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ type: 'bookmark', id: item.id })
        );
        e.dataTransfer.setData('text/plain', item.url || '');
        e.dataTransfer.effectAllowed = 'move';
      }}
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
      className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
        isInspected
          ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 shadow-sm ring-1 ring-sky-500'
          : isSelected
          ? 'border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/60'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 min-w-0">
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
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {domain || 'link'}
            </span>
          </div>

          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
            className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
          />
        </div>

        <h4
          className={`text-xs font-semibold line-clamp-2 mb-1 ${
            item.title
              ? 'text-slate-800 dark:text-slate-100'
              : 'text-amber-600 dark:text-amber-400 italic'
          }`}
        >
          {item.title || '(Sem título)'}
        </h4>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono mb-2">
          {item.url}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span className="truncate max-w-[120px]">
          {folderPath ? folderPath.split(' / ').pop() : formatDateShort(item.dateAdded)}
        </span>

        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir link"
            className="p-1 hover:text-sky-600 dark:hover:text-sky-400 rounded"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            title="Editar"
            className="p-1 hover:text-amber-600 dark:hover:text-amber-400 rounded"
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
              className="p-1 hover:text-sky-600 dark:hover:text-sky-400 rounded"
            >
              <FolderInput className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            title="Excluir"
            className="p-1 hover:text-rose-600 dark:hover:text-rose-400 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
