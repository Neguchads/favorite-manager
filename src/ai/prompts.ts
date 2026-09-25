import { AiBookmarkItem, MiniAgentBookmarkContext } from './types';

/**
 * Clean, non-redundant Master Categories.
 */
export const CLEAN_MASTER_CATEGORIES = [
  'Arte & Design',
  'Compras',
  'Comunicação & Redes Sociais',
  'Dev & IA',
  'Eletroeletrônica',
  'Eletrônica',
  'Engenharia & Mecânica',
  'Entretenimento',
  'Espiritualidade',
  'Estudos',
  'Filmes & Séries',
  'Finanças',
  'Governo',
  'Jogos',
  'Mecânica',
  'Música',
  'Negócios & Finanças',
  'Notícias',
  'Notícias & Informação',
  'Outros',
  'Produtividade',
  'Redes Sociais',
  'Saúde & Bem-Estar',
  'Serviços & Utilidades',
  'Tecnologia',
  'Trabalho & Carreira',
  'Viagens & Turismo',
] as const;

/**
 * Builds a compact, token-efficient prompt for Ollama LLM batch classification.
 * Powered by organizar-tudo principles: strict Title Case, zero "Geral", high precision subfolders.
 */
export function buildCategorizationPrompt(items: AiBookmarkItem[]): string {
  const simplified = items.map((i) => ({
    id: i.id,
    title: (i.title || '').substring(0, 90),
    url: (i.url || '').substring(0, 140),
  }));

  return `Você é um taxonomista de favoritos web operando com as diretrizes do sistema "organizar-tudo". Classifique cada item no formato "Categoria Principal / Subpasta" (ou apenas "Categoria Principal" se geral).

TAXONOMIA ELEVADA E SEMÂNTICA:
- Mecânica: Automotiva, Industrial & Usinagem, CAD & Modelagem 3D
- Eletroeletrônica: Eletrônica & Circuitos, Elétrica Predial & Residencial, Microcontroladores & DIY
- Tecnologia: Inteligência Artificial, Programação & Desenvolvimento, Software & Ferramentas, Android & Celulares, Computadores & Sistemas, Hardware & Armazenamento, Redes & Internet
- Estudos: Livros, Artigos & Pesquisa, Faculdade & Cursos, ENEM & Vestibulares, Concursos Públicos, Idiomas, Ciências & Humanidades
- Espiritualidade: Religião & Filosofia, Astrologia & Numerologia, Cabala & Hermetismo, Tarot & Esoterismo, Nomes & Simbolismo
- Jogos: PC & Plataformas, Consoles, Mods & Utilitários, Emuladores & ROMs, Wikis & Guias
- Filmes & Séries: Animes & Mangás, Filmes & Séries, Streaming & Mídia
- Música: Hinários & CCB, Partituras, Cifras & Teoria, Instrumentos & Áudio, Plataformas & Produção
- Trabalho & Carreira: Negócios & Empreendedorismo, Vagas & Profissões
- Finanças: Bancos, Investimentos & Crédito
- Compras: Hardware & Informática, Lojas & Ofertas, Cupons & Comparadores, Moda & Vestuário
- Saúde & Bem-Estar: Treino & Nutrição, Medicina & Cuidados
- Notícias & Informação: Notícias & Atualidades
- Arte & Design: Design & Ilustração, Wallpapers & Ícones, Quadrinhos & HQs
- Viagens & Turismo
- Comunicação & Redes Sociais: Redes Sociais & Mensagens
- Serviços & Utilidades: Ferramentas Online, Serviços Públicos & Documentos
- Outros

REGRAS DE OURO ("ORGANIZAR-TUDO"):
1. TITLE CASE OBRIGATÓRIO: Cada palavra deve começar com letra Maiúscula, preservando siglas técnicas (IA, CCB, ROMs, CAD, 3D, DIY, PC, EAD, CNPJ). Jamais gere pastas em minúsculas.
2. ZERO REDUNDÂNCIAS: Nunca use sinônimos repetidos (use "Jogos" e NÃO "Jogos & Games"; use "Compras" e NÃO "Lojas & Compras").
3. ZERO "GERAL": Nunca crie subpastas com nome "Geral" ou "(Geral)". Use a Categoria Principal diretamente.
4. ISOLAMENTO DE CONTEÚDO: Nunca misture Jogos, Filmes, Músicas e Documentos.
5. JSON ESTRITO: Responda ESTRITAMENTE em formato JSON válido com acentuação correta em Português do Brasil.

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
 * System prompt for the interactive Mini-Agent assistant (fallback).
 */
export const MINI_AGENT_SYSTEM_PROMPT = `Você é o Mini-Agente de IA do Favorite Manager (gerenciador de favoritos para Microsoft Edge, Google Chrome e Brave).
Sua missão é ajudar o usuário a organizar, planejar e estruturar seus favoritos web e extensões de maneira limpa, intuitiva e sem redundâncias.

DIRETRIZES FUNDAMENTAIS:
1. ORTOGRAFIA E CAPITALIZAÇÃO: Cada palavra de título de pasta DEVE ter letra Maiúscula no início (Title Case: ex: "Jogos", "Viagens & Turismo", "Dev & IA / Inteligência Artificial"). Jamais gere palavras em minúsculas como título de pasta.
2. SEM REDUNDÂNCIAS: Use nomes concisos e diretos (prefira "Jogos" em vez de "Jogos & Games", "Governo" em vez de "Governo & Cidadania", "Dev & IA" em vez de "Programação, Dev & IA", "Compras" em vez de "Lojas & Compras").
3. ESTRUTURA LIMPA: Sugira no máximo 2 níveis (Pasta Principal / Subpasta) para que a barra de favoritos fique elegante e rápida de navegar.
4. REPOSTAS PRÁTICAS: Quando o usuário pedir sugestão de pastas ou organização, forneça uma lista clara em markdown com emojis e justificativas breves.
5. EXTENSÕES DO NAVEGADOR: Quando perguntado sobre extensões, explique como gerenciar permissões, atalhos de teclado (como Ctrl+Shift+F) e como sincronizar em tempo real entre Edge, Chrome e Brave sem loops.`;

/**
 * Builds an enriched system prompt with direct live access to the user's bookmarks catalog.
 */
export function buildMiniAgentSystemPrompt(context: MiniAgentBookmarkContext): string {
  const categoryLines = context.topCategories
    .slice(0, 8)
    .map((c) => `  - ${c.category}: ${c.count} favoritos (${c.percentage}%)`)
    .join('\n');

  const domainLines = context.topDomains
    .slice(0, 8)
    .map((d) => `  - ${d.domain}: ${d.count} links`)
    .join('\n');

  const folderLines = context.topExistingFolders
    .slice(0, 6)
    .map((f) => `  - "${f.name}": ${f.count} favoritos`)
    .join('\n');

  return `Você é o Mini-Agente de IA do Favorite Manager (extensão para Microsoft Edge, Google Chrome e Brave).
VOCÊ ESTÁ EXECUTANDO DIRETAMENTE DENTRO DA EXTENSÃO DO USUÁRIO E JÁ POSSUI ACESSO TOTAL AOS FAVORITOS DELE NESTA SESSÃO.
A extensão já leu e catalogou todos os ${context.totalBookmarks} favoritos e ${context.totalFolders} pastas do usuário.

⚠️ REGRAS CRÍTICAS DE CONVERSAÇÃO E PRIVACIDADE:
1. NUNCA diga: "não tenho acesso aos seus favoritos", "não tenho acesso ao seu navegador", "por questões de segurança não consigo ler", ou similares. VOCÊ JÁ TEM ACESSO COMPLETO e direto aos dados fornecidos logo abaixo.
2. NUNCA peça ao usuário para exportar arquivos HTML, nem pedir para ele copiar e colar links aqui no chat.
3. Se o usuário perguntar "você consegue analisar meus favoritos agora?", "como estão meus favoritos?", "quantos favoritos eu tenho?", ou qualquer pergunta sobre a biblioteca dele:
   - Responda IMEDIATAMENTE confirmando com firmeza: "Sim! Já tenho acesso aos seus ${context.totalBookmarks} favoritos e ${context.totalFolders} pastas aqui na extensão."
   - Apresente o diagnóstico detalhado e objetivo dos dados reais abaixo (categorias principais, pastas sobrecarregadas, domínios mais acessados).
   - Proponha uma reorganização semântica elegante e sem redundâncias.
   - Destaque que ele pode clicar em "⚡ Aplicar Organização Agora" no rodapé para executar a mudança automaticamente.

📊 DADOS REAIS DA BIBLIOTECA DO USUÁRIO NESTA SESSÃO:
- Total de Favoritos: ${context.totalBookmarks}
- Total de Pastas: ${context.totalFolders}
- Favoritos com potencial de organização: ${context.unorganizedCount} itens
- Distribuição Semântica Detectada:
${categoryLines || '  (Nenhum favorito)'}
- Domínios mais frequentes:
${domainLines || '  (Nenhum)'}
- Pastas atuais com mais links:
${folderLines || '  (Nenhum)'}

🎯 DIRETRIZES DO SISTEMA "ORGANIZAR-TUDO":
1. REVERSIBILIDADE & SEGURANÇA: A extensão SEMPRE cria um snapshot de segurança antes de qualquer reorganização e permite restauração com 1 clique.
2. TITLE CASE OBRIGATÓRIO: Cada palavra de título de pasta DEVE ter letra Maiúscula no início (ex: "Jogos / Consoles", "Tecnologia / Inteligência Artificial", "Música / Partituras, Cifras & Teoria", "Viagens & Turismo"). Jamais gere palavras em minúsculas como título de pasta. Preservar siglas técnicas (IA, CCB, ROMs, CAD, 3D, DIY, PC, EAD, CNPJ).
3. SEM REDUNDÂNCIAS E SEM "GERAL": Nunca use sinônimos repetidos (use "Jogos" e NÃO "Jogos & Games"; use "Compras" e NÃO "Compras / Lojas"). Jamais crie subpastas com nome "Geral".
4. ESTRUTURA PROFISSIONAL: Organize em no máximo 2 a 3 níveis (Categoria Principal / Subpasta) para uma barra de favoritos limpa e de acesso imediato.
5. SEJA CONCISO: Responda em português do Brasil com clareza, formatação limpa em markdown e emojis úteis.`;
}

/**
 * Generates an instant, highly detailed bookmark analysis string based on real data.
 */
export function generateDetailedBookmarkAnalysis(context: MiniAgentBookmarkContext): string {
  const categoriesList = context.topCategories
    .slice(0, 7)
    .map((c) => `- **${c.category}**: ${c.count} favoritos (${c.percentage}%)`)
    .join('\n');

  const domainsList = context.topDomains
    .slice(0, 6)
    .map((d) => `- \`${d.domain}\`: ${d.count} links`)
    .join('\n');

  const foldersList = context.topExistingFolders
    .slice(0, 5)
    .map((f) => `- 📁 **${f.name}**: ${f.count} itens`)
    .join('\n');

  return `Sim! Já analisei toda a sua biblioteca de favoritos carregada na extensão com acesso direto e em tempo real. 🚀

📊 **Diagnóstico Completo da Sua Biblioteca**:
- **Total de Favoritos**: **${context.totalBookmarks}** links
- **Pastas Existentes**: **${context.totalFolders}** pastas
- **Itens para Otimizar**: **${context.unorganizedCount}** links em pastas genéricas ou na raiz

📁 **Principais Categorias Identificadas**:
${categoriesList || '- (Nenhum item)'}

🌐 **Domínios Mais Frequentes**:
${domainsList || '- (Nenhum)'}

📂 **Pastas Atuais com Maior Volume**:
${foldersList || '- (Nenhum)'}

💡 **Como podemos organizar**:
Podemos reestruturar esses links em categorias padronizadas em **Title Case** (ex: *Filmes & Séries*, *Jogos*, *Dev & IA*, *Estudos*, *Compras*) sem nenhuma duplicata ou subpasta genérica.

👉 Clique no botão **"⚡ Aplicar Organização Agora"** abaixo para que a extensão execute a organização completa nos seus favoritos!`;
}

export const MINI_AGENT_QUICK_CHIPS = [
  '📊 Analisar meus favoritos agora',
  '📁 Como estão minhas pastas atuais?',
  '⚡ Quais categorias você detectou?',
  '🎮 Sugestão de pastas para Jogos e Mods',
  '💻 Sugestão de pastas para Dev & IA',
  '🚀 Como sincronizar com Edge e Chrome?',
];

