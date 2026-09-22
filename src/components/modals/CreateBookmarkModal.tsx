import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FolderOption } from '../../hooks/useBookmarks';

interface CreateBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderOption[];
  defaultParentId?: string;
  onCreate: (title: string, url: string, parentId?: string) => Promise<any>;
}

export const CreateBookmarkModal: React.FC<CreateBookmarkModalProps> = ({
  isOpen,
  onClose,
  folders,
  defaultParentId,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState(defaultParentId || '1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('A URL é obrigatória.');
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      setLoading(true);
      setError(null);
      await onCreate(title.trim() || finalUrl, finalUrl, parentId);
      setTitle('');
      setUrl('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar favorito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Favorito">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Documentação do Edge"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            URL <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            Salvar na pasta
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
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Adicionar Favorito'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
