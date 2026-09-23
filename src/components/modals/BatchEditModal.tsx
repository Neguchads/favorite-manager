import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { BookmarkNode } from '../../types/bookmarks';
import { Check, AlertCircle } from 'lucide-react';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: BookmarkNode[];
  onSaveBatch: (updates: { id: string; title: string }[]) => Promise<void>;
}

type EditOperation = 'prefix' | 'suffix' | 'replace';

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onSaveBatch,
}) => {
  const [operation, setOperation] = useState<EditOperation>('prefix');
  const [prefixText, setPrefixText] = useState('');
  const [suffixText, setSuffixText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview generated names
  const previews = useMemo(() => {
    return selectedItems.map((item) => {
      let newTitle = item.title || '';
      if (operation === 'prefix' && prefixText) {
        newTitle = `${prefixText}${item.title}`;
      } else if (operation === 'suffix' && suffixText) {
        newTitle = `${item.title}${suffixText}`;
      } else if (operation === 'replace' && findText) {
        newTitle = item.title.split(findText).join(replaceText);
      }
      return {
        id: item.id,
        original: item.title,
        updated: newTitle,
        isFolder: !item.url,
      };
    });
  }, [selectedItems, operation, prefixText, suffixText, findText, replaceText]);

  const hasChanges = previews.some((p) => p.original !== p.updated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      setError('Nenhuma alteração foi realizada nos títulos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updates = previews
        .filter((p) => p.original !== p.updated)
        .map((p) => ({ id: p.id, title: p.updated }));
      await onSaveBatch(updates);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar edições em lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar em Lote (${selectedItems.length} itens/pastas)`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Operation selector tabs */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Tipo de Alteração
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setOperation('prefix')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                operation === 'prefix'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Adicionar Prefixo
            </button>
            <button
              type="button"
              onClick={() => setOperation('suffix')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                operation === 'suffix'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Adicionar Sufixo
            </button>
            <button
              type="button"
              onClick={() => setOperation('replace')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                operation === 'replace'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Localizar e Substituir
            </button>
          </div>
        </div>

        {/* Input fields based on operation */}
        {operation === 'prefix' && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
              Texto do Prefixo (inserido no início dos nomes)
            </label>
            <input
              type="text"
              value={prefixText}
              onChange={(e) => setPrefixText(e.target.value)}
              placeholder="Ex: [Projeto] "
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        {operation === 'suffix' && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
              Texto do Sufixo (inserido no fim dos nomes)
            </label>
            <input
              type="text"
              value={suffixText}
              onChange={(e) => setSuffixText(e.target.value)}
              placeholder="Ex:  - 2026"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        {operation === 'replace' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
                Localizar
              </label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Ex: Antigo"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
                Substituir por
              </label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Ex: Novo"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Live Preview List */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Pré-visualização das Alterações ({previews.length})
          </label>
          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/60 p-1">
            {previews.map((p) => {
              const changed = p.original !== p.updated;
              return (
                <div
                  key={p.id}
                  className="px-2.5 py-1.5 flex items-center justify-between text-[11px] space-x-2"
                >
                  <div className="truncate flex-1 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 line-through mr-1.5">
                      {p.original}
                    </span>
                    {changed ? (
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        {p.updated}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sem alteração</span>
                    )}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                    {p.isFolder ? 'Pasta' : 'Favorito'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{loading ? 'Salvando...' : 'Aplicar Alterações'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
