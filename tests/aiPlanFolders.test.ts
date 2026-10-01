import { describe, it, expect } from 'vitest';
import { bookmarksService } from '../src/services/bookmarks';
import { executeAiPlanWithHierarchy } from '../src/services/bookmarks/hierarchy';
import { BookmarkNode } from '../src/types/bookmarks';
import { AiProposedPlan } from '../src/ai/types';

async function childrenOf(id: string): Promise<BookmarkNode[]> {
  const [node] = await bookmarksService.getSubTree(id);
  return node.children || [];
}

function plan(moves: Array<{ id: string; title: string; target: string }>): AiProposedPlan {
  return {
    suggestedFolders: Array.from(new Set(moves.map((m) => m.target))),
    moves: moves.map((m) => ({
      bookmarkId: m.id,
      bookmarkTitle: m.title,
      url: `https://${m.id}.example/`,
      targetFolder: m.target,
      targetFolderExists: true,
    })),
  } as AiProposedPlan;
}

async function run(p: AiProposedPlan) {
  // Sem limpar pastas vazias nem ordenar: o teste olha só onde as pastas vão parar
  return executeAiPlanWithHierarchy(p, await bookmarksService.getTree(), '1', undefined, false, false);
}

describe('executeAiPlanWithHierarchy reaproveita pastas aninhadas', () => {
  it('pasta mestre dentro de outra pasta não é recriada na raiz', async () => {
    const pessoal = await bookmarksService.create({ parentId: '1', title: 'Pessoal Teste A' });
    const estudos = await bookmarksService.create({ parentId: pessoal.id, title: 'Estudos Aninhados A' });
    const solto = await bookmarksService.create({ parentId: '1', title: 'Curso', url: 'https://curso-a.example/' });

    const res = await run(plan([{ id: solto.id, title: 'Curso', target: 'Estudos Aninhados A' }]));

    expect(res.createdFoldersCount).toBe(0);
    expect((await childrenOf('1')).filter((c) => c.title === 'Estudos Aninhados A')).toHaveLength(0);
    expect((await childrenOf(estudos.id)).map((c) => c.id)).toContain(solto.id);
  });

  it('subpasta nova é criada dentro da pasta aninhada existente', async () => {
    const pessoal = await bookmarksService.create({ parentId: '1', title: 'Pessoal Teste B' });
    const estudos = await bookmarksService.create({ parentId: pessoal.id, title: 'Estudos Aninhados B' });
    const solto = await bookmarksService.create({ parentId: '1', title: 'Inglês', url: 'https://ingles-b.example/' });

    const res = await run(plan([{ id: solto.id, title: 'Inglês', target: 'Estudos Aninhados B / Inglês' }]));

    expect(res.createdFoldersCount).toBe(1);
    expect((await childrenOf('1')).filter((c) => c.title === 'Estudos Aninhados B')).toHaveLength(0);
    const sub = (await childrenOf(estudos.id)).find((c) => c.title === 'Inglês');
    expect(sub).toBeDefined();
    expect((await childrenOf(sub!.id)).map((c) => c.id)).toContain(solto.id);
  });

  it('caminho completo existente em outra raiz é reaproveitado', async () => {
    const estudos = await bookmarksService.create({ parentId: '2', title: 'Estudos Outra Raiz' });
    const ingles = await bookmarksService.create({ parentId: estudos.id, title: 'Idiomas' });
    const solto = await bookmarksService.create({ parentId: '1', title: 'Duolingo', url: 'https://duo-c.example/' });

    const res = await run(plan([{ id: solto.id, title: 'Duolingo', target: 'Estudos Outra Raiz / Idiomas' }]));

    expect(res.createdFoldersCount).toBe(0);
    expect((await childrenOf(ingles.id)).map((c) => c.id)).toContain(solto.id);
  });

  it('pasta de mesmo nome no topo da barra tem prioridade sobre a aninhada', async () => {
    const topo = await bookmarksService.create({ parentId: '1', title: 'Compras Prioridade' });
    const outra = await bookmarksService.create({ parentId: '1', title: 'Arquivo Prioridade' });
    await bookmarksService.create({ parentId: outra.id, title: 'Compras Prioridade' });
    const solto = await bookmarksService.create({ parentId: '1', title: 'Loja', url: 'https://loja-d.example/' });

    await run(plan([{ id: solto.id, title: 'Loja', target: 'Compras Prioridade' }]));

    expect((await childrenOf(topo.id)).map((c) => c.id)).toContain(solto.id);
  });

  it('sem pasta existente, cria na raiz como antes', async () => {
    const solto = await bookmarksService.create({ parentId: '1', title: 'Novo', url: 'https://novo-e.example/' });
    const res = await run(plan([{ id: solto.id, title: 'Novo', target: 'Categoria Inexistente E / Sub' }]));
    expect(res.createdFoldersCount).toBe(2);
    const cat = (await childrenOf('1')).find((c) => c.title === 'Categoria Inexistente E');
    expect(cat).toBeDefined();
  });
});
