import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FolderOption } from '../../hooks/useBookmarks';
import { FolderInput, Folder, Search, Check } from 'lucide-react';

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
  const [targetParentId, setTargetParentId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out any folders that are being moved or are children/descendants of moving folders (prevent cyclic trees)
  const availableFolders = useMemo(() => {
    const movingFolderPaths = folders
      .filter((f) => itemIds.includes(f.id))
      .map((f) => f.path);

    return folders.filter((f) => {
      // Cannot move into itself
      if (itemIds.includes(f.id)) return false;
      // Cannot move into any subfolder of itself
      for (const movingPath of movingFolderPaths) {
        if (f.path === movingPath || f.path.startsWith(`${movingPath} /`)) {
          return false;
        }
      }
      return true;
    });
  }, [folders, itemIds]);

  // Filtered by user search
  const filteredFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableFolders;
    return availableFolders.filter(
      (f) => f.title.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [availableFolders, searchQuery]);

  // Ensure targetParentId is valid whenever availableFolders change or modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSearchQuery('');
      if (!availableFolders.some((f) => f.id === targetParentId)) {
        setTargetParentId(availableFolders[0]?.id || '1');
      }
    }
  }, [isOpen, availableFolders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemIds.length === 0 || !targetParentId) return;

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

  const selectedFolder = folders.find((f) => f.id === targetParentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemIds.length === 1 ? 'Mover Item' : 'Mover Favoritos'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-800 dark:text-sky-200 flex items-center space-x-2.5">
          <FolderInput className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <span>
              Movendo <strong>{itemIds.length}</strong> {itemIds.length === 1 ? 'item' : 'itens'}.
            </span>
            {selectedFolder && (
              <span className="block text-[11px] text-sky-600 dark:text-sky-300 mt-0.5 truncate">
                Destino: <strong>{selectedFolder.path || selectedFolder.title}</strong>
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-200">
              Escolha a pasta de destino
            </label>
            <span className="text-[10px] text-slate-400">
              {filteredFolders.length} {filteredFolders.length === 1 ? 'pasta' : 'pastas'}
            </span>
          </div>

          {/* Quick search input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pasta de destino..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/60">
            {filteredFolders.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                Nenhuma pasta encontrada.
              </div>
            ) : (
              filteredFolders.map((f) => {
                const isSelected = targetParentId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setTargetParentId(f.id)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                    }`}
                    style={{ paddingLeft: `${Math.max(f.level * 12 + 12, 12)}px` }}
                  >
                    <div className="flex items-center space-x-2 truncate min-w-0">
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-amber-500'}`} />
                      <span className="truncate">{f.title}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !targetParentId || availableFolders.length === 0}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center space-x-1"
          >
            {loading ? <span>Movendo...</span> : <span>Mover Aqui</span>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
