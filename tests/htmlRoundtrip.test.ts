import { describe, it, expect } from 'vitest';
import { generateNetscapeHtml } from '../src/services/backup/htmlExporter';
import { parseNetscapeHtml } from '../src/services/backup/htmlParser';
import { BookmarkNode } from '../src/types/bookmarks';

const tree: BookmarkNode[] = [
  {
    id: '0',
    title: '',
    children: [
      {
        id: '1',
        title: 'Barra de favoritos',
        parentId: '0',
        children: [
          {
            id: '10',
            title: 'Dev & <Tools>',
            parentId: '1',
            children: [
              { id: '11', title: 'Título "aspas" & <tag>', url: 'https://example.com/?a=1&b=2', parentId: '10' },
            ],
          },
          { id: '12', title: 'Raiz', url: 'https://example.org/', parentId: '1' },
        ],
      },
      {
        id: '2',
        title: 'Outros favoritos',
        parentId: '0',
        children: [{ id: '20', title: "D'Artagnan", url: 'https://example.net/', parentId: '2' }],
      },
    ],
  },
];

describe('exportação e importação HTML', () => {
  it('ida e volta preserva títulos, URLs e pastas', () => {
    const parsed = parseNetscapeHtml(generateNetscapeHtml(tree));
    const flat = parsed.flatBookmarks.map((b) => ({ title: b.title, url: b.url, path: b.path }));
    expect(flat).toEqual([
      { title: 'Título "aspas" & <tag>', url: 'https://example.com/?a=1&b=2', path: 'Barra de favoritos / Dev & <Tools>' },
      { title: 'Raiz', url: 'https://example.org/', path: 'Barra de favoritos' },
      { title: "D'Artagnan", url: 'https://example.net/', path: 'Outros favoritos' },
    ]);
    expect(parsed.totalBookmarks).toBe(3);
  });

  it('marca a barra de favoritos com PERSONAL_TOOLBAR_FOLDER uma única vez', () => {
    const html = generateNetscapeHtml(tree);
    expect(html.match(/PERSONAL_TOOLBAR_FOLDER="true"/g)).toHaveLength(1);
    expect(html).toMatch(/<H3[^>]*PERSONAL_TOOLBAR_FOLDER="true"[^>]*>Barra de favoritos<\/H3>/);
  });
});
