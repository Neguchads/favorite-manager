import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { BookmarkNode } from '../../types/bookmarks';
import { useTranslation } from '../../i18n';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookmarkNode | null;
  onSave: (id: string, title: string, url?: string) => Promise<any>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFolder = item ? !item.url : false;

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setUrl(item.url || '');
      setError(null);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!isFolder && !url.trim()) {
      setError(t('modal.urlRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(item.id, title.trim(), isFolder ? undefined : url.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || t('modal.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFolder ? t('modal.renameFolderTitle') : t('modal.editBookmarkTitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
            {t('modal.title')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        {!isFolder && (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-1">
              {t('modal.url')}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {t('modal.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? t('modal.savingChanges') : t('modal.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
