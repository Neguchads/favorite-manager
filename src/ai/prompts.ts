import { AiBookmarkItem } from './types';

/**
 * Clean, non-redundant Master Categories.
 */
export const CLEAN_MASTER_CATEGORIES = [
  'Arte & Design',
  'Compras',
  'Dev & IA',
  'Eletrônica',
  'Engenharia & Mecânica',
  'Espiritualidade',
  'Estudos',
  'Filmes & Séries',
  'Governo',
  'Jogos',
  'Música',
  'Negócios & Finanças',
  'Notícias',
  'Outros',
  'Produtividade',
  'Redes Sociais',
  'Saúde & Bem-Estar',
  'Tecnologia',
  'Viagens & Turismo',
] as const;

/**
 * Builds a compact, token-efficient prompt for Ollama LLM batch classification.
 * Optimized to prevent context overflow and produce deterministic JSON responses.
 */
export function buildCategorizationPrompt(items: AiBookmarkItem[]): string {
  const simplified = items.map((i) => ({
    id: i.id,
    title: (i.title || '').substring(0, 90),
    url: (i.url || '').substring(0, 140),
  }));

  return `Você é um taxonomista de favoritos web. Classifique cada item no formato "Categoria Principal / Subpasta" (ou apenas "Categoria Principal" se geral).

CATEGORIAS E SUBPASTAS:
- Jogos: PlayStation, Nintendo, Xbox, PC, Mods, Wikis & Guias, Emuladores & ROMs
- Dev & IA: Inteligência Artificial, Repositórios, Comunidade & Dúvidas, Documentação, Ferramentas
- Eletrônica: Microcontroladores & DIY, Circuitos & Esquemas, Componentes & Datasheets, Instalações & Energia
- Engenharia & Mecânica: Automotivo, Inspeção & Manutenção, Usinagem & Ferramentas, CAD & Modelagem 3D
- Música: Hinários & CCB, Instrumentos & Luthiaria, Partituras & Cifras, Teoria & Solfejo, Streaming
- Estudos: Concursos & Cursos, Livros & Artigos, Faculdades & EAD, Idiomas, Ciências Exatas, Ciências Humanas
- Tecnologia: Android, Windows & Sistemas, Hardware, Redes & Segurança
- Saúde & Bem-Estar: Nutrição & Suplementos, Treino & Fitness, Medicina & Cuidados
- Negócios & Finanças: Investimentos & Bancos, Empreendedorismo & Marcas, Vagas & Carreira
- Espiritualidade: Bíblia & Teologia, Astrologia & Numerologia, Filosofia & Misticismo
- Governo: Trânsito & Detran, Serviços Públicos
- Filmes & Séries: Animes, Streaming, Torrents & Downloads
- Arte & Design: Wallpapers & Ícones, Arquitetura & Construção, Modelagem 3D & Design, Quadrinhos & HQs
- Compras: Hardware & Informática, Cupons & Comparadores, Perfumaria, Marketplaces
- Produtividade: Nuvem & Arquivos
- Viagens & Turismo
- Redes Sociais
- Notícias
- Outros

REGRAS RÍGIDAS:
1. NUNCA gere nomes de pastas em letras minúsculas. Cada palavra deve começar OBRIGATORIAMENTE com letra Maiúscula (Title Case, ex: "Viagens & Turismo", "Dev & IA", "Jogos / PlayStation").
2. NUNCA use nomes redundantes (ex: use "Jogos" e NÃO "Jogos & Games"; use "Governo" e NÃO "Governo & Cidadania"; use "Viagens & Turismo" e NUNCA "turismo, viagens & eventos").
3. NUNCA crie subpastas com nome "Geral". Use a Categoria Principal diretamente.
4. NUNCA misture Jogos, Filmes e Músicas.
5. Responda ESTRITAMENTE em formato JSON com ortografia correta em Português do Brasil.

Favoritos:
${JSON.stringify(simplified)}

JSON formato esperado:
{
  "classifications": [
    { "id": "id", "suggestedFolder": "Categoria / Subpasta" }
  ]
}`;
}

/**
 * System prompt for the interactive Mini-Agent assistant.
 */
export const MINI_AGENT_SYSTEM_PROMPT = `Você é o Mini-Agente de IA do Favorite Manager (gerenciador de favoritos para Microsoft Edge, Google Chrome e Brave).
Sua missão é ajudar o usuário a organizar, planejar e estruturar seus favoritos web e extensões de maneira limpa, intuitiva e sem redundâncias.

DIRETRIZES FUNDAMENTAIS:
1. ORTOGRAFIA E CAPITALIZAÇÃO: Cada palavra de título de pasta DEVE ter letra Maiúscula no início (Title Case: ex: "Jogos", "Viagens & Turismo", "Dev & IA / Inteligência Artificial"). Jamais gere palavras em minúsculas como título de pasta.
2. SEM REDUNDÂNCIAS: Use nomes concisos e diretos (prefira "Jogos" em vez de "Jogos & Games", "Governo" em vez de "Governo & Cidadania", "Dev & IA" em vez de "Programação, Dev & IA", "Compras" em vez de "Lojas & Compras").
3. ESTRUTURA LIMPA: Sugira no máximo 2 níveis (Pasta Principal / Subpasta) para que a barra de favoritos fique elegante e rápida de navegar.
4. REPOSTAS PRÁTICAS: Quando o usuário pedir sugestão de pastas ou organização, forneça uma lista clara em markdown com emojis e justificativas breves.
5. EXTENSÕES DO NAVEGADOR: Quando perguntado sobre extensões, explique como gerenciar permissões, atalhos de teclado (como Ctrl+Shift+F) e como sincronizar em tempo real entre Edge, Chrome e Brave sem loops.`;

export const MINI_AGENT_QUICK_CHIPS = [
  '💡 Como organizar meus favoritos de Dev & IA?',
  '🎮 Sugestão de pastas para Jogos e Mods',
  '📚 Como separar matérias de faculdade e cursos?',
  '🛒 Dica para organizar compras e ofertas',
  '🚀 Quais as vantagens de sincronizar entre Edge e Chrome?',
];
