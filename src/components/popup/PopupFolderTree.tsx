import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  FolderPlus,
  Star,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';

interface PopupFolderTreeProps {
  tree: BookmarkNode[];
  activeFolderId: string;
  folderItemCount: Record<string, number>;
  onSelectFolder: (folderId: string) => void;
  onSaveToFolder?: (folderId: string) => void;
  onCreateFolder?: (parentId: string) => void;
}

interface TreeNodeItemProps {
  node: BookmarkNode;
  activeFolderId: string;
  folderItemCount: Record<string, number>;
  level: number;
  expandedFolders: Set<string>;
  toggleExpand: (id: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSaveToFolder?: (folderId: string) => void;
  onCreateFolder?: (parentId: string) => void;
  matchingFolderIds?: Set<string>;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  activeFolderId,
  folderItemCount,
  level,
  expandedFolders,
  toggleExpand,
  onSelectFolder,
  onSaveToFolder,
  onCreateFolder,
  matchingFolderIds,
}) => {
  const subfolders = (node.children || []).filter((c) => !c.url);
  const hasSubfolders = subfolders.length > 0;
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = activeFolderId === node.id;
  const count = folderItemCount[node.id] || 0;

  // Filter visibility if search is active
  const isMatching = matchingFolderIds ? matchingFolderIds.has(node.id) : true;
  if (matchingFolderIds && !isMatching) {
    return null;
  }

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
        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
          isSelected
            ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 font-semibold ring-1 ring-sky-500/40'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
        }`}
        style={{ paddingLeft: `${Math.max(level * 14 + 6, 6)}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {hasSubfolders ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded shrink-0"
              title={isExpanded ? 'Recolher pasta' : 'Expandir pasta'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}

          <span className="truncate text-xs font-medium">{displayTitle}</span>

          {count > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 font-normal ${
                isSelected
                  ? 'bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {count}
            </span>
          )}
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSaveToFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveToFolder(node.id);
              }}
              className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 rounded transition-colors"
              title={`Salvar favorito nesta pasta (${displayTitle})`}
            >
              <Star className="w-3 h-3 text-sky-500" />
            </button>
          )}

          {onCreateFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(node.id);
              }}
              className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 rounded transition-colors"
              title={`Criar subpasta dentro de ${displayTitle}`}
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Render children subfolders */}
      {isExpanded && hasSubfolders && (
        <div className="space-y-0.5">
          {subfolders.map((sub) => (
            <TreeNodeItem
              key={sub.id}
              node={sub}
              activeFolderId={activeFolderId}
              folderItemCount={folderItemCount}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
              onSelectFolder={onSelectFolder}
              onSaveToFolder={onSaveToFolder}
              onCreateFolder={onCreateFolder}
              matchingFolderIds={matchingFolderIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const PopupFolderTree: React.FC<PopupFolderTreeProps> = ({
  tree,
  activeFolderId,
  folderItemCount,
  onSelectFolder,
  onSaveToFolder,
  onCreateFolder,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Default open root folders '1' and '2'
    return new Set(['1', '2']);
  });

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    function collect(nodes: BookmarkNode[]) {
      for (const n of nodes) {
        if (!n.url) {
          all.add(n.id);
          if (n.children) collect(n.children);
        }
      }
    }
    collect(tree);
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set(['1', '2']));
  };

  // Search/Filter matching folder IDs and auto-expand their parents
  const matchingFolderIds = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return undefined;

    const matched = new Set<string>();

    function matchNode(node: BookmarkNode): boolean {
      if (node.url) return false;
      let selfMatches = (node.title || '').toLowerCase().includes(query);
      if (node.id === '1' && 'barra de favoritos'.includes(query)) selfMatches = true;
      if (node.id === '2' && 'outros favoritos'.includes(query)) selfMatches = true;

      let childMatches = false;
      if (node.children) {
        for (const child of node.children) {
          if (matchNode(child)) {
            childMatches = true;
          }
        }
      }

      if (selfMatches || childMatches) {
        matched.add(node.id);
        return true;
      }
      return false;
    }

    tree.forEach(matchNode);

    // Auto-expand matched branches
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      matched.forEach((id) => next.add(id));
      return next;
    });

    return matched;
  }, [filterQuery, tree]);

  // Root folder nodes
  const rootFolders = useMemo(() => {
    if (tree.length === 0) return [];
    if (tree[0].id === '0' && tree[0].children) {
      return tree[0].children.filter((c) => !c.url);
    }
    return tree.filter((c) => !c.url);
  }, [tree]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Search and control bar */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-1.5 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar pastas..."
            className="w-full pl-7 pr-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={expandAll}
            className="px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
            title="Expandir todas as pastas"
          >
            Expandir
          </button>
          <button
            onClick={collapseAll}
            className="px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
            title="Recolher pastas"
          >
            Recolher
          </button>
          {onCreateFolder && (
            <button
              onClick={() => onCreateFolder('1')}
              className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded transition-colors"
              title="Nova pasta na Barra de favoritos"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {rootFolders.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Nenhuma pasta de favoritos encontrada
          </div>
        ) : (
          rootFolders.map((rootNode) => (
            <TreeNodeItem
              key={rootNode.id}
              node={rootNode}
              activeFolderId={activeFolderId}
              folderItemCount={folderItemCount}
              level={0}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
              onSelectFolder={onSelectFolder}
              onSaveToFolder={onSaveToFolder}
              onCreateFolder={onCreateFolder}
              matchingFolderIds={matchingFolderIds}
            />
          ))
        )}
      </div>

      {/* Tree helper footer */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
        <span>Clique na pasta para ver favoritos</span>
        <span className="flex items-center space-x-1">
          <Star className="w-2.5 h-2.5 text-sky-500 inline" />
          <span>= salvar aqui</span>
        </span>
      </div>
    </div>
  );
};
