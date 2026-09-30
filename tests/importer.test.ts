import { describe, it, expect } from 'vitest';
import { importBookmarks, exportBookmarksToJson, generateNetscapeHtml } from '../src/services/backup';
import { bookmarksService } from '../src/services/bookmarks';
import { BookmarkNode } from '../src/types/bookmarks';

// Árvore no formato que o próprio Backup exporta: nó '0' sem título com as três raízes
const backupTree: BookmarkNode[] = [
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
            title: 'Dev',
            parentId: '1',
            children: [{ id: '11', title: 'MDN', url: 'https://imp-mdn.example/', parentId: '10' }],
          },
          { id: '12', title: 'Solto', url: 'https://imp-solto.example/', parentId: '1' },
        ],
      },
      {
        id: '2',
        title: 'Outros favoritos',
        parentId: '0',
        children: [{ id: '20', title: 'Outro', url: 'https://imp-outro.example/', parentId: '2' }],
      },
      { id: '3', title: 'Favoritos móveis', parentId: '0', children: [] },
    ],
  },
];

async function importedChildren(folderName: string): Promise<BookmarkNode[]> {
  const [bar] = await bookmarksService.getSubTree('1');
  const folder = bar.children?.find((c) => c.title === folderName);
  expect(folder).toBeDefined();
  return folder!.children || [];
}

describe('importar no modo preservar', () => {
  it('JSON do próprio backup: sem pasta fantasma nem raiz duplicada', async () => {
    const result = await importBookmarks({
      fileContent: exportBookmarksToJson(backupTree),
      fileType: 'json',
      strategy: 'preserve',
      createDedicatedFolder: true,
      dedicatedFolderName: 'Importados JSON',
      skipExistingUrls: false,
    });
    expect(result.success).toBe(true);
    const children = await importedChildren('Importados JSON');
    expect(children.map((c) => c.title)).toEqual(['Dev', 'Solto', 'Outros favoritos']);
    const outros = children.find((c) => c.title === 'Outros favoritos');
    expect(outros?.children?.map((c) => c.url)).toEqual(['https://imp-outro.example/']);
  });

  it('HTML exportado pela extensão: barra desembrulhada, "Outros" vira subpasta', async () => {
    const result = await importBookmarks({
      fileContent: generateNetscapeHtml(backupTree),
      fileType: 'html',
      strategy: 'preserve',
      createDedicatedFolder: true,
      dedicatedFolderName: 'Importados HTML',
      skipExistingUrls: false,
    });
    expect(result.success).toBe(true);
    const children = await importedChildren('Importados HTML');
    expect(children.map((c) => c.title)).toEqual(['Dev', 'Solto', 'Outros favoritos']);
  });

  it('mantém o nome original das pastas', async () => {
    const tree: BookmarkNode[] = [
      {
        id: '5',
        title: 'minhas receitas',
        children: [{ id: '6', title: 'Bolo', url: 'https://imp-bolo.example/', parentId: '5' }],
      },
    ];
    await importBookmarks({
      fileContent: exportBookmarksToJson(tree),
      fileType: 'json',
      strategy: 'preserve',
      createDedicatedFolder: true,
      dedicatedFolderName: 'Importados Nomes',
      skipExistingUrls: false,
    });
    const children = await importedChildren('Importados Nomes');
    expect(children.map((c) => c.title)).toEqual(['minhas receitas']);
  });
});
