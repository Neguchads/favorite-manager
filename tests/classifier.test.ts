import { describe, it, expect } from 'vitest';
import { capitalizeFolderWords, parseChatActionIntent, matchWithExistingFolders } from '../src/ai/classifier';

describe('matchWithExistingFolders', () => {
  it('prefere a pasta existente com o nome exato da categoria a um apelido', () => {
    const existing = new Set(['dev', 'dev & ia']);
    expect(matchWithExistingFolders('Dev & IA / Repositórios', existing)).toBe('Dev & IA / Repositórios');
  });

  it('sem o nome exato, usa o apelido existente', () => {
    expect(matchWithExistingFolders('Dev & IA / Repositórios', new Set(['programação']))).toBe(
      'Programação / Repositórios'
    );
  });
});

describe('capitalizeFolderWords', () => {
  it('preserva siglas técnicas', () => {
    expect(capitalizeFolderWords('dev & ia / api')).toBe('Dev & IA / API');
  });

  it('mantém a grafia oficial das marcas', () => {
    expect(capitalizeFolderWords('dev / github')).toBe('Dev / GitHub');
    expect(capitalizeFolderWords('redes / linkedin & tiktok')).toBe('Redes / LinkedIn & TikTok');
  });
});

describe('parseChatActionIntent', () => {
  it('entende criar pasta e mover links', () => {
    const items = [
      { id: 'b1', title: 'Duolingo', url: 'https://www.duolingo.com/' },
      { id: 'b2', title: 'Duolingo Stories', url: 'https://stories.duolingo.com/' },
      { id: 'b3', title: 'GitHub', url: 'https://github.com/' },
    ];
    const result = parseChatActionIntent(
      'Crie a pasta Estudos/Inglês e mova todos os links do Duolingo para lá',
      items,
      new Set<string>()
    );
    expect(result?.targetFolder).toBe('Estudos / Inglês');
    expect(result?.plan.moves.map((m) => m.bookmarkId)).toEqual(['b1', 'b2']);
  });
});
