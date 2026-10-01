import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('paho-mqtt', () => ({ default: { Client: vi.fn(), Message: vi.fn() } }));

import { crossBrowserSyncService } from '../src/services/sync/syncService';
import { bookmarksService } from '../src/services/bookmarks';

const svc = crossBrowserSyncService as any;
let session: Record<string, unknown>;
let broadcast: ReturnType<typeof vi.fn>;

beforeEach(() => {
  session = {};
  // Só storage.session: o serviço de favoritos continua sendo o mock (sem chrome.bookmarks)
  (globalThis as any).chrome = {
    storage: { session: { get: async () => ({ ...session }) } },
  };
  svc.autoSync = true;
  svc.remoteAppliedUrls = new Map();
  broadcast = vi.fn().mockResolvedValue(undefined);
  svc.broadcastMessage = broadcast;
});

afterEach(() => {
  (globalThis as any).chrome = undefined;
});

describe('eventos de favoritos do navegador (Ctrl+D, estrela, gerenciador nativo)', () => {
  it('favorito criado pelo navegador é enviado com raiz e caminho da pasta', async () => {
    const folder = await bookmarksService.create({ parentId: '1', title: 'Eventos Pasta' });
    const bm = await bookmarksService.create({ parentId: folder.id, title: 'Novo', url: 'https://evento.example/' });

    await svc.handleLocalCreated(bm.id, bm);

    expect(broadcast).toHaveBeenCalledWith('BOOKMARK_CREATED', {
      title: 'Novo',
      url: 'https://evento.example/',
      rootId: '1',
      folderPath: 'Eventos Pasta',
    });
  });

  it('pasta criada não é enviada', async () => {
    const folder = await bookmarksService.create({ parentId: '1', title: 'Só Pasta' });
    await svc.handleLocalCreated(folder.id, folder);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('durante operação em massa (importar, restaurar, organizar) nada é enviado', async () => {
    session.isBulkOperating = true;
    const bm = await bookmarksService.create({ parentId: '1', title: 'Em massa', url: 'https://massa.example/' });
    await svc.handleLocalCreated(bm.id, bm);
    await svc.handleLocalRemoved(bm.id, { parentId: '1', index: 0, node: bm });
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('favorito que acabou de chegar de outro navegador não volta como eco', async () => {
    svc.markRemoteApplied('https://eco.example/');
    const bm = await bookmarksService.create({ parentId: '1', title: 'Eco', url: 'https://eco.example/' });
    await svc.handleLocalCreated(bm.id, bm);
    await svc.handleLocalRemoved(bm.id, { parentId: '1', index: 0, node: bm });
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('remoção de favorito é enviada; remoção de pasta não', async () => {
    await svc.handleLocalRemoved('x1', {
      parentId: '1',
      index: 0,
      node: { id: 'x1', title: 'Apagado', url: 'https://apagado.example/' },
    });
    await svc.handleLocalRemoved('x2', { parentId: '1', index: 0, node: { id: 'x2', title: 'Pasta', children: [] } });
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledWith('BOOKMARK_REMOVED', { url: 'https://apagado.example/' });
  });

  it('com a sincronização automática desligada nada é enviado', async () => {
    svc.autoSync = false;
    const bm = await bookmarksService.create({ parentId: '1', title: 'Off', url: 'https://off.example/' });
    await svc.handleLocalCreated(bm.id, bm);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('registra os listeners de criação e remoção do navegador uma vez só', () => {
    const onCreated = { addListener: vi.fn() };
    const onRemoved = { addListener: vi.fn() };
    (globalThis as any).chrome.bookmarks = { onCreated, onRemoved };
    svc.watchingLocalBookmarks = false;
    svc.startLocalBookmarkWatch();
    svc.startLocalBookmarkWatch();
    expect(onCreated.addListener).toHaveBeenCalledTimes(1);
    expect(onRemoved.addListener).toHaveBeenCalledTimes(1);
  });
});
