import { BookmarkNode } from '../../types/bookmarks';
import { CreateBookmarkParams, IBookmarksService, MoveBookmarkParams, UpdateBookmarkParams } from './types';

export class ChromeBookmarksService implements IBookmarksService {
  isNative(): boolean {
    return true;
  }

  async getTree(): Promise<BookmarkNode[]> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.bookmarks?.getTree) {
          reject(new Error('API chrome.bookmarks indisponível'));
          return;
        }
        chrome.bookmarks.getTree((nodes) => {
          const err = chrome.runtime?.lastError;
          if (err) {
            reject(new Error(err.message || 'Erro ao acessar favoritos'));
          } else {
            resolve(nodes as BookmarkNode[]);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async getSubTree(id: string): Promise<BookmarkNode[]> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.getSubTree(id, (nodes) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(nodes as BookmarkNode[]);
        }
      });
    });
  }

  async create(params: CreateBookmarkParams): Promise<BookmarkNode> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create(
        {
          parentId: params.parentId,
          title: params.title,
          url: params.url,
          index: params.index,
        },
        (node) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(node as BookmarkNode);
          }
        }
      );
    });
  }

  async update(id: string, params: UpdateBookmarkParams): Promise<BookmarkNode> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.update(id, params, (node) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(node as BookmarkNode);
        }
      });
    });
  }

  async move(id: string, params: MoveBookmarkParams): Promise<BookmarkNode> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.move(
        id,
        {
          parentId: params.parentId,
          index: params.index,
        },
        (node) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(node as BookmarkNode);
          }
        }
      );
    });
  }

  async remove(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.remove(id, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  async removeTree(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.removeTree(id, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  subscribe(callback: () => void): () => void {
    const handler = () => callback();

    if (chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(handler);
      chrome.bookmarks.onRemoved.addListener(handler);
      chrome.bookmarks.onChanged.addListener(handler);
      chrome.bookmarks.onMoved.addListener(handler);
      chrome.bookmarks.onChildrenReordered.addListener(handler);
    }

    return () => {
      if (chrome.bookmarks) {
        chrome.bookmarks.onCreated.removeListener(handler);
        chrome.bookmarks.onRemoved.removeListener(handler);
        chrome.bookmarks.onChanged.removeListener(handler);
        chrome.bookmarks.onMoved.removeListener(handler);
        chrome.bookmarks.onChildrenReordered.removeListener(handler);
      }
    };
  }
}
