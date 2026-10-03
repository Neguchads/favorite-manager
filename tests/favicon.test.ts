import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFaviconUrl } from '../src/utils/url';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getFaviconUrl', () => {
  it('na extensão usa o cache local do navegador, sem serviço externo', () => {
    vi.stubGlobal('chrome', { runtime: { id: 'abc', getURL: (p: string) => `chrome-extension://abc${p}` } });
    const icon = getFaviconUrl('https://github.com/Neguchads');
    expect(icon.startsWith('chrome-extension://abc/_favicon/?pageUrl=')).toBe(true);
    expect(decodeURIComponent(icon)).toContain('https://github.com/Neguchads');
    expect(icon).not.toContain('google.com');
  });

  it('retorna vazio sem URL', () => {
    expect(getFaviconUrl(undefined)).toBe('');
  });
});
