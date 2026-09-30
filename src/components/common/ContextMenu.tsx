import React, { useEffect, useRef } from 'react';
import {
  ExternalLink,
  AppWindow,
  EyeOff,
  Copy,
  Edit2,
  FolderInput,
  Trash2,
  FolderPlus,
  Plus,
  ArrowDownAZ,
  RefreshCw,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';

export type ContextMenuType = 'bookmark' | 'folder' | 'background';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  item?: BookmarkNode;
  folder?: BookmarkNode;
}

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onOpenInNewTab?: (url: string) => void;
  onOpenInNewWindow?: (url: string) => void;
  onOpenInIncognito?: (url: string) => void;
  onOpenFolderInNewWindow?: (folderId: string) => void;
  onOpenFolderInIncognito?: (folderId: string) => void;
  onCopyUrl?: (url: string) => void;
  onEdit?: (item: BookmarkNode) => void;
  onMove?: (item: BookmarkNode) => void;
  onDelete?: (id: string) => void;
  onDeleteFolder?: (id: string) => void;
  onCreateBookmark?: () => void;
  onCreateFolder?: () => void;
  onSortAZ?: () => void;
  onRefresh?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onClose,
  onOpenInNewTab,
  onOpenInNewWindow,
  onOpenInIncognito,
  onOpenFolderInNewWindow,
  onOpenFolderInIncognito,
  onCopyUrl,
  onEdit,
  onMove,
  onDelete,
  onDeleteFolder,
  onCreateBookmark,
  onCreateFolder,
  onSortAZ,
  onRefresh,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Use capture phase so we catch clicks before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, onClose]);

  if (!state.isOpen) return null;

  // Collision detection with viewport edges
  const menuWidth = 220;
  const menuHeight = state.type === 'bookmark' ? 260 : state.type === 'folder' ? 240 : 180;
  const safeX = Math.max(10, Math.min(state.x, window.innerWidth - menuWidth - 12));
  const safeY = Math.max(10, Math.min(state.y, window.innerHeight - menuHeight - 12));

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{ left: `${safeX}px`, top: `${safeY}px` }}
      className="fixed z-50 w-56 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xl py-1 text-xs select-none transition-opacity animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Bookmark context menu */}
      {state.type === 'bookmark' && state.item && (
        <>
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 truncate">
            {state.item.title || '(Favorito)'}
          </div>

          <button
            onClick={() => {
              if (state.item?.url) onOpenInNewTab?.(state.item.url);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir em nova guia</span>
          </button>

          <button
            onClick={() => {
              if (state.item?.url) onOpenInNewWindow?.(state.item.url);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Abrir em nova janela</span>
          </button>

          <button
            onClick={() => {
              if (state.item?.url) onOpenInIncognito?.(state.item.url);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Abrir em janela InPrivate</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              if (state.item?.url) onCopyUrl?.(state.item.url);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar link</span>
          </button>

          <button
            onClick={() => {
              if (state.item) onEdit?.(state.item);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar favorito</span>
          </button>

          {onMove && (
            <button
              onClick={() => {
                if (state.item) onMove(state.item);
                onClose();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Mover para...</span>
            </button>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              if (state.item?.id) onDelete?.(state.item.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </>
      )}

      {/* 2. Folder context menu */}
      {state.type === 'folder' && state.folder && (
        <>
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 truncate">
            {state.folder.title || 'Pasta'}
          </div>

          <button
            onClick={() => {
              if (state.folder?.id) onOpenFolderInNewWindow?.(state.folder.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Abrir todos em nova janela</span>
          </button>

          <button
            onClick={() => {
              if (state.folder?.id) onOpenFolderInIncognito?.(state.folder.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Abrir todos em InPrivate</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              onCreateBookmark?.();
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar favorito nesta pasta</span>
          </button>

          <button
            onClick={() => {
              onCreateFolder?.();
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Adicionar subpasta aqui</span>
          </button>

          <button
            onClick={() => {
              if (state.folder) onEdit?.(state.folder);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Renomear pasta</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              if (state.folder?.id) onDeleteFolder?.(state.folder.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir pasta</span>
          </button>
        </>
      )}

      {/* 3. Background context menu */}
      {state.type === 'background' && (
        <>
          <button
            onClick={() => {
              onCreateBookmark?.();
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo favorito</span>
          </button>

          <button
            onClick={() => {
              onCreateFolder?.();
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Nova pasta</span>
          </button>

          {onSortAZ && (
            <button
              onClick={() => {
                onSortAZ();
                onClose();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span>Organizar Tudo A-Z</span>
            </button>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recarregar favoritos</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
