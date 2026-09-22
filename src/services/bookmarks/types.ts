import { BookmarkNode } from '../../types/bookmarks';

export interface CreateBookmarkParams {
  parentId?: string;
  title: string;
  url?: string;
  index?: number;
}

export interface UpdateBookmarkParams {
  title?: string;
  url?: string;
}

export interface MoveBookmarkParams {
  parentId?: string;
  index?: number;
}

export interface IBookmarksService {
  isNative(): boolean;
  getTree(): Promise<BookmarkNode[]>;
  getSubTree(id: string): Promise<BookmarkNode[]>;
  create(params: CreateBookmarkParams): Promise<BookmarkNode>;
  update(id: string, params: UpdateBookmarkParams): Promise<BookmarkNode>;
  move(id: string, params: MoveBookmarkParams): Promise<BookmarkNode>;
  remove(id: string): Promise<void>;
  removeTree(id: string): Promise<void>;
  subscribe(callback: () => void): () => void;
}
