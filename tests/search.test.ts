import { describe, it, expect } from 'vitest';
import { parseSearchQuery, scoreSearchRelevance } from '../src/utils/search';
import { BookmarkNode } from '../src/types/bookmarks';

describe('scoreSearchRelevance', () => {
  it('título exato fica acima de título que só contém o termo', () => {
    const query = parseSearchQuery('react');
    const exact: BookmarkNode = { id: '1', title: 'React', url: 'https://example.com/a' };
    const contains: BookmarkNode = { id: '2', title: 'Tutorial avançado sobre hooks do react', url: 'https://example.com/b' };
    expect(scoreSearchRelevance(exact, query)).toBeGreaterThan(scoreSearchRelevance(contains, query));
  });

  it('consulta vazia pontua zero', () => {
    const node: BookmarkNode = { id: '1', title: 'React', url: 'https://react.dev/' };
    expect(scoreSearchRelevance(node, parseSearchQuery('   '))).toBe(0);
  });
});
