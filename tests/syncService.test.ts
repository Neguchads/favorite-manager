import { describe, it, expect, vi, beforeEach } from 'vitest';

const { snapshotSpy } = vi.hoisted(() => ({ snapshotSpy: vi.fn().mockResolvedValue('snapshot_teste') }));

// Paho não é usado aqui: as mensagens entram direto pelo receive()
vi.mock('paho-mqtt', () => ({ default: { Client: vi.fn(), Message: vi.fn() } }));
vi.mock('../src/services/backup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/services/backup')>()),
  createLocalSnapshot: snapshotSpy,
}));

import { crossBrowserSyncService } from '../src/services/sync/syncService';
import { isLegacySyncKey, generateSyncKey } from '../src/services/sync/browserDetect';
import { deriveSyncMaterial, sealMessage, chunk } from '../src/services/sync/crypto';
import { bookmarksService } from '../src/services/bookmarks';
import { BookmarkNode } from '../src/types/bookmarks';

const KEY = 'FAV-TEST-TEST-TEST-TEST-TEST';
const svc = crossBrowserSyncService as any;

function message(type: string, payload: unknown, extra: Record<string, unknown> = {}) {
  return { type, senderId: 'peer-1', browserName: 'Chrome', syncKey: KEY, timestamp: Date.now(), payload, ...extra };
}

async function findByUrl(url: string): Promise<BookmarkNode | null> {
  const tree = await bookmarksService.getTree();
  const stack = [...tree];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.url === url) return n;
    if (n.children) stack.push(...n.children);
  }
  return null;
}

beforeEach(async () => {
  svc.syncKey = KEY;
  svc.material = await deriveSyncMaterial(KEY);
  svc.autoSync = true;
  snapshotSpy.mockClear();
});

describe('recebimento de mensagens de sync', () => {
  it('lotes que chegam juntos são aplicados em ordem: uma pasta, um snapshot', async () => {
    const items = Array.from({ length: 450 }, (_, i) => ({
      title: `Item ${i}`,
      url: `https://lote.example/${i}`,
      rootId: '1',
      folderPath: 'Lote Grande',
    }));
    const batches = chunk(items, 200);
    const sealed = await Promise.all(
      batches.map((b, i) =>
        sealMessage(
          svc.material.key,
          message('CATALOG_PAYLOAD', { items: b, itemCount: items.length, part: i + 1, totalParts: batches.length })
        )
      )
    );
    // Entrega todos sem esperar, como o Paho faz
    sealed.forEach((raw) => svc.receive(raw));
    await svc.inbox;

    const [bar] = await bookmarksService.getSubTree('1');
    const folders = bar.children?.filter((c) => c.title === 'Lote Grande') || [];
    expect(folders).toHaveLength(1);
    expect(folders[0].children).toHaveLength(450);
    expect(snapshotSpy).toHaveBeenCalledTimes(1);
  });

  it('mensagem cifrada com outra chave é descartada', async () => {
    const other = await deriveSyncMaterial('FAV-OUTR-AOUT-RAOU-TRAO-UTRA');
    const raw = await sealMessage(
      other.key,
      message('BOOKMARK_CREATED', { title: 'Intruso', url: 'https://intruso.example/', folderPath: '' })
    );
    svc.receive(raw);
    await svc.inbox;
    expect(await findByUrl('https://intruso.example/')).toBeNull();
  });

  it('reenvio idêntico (replay) não recria favorito apagado', async () => {
    const raw = await sealMessage(
      svc.material.key,
      message('BOOKMARK_CREATED', { title: 'Uma vez', url: 'https://replay.example/', folderPath: '' })
    );
    svc.receive(raw);
    await svc.inbox;
    const created = await findByUrl('https://replay.example/');
    expect(created).not.toBeNull();
    await bookmarksService.remove(created!.id);

    svc.receive(raw);
    await svc.inbox;
    expect(await findByUrl('https://replay.example/')).toBeNull();
  });

  it('mensagem com mais de 5 minutos é descartada', async () => {
    const raw = await sealMessage(
      svc.material.key,
      message(
        'BOOKMARK_CREATED',
        { title: 'Velha', url: 'https://velha.example/', folderPath: '' },
        { timestamp: Date.now() - 6 * 60_000 }
      )
    );
    svc.receive(raw);
    await svc.inbox;
    expect(await findByUrl('https://velha.example/')).toBeNull();
  });
});

describe('replay após reconexão', () => {
  it('payload capturado não recria favorito depois de disconnect + reconexão com a mesma chave', async () => {
    const raw = await sealMessage(
      svc.material.key,
      message('BOOKMARK_CREATED', { title: 'Reconexão', url: 'https://reconexao.example/', folderPath: '' })
    );
    svc.receive(raw);
    await svc.inbox;
    const created = await findByUrl('https://reconexao.example/');
    expect(created).not.toBeNull();
    await bookmarksService.remove(created!.id);

    svc.disconnect();
    // Reconexão com a mesma chave restaura chave e material
    svc.syncKey = KEY;
    svc.material = await deriveSyncMaterial(KEY);

    svc.receive(raw);
    await svc.inbox;
    expect(await findByUrl('https://reconexao.example/')).toBeNull();
  });
});

describe('chaves legadas (formato curto)', () => {
  it('isLegacySyncKey reconhece só o formato antigo FAV-0000-XXXX', () => {
    expect(isLegacySyncKey('FAV-1234-AB12')).toBe(true);
    expect(isLegacySyncKey(' fav-1234-ab12 ')).toBe(true);
    expect(isLegacySyncKey(KEY)).toBe(false);
    expect(isLegacySyncKey(generateSyncKey())).toBe(false);
    expect(isLegacySyncKey('FAV-ABCD-AB12')).toBe(false);
    expect(isLegacySyncKey('')).toBe(false);
  });

  it('connect() recusa chave legada: status error, sem derivar nem conectar', async () => {
    const Paho = (await import('paho-mqtt')).default as any;
    Paho.Client.mockClear();
    const listener = vi.fn();
    const unsubscribe = svc.subscribe(listener);
    await svc.connect('FAV-1234-AB12');
    unsubscribe();
    expect(svc.getStatus()).toBe('error');
    expect(listener).toHaveBeenCalled();
    expect(Paho.Client).not.toHaveBeenCalled();
    expect(svc.getSyncKey()).not.toBe('FAV-1234-AB12');
  });
});
