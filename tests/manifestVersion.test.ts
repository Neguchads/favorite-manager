import { describe, it, expect } from 'vitest';
import { applyPackageVersion } from '../scripts/manifestVersion';

describe('applyPackageVersion', () => {
  it('troca a versão do manifest pela do package.json e mantém o resto', () => {
    const manifest = JSON.stringify({ manifest_version: 3, name: 'X', version: '0.0.1', omnibox: { keyword: 'fav' } });
    const result = JSON.parse(applyPackageVersion(manifest, '1.2.3'));
    expect(result.version).toBe('1.2.3');
    expect(result.name).toBe('X');
    expect(result.omnibox).toEqual({ keyword: 'fav' });
  });

  it('recusa versão que a loja do Edge não aceita', () => {
    expect(() => applyPackageVersion('{}', '1.2.0-beta')).toThrow();
    expect(() => applyPackageVersion('{}', '')).toThrow();
  });
});
