import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Folder,
  Calendar,
  Globe,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import { formatDate } from '../../utils/date';

interface RightInspectorProps {
  item: BookmarkNode | null;
  folderPath?: string;
  onClose: () => void;
  onEdit: (item: BookmarkNode) => void;
  onDelete: (id: string) => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  item,
  folderPath,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!item) return null;

  const domain = extractDomain(item.url);
  const favicon = getFaviconUrl(item.url);

  const handleCopy = () => {
    if (item.url) {
      navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Detalhes do Favorito
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Favicon & Title */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            {favicon && !imgError ? (
              <img
                src={favicon}
                alt=""
                onError={() => setImgError(true)}
                className="w-6 h-6 rounded object-contain"
              />
            ) : (
              <Globe className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
              {item.title || '(Sem título)'}
            </h3>
            {domain && (
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {domain}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Link</span>
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors text-xs border border-slate-200 dark:border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar URL</span>
              </>
            )}
          </button>
        </div>

        {/* Properties list */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              URL Completa
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px] break-all mt-0.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              {item.url}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Localização / Pasta
            </span>
            <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 mt-1">
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{folderPath || 'Raiz'}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Data de Adição
            </span>
            <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatDate(item.dateAdded)}</span>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => onEdit(item)}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Título & URL</span>
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-lg transition-colors font-medium text-xs border border-rose-200 dark:border-rose-900/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Favorito</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
