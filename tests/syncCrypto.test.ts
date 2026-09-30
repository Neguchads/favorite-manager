import { describe, it, expect } from 'vitest';
import { deriveSyncMaterial, sealMessage, openMessage, chunk } from '../src/services/sync/crypto';
import { generateSyncKey } from '../src/services/sync/browserDetect';

describe('sync crypto', () => {
  it('ida e volta com a mesma chave', async () => {
    const { key } = await deriveSyncMaterial('FAV-ABCD-EFGH-JKLM-NPQR-STUV');
    const sealed = await sealMessage(key, { hello: 'mundo' });
    expect(sealed).not.toContain('mundo');
    expect(await openMessage(key, sealed)).toEqual({ hello: 'mundo' });
  });

  it('chave errada ou payload corrompido retorna null', async () => {
    const a = await deriveSyncMaterial('FAV-AAAA-AAAA-AAAA-AAAA-AAAA');
    const b = await deriveSyncMaterial('FAV-BBBB-BBBB-BBBB-BBBB-BBBB');
    const sealed = await sealMessage(a.key, { x: 1 });
    expect(await openMessage(b.key, sealed)).toBeNull();
    expect(await openMessage(a.key, sealed.slice(0, -4) + 'AAAA')).toBeNull();
    expect(await openMessage(a.key, 'lixo')).toBeNull();
  });

  it('tópico não revela a chave e é estável', async () => {
    const m1 = await deriveSyncMaterial('FAV-ABCD-EFGH-JKLM-NPQR-STUV');
    const m2 = await deriveSyncMaterial('fav-abcd-efgh-jklm-npqr-stuv');
    expect(m1.topic).toBe(m2.topic);
    expect(m1.topic).toMatch(/^favmanager\/v2\/[0-9a-f]{32}$/);
    expect(m1.topic).not.toContain('ABCD');
  });

  it('chave nova tem 20 caracteres aleatórios (100 bits)', () => {
    const k1 = generateSyncKey();
    expect(k1).toMatch(/^FAV(-[A-Z2-9]{4}){5}$/);
    expect(generateSyncKey()).not.toBe(k1);
  });

  it('catálogo grande é enviado em lotes de 200', () => {
    const items = Array.from({ length: 450 }, (_, i) => i);
    expect(chunk(items, 200).map((c) => c.length)).toEqual([200, 200, 50]);
    expect(chunk([], 200)).toEqual([]);
  });
});
