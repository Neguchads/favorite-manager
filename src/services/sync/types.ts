export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
export type SupportedBrowser = 'Edge' | 'Chrome' | 'Brave' | 'Browser';

export interface SyncPeer {
  id: string;
  browser: SupportedBrowser;
  lastSeen: number;
}

export type SyncMessageType =
  | 'PEER_ANNOUNCE'
  | 'PEER_ACK'
  | 'BOOKMARK_CREATED'
  | 'BOOKMARK_MOVED'
  | 'BOOKMARK_REMOVED'
  | 'BOOKMARK_UPDATED'
  | 'CATALOG_REQUEST'
  | 'CATALOG_PAYLOAD';

export interface SyncMessage<T = any> {
  type: SyncMessageType;
  senderId: string;
  browserName: SupportedBrowser;
  syncKey: string;
  timestamp: number;
  payload: T;
}

export interface SyncBookmarkPayload {
  title: string;
  url?: string;
  folderPath: string; // Hierarchical path (e.g. "Barra de favoritos / Dev")
  index?: number;
}

export interface SyncCatalogItem {
  title: string;
  url?: string;
  folderPath: string;
  dateAdded?: number;
}

export interface SyncCatalogPayload {
  items: SyncCatalogItem[];
  itemCount: number;
}

export interface MergeResult {
  localAdded: number;
  remoteAdded: number;
  itemsProcessed: number;
}
