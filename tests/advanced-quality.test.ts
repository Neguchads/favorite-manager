import { describe, expect, it } from 'vitest';
import { levenshteinDistance, parseSearchQuery } from '../src/utils/search';
import { extractDomain, normalizeUrl } from '../src/utils/url';

function generated(seed: number): string {
  const alphabet = 'abcDef XYZ_0123';
  let state = seed >>> 0;
  return Array.from({ length: seed % 22 }, () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return alphabet[state % alphabet.length];
  }).join('');
}

describe('advanced property fuzz — bookmark search and URLs', () => {
  it('Levenshtein is symmetric, bounded and identity-preserving', () => {
    for (let seed = 1; seed <= 700; seed++) {
      const a = generated(seed);
      const b = generated(seed * 17 + 5);
      const distance = levenshteinDistance(a, b);
      expect(distance).toBe(levenshteinDistance(b, a));
      expect(distance).toBeGreaterThanOrEqual(Math.abs(a.length - b.length));
      expect(distance).toBeLessThanOrEqual(Math.max(a.length, b.length));
      expect(levenshteinDistance(a, a)).toBe(0);
    }
  });
  it('URL normalization removes tracking and is idempotent', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const input = `https://WWW.Example.com/path${seed}/?utm_source=ad&keep=${seed}`;
      const cleaned = normalizeUrl(input);
      expect(normalizeUrl(cleaned)).toBe(cleaned);
      expect(cleaned).not.toContain('utm_source');
      expect(extractDomain(cleaned)).toBe('example.com');
    }
  });
  it('search query parsing never drops plain input tokens', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const token = generated(seed).trim().replace(/\s+/g, '_') || 'item';
      const result = parseSearchQuery(`domain:example.com ${token}`);
      expect(result.domain).toBe('example.com');
      expect(result.text).toBe(token.toLowerCase());
    }
  });
});
