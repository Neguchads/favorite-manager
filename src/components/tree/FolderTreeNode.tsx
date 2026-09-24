import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, GripVertical } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { parseDragPayload, getDropPosition, DropPosition } from '../../utils/dragDrop';

interface FolderTreeNodeProps {
  node: BookmarkNode;
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  folderItemCount: Record<string, number>;
  level?: number;
  onDropBookmark?: (bookmarkId: string, targetFolderId: string) => void;
  onMoveToTarget?: (
    sourceIds: string[],
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => void;
}

export const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  node,
  activeSection,
  onSelectSection,
  folderItemCount,
  level = 0,
  onDropBookmark,
  onMoveToTarget,
}) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  // System roots cannot be moved or deleted
  const isSystemFolder =
    node.id === '0' || node.id === '1' || node.id === '2' || node.id === '3';
  const isDraggable = !isSystemFolder;

  // Subfolders only
  const subFolders = (node.children || []).filter((child) => !child.url);
  const hasSubFolders = subFolders.length > 0;
  const count = folderItemCount[node.id] || 0;
  const isSelected = activeSection === node.id;

  const displayTitle =
    node.id === '1'
      ? 'Barra de favoritos'
      : node.id === '2'
      ? 'Outros favoritos'
      : node.id === '3'
      ? 'Favoritos móveis'
      : node.title;

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.stopPropagation();
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'folder', id: node.id })
    );
    e.dataTransfer.setData('text/plain', node.title);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // System folders can only receive items inside (cannot be reordered before/after)
    if (isSystemFolder) {
      if (dropPosition !== 'inside') setDropPosition('inside');
      return;
    }

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

    // Do not drop on self
    if (payload.ids.includes(node.id) && finalPos === 'inside') return;

    if (onMoveToTarget) {
      onMoveToTarget(payload.ids, node.id, finalPos);
    } else if (onDropBookmark) {
      onDropBookmark(payload.ids[0], node.id);
    }
  };

  return (
    <div className="select-none">
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
          dropPosition === 'inside'
            ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/60 font-semibold'
            : isSelected
            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
        }`}
        style={{ paddingLeft: `${Math.max(level * 12 + 8, 8)}px` }}
        onClick={() => onSelectSection(node.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Reordering indicators */}
        {dropPosition === 'before' && (
          <div className="absolute top-0 left-2 right-2 h-0.5 bg-sky-500 rounded-full z-10 shadow-xs shadow-sky-500/50" />
        )}
        {dropPosition === 'after' && (
          <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-500 rounded-full z-10 shadow-xs shadow-sky-500/50" />
        )}

        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {isDraggable && (
            <span title="Arrastar pasta para reordenar ou mover" className="shrink-0 -ml-1">
              <GripVertical className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
            </span>
          )}

          {hasSubFolders ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}

          <span className="truncate text-xs">{displayTitle}</span>
        </div>

        {count > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ml-1.5 ${
              dropPosition === 'inside'
                ? 'bg-sky-500 text-white font-bold'
                : isSelected
                ? 'bg-sky-200/70 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                : 'bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {count}
          </span>
        )}
      </div>

      {isOpen && hasSubFolders && (
        <div className="space-y-0.5">
          {subFolders.map((sub) => (
            <FolderTreeNode
              key={sub.id}
              node={sub}
              activeSection={activeSection}
              onSelectSection={onSelectSection}
              folderItemCount={folderItemCount}
              level={level + 1}
              onDropBookmark={onDropBookmark}
              onMoveToTarget={onMoveToTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};
