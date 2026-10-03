import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkSingleUrlStatus } from '../src/services/health';

function stubFetch(response: Partial<Response>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 0, type: 'basic', redirected: false, ...response }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkSingleUrlStatus (fetch direto)', () => {
  it('404 vira broken_404, não ok', async () => {
    stubFetch({ ok: false, status: 404 });
    expect((await checkSingleUrlStatus('https://example.com/sumiu')).status).toBe('broken_404');
  });

  it('500 vira broken_server', async () => {
    stubFetch({ ok: false, status: 503 });
    expect((await checkSingleUrlStatus('https://example.com/')).status).toBe('broken_server');
  });

  it('resposta opaca não conta como ok', async () => {
    stubFetch({ type: 'opaque', status: 0 });
    expect((await checkSingleUrlStatus('https://example.com/')).status).toBe('network_error');
  });

  it('200 e 403 contam como ok', async () => {
    stubFetch({ ok: true, status: 200 });
    expect((await checkSingleUrlStatus('https://example.com/')).status).toBe('ok');
    stubFetch({ ok: false, status: 403 });
    expect((await checkSingleUrlStatus('https://example.com/')).status).toBe('ok');
  });

  it('redirecionamento informa o destino', async () => {
    stubFetch({ ok: true, status: 200, redirected: true, url: 'https://example.com/novo' });
    const res = await checkSingleUrlStatus('https://example.com/velho');
    expect(res).toMatchObject({ status: 'redirected', finalUrl: 'https://example.com/novo' });
  });

  it('401 e 429 contam como ok (a página existe)', async () => {
    stubFetch({ ok: false, status: 401 });
    expect((await checkSingleUrlStatus('https://example.com/')).status).toBe('ok');
    stubFetch({ ok: false, status: 429 });
    expect((await checkSingleUrlStatus('https://example.com/')).status).toBe('ok');
  });

  it('410 (removida) vira broken_404', async () => {
    stubFetch({ ok: false, status: 410 });
    expect(await checkSingleUrlStatus('https://example.com/')).toMatchObject({ status: 'broken_404', httpCode: 410 });
  });
});
