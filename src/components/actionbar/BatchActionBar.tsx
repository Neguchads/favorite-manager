import React from 'react';
import {
  FolderInput,
  Trash2,
  X,
  Sparkles,
  Download,
  RotateCcw,
  Edit2,
} from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onInvertSelection: () => void;
  onOpenMoveModal: () => void;
  onEditSelected?: () => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
  onAiAnalyzeSelected: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onInvertSelection,
  onOpenMoveModal,
  onEditSelected,
  onDeleteSelected,
  onExportSelected,
  onAiAnalyzeSelected,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700/80 text-xs">
        {/* Counter */}
        <div className="flex items-center space-x-2 border-r border-slate-700 pr-3 mr-1">
          <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-[11px]">
            {selectedCount}
          </span>
          <span className="font-medium text-slate-200">
            {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
        </div>

        {/* Move Button */}
        <button
          onClick={onOpenMoveModal}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors"
          title="Mover itens ou pastas selecionadas"
        >
          <FolderInput className="w-3.5 h-3.5 text-sky-400" />
          <span>Mover</span>
        </button>

        {/* Edit Button */}
        {onEditSelected && (
          <button
            onClick={onEditSelected}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors"
            title={selectedCount === 1 ? 'Editar item selecionado' : 'Editar itens selecionados em lote'}
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Editar</span>
          </button>
        )}

        {/* Delete Button */}
        <button
          onClick={onDeleteSelected}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-lg transition-colors border border-rose-800/40"
          title="Excluir selecionados"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>

        {/* Export JSON Button */}
        <button
          onClick={onExportSelected}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors hidden sm:flex"
          title="Exportar selecionados para JSON"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Exportar</span>
        </button>

        {/* AI Analyze Button */}
        <button
          onClick={onAiAnalyzeSelected}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-sm"
          title="Analisar e sugerir pastas com IA"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Analisar com IA</span>
        </button>

        {/* Invert selection */}
        <button
          onClick={onInvertSelection}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Inverter seleção"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Desmarcar todos"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
