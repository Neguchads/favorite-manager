import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FolderOption } from '../../hooks/useBookmarks';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderOption[];
  defaultParentId?: string;
  onCreate: (title: string, parentId?: string) => Promise<any>;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  folders,
  defaultParentId,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState(defaultParentId || '1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setParentId(defaultParentId || '1');
      setError(null);
    }
  }, [isOpen, defaultParentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O nome da pasta é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onCreate(title.trim(), parentId);
      setTitle('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar pasta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Pasta de Favoritos">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            Nome da Pasta <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Engenharia, IA, Estudos..."
            required
            autoFocus
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            Criar dentro de
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.path || f.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Pasta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
