import React from 'react';
import {
  Bookmark,
  Star,
  FolderOpen,
  Clock,
  Copy,
  Sparkles,
  BarChart3,
  HardDriveDownload,
  FolderPlus,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { FolderTreeNode } from '../tree/FolderTreeNode';

interface SidebarProps {
  tree: BookmarkNode[];
  activeSection: string;
  onSelectSection: (section: string) => void;
  folderItemCount: Record<string, number>;
  totalBookmarks: number;
  duplicateCount: number;
  cleanupCount: number;
  onOpenCreateFolder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tree,
  activeSection,
  onSelectSection,
  folderItemCount,
  totalBookmarks,
  duplicateCount,
  cleanupCount,
  onOpenCreateFolder,
}) => {
  // Extract top-level root folders (usually Barra de favoritos, Outros favoritos, etc.)
  const rootNode = tree[0];
  const rootFolders = (rootNode?.children || []).filter((child) => !child.url);

  return (
    <aside className="w-64 bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden transition-colors">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Main Navigation Section */}
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 mb-1.5">
            Navegação
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectSection('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'all'
                  ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Todos os favoritos</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeSection === 'all'
                    ? 'bg-sky-600/70 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {totalBookmarks}
              </span>
            </button>

            <button
              onClick={() => onSelectSection('bookmarks_bar')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'bookmarks_bar'
                  ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Barra de favoritos</span>
              </div>
            </button>

            <button
              onClick={() => onSelectSection('other')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'other'
                  ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Outros favoritos</span>
              </div>
            </button>

            <button
              onClick={() => onSelectSection('recent')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'recent'
                  ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Recentes</span>
              </div>
            </button>
          </div>
        </div>

        {/* Maintenance & Tools Section */}
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 mb-1.5">
            Manutenção & Inteligência
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectSection('duplicates')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'duplicates'
                  ? 'bg-amber-500 text-white font-medium shadow-sm shadow-amber-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5 text-amber-500" />
                <span>Duplicados</span>
              </div>
              {duplicateCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    activeSection === 'duplicates'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {duplicateCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectSection('cleanup')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'cleanup'
                  ? 'bg-rose-500 text-white font-medium shadow-sm shadow-rose-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Central de Limpeza</span>
              </div>
              {cleanupCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    activeSection === 'cleanup'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {cleanupCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectSection('stats')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'stats'
                  ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-3.5 h-3.5 text-teal-500" />
                <span>Estatísticas</span>
              </div>
            </button>

            <button
              onClick={() => onSelectSection('backups')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeSection === 'backups'
                  ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HardDriveDownload className="w-3.5 h-3.5 text-blue-500" />
                <span>Backups & Snapshots</span>
              </div>
            </button>
          </div>
        </div>

        {/* Folders Hierarchy Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Árvore de Pastas
            </span>
            <button
              onClick={onOpenCreateFolder}
              title="Criar nova subpasta"
              className="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-0.5">
            {rootFolders.map((folder) => (
              <FolderTreeNode
                key={folder.id}
                node={folder}
                activeSection={activeSection}
                onSelectSection={onSelectSection}
                folderItemCount={folderItemCount}
                level={0}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
