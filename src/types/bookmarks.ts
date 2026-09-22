export interface BookmarkNode {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkNode[];
}

export type ViewMode = 'list' | 'tree' | 'cards';

export type NavigationSection =
  | 'all'
  | 'bookmarks_bar'
  | 'other'
  | 'recent'
  | 'duplicates'
  | 'cleanup'
  | 'stats'
  | 'backups'
  | 'settings';

export type SortField = 'title' | 'domain' | 'dateAdded' | 'url';
export type SortDirection = 'asc' | 'desc';

export interface SearchQuery {
  raw: string;
  text: string;
  domain?: string;
  folder?: string;
  title?: string;
}

export interface BookmarkDuplicateGroup {
  normalizedUrl: string;
  items: BookmarkNode[];
  reason: 'exact' | 'normalized';
}

export interface CleanupReport {
  emptyFolders: BookmarkNode[];
  missingTitles: BookmarkNode[];
  invalidUrls: BookmarkNode[];
  duplicateCount: number;
}
