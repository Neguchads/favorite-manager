import { it, expect } from 'vitest';
import { bookmarksService } from '../src/services/bookmarks';
import { sortFoldersAlphabetically } from '../src/services/bookmarks/hierarchy';

async function childTitles(id: string): Promise<string[]> {
  const [node] = await bookmarksService.getSubTree(id);
  return (node.children || []).map((c) => c.title);
}

it('ordena [C, B, A] como [A, B, C]', async () => {
  const folder = await bookmarksService.create({ parentId: '1', title: 'Teste Ordenação' });
  for (const t of ['C', 'B', 'A']) {
    await bookmarksService.create({ parentId: folder.id, title: t, url: `https://example.com/${t}` });
  }
  await sortFoldersAlphabetically(folder.id, false);
  expect(await childTitles(folder.id)).toEqual(['A', 'B', 'C']);
});

it('pastas antes dos favoritos, cada grupo em A-Z', async () => {
  const folder = await bookmarksService.create({ parentId: '1', title: 'Teste Misto' });
  await bookmarksService.create({ parentId: folder.id, title: 'z-link', url: 'https://example.com/z' });
  await bookmarksService.create({ parentId: folder.id, title: 'Beta' });
  await bookmarksService.create({ parentId: folder.id, title: 'a-link', url: 'https://example.com/a' });
  await bookmarksService.create({ parentId: folder.id, title: 'Alfa' });
  await sortFoldersAlphabetically(folder.id, false);
  expect(await childTitles(folder.id)).toEqual(['Alfa', 'Beta', 'a-link', 'z-link']);
});
