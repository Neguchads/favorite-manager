import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';

interface FolderTreeNodeProps {
  node: BookmarkNode;
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  folderItemCount: Record<string, number>;
  level?: number;
}

export const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  node,
  activeSection,
  onSelectSection,
  folderItemCount,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = useState(level === 0);

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

  return (
    <div className="select-none">
      <div
        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${Math.max(level * 12 + 8, 8)}px` }}
        onClick={() => onSelectSection(node.id)}
      >
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
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
              isSelected
                ? 'bg-sky-200/70 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
