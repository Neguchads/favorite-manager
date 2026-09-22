import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FolderOption } from '../../hooks/useBookmarks';
import { FolderInput, Folder } from 'lucide-react';

interface MoveItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemIds: string[];
  folders: FolderOption[];
  onMove: (ids: string[], targetParentId: string) => Promise<any>;
}

export const MoveItemsModal: React.FC<MoveItemsModalProps> = ({
  isOpen,
  onClose,
  itemIds,
  folders,
  onMove,
}) => {
  const [targetParentId, setTargetParentId] = useState(folders[0]?.id || '1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemIds.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      await onMove(itemIds, targetParentId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao mover itens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mover Favoritos">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-800 dark:text-sky-200 flex items-center space-x-2">
          <FolderInput className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>
            Movendo <strong>{itemIds.length}</strong> {itemIds.length === 1 ? 'item' : 'itens'}. Escolha a pasta de destino abaixo:
          </span>
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            Pasta de Destino
          </label>
          <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
            {folders.map((f) => {
              const isSelected = targetParentId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setTargetParentId(f.id)}
                  className={`flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                  style={{ paddingLeft: `${Math.max(f.level * 12 + 12, 12)}px` }}
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{f.title}</span>
                </div>
              );
            })}
          </div>
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
            {loading ? 'Movendo...' : 'Mover Agora'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
