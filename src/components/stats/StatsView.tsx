import React from 'react';
import {
  Bookmark,
  Folder,
  Globe,
  Copy,
  FolderX,
  FileQuestion,
  Layers,
} from 'lucide-react';

interface StatsViewProps {
  stats: {
    totalBookmarks: number;
    totalFolders: number;
    totalDomains: number;
    duplicateCount: number;
    emptyFoldersCount: number;
    missingTitlesCount: number;
  };
}

export const StatsView: React.FC<StatsViewProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total de Favoritos',
      value: stats.totalBookmarks,
      icon: Bookmark,
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      border: 'border-sky-200 dark:border-sky-900/50',
    },
    {
      title: 'Pastas Organizadas',
      value: stats.totalFolders,
      icon: Folder,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      title: 'Domínios Únicos',
      value: stats.totalDomains,
      icon: Globe,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-900/50',
    },
    {
      title: 'Duplicados Encontrados',
      value: stats.duplicateCount,
      icon: Copy,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      title: 'Pastas Vazias',
      value: stats.emptyFoldersCount,
      icon: FolderX,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-900/50',
    },
    {
      title: 'Favoritos Sem Título',
      value: stats.missingTitlesCount,
      icon: FileQuestion,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-200 dark:border-purple-900/50',
    },
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Visão Geral dos Favoritos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Métricas em tempo real sobre a saúde e estrutura da sua biblioteca.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border ${c.border} ${c.bg} shadow-sm flex items-center space-x-4`}
            >
              <div className={`p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {c.title}
                </span>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {c.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
