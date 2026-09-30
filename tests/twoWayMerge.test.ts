import { describe, it, expect } from 'vitest';
import { applyRemoteCatalogMerge, extractCatalogFromTree, resolveRemoteTarget } from '../src/services/sync/twoWayMerge';
import { bookmarksService } from '../src/services/bookmarks';
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
            title: 'Estudos',
            parentId: '1',
            children: [{ id: '11', title: 'MDN', url: 'https://developer.mozilla.org/', parentId: '10' }],
          },
          { id: '12', title: 'Solto', url: 'https://example.org/', parentId: '1' },
        ],
      },
      {
        id: '2',
        title: 'Outros favoritos',
        parentId: '0',
        children: [
          {
            id: '20',
            title: 'Estudos',
            parentId: '2',
            children: [{ id: '21', title: 'Khan', url: 'https://khanacademy.org/', parentId: '20' }],
          },
        ],
      },
    ],
  },
];

describe('extractCatalogFromTree', () => {
  it('grava a raiz em rootId e o caminho sem o nome da raiz', () => {
    const items = extractCatalogFromTree(tree);
    const pick = (url: string) => items.find((i) => i.url === url);
    expect(pick('https://developer.mozilla.org/')).toMatchObject({ rootId: '1', folderPath: 'Estudos' });
    expect(pick('https://example.org/')).toMatchObject({ rootId: '1', folderPath: '' });
    expect(pick('https://khanacademy.org/')).toMatchObject({ rootId: '2', folderPath: 'Estudos' });
  });
});

describe('resolveRemoteTarget', () => {
  it('usa rootId quando existe', () => {
    expect(resolveRemoteTarget({ rootId: '2', folderPath: 'Estudos' })).toEqual({ rootId: '2', path: 'Estudos' });
  });

  it('formato antigo: tira o nome da raiz do caminho, em qualquer idioma', () => {
    expect(resolveRemoteTarget({ folderPath: 'Bookmarks bar / Dev' })).toEqual({ rootId: '1', path: 'Dev' });
    expect(resolveRemoteTarget({ folderPath: 'Barra de favoritos' })).toEqual({ rootId: '1', path: '' });
    expect(resolveRemoteTarget({ folderPath: 'Other bookmarks / A / B' })).toEqual({ rootId: '2', path: 'A / B' });
    expect(resolveRemoteTarget({ folderPath: 'Favoritos móveis / C' })).toEqual({ rootId: '3', path: 'C' });
  });

  it('reconhece os nomes do Edge em inglês', () => {
    expect(resolveRemoteTarget({ folderPath: 'Favorites bar / Dev' })).toEqual({ rootId: '1', path: 'Dev' });
    expect(resolveRemoteTarget({ folderPath: 'Other favorites / A' })).toEqual({ rootId: '2', path: 'A' });
    expect(resolveRemoteTarget({ folderPath: 'Mobile favorites' })).toEqual({ rootId: '3', path: '' });
  });

  it('caminho sem raiz conhecida vai para a barra', () => {
    expect(resolveRemoteTarget({ folderPath: 'Dev / Web' })).toEqual({ rootId: '1', path: 'Dev / Web' });
    expect(resolveRemoteTarget({ folderPath: '' })).toEqual({ rootId: '1', path: '' });
  });

  it('rootId inválido cai na barra', () => {
    expect(resolveRemoteTarget({ rootId: '99' as any, folderPath: 'Dev' })).toEqual({ rootId: '1', path: 'Dev' });
  });
});

describe('applyRemoteCatalogMerge', () => {
  it('não cria "Barra de favoritos" dentro da barra e não mistura raízes', async () => {
    await applyRemoteCatalogMerge([
      { title: 'Novo', url: 'https://novo.example/', folderPath: 'Barra de favoritos / Sync Teste' },
      { title: 'Outro', url: 'https://outro.example/', rootId: '2', folderPath: 'Sync Teste' },
    ]);
    const [bar] = await bookmarksService.getSubTree('1');
    const [other] = await bookmarksService.getSubTree('2');
    expect(bar.children?.some((c) => c.title === 'Barra de favoritos')).toBe(false);
    const barFolder = bar.children?.find((c) => c.title === 'Sync Teste');
    const otherFolder = other.children?.find((c) => c.title === 'Sync Teste');
    expect(barFolder?.children?.map((c) => c.url)).toEqual(['https://novo.example/']);
    expect(otherFolder?.children?.map((c) => c.url)).toEqual(['https://outro.example/']);
  });
});
