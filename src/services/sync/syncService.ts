import Paho from 'paho-mqtt';
import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import { detectBrowserName, getOrCreateInstallationId, isLegacySyncKey } from './browserDetect';
import {
  SyncStatus,
  SyncPeer,
  SyncMessage,
  SupportedBrowser,
  SyncCatalogItem,
} from './types';
import { applyRemoteCatalogMerge, extractCatalogFromTree, normalizeSyncUrl, resolveRemoteTarget } from './twoWayMerge';
import { deriveSyncMaterial, sealMessage, openMessage, chunk, SyncMaterial } from './crypto';
import { ensureHierarchicalFolder, buildExistingFolderMap } from '../bookmarks/hierarchy';

const STORAGE_SYNC_KEY = 'fav_manager_sync_key';
const STORAGE_AUTO_SYNC = 'fav_manager_auto_sync_enabled';
const CATALOG_BATCH_SIZE = 200;
const MAX_MESSAGE_AGE_MS = 5 * 60_000;
const SEEN_PAYLOADS_LIMIT = 500;

class CrossBrowserSyncService {
  private client: Paho.Client | null = null;
  private syncKey: string | null = null;
  private material: SyncMaterial | null = null;
  // Payloads cifrados já recebidos: descarta reenvio idêntico (replay)
  private seenPayloads: Set<string> = new Set();
  private status: SyncStatus = 'disconnected';
  private peers: Map<string, SyncPeer> = new Map();
  private listeners: Set<() => void> = new Set();
  private autoSync: boolean = true;
  private isApplyingRemoteChange: boolean = false;
  private myInstallationId: string;
  private myBrowser: SupportedBrowser;
  private reconnectTimer: any = null;
  // Invalida um connect() que ainda está derivando a chave quando outro connect/disconnect acontece
  private connectAttempt = 0;

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
            // Chave legada fica visível para o aviso na UI, mas não conecta
            if (!isLegacySyncKey(this.syncKey!)) this.connect(this.syncKey!);
            this.notify();
          }
        });
      } else {
        const savedKey = localStorage.getItem(STORAGE_SYNC_KEY);
        const savedAuto = localStorage.getItem(STORAGE_AUTO_SYNC);
        if (savedKey) {
          this.syncKey = savedKey;
          this.autoSync = savedAuto !== 'false';
          if (!isLegacySyncKey(savedKey)) this.connect(savedKey);
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

    // Chave antiga e curta: recusada sem derivar nem abrir conexão
    if (isLegacySyncKey(cleanKey)) {
      console.warn('Sync key in legacy format rejected');
      this.status = 'error';
      this.notify();
      return;
    }

    if (this.client) {
      if (this.client.isConnected() && this.syncKey === cleanKey) return;
      // Cliente antigo (outra chave ou conexão caída): descarta antes de criar outro
      this.disconnect();
    }
    const attempt = ++this.connectAttempt;

    // Histórico anti-replay só vale para a mesma chave: sobrevive a reconexões
    if (this.syncKey !== cleanKey) this.seenPayloads.clear();
    this.syncKey = cleanKey;
    this.material = null;
    this.status = 'connecting';
    this.notify();

    try {
      localStorage.setItem(STORAGE_SYNC_KEY, cleanKey);
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_SYNC_KEY]: cleanKey });
      }
    } catch {}

    let material: SyncMaterial;
    try {
      material = await deriveSyncMaterial(cleanKey);
    } catch (err) {
      console.warn('Sync key derivation failed:', err);
      this.status = 'error';
      this.notify();
      return;
    }
    // Outra chamada de connect/disconnect aconteceu enquanto a chave era derivada
    if (attempt !== this.connectAttempt || this.syncKey !== cleanKey) return;
    this.material = material;

    const clientId = `fav_${this.myBrowser.toLowerCase()}_${this.myInstallationId.substring(0, 8)}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Connect to secure public MQTT broker
    const client = new Paho.Client('broker.hivemq.com', 8884, '/mqtt', clientId);
    this.client = client;
    // Cliente de uma tentativa antiga (chave trocada ou apagada durante o handshake): fecha e ignora
    const isStale = () => {
      if (attempt === this.connectAttempt) return false;
      try {
        client.disconnect();
      } catch {}
      return true;
    };

    client.onConnectionLost = (responseObject) => {
      if (attempt !== this.connectAttempt) return;
      this.status = 'disconnected';
      this.notify();
      if (responseObject.errorCode !== 0) {
        console.warn('Sync connection lost:', responseObject.errorMessage);
        this.scheduleReconnect();
      }
    };

    client.onMessageArrived = (message) => {
      if (attempt !== this.connectAttempt) return;
      this.receive(message.payloadString);
    };

    client.connect({
      useSSL: true,
      timeout: 10,
      keepAliveInterval: 30,
      cleanSession: true,
      onSuccess: () => {
        if (isStale()) return;
        this.status = 'connected';
        // Tópico derivado da chave: não revela a chave a quem observa o broker
        client.subscribe(material.topic);
        
        // Announce presence to other browsers in the same sync key
        void this.broadcastMessage('PEER_ANNOUNCE', {
          browser: this.myBrowser,
          ready: true,
        });

        this.notify();
      },
      onFailure: (err) => {
        if (attempt !== this.connectAttempt) return;
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
    this.connectAttempt++;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.client) {
      try {
        if (this.client.isConnected()) {
          this.client.disconnect();
        }
      } catch {}
      this.client = null;
    }
    this.material = null;
    // seenPayloads fica: limpar aqui permitiria replay logo após reconectar
    this.status = 'disconnected';
    this.peers.clear();
    this.notify();
  }

  public clearSyncKey() {
    this.disconnect();
    this.syncKey = null;
    this.seenPayloads.clear();
    try {
      localStorage.removeItem(STORAGE_SYNC_KEY);
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.remove([STORAGE_SYNC_KEY]);
      }
    } catch {}
    this.notify();
  }

  private async broadcastMessage(type: any, payload: any): Promise<void> {
    const client = this.client;
    const material = this.material;
    if (!client || !client.isConnected() || !this.syncKey || !material) return;

    const message: SyncMessage = {
      type,
      senderId: this.myInstallationId,
      browserName: this.myBrowser,
      syncKey: this.syncKey,
      timestamp: Date.now(),
      payload,
    };

    try {
      const pahoMsg = new Paho.Message(await sealMessage(material.key, message));
      pahoMsg.destinationName = material.topic;
      pahoMsg.qos = 1;
      if (client.isConnected()) client.send(pahoMsg);
    } catch (err) {
      console.warn('Sync message not sent:', err);
    }
  }

  private inbox: Promise<void> = Promise.resolve();

  // Uma mensagem por vez: lotes do catálogo chegam juntos e não podem ser aplicados em paralelo
  private receive(rawPayload: string) {
    this.inbox = this.inbox.then(() => this.handleIncomingMessage(rawPayload)).catch(() => undefined);
  }

  private async handleIncomingMessage(rawPayload: string) {
    try {
      const material = this.material;
      if (!material) return;
      if (this.seenPayloads.has(rawPayload)) return;

      // Sem a chave certa, openMessage devolve null: mensagem descartada sem tocar nos favoritos
      const msg = (await openMessage(material.key, rawPayload)) as SyncMessage | null;
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;
      if (msg.syncKey !== this.syncKey) return;
      if (typeof msg.timestamp !== 'number' || Math.abs(Date.now() - msg.timestamp) > MAX_MESSAGE_AGE_MS) return;

      this.seenPayloads.add(rawPayload);
      if (this.seenPayloads.size > SEEN_PAYLOADS_LIMIT) {
        const oldest = this.seenPayloads.values().next().value;
        if (oldest !== undefined) this.seenPayloads.delete(oldest);
      }

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
          void this.broadcastMessage('PEER_ACK', { browser: this.myBrowser });
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
          if (Array.isArray(msg.payload?.items)) {
            this.status = 'syncing';
            this.notify();
            // Snapshot só no primeiro lote: 15 lotes não podem empurrar os backups antigos para fora
            const part = msg.payload.part;
            const res = await applyRemoteCatalogMerge(msg.payload.items, undefined, {
              takeSnapshot: typeof part !== 'number' || part === 1,
            });
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

  private async handleRemoteBookmarkCreated(item: {
    title: string;
    url?: string;
    rootId?: SyncCatalogItem['rootId'];
    folderPath?: string;
  }) {
    if (!item.url) return;
    this.isApplyingRemoteChange = true;
    try {
      const currentTree = await bookmarksService.getTree();
      const localCatalog = extractCatalogFromTree(currentTree);
      const normalizedNew = normalizeSyncUrl(item.url);

      const exists = localCatalog.some((b) => b.url && normalizeSyncUrl(b.url) === normalizedNew);
      if (!exists) {
        const existingFolderMap = buildExistingFolderMap(currentTree);
        const { rootId, path } = resolveRemoteTarget({ rootId: item.rootId, folderPath: item.folderPath || '' });
        const targetFolderId = await ensureHierarchicalFolder(path, rootId, existingFolderMap);

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
    void this.broadcastMessage('BOOKMARK_CREATED', {
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
    void this.broadcastMessage('BOOKMARK_REMOVED', { url });
  }

  /**
   * Sends the full local catalog to peers
   */
  private async sendCatalogPayload() {
    const tree = await bookmarksService.getTree();
    const items = extractCatalogFromTree(tree);
    // Lotes de 200: catálogo grande não passa do limite de mensagem do broker.
    // O receptor aplica cada lote; applyRemoteCatalogMerge já pula URLs repetidas.
    const batches = chunk(items, CATALOG_BATCH_SIZE);
    for (let part = 0; part < batches.length; part++) {
      await this.broadcastMessage('CATALOG_PAYLOAD', {
        items: batches[part],
        itemCount: items.length,
        part: part + 1,
        totalParts: batches.length,
      });
    }
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
    void this.broadcastMessage('CATALOG_REQUEST', {});

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
