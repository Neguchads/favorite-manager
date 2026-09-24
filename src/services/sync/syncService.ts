import Paho from 'paho-mqtt';
import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import { detectBrowserName, getOrCreateInstallationId } from './browserDetect';
import {
  SyncStatus,
  SyncPeer,
  SyncMessage,
  SupportedBrowser,
} from './types';
import { applyRemoteCatalogMerge, extractCatalogFromTree, normalizeSyncUrl } from './twoWayMerge';
import { ensureHierarchicalFolder, buildExistingFolderMap } from '../bookmarks/hierarchy';

const STORAGE_SYNC_KEY = 'fav_manager_sync_key';
const STORAGE_AUTO_SYNC = 'fav_manager_auto_sync_enabled';

class CrossBrowserSyncService {
  private client: Paho.Client | null = null;
  private syncKey: string | null = null;
  private status: SyncStatus = 'disconnected';
  private peers: Map<string, SyncPeer> = new Map();
  private listeners: Set<() => void> = new Set();
  private autoSync: boolean = true;
  private isApplyingRemoteChange: boolean = false;
  private myInstallationId: string;
  private myBrowser: SupportedBrowser;
  private reconnectTimer: any = null;

  constructor() {
    this.myInstallationId = getOrCreateInstallationId();
    this.myBrowser = detectBrowserName();
    this.loadSavedSettings();
  }

  private async loadSavedSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([STORAGE_SYNC_KEY, STORAGE_AUTO_SYNC], (res) => {
          if (res[STORAGE_SYNC_KEY]) {
            this.syncKey = res[STORAGE_SYNC_KEY];
            this.autoSync = res[STORAGE_AUTO_SYNC] !== false;
            this.connect(this.syncKey!);
          }
        });
      } else {
        const savedKey = localStorage.getItem(STORAGE_SYNC_KEY);
        const savedAuto = localStorage.getItem(STORAGE_AUTO_SYNC);
        if (savedKey) {
          this.syncKey = savedKey;
          this.autoSync = savedAuto !== 'false';
          this.connect(savedKey);
        }
      }
    } catch {}
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getSyncKey(): string | null {
    return this.syncKey;
  }

  public getActivePeers(): SyncPeer[] {
    const now = Date.now();
    // Keep peers seen in the last 60 seconds
    return Array.from(this.peers.values()).filter((p) => now - p.lastSeen < 60000);
  }

  public isAutoSyncEnabled(): boolean {
    return this.autoSync;
  }

  public setAutoSyncEnabled(enabled: boolean) {
    this.autoSync = enabled;
    try {
      localStorage.setItem(STORAGE_AUTO_SYNC, String(enabled));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_AUTO_SYNC]: enabled });
      }
    } catch {}
    this.notify();
  }

  public async connect(key: string) {
    const cleanKey = key.trim().toUpperCase();
    if (!cleanKey) return;

    if (this.client && this.client.isConnected()) {
      if (this.syncKey === cleanKey) return;
      this.disconnect();
    }

    this.syncKey = cleanKey;
    this.status = 'connecting';
    this.notify();

    try {
      localStorage.setItem(STORAGE_SYNC_KEY, cleanKey);
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_SYNC_KEY]: cleanKey });
      }
    } catch {}

    const clientId = `fav_${this.myBrowser.toLowerCase()}_${this.myInstallationId.substring(0, 8)}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Connect to secure public MQTT broker
    this.client = new Paho.Client('broker.hivemq.com', 8884, '/mqtt', clientId);

    this.client.onConnectionLost = (responseObject) => {
      this.status = 'disconnected';
      this.notify();
      if (responseObject.errorCode !== 0) {
        console.warn('Sync connection lost:', responseObject.errorMessage);
        this.scheduleReconnect();
      }
    };

    this.client.onMessageArrived = (message) => {
      this.handleIncomingMessage(message.payloadString);
    };

    this.client.connect({
      useSSL: true,
      timeout: 10,
      keepAliveInterval: 30,
      cleanSession: true,
      onSuccess: () => {
        this.status = 'connected';
        const topic = `favmanager/sync/${cleanKey}`;
        this.client?.subscribe(topic);
        
        // Announce presence to other browsers in the same sync key
        this.broadcastMessage('PEER_ANNOUNCE', {
          browser: this.myBrowser,
          ready: true,
        });

        this.notify();
      },
      onFailure: (err) => {
        console.warn('Sync connection failed:', err);
        this.status = 'error';
        this.notify();
        this.scheduleReconnect();
      },
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (!this.syncKey) return;
    this.reconnectTimer = setTimeout(() => {
      if (this.syncKey && (!this.client || !this.client.isConnected())) {
        this.connect(this.syncKey);
      }
    }, 5000);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.client) {
      try {
        if (this.client.isConnected()) {
          this.client.disconnect();
        }
      } catch {}
      this.client = null;
    }
    this.status = 'disconnected';
    this.peers.clear();
    this.notify();
  }

  public clearSyncKey() {
    this.disconnect();
    this.syncKey = null;
    try {
      localStorage.removeItem(STORAGE_SYNC_KEY);
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.remove([STORAGE_SYNC_KEY]);
      }
    } catch {}
    this.notify();
  }

  private broadcastMessage(type: any, payload: any) {
    if (!this.client || !this.client.isConnected() || !this.syncKey) return;

    const message: SyncMessage = {
      type,
      senderId: this.myInstallationId,
      browserName: this.myBrowser,
      syncKey: this.syncKey,
      timestamp: Date.now(),
      payload,
    };

    const pahoMsg = new Paho.Message(JSON.stringify(message));
    pahoMsg.destinationName = `favmanager/sync/${this.syncKey}`;
    pahoMsg.qos = 1;
    this.client.send(pahoMsg);
  }

  private async handleIncomingMessage(rawPayload: string) {
    try {
      const msg: SyncMessage = JSON.parse(rawPayload);

      // Ignore messages sent by this same browser installation
      if (msg.senderId === this.myInstallationId) return;

      // Update peer tracking
      this.peers.set(msg.senderId, {
        id: msg.senderId,
        browser: msg.browserName,
        lastSeen: Date.now(),
      });
      this.notify();

      switch (msg.type) {
        case 'PEER_ANNOUNCE':
          // Respond with ACK so the new peer knows we are also online
          this.broadcastMessage('PEER_ACK', { browser: this.myBrowser });
          break;

        case 'PEER_ACK':
          // Peer acknowledged our announcement
          break;

        case 'BOOKMARK_CREATED':
          if (this.autoSync && msg.payload) {
            await this.handleRemoteBookmarkCreated(msg.payload);
          }
          break;

        case 'BOOKMARK_REMOVED':
          if (this.autoSync && msg.payload?.url) {
            await this.handleRemoteBookmarkRemoved(msg.payload.url);
          }
          break;

        case 'CATALOG_REQUEST':
          // Peer requested our catalog for two-way merge
          await this.sendCatalogPayload();
          break;

        case 'CATALOG_PAYLOAD':
          if (msg.payload?.items) {
            this.status = 'syncing';
            this.notify();
            const res = await applyRemoteCatalogMerge(msg.payload.items);
            this.status = 'connected';
            this.notify();
            if (res.localAdded > 0) {
              this.showNativeNotification(
                `⚡ Sincronizado do ${msg.browserName}`,
                `${res.localAdded} novos favoritos adicionados!`
              );
            }
          }
          break;
      }
    } catch (err) {
      console.warn('Error handling incoming sync message:', err);
    }
  }

  private async handleRemoteBookmarkCreated(item: { title: string; url?: string; folderPath?: string }) {
    if (!item.url) return;
    this.isApplyingRemoteChange = true;
    try {
      const currentTree = await bookmarksService.getTree();
      const localCatalog = extractCatalogFromTree(currentTree);
      const normalizedNew = normalizeSyncUrl(item.url);

      const exists = localCatalog.some((b) => b.url && normalizeSyncUrl(b.url) === normalizedNew);
      if (!exists) {
        const existingFolderMap = buildExistingFolderMap(currentTree);
        const folderPath = item.folderPath?.trim() || 'Barra de favoritos';
        const targetFolderId = await ensureHierarchicalFolder(folderPath, '1', existingFolderMap);

        await bookmarksService.create({
          parentId: targetFolderId,
          title: item.title || item.url,
          url: item.url,
        });

        this.showNativeNotification(
          '⚡ Favorito Sincronizado',
          `Novo favorito recebido em tempo real: ${item.title}`
        );
      }
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  private async handleRemoteBookmarkRemoved(rawUrl: string) {
    this.isApplyingRemoteChange = true;
    try {
      const currentTree = await bookmarksService.getTree();
      const targetNormalized = normalizeSyncUrl(rawUrl);

      function findAndRemove(nodes: BookmarkNode[]) {
        for (const node of nodes) {
          if (node.url && normalizeSyncUrl(node.url) === targetNormalized) {
            bookmarksService.remove(node.id).catch(() => {});
          }
          if (node.children) {
            findAndRemove(node.children);
          }
        }
      }

      findAndRemove(currentTree);
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  /**
   * Called by local bookmark listeners when a bookmark is created locally
   */
  public onLocalBookmarkCreated(bookmark: BookmarkNode, folderPath: string) {
    if (this.isApplyingRemoteChange || !this.autoSync) return;
    this.broadcastMessage('BOOKMARK_CREATED', {
      title: bookmark.title,
      url: bookmark.url,
      folderPath,
    });
  }

  /**
   * Called by local bookmark listeners when a bookmark is removed locally
   */
  public onLocalBookmarkRemoved(url: string) {
    if (this.isApplyingRemoteChange || !this.autoSync) return;
    this.broadcastMessage('BOOKMARK_REMOVED', { url });
  }

  /**
   * Sends the full local catalog to peers
   */
  private async sendCatalogPayload() {
    const tree = await bookmarksService.getTree();
    const items = extractCatalogFromTree(tree);
    this.broadcastMessage('CATALOG_PAYLOAD', {
      items,
      itemCount: items.length,
    });
  }

  /**
   * Triggers a full two-way merge across all connected browsers
   */
  public async triggerTwoWayMerge(): Promise<void> {
    if (!this.client || !this.client.isConnected() || !this.syncKey) {
      throw new Error('Sincronização desconectada');
    }

    this.status = 'syncing';
    this.notify();

    // 1. Broadcast our catalog to other peers
    await this.sendCatalogPayload();

    // 2. Request peers to broadcast their catalog to us
    this.broadcastMessage('CATALOG_REQUEST', {});

    setTimeout(() => {
      if (this.status === 'syncing') {
        this.status = 'connected';
        this.notify();
      }
    }, 4000);
  }

  private showNativeNotification(title: string, message: string) {
    try {
      if (typeof chrome !== 'undefined' && chrome.notifications?.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title,
          message,
          priority: 1,
        });
      }
    } catch {}
  }
}

export const crossBrowserSyncService = new CrossBrowserSyncService();
