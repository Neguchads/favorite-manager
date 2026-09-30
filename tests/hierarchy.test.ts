import { it, expect, vi } from 'vitest';

const { removeTree } = vi.hoisted(() => ({ removeTree: vi.fn() }));
vi.mock('../src/services/bookmarks/index', () => ({
  bookmarksService: {
    remove: vi.fn().mockRejectedValue(new Error("Can't remove non-empty folder")),
    removeTree,
  },
}));

import { pruneEmptyFolders } from '../src/services/bookmarks/hierarchy';

it('não chama removeTree quando remove falha', async () => {
  const tree = [
    {
      id: '0',
      title: '',
      children: [
        {
          id: '1',
          title: 'Barra',
          parentId: '0',
          children: [{ id: '50', title: 'Vazia na memória', parentId: '1', children: [] }],
        },
      ],
    },
  ];
  const pruned = await pruneEmptyFolders(tree as any, undefined, new Set(['50']));
  expect(pruned).toBe(0);
  expect(removeTree).not.toHaveBeenCalled();
});
