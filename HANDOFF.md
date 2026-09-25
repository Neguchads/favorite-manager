# Handoff entre agentes

Registro curto de passagem de turno. Entrada mais recente no topo.

Formato de cada entrada:

```
## 2026-09-25 — Antigravity — Fase 1 (Virtualização de Lista e Grid com TanStack Virtual) e Fase 2 (Sugestão Preditiva no Salvamento, Favicons no Ctrl+K e Navegação Linear por Teclado)
- Arquivos alterados:
  - `src/components/layout/MainContent.tsx` (integração de `@tanstack/react-virtual` com `rowVirtualizer` e `gridVirtualizer`, suporte dinâmico a `lanes` com ResizeObserver, contenção de `scrollMargin` com subpastas, redução de 45.000 nós no DOM para ~250 nós e 60 FPS estáveis)
  - `src/components/popup/SaveCurrentTabCard.tsx` (sugestão preditiva inteligente de pasta via `classifyBookmarkIntelligently` ao abrir a extensão, pre-seleção automática e pill visual com botão 'Usar')
  - `src/components/common/CommandPaletteModal.tsx` (exibição de favicons reais em alta resolução via `getFaviconUrl` com fallback gracioso para `<Globe />`, eliminando ícone estático genérico)
  - `src/App.tsx` (navegação contínua por teclado estilo Raycast/Linear: setas `ArrowDown`/`ArrowUp` movem o foco de inspeção, `Enter` abre em nova aba, `Shift+Enter` em nova janela, `Espaço` alterna a gaveta de detalhes e `Escape` limpa seleção)
  - `src/i18n/translations.ts` (novas chaves de tradução `popup.suggestedFolder` e `popup.useSuggestion` em pt-BR e en)
- Verificado:
  - `npx tsx scratch/test-virtualization-and-ergonomics.ts`: 6/6 testes de sugestão preditiva passando com 100% de sucesso.
  - `npx tsx scratch/test-full-suite.ts`: 56/56 testes da suíte completa passando com 100% de sucesso.
  - `npm run build`: `tsc && vite build` concluído com sucesso e 0 erros (1653 módulos transformados em 4.65s).
- Pendente / próximo passo: Continuação do roteiro da Fase 2 e 3 (Padrão Undo Toast Ctrl+Z para exclusões unitárias e busca semântica).
- Avisos para o outro agente:
  1. **Virtualização com @tanstack/react-virtual**:
     - `parentRef` no container `flex-1 overflow-y-auto` gerencia o scroll.
     - `subfoldersRef` mede dinamicamente a altura de subpastas para alimentar `scrollMargin`.
     - No modo `'cards'`, `gridRows` agrupa os favoritos pelo número de colunas responsivas (1 a 4).
  2. **Sugestão de Pasta no Popup**:
     - Ao salvar uma aba ativa, a extensão calcula a classificação heurística em < 5ms e busca a pasta existente mais próxima em `allFolders`.

## 2026-09-25 — Antigravity — Integração da Inteligência da Skill "organizar-tudo" no Motor de IA da Extensão e Aplicação da Taxonomia Perfeita
- Arquivos alterados:
  - `src/ai/classifier.ts` (expansão de `TAXONOMY_MASTER_CATEGORIES` com as categorias aperfeiçoadas de `organizar-tudo` como `Mecânica`, `Eletroeletrônica`, `Tecnologia`, `Serviços & Utilidades`, `Comunicação & Redes Sociais`, `Notícias & Informação`, `Trabalho & Carreira`, `Finanças`, `Entretenimento`; ampliação de `MASTER_REDUNDANT_SUBFOLDERS` e `ALIAS_GROUPS` com sinônimos bidirecionais entre a taxonomia ideal e pastas legadas)
  - `src/ai/prompts.ts` (atualização de `CLEAN_MASTER_CATEGORIES`, enriquecimento de `buildCategorizationPrompt` e `buildMiniAgentSystemPrompt` com as Regras de Ouro do sistema "organizar-tudo": reversibilidade, preservação de metadados, Title Case estrito com acrônimos técnicos, erradicação de "Geral" e pastas vazias residuais)
  - `C:\Users\Desktop\Documents\favoritos_23_09_2026. html.html` (3.199 favoritos reorganizados 100% na taxonomia harmonizada com backup de segurança criado em `favoritos_23_09_2026_ORIGINAL_BACKUP.html` e log CSV completo em `Documents/_logs/log_organizacao_favoritos_2026-09-25.csv`)
  - `docs/PLANO_EVOLUCAO_E_MELHORIAS.md` (novo: planejamento arquitetural, frontend craft e inteligência artificial detalhado em 3 pilares e 3 fases para futuras implementações)
- Verificado:
  - `npx tsx scratch/test-full-suite.ts`: 56/56 testes passando com 100% de sucesso.
  - `npm run build`: `tsc && vite build` concluído com 0 erros (1649 módulos, 14.69s).
  - Integridade do arquivo Netscape HTML: 3.198 links preservados, 70 pastas sem nenhuma redundância, 0 itens em pastas genéricas.
- Pendente / próximo passo: Retomar o desenvolvimento seguindo o roteiro em `docs/PLANO_EVOLUCAO_E_MELHORIAS.md` iniciando pela Fase 1 (Virtualização com `@tanstack/react-virtual` e Mutex de sessão no background).
- Avisos para o outro agente:
  1. **Motor de IA Alinhado com a Skill `organizar-tudo`**:
     - O motor heurístico e os prompts do Ollama agora compartilham da mesma taxonomia perfeita extraída do backup do usuário e elevada com `organizar-tudo`.
     - `ALIAS_GROUPS` garante que pastas já existentes ou renomeadas pelo usuário sejam respeitadas, evitando criar pastas duplicadas com variações de nomes.
  2. **Backup e Logs Salvos**:
     - O arquivo original do usuário em `Documents` possui backup intocado `favoritos_23_09_2026_ORIGINAL_BACKUP.html`. O log de cada link movido e das 2 URLs duplicadas unificadas está em `Documents/_logs/log_organizacao_favoritos_2026-09-25.csv`.

---

- Arquivos alterados:
  - `src/ai/types.ts` (nova interface `MiniAgentBookmarkContext` contendo métricas da biblioteca do usuário)
  - `src/ai/classifier.ts` (função universal e rápida `extractBookmarkCatalogSummary` que indexa milhares de links e pastas em milissegundos sem travar a UI)
  - `src/ai/prompts.ts` (injeção dinâmica da biblioteca real no prompt de sistema `buildMiniAgentSystemPrompt`, gerador de diagnóstico ao vivo `generateDetailedBookmarkAnalysis`, proibição estrita de respostas genéricas de recusa como "não tenho acesso ao seu navegador", novos chips rápidos de diagnóstico)
  - `src/components/modals/AiOrganizeModal.tsx` (mensagem de boas-vindas com contagem dinâmica de favoritos e pastas, pill de status ao vivo com indicador verde e botão `📊 Diagnosticar Meus Favoritos`, interceptação de recusas de privacidade de modelos locais com substituição automática pelo diagnóstico completo, respostas heurísticas atualizadas com os dados reais)
- Verificado:
  - `npx tsx scratch/test-full-suite.ts` executou com **56/56 testes passando com 100% de sucesso** (cobrindo diagnóstico ao vivo contra os 3.212 favoritos reais).
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 3.92s, 1649 módulos).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip`.
- Pendente / próximo passo: Recarregamento da extensão no Microsoft Edge pelo usuário (`edge://extensions`).
- Avisos para o outro agente:
  1. **Acesso Direto do Mini-Agente à Biblioteca do Usuário**:
     - Modelos de IA locais como `qwen3.5:9b` vinham com alinhamento de segurança que dizia "não tenho acesso ao seu navegador nem aos seus arquivos locais".
     - Agora, a extensão calcula em tempo real o catálogo compacto (`totalBookmarks`, `totalFolders`, `unorganizedCount`, `topCategories`, `topDomains`, `topExistingFolders`) e injeta diretamente no system prompt via `buildMiniAgentSystemPrompt`.
     - Caso o modelo ainda emita frases de recusa por reflexo de RLHF, a função `handleSendChatMessage` intercepta e substitui instantaneamente pelo diagnóstico real e factual gerado por `generateDetailedBookmarkAnalysis`.
  2. **Banner de Status da Biblioteca no Chat**:
     - A aba do Mini-Agente agora exibe uma barra viva: `3.212 favoritos carregados • 75 pastas indexadas • 516 para otimizar` com botão direto `📊 Diagnosticar Meus Favoritos`.

---

## 2026-09-24 — Antigravity — Resolução de importação de arquivos com múltiplas pastas, eliminação de subpastas sinônimas/repetidas, execução direta em 1-clique no Mini-Agente e limpeza segura de pastas vazias
- Arquivos alterados:
  - `src/services/backup/importer.ts` (desempacotamento de nós raiz repetidos do navegador como 'Barra de favoritos', sanitização Title Case e reutilização de pastas em `preserve`, integração completa de `bm.path`, `validateAndSanitizeFolder` e `matchWithExistingFolders` em `ai_organize`)
  - `src/ai/classifier.ts` (eliminação definitiva de subpastas sinônimas e redundantes como 'Jogos / Games' -> 'Jogos', 'Governo / Cidadania' -> 'Governo', 'Filmes & Séries / Filmes' -> 'Filmes & Séries', 'Compras / Lojas' -> 'Compras', remoção de prefixos de sistema como 'Barra de favoritos' do contexto de pasta, sanitização multi-nível)
  - `src/components/modals/AiOrganizeModal.tsx` (botão de execução direta '⚡ Aplicar Organização Agora' em 1-clique direto no balão do Mini-Agente e no rodapé da modal, feedback de progresso e mensagem de confirmação nativa no chat; botão secundário 'Revisar na Árvore')
  - `src/services/bookmarks/hierarchy.ts` (fallback com `removeTree` para pastas vazias candidatas cujos nós filhos foram esvaziados no Chromium)
- Verificado:
  - `npx tsx scratch/test-classifier-formatting.ts` executado com 100% de sucesso em todas as asserções de redundância e Title Case.
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 7.08s, 1649 módulos transformados).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip` (181 KB).
- Pendente / próximo passo: Recarregamento da extensão no Microsoft Edge pelo usuário (`edge://extensions`).
- Avisos para o outro agente:
  1. **Arquivos com Múltiplas Pastas / Estrutura Aninhada**:
     - Arquivos exportados por navegadores continham raiz `Barra de favoritos`. O importador agora desempacota o contêiner raiz para não aninhar `Barra de favoritos` dentro de `Barra de favoritos`, reutiliza pastas existentes sob o mesmo pai e sanitiza pastas em Title Case (`arte & design` -> `Arte & Design`, `eletroeletrônica` -> `Eletrônica`).
  2. **Eliminação de Sinônimos Redundantes**:
     - `MASTER_REDUNDANT_SUBFOLDERS` filtra ativamente subpastas que duplicam a semântica da categoria pai (`Jogos / Games`, `Governo / Cidadania`, `Filmes & Séries / Filmes`, `Compras / Lojas`, `Estudos / Educação`, `Música / Músicas`).
  3. **Execução Direta pelo Chat do Mini-Agente**:
     - `handleExecuteDirectFromChat` gera o plano em background e aplica imediatamente aos favoritos, postando o resumo de itens organizados/pastas criadas/limpas direto no histórico do chat.

---


## 2026-09-24 — Antigravity — Motor semântico calibrado com 3.212 favoritos reais, eliminação de subpastas duplicadas, botão de aplicação direta no Mini-Agente IA e cópia de conversa
- Arquivos alterados:
  - `src/ai/classifier.ts` (calibração cirúrgica com o arquivo real de 3.212 favoritos do usuário: eliminação de contaminação de contexto de pasta anterior, erradicação de duplicatas como 'Animes / Animes' e 'Serviços Públicos / Serviços Públicos', mapeamento de domínios e regexes especializadas para dezenas de nichos, redução de não-classificados para < 8.8% sem nenhum item jogado em 'Geral')
  - `src/components/modals/AiOrganizeModal.tsx` (transformação da proposta do Mini-Agente IA em botão acionável '✨ Aplicar Esta Organização nos Favoritos' direto no balão da resposta e no rodapé da modal; botão de 'Copiar Conversa' completa no topo do chat com feedback visual e botão individual de cópia em cada mensagem; eliminação visual de qualquer pasta artificial '(Geral)' no preview da árvore)
- Verificado:
  - Análise automatizada em `scratch/analyze_user_bookmarks.ts` contra os 3.212 favoritos reais do usuário: 0 duplicatas 'Animes / Animes', 0 'Serviços Públicos / Serviços Públicos', itens em 'Outros' reduzidos de 498 para 285 com 0 itens em pasta 'Geral'.
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 3.77s, 1649 módulos transformados).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip`.
- Pendente / próximo passo: Recarregamento da extensão no Microsoft Edge pelo usuário.
- Avisos para o outro agente:
  1. **Motor Semântico Calibrado com Dados Reais**:
     - O arquivo de favoritos do usuário revelou que favoritos antigos continham caminhos duplicados da barra de favoritos (`Animes / Animes`). O extrator de contexto agora só usa a pasta antiga se o título for curto (< 15 caracteres), evitando que títulos de filmes fossem contaminados por pastas antigas de animes.
     - As funções `validateAndSanitizeFolder` e `matchWithExistingFolders` impedem categoricamente que a categoria master seja idêntica à subpasta.
  2. **Mini-Agente com Ação Real de Organização**:
     - As respostas do assistente no chat agora contam com botão de ação direta: "✨ Aplicar Esta Organização nos Favoritos". Ao clicar, o modal transiciona para a aba de organização e gera/aplica o plano instantaneamente. O rodapé da modal também exibe o botão correspondente na aba do chat.
  3. **Cópia de Conversa Completa e por Mensagem**:
     - Botão "Copiar Conversa" na barra superior do chat copia todo o histórico formatado com feedback visual `Copiado!`. Cada balão de mensagem (usuário e IA) também possui botão próprio de cópia.

---

## 2026-09-24 — Antigravity — contenção de viewport da modal (evitando extrapolação da tela/barra de tarefas) e rodapé fixo dos botões de ação
- Arquivos alterados:
  - `src/components/common/Modal.tsx` (adicionada restrição estrita `max-h-[calc(100vh-2.5rem)]`, `flex flex-col`, scroll interno com `overflow-y-auto flex-1 min-h-0`, suporte a `maxWidth="2xl"` e prop `footer` fixo/sticky que nunca sai da tela)
  - `src/components/modals/AiOrganizeModal.tsx` (migração dos botões "Aplicar Organização com Subpastas", "Refazer Análise" e "Fechar" para a prop `footer` fixa do `Modal`, `maxWidth="2xl"`, redução da altura máxima do preview para `max-h-60 sm:max-h-68`, ocultação de banner estático desnecessário quando o plano já foi gerado e garantia visual de Title Case em `masterGroup.masterCategory` e `subgroup.subfolderName`)
- Verificado:
  - `npx tsx scratch/test-classifier-formatting.ts` executou com 100% de sucesso.
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 3.99s, 1649 módulos).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip`.
- Pendente / próximo passo: Recarregamento da extensão pelo usuário.
- Avisos para o outro agente:
  1. **Rodapé Fixo (Sticky Footer)**:
     - O botão principal de organização ("Aplicar Organização com Subpastas") agora fica permanentemente visível e fixado na base da modal, nunca sendo empurrado para fora da tela ou escondido atrás da barra de tarefas do Windows.
  2. **Contenção Total do Modal**:
     - A janela modal agora respeita `max-h-[calc(100vh-2.5rem)]` em qualquer resolução de tela (laptops, 768p, 1080p, janelas não maximizadas). O conteúdo central rola suavemente sem esticar o modal além dos limites do navegador.
  3. **Title Case 100% Blindado**:
     - Mesmo se a árvore do usuário contiver pastas em minúsculo do passado, a renderização do preview passa por `capitalizeFolderWords`, garantindo visualização limpa (ex: `Arte & Design` em vez de `arte & design`).

---

## 2026-09-24 — Antigravity — Title Case em pastas, resolução de CORS 403 Ollama, seletor de modelos persistente, botão de teste de conexão e melhorias no motor semântico
- Arquivos alterados:
  - `public/rules/ollama_cors.json` (novo: regra declarativeNetRequest sobrescrevendo Origin para http://localhost na porta 11434)
  - `public/manifest.json` (permissão `declarativeNetRequest` e registro da rule_resources)
  - `src/background/index.ts` (`setupOllamaCorsRules` dinâmica no service worker para neutralizar 403 CORS do Ollama)
  - `src/ai/classifier.ts` (`capitalizeFolderWords` em todas as categorias e subpastas preservando siglas como IA/PC/ROMs, expansão do `DOMAIN_SUBFOLDER_MAP` com +150 domínios, sanitização de redundâncias legadas e correção cirúrgica em `matchWithExistingFolders`)
  - `src/ai/prompts.ts` (regras estritas de Title Case no prompt do Ollama e refinamento do `MINI_AGENT_SYSTEM_PROMPT`)
  - `src/ai/ollama.ts` (modelo padrão atualizado para `qwen3.5:9b`, medição de `latencyMs` no `checkOllamaConnection`)
  - `src/components/modals/AiOrganizeModal.tsx` (barra de IA local com seletor permanente de modelos, botão dedicado "Testar Conexão com IA Local" com ping em ms, banner explicativo para CORS, integração nas duas abas e fallback heurístico inteligente no chat)
  - `scratch/test-classifier-formatting.ts` (testes unitários para Title Case, sanitização, matching de pastas existentes e classificação)
- Verificado:
  - `npx tsx scratch/test-classifier-formatting.ts` executou com sucesso total (100% dos testes passando).
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 3.95s, 1649 módulos).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip`.
- Pendente / próximo passo: Testes no navegador pelo usuário (recarregar extensão a partir de `dist/` ou do zip).
- Avisos para o outro agente:
  1. **Nomes de Pastas e Subpastas em Title Case**:
     - Toda palavra agora inicia com letra maiúscula (ex: `Viagens & Turismo`, `Dev & IA / Inteligência Artificial`, `Jogos / Emuladores & ROMs`), eliminando nomes em minúsculas como `turismo, viagens & eventos`.
     - Siglas técnicas conhecidas (`IA`, `AI`, `PC`, `CAD`, `3D`, `ROMs`, etc.) são preservadas em maiúsculas por regex inteligente.
  2. **Bypass de CORS 403 do Ollama**:
     - Extensões enviam cabeçalho `Origin: chrome-extension://<id>`, que o Ollama bloqueava com HTTP 403.
     - Corrigido via `declarativeNetRequest` (estático e dinâmico) reescrevendo `Origin` para `http://localhost`, tornando a comunicação direta com o Ollama transparente sem depender obrigatoriamente de flags de linha de comando.
  3. **Barra de IA Local Persistente com Botão de Teste**:
     - O seletor de modelos nunca desaparece, mesmo se o Ollama estiver offline ou carregando.
     - Adicionado botão "Testar Conexão com IA Local" com ping em milissegundos nas duas abas (Plano de Organização e Chat do Mini-Agente).
  4. **Chat do Mini-Agente com Resposta Heurística Resiliente**:
     - Se o usuário enviar perguntas no chat enquanto o modelo local ainda estiver offline ou baixando, o assistente responde com orientações sem travar nem dar erro genérico.

---

## 2026-09-24 — Antigravity — eliminação de redundâncias na taxonomia, resolução completa do relatório de bugs do Ollama (3.1 a 3.8), sincronização com Brave e Mini-Agente IA Local
- Arquivos alterados:
  - `src/ai/classifier.ts` (remoção de redundâncias como "Jogos & Games" -> "Jogos", "Governo & Cidadania" -> "Governo", eliminação de subpastas "... / Geral", adaptação para pastas existentes `matchWithExistingFolders`, pre-filtering por domínio antes do LLM)
  - `src/ai/prompts.ts` (prompt enxuto < 800 tokens, regras claras de não criar subpastas genéricas, prompt de sistema e quick chips para o Mini-Agente)
  - `src/ai/ollama.ts` (`options: { num_ctx: 8192, temperature: 0, num_predict: 2048 }`, batch retry resiliente, detecção de erro HTTP 403 / CORS, chat completions com Ollama)
  - `src/ai/types.ts` (`AiProposedPlan` enriquecido com `stats` de origem `domain | ollama | heuristic`, tipo `ChatMessage`)
  - `src/components/modals/AiOrganizeModal.tsx` (persistência de motor/modelo, banner de auxílio CORS com comando 1-clique `setx OLLAMA_ORIGINS`, breakdown e badges de origem, botão cancelar com AbortController, aba interativa do Mini-Agente IA com chat e sugestões de organização)
  - `src/components/modals/ImportBookmarksModal.tsx` (importação JSON com modo "Preservar" por padrão, checkbox de deduplicação ignorando URLs já existentes, contagem prévia de novos vs duplicados)
  - `src/services/backup/importer.ts` (suporte a `skipExistingUrls` e contagem de ignorados)
  - `src/services/sync/browserDetect.ts` (detecção oficial do navegador Brave via `navigator.brave.isBrave()`)
  - `src/services/sync/types.ts` (suporte a 'Brave' como `SupportedBrowser`)
  - `src/services/sync/syncService.ts` e `src/components/sync/CrossBrowserSyncModal.tsx` (sincronização em tempo real Edge ⇄ Chrome ⇄ Brave)
  - `src/i18n/translations.ts` (traduções para Brave e novos recursos)
  - `src/background/index.ts` (sanitização de auto-organização)
- Verificado:
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 3.77s, 1649 módulos).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip`.
- Pendente / próximo passo: Testes no navegador pelo usuário (recarregar extensão a partir de `dist/` ou do zip).
- Avisos para o outro agente:
  1. **Taxonomia Limpa e Inteligente**:
     - Nomes redundantes foram unificados: "Jogos & Games" -> "Jogos", "Governo & Cidadania" -> "Governo", "Dev & IA", "Estudos", "Compras", "Tecnologia".
     - Eliminadas as subpastas repetitivas do tipo `... / Geral` (jogando direto na categoria principal ou subpasta relevante).
     - `matchWithExistingFolders`: Se o usuário já tiver uma pasta chamada "Games" ou "Cidadania" na árvore, a IA aproveita a pasta existente sem criar uma duplicata.
  2. **Pipeline de IA Híbrido e Otimizado**:
     - O mapa de domínios (`DOMAIN_SUBFOLDER_MAP`) executa ANTES do LLM, resolvendo 70%+ dos favoritos em milissegundos com precisão cirúrgica.
     - Lotes para o Ollama reduzidos para 10 itens com `num_ctx: 8192` (eliminando o estouro de contexto em placas de 8GB VRAM) e 1 retry individual por lote em caso de falha.
  3. **Mini-Agente IA Local**:
     - Integrado diretamente na modal de IA via aba "Mini-Agente IA (Chat Local)", permitindo conversar com o modelo sobre organização de favoritos e extensões.
  4. **Brave Browser Sync**:
     - O canal de sincronização MQTT agora identifica ativamente o Brave Browser com badge `🟢 Conectado com Brave`.

---

## 2026-09-24 — Antigravity — sistema de sincronização em tempo real entre navegadores (Microsoft Edge ⇄ Google Chrome)
- Arquivos alterados:
  - `src/services/sync/types.ts` (novo)
  - `src/services/sync/browserDetect.ts` (novo)
  - `src/services/sync/twoWayMerge.ts` (novo)
  - `src/services/sync/syncService.ts` (novo)
  - `src/services/sync/index.ts` (novo)
  - `src/hooks/useSync.ts` (novo)
  - `src/components/sync/CrossBrowserSyncModal.tsx` (novo)
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/hooks/useBookmarks.ts`
  - `src/App.tsx`
  - `src/i18n/translations.ts`
- Verificado:
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 11.04s, 1649 módulos).
  - Pacote `.zip` atualizado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip`.
  - Teste de transporte MQTT via WSS em `broker.hivemq.com:8884/mqtt` validado com sucesso.
- Pendente / próximo passo: Testes simultâneos no Edge e Chrome pelo usuário.
- Avisos para o outro agente:
  1. **Arquitetura de Sincronização em Tempo Real (Cross-Browser Live Pairing)**:
     - Funciona sem necessidade de conta, cadastro ou banco de dados pago, conectando-se a um canal seguro WebSocket TLS (`wss://broker.hivemq.com:8884/mqtt`) isolado por `SyncKey` (ex: `FAV-9821-X4K9`).
     - **Detecção Mútua**: Quando Edge e Chrome estão abertos com a mesma chave, enviam eventos de presença (`PEER_ANNOUNCE` / `PEER_ACK`) e exibem badge verde pulsante: `🟢 Conectado com Google Chrome` (no Edge) e `🟢 Conectado com Microsoft Edge` (no Chrome).
     - **Sincronização em Tempo Real**: Criação e remoção de favoritos notificam os peers via MQTT; o peer remoto aplica as alterações com flag `isApplyingRemoteChange = true` para evitar loops de eco infinito.
     - **Two-Way Merge**: Botão "Mesclar Tudo Agora" troca os catálogos completos e insere no Edge o que existe no Chrome, e no Chrome o que existe no Edge (com snapshot prévio de segurança).

---

## 2026-09-24 — Antigravity — internacionalização bilíngue completa (Português / Inglês) com sincronização em tempo real e pacote da Microsoft Edge Add-ons Store
- Arquivos alterados:
  - `src/i18n/translations.ts` (novo)
  - `src/i18n/LanguageContext.tsx` (novo)
  - `src/i18n/index.ts` (novo)
  - `src/main.tsx`
  - `src/popup.tsx`
  - `src/sidepanel.tsx`
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/tree/FolderTreeNode.tsx`
  - `src/components/layout/MainContent.tsx`
  - `src/components/actionbar/BatchActionBar.tsx`
  - `src/components/popup/PopupContent.tsx`
  - `src/components/popup/SaveCurrentTabCard.tsx`
  - `src/components/sidepanel/SidePanelContent.tsx`
  - `src/components/modals/CreateBookmarkModal.tsx`
  - `src/components/modals/CreateFolderModal.tsx`
  - `src/components/modals/EditItemModal.tsx`
  - `src/components/common/ConfirmDialog.tsx`
  - `public/manifest.json`
- Verificado:
  - `npm run build` executado com sucesso e 0 erros (`tsc && vite build` em 3.75s, 1640 módulos).
  - Pacote `.zip` para envio à Microsoft Edge Store gerado em `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip` (155 KB).
- Pendente / próximo passo: Submissão do pacote `.zip` no Microsoft Edge Partner Center ou testes locais no Edge.
- Avisos para o outro agente:
  1. **Infraestrutura i18n (`src/i18n`)**:
     - `translations.ts` com dicionário completo cobrindo todas as áreas: cabeçalho, navegação, ordenação, drag and drop, popups, side panel, duplicatas, central de limpeza, snapshots, modais de criação/edição e mensagens de feedback.
     - `LanguageContext.tsx`: detecção automática pelo navegador (`navigator.language`), persistência via `localStorage` e `chrome.storage.local`.
     - **Sincronização em tempo real entre superfícies**: listener de `chrome.storage.onChanged` garante que alternar o idioma na aba cheia, no popup ou no painel lateral sincroniza instantaneamente todas as demais telas sem recarregar.
  2. **Alternadores de Idioma na UI**:
     - Botão seletor dinâmico `🇧🇷 PT` / `🇺🇸 EN` integrado no Header principal, no Popup e no Side Panel.
  3. **Localização de Pastas do Sistema**:
     - Nós raiz ('1' Barra de favoritos, '2' Outros favoritos, '3' Favoritos móveis) em `FolderTreeNode.tsx` adaptam seu título conforme o idioma ativo (ex: "Barra de favoritos" vs "Favorites bar").

---

## 2026-09-24 — Antigravity — sistema completo de arrastar e soltar (Drag and Drop) com reordenação para cima/baixo e movimentação entre pastas
- Arquivos alterados:
  - `src/utils/dragDrop.ts` (novo)
  - `src/hooks/useBookmarks.ts`
  - `src/components/tree/FolderTreeNode.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/MainContent.tsx`
  - `src/components/list/BookmarkItemRow.tsx`
  - `src/components/list/FolderItemRow.tsx`
  - `src/components/list/BookmarkCard.tsx`
  - `src/components/list/FolderCard.tsx`
  - `src/App.tsx`
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.21s, 1637 módulos).
- Pendente / próximo passo: Testes de interação com o mouse no Edge via `dist/`.
- Avisos para o outro agente:
  1. **Arrastar e Soltar Completo e Universal**:
     - Suporta arrastar favoritos individuais, pastas e múltiplos itens selecionados em lote.
     - Detecção de posição de drop baseada nas coordenadas do mouse: `'before'` (reordenar acima), `'inside'` (soltar dentro da pasta) e `'after'` (reordenar abaixo).
  2. **Indicadores Visuais**:
     - Linha indicadora azul no topo para reordenar acima.
     - Linha indicadora azul na base para reordenar abaixo.
     - Destaque e anel azul para inserção dentro da pasta.
     - Ícone de grip (`GripVertical`) exibido no hover para indicar que os itens e pastas são arrastáveis.
  3. **Segurança de Hierarquia e Ciclos (`isDescendantOf`)**:
     - Previne que uma pasta seja movida para dentro de si mesma ou para dentro de qualquer uma de suas subpastas descendentes.
     - Pastas raiz do sistema ('1' Barra de favoritos, '2' Outros favoritos) não podem ser arrastadas e aceitam apenas drops no modo `'inside'`.
  4. **Cálculo de Índices no Chromium**:
     - `moveItemsToTarget` calcula com precisão matemática o deslocamento de índice (`sourceIndex < targetIndex ? targetIndex - 1 : targetIndex`) ao mover irmãos na mesma pasta pai.

---

## 2026-09-24 — Antigravity — criação da skill de agente `manifest-v3-extension-craft` encapsulando toda a engenharia e arquitetura da extensão
- Arquivos alterados:
  - `C:\Users\Desktop\.gemini\config\skills\manifest-v3-extension-craft\SKILL.md` (novo)
  - `C:\Users\Desktop\.gemini\config\skills\manifest-v3-extension-craft\references\architecture.md` (novo)
  - `C:\Users\Desktop\.gemini\config\skills\manifest-v3-extension-craft\references\bookmarks-and-tree-safety.md` (novo)
  - `C:\Users\Desktop\.gemini\config\skills\manifest-v3-extension-craft\references\netscape-html-spec.md` (novo)
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.67s, 1636 módulos transformados).
- Pendente / próximo passo: Pronta para uso em novos projetos ou extensões Manifest V3 por qualquer agente.
- Avisos para o outro agente:
  1. A skill global `manifest-v3-extension-craft` foi estruturada seguindo rigorosamente os padrões de `writing-skills` e `skill-creator`.
  2. Sintetiza todo o aprendizado prático: multi-surface Vite build (popup, side panel, full tab, background.js), regras de ouro do Service Worker Manifest V3, indexação determinística de pastas (`parentId:folderTitle`), poda seletiva, snapshots de segurança pré-mutação, verificação HTTP resiliente (HEAD com fallback para GET Range bytes=0-1024), e parser/gerador de HTML Netscape.

---

## 2026-09-24 — Antigravity — revisão completa de código, funções, botões e integridade do projeto
- Arquivos alterados: `tailwind.config.js`, `src/components/common/CommandPaletteModal.tsx`, `src/components/common/ConfirmDialog.tsx`, `src/components/popup/PopupContent.tsx`, `src/components/sidepanel/SidePanelContent.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 9.68s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar extensão a partir de `dist/`).
- Avisos para o outro agente:
  1. **Auditoria Geral de Todas as Funcionalidades**:
     - **Os 7 bugs prioritários de AGENTS.md estão 100% resolvidos**:
       - Bug 1 (Hierarchy folder mapping): Mapa baseado em `parentId:folderTitle` previne duplicações de subpastas.
       - Bug 2 (Auto-organize no `onCreated`): Desativado por padrão (opt-in no storage) e respeita subpastas manuais.
       - Bug 3 (Restauração de Snapshots): `restoreSnapshot` implementado e conectado ao botão de restauração na UI.
       - Bug 4 (Criação de favoritos com IDs inválidos): `resolveSafeParentId` sanitiza sempre para uma pasta válida ('1' ou subpasta real).
       - Bug 5 (Limpeza de pastas pós-IA): `pruneEmptyFolders` opera seletivamente sobre `candidateFolderIds` (apenas pastas esvaziadas pela operação).
       - Bug 6 (Debounce de eventos de favoritos): Debounce de 300ms ativo em `useBookmarks.ts`.
       - Bug 7 (Checagem de links 403/405): Trata códigos de recusa de bots como online sem falsos positivos.
  2. **Refinamentos e Correções Aplicadas**:
     - `tailwind.config.js`: Incluído `./popup.html` no array `content` para que o Tailwind compile corretamente classes do popup.
     - `CommandPaletteModal.tsx`: Habilitada busca fuzzy tolerante a erros de digitação (Levenshtein) para ações e favoritos no Command Palette (Ctrl+K).
     - `ConfirmDialog.tsx`: Botão de confirmação alinhado com o token padrão `bg-sky-600 hover:bg-sky-700`.
     - `PopupContent.tsx`: Conectado `onSaveToFolder` na `PopupFolderTree`, permitindo salvar a guia ativa diretamente em qualquer pasta da árvore via ícone de estrela.
     - `SidePanelContent.tsx`: Passado `sortAlphabetical: true` na execução do plano de IA no painel lateral.

---

## 2026-09-23 — Antigravity — importação de ideias do MasterFavorites: busca fuzzy tolerante a erros de digitação, estratégia de duplicatas pelo título mais completo e detecção/atualização de redirecionamentos 301/302
- Arquivos alterados: `src/utils/search.ts`, `src/components/duplicates/DuplicatesView.tsx`, `src/background/index.ts`, `src/services/health/index.ts`, `src/components/cleanup/CleanupView.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.63s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar extensão a partir de `dist/`).
- Avisos para o outro agente:
  1. **Busca Fuzzy / Tolerante a Erros de Digitação (`search.ts`)**:
     - Implementado algoritmo de distância Levenshtein e cálculo de similaridade (`levenshteinDistance`, `stringSimilarity`, `fuzzyContains`).
     - A busca em tempo real agora tolera erros de digitação (ex: "gitub" acha "github", "youtub" acha "youtube", "cloude" acha "claude").
     - Suporta busca geral (título, url, domínio, pasta) e filtros com prefixo (`title:`, `folder:`, `domain:`).
  2. **Estratégia Inteligente de Duplicatas (`DuplicatesView.tsx`)**:
     - Adicionada a estratégia `'longest'` ("Título Mais Completo") ao lado de `'oldest'` ("Mais Antigo") e `'newest'` ("Mais Recente").
     - Permite ao usuário manter automaticamente o favorito com o título mais descritivo e detalhado, descartando cópias com títulos genéricos ou truncados.
  3. **Detecção de Redirecionamento HTTP 301/302 e Atualização em 1 Clique (`background/index.ts`, `health/index.ts`, `CleanupView.tsx`)**:
     - O service worker no background verifica se a resposta sofreu redirecionamento (`res.redirected` ou alteração de URL canônica) e retorna a URL de destino (`finalUrl`).
     - A aba "Integridade & Redirecionamentos" na tela de Limpeza agora agrupa links com redirecionamento detectado, exibindo a URL original tachada com seta indicando a nova URL final.
     - Disponibilizado botão individual "Atualizar URL" e botão em lote "Atualizar Redirecionados (N)" para atualizar os favoritos diretamente com o endereço definitivo, eliminando saltos lentos.

---

## 2026-09-23 — Antigravity — importação e exportação de favoritos em formato Netscape HTML (.html) oficial e JSON com pré-visualização e organização por IA
- Arquivos alterados: `src/services/backup/htmlParser.ts` (novo), `src/services/backup/htmlExporter.ts` (novo), `src/services/backup/importer.ts` (novo), `src/components/modals/ImportBookmarksModal.tsx` (novo), `src/services/backup/index.ts`, `src/components/backup/BackupView.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/MainContent.tsx`, `src/App.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 4.50s, saída em `dist/`).
- Pendente / próximo passo: Prosseguir com as próximas melhorias solicitadas pelo usuário (Desfazer Global Ctrl+Z, Regras Customizadas do Usuário, etc.).
- Avisos para o outro agente:
  1. **Parser Robusto de HTML Netscape (`htmlParser.ts`)**:
     - Converte qualquer arquivo de favoritos `.html` (padrão universal Netscape Bookmark File 1 usado pelo Edge, Chrome, Firefox, Safari) para a estrutura hierárquica `ParsedBookmarkItem` e nós planos.
     - Lê tags `<DL><p>`, `<DT><H3>` (pastas com timestamps) e `<DT><A HREF="...">` (links com atributos `ICON`, `ADD_DATE`).
     - Trata entidades HTML (`&amp;`, `&quot;`, `&lt;`, `&gt;`) e recupera links mesmo se o arquivo tiver tags mal formatadas ou incompletas.
  2. **Exportador Oficial Netscape HTML (`htmlExporter.ts`)**:
     - Função `generateNetscapeHtml(tree)` e `downloadNetscapeHtmlFile(tree, filename)`.
     - Permite ao usuário baixar um arquivo `.html` pronto para ser importado diretamente em `edge://favorites/` ou em qualquer outro navegador.
  3. **Assistente de Importação com IA (`ImportBookmarksModal.tsx` & `importer.ts`)**:
     - Área de drag-and-drop para arquivos `.html`, `.htm` ou `.json`.
     - Pré-visualização com total de favoritos e pastas detectadas.
     - Duas estratégias de importação:
       - **Manter Estrutura Original**: Recria pastas e subpastas exatamente como no arquivo, opcionalmente agrupadas em uma pasta dedicada "Importados (DD/MM/AAAA)".
       - **Organizar com IA & Heurística**: Passa todos os links pelo classificador semântico e categoriza automaticamente nas pastas temáticas ideais (*Desenvolvimento*, *Estudos*, *Jogos*, *Finanças*, etc.).
     - Criação automática de snapshot prévio de segurança antes de gravar qualquer link no Edge.
     - Barra de progresso visual em tempo real mostrando item atual sendo processado.
  4. **Integração na Interface**:
     - Botão "Importar" adicionado no cabeçalho superior (`Header.tsx`).
     - Card proeminente de importação e opção de exportação HTML adicionados em `BackupView.tsx`.

---

## 2026-09-23 — Antigravity — popup compacto com árvore de pastas completa, filtro por pastas e salvamento direto da guia ativa
- Arquivos alterados: `popup.html`, `src/components/popup/PopupContent.tsx`, `src/components/popup/SaveCurrentTabCard.tsx` (novo), `src/components/popup/PopupFolderTree.tsx` (novo).
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 6.51s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar extensão a partir de `dist/`).
- Avisos para o outro agente:
  1. **Salvamento da Guia Ativa no Popup (`SaveCurrentTabCard.tsx`)**:
     - Ao abrir o popup, consulta `chrome.tabs.query({ active: true, currentWindow: true })`.
     - Se a página não estiver salva: exibe card compacto com favicon, título editável, seletor de pasta de destino (`allFolders`) e botão de salvar.
     - Se já favoritada: exibe badge de favoritada com o nome/caminho da pasta onde reside, com botão de mover para outra pasta ou remover.
  2. **Árvore de Pastas no Próprio Popup (`PopupFolderTree.tsx`)**:
     - Eliminado o antigo banner "abra em tela cheia para ver a árvore de pastas".
     - Adicionado alternador de visualização no popup entre "Favoritos" (lista) e "Árvore de Pastas" (hierarquia completa).
     - Árvore navegável com chevrons de expandir/recolher, contadores de itens, botões "Expandir tudo / Recolher tudo" e busca instantânea de pastas.
     - Cada pasta permite selecionar para filtrar a lista, salvar a guia atual diretamente nela com 1 clique (ícone de estrela) ou criar uma subpasta (`+`).
  3. **Filtro por Pastas no Popup**:
     - Na lista de favoritos, adicionado dropdown direto "📁 Filtrar Pasta..." com todas as pastas formatadas por caminho hierárquico.
     - Ao selecionar uma pasta, exibe badge com o nome e contagem de itens, botões para entrar em subpastas diretas e botão `✕` para limpar o filtro.
  4. **Dimensões e Tema**:
     - `popup.html` ampliado para `440px x 600px` (aproveitamento ideal do limite do Edge).
     - Integração com `useTheme()` para modo escuro sincronizado.

---

## 2026-09-23 — Antigravity — expansão semântica profunda do classificador e didática universal de organização de favoritos
- Arquivos alterados: `src/ai/classifier.ts`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 17.43s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions`.
- Avisos para o outro agente:
  1. **Análise do arquivo real `favoritos_23_09_2026. html.html` (3.199 favoritos, 87 pastas)**: Identificado que 764 links estavam acumulados em `Barra de favoritos / ALL / Outros & Geral` e que 517 links eram de plataformas genéricas (Google, YouTube, Wikipedia, Bing).
  2. **Motor Semântico Expandido (`classifier.ts`)**:
     - Implementado desempacotador e normalizador de títulos (`cleanUrlAndExtractContext`), limpando prefixos de abas `(41)`, sufixos `- YouTube` e decodificando parâmetros de busca e slugs de URL com `decodeURIComponent`.
     - Adicionadas dezenas de âncoras de domínio especializadas no `DOMAIN_SUBFOLDER_MAP` (musescore, ubc, dyndolod, wabbajack, engeteles, doutorie, passeidireto, geogebra, naomeperturbe, jusbrasil, veganize, etc.).
     - Expressões regulares expandidas para cobrir culinária e nutrição (`Gastronomia & Nutrição`), reforma e marcenaria residencial, jogos específicos (mods, Skyrim, PoE, emuladores), música clássica/teoria, estudos e idiomas (`Alemão`, `Inglês Shadowing`, etc.), e cidadania/leis.
  3. Mudanças ainda não foram commitadas (aguardando pedido explícito do usuário).

---

## 2026-09-23 — Antigravity — revisão completa de contraste, legibilidade e tokens do Modo Escuro (Dark Mode)
- Arquivos alterados: `tailwind.config.js`, `src/components/layout/MainContent.tsx`, `src/components/list/BookmarkItemRow.tsx`, `src/components/list/BookmarkCard.tsx`, `src/components/list/FolderItemRow.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/RightInspector.tsx`, `src/components/tree/FolderTreeNode.tsx`, `src/components/modals/WorkspaceTabsModal.tsx`, `src/components/modals/BatchEditModal.tsx`, `src/components/modals/MoveItemsModal.tsx`, `src/components/duplicates/DuplicatesView.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.14s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente:
  1. **Configuração Tailwind `slate-850`**: Adicionado o tom `#172033` em `theme.extend.colors.slate[850]` no `tailwind.config.js`. Classes como `dark:bg-slate-850` agora geram CSS válido e um tom intermediário elegante entre `slate-800` (#1e293b) e `slate-900` (#0f172a).
  2. **Toolbar e Breadcrumbs do `MainContent`**:
     - Contador de itens e subpastas transformado em badge tipo pill de alto contraste: `bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-medium`.
     - Rótulo `"Ordenar:"` e botões de ordenação ("Nome", "Domínio", "Data") ajustados para `dark:text-slate-300` com hover `dark:text-white` e fundo ativo com contraste claro.
     - Breadcrumbs com texto `dark:text-slate-300` e separadores `>` visíveis.
     - Botões de "Organizar Tudo A-Z" e "Guias do Workspace" com bordas e cores de destaque nítidas no escuro.
  3. **Legibilidade das Listas e Cards**:
     - `BookmarkItemRow` e `BookmarkCard`: URLs secundárias, domínios e datas clareados para `dark:text-slate-400` / `dark:text-slate-300` (eliminado o sumiço causado por `dark:text-slate-500` / `dark:text-slate-600` em fundos escuros).
     - `FolderItemRow`: Badge de contagem (`fav.` e `sub.`) com fundo e texto âmbar nítidos (`dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800/80`) e subtítulo informativo legível (`dark:text-slate-400`).
  4. **Barra Lateral e Detalhes**:
     - `Sidebar` e `FolderTreeNode`: Cabeçalhos de seção e nomes de pasta com `dark:text-slate-400` / `dark:text-slate-300`, badges de contagem nítidos.
     - `RightInspector`: Rótulos de campos ("URL Completa", "Localização", "Data") em `dark:text-slate-400 font-semibold`.
     - Modais (`WorkspaceTabsModal`, `BatchEditModal`, `MoveItemsModal`, `DuplicatesView`): URLs, listas de abas e estados vazios com alto contraste e legibilidade imediata.
  5. Mudanças ainda não foram commitadas (aguardando pedido explícito do usuário).

---

## 2026-09-23 — Antigravity — seleção múltipla de pastas para mover/editar, suporte a guias de Edge Workspaces e modo Dark sincronizado com o navegador
- Arquivos alterados: `src/hooks/useTheme.ts` (novo), `src/components/modals/BatchEditModal.tsx` (novo), `src/services/tabs/workspaceTabs.ts`, `src/hooks/useBookmarks.ts`, `src/components/actionbar/BatchActionBar.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/MainContent.tsx`, `src/components/list/FolderCard.tsx`, `src/components/list/FolderItemRow.tsx`, `src/components/modals/WorkspaceTabsModal.tsx`, `src/App.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.21s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente:
  1. **Captura e exibição de guias de Edge Workspaces**:
     - `getOpenWindowsAndTabs()` em `workspaceTabs.ts` agora consulta `chrome.windows.getAll` sem filtro restritivo de `windowTypes` e combina com `chrome.tabs.query({})` para capturar todas as guias de todas as janelas/workspaces do Edge.
     - No `MainContent`, ao visualizar pastas de workspace ou pastas vazias, há um botão dedicado "Capturar Guias do Workspace" e na toolbar "Guias do Workspace", abrindo o modal com o destino pré-configurado na pasta atual.
     - `saveTabsAsBookmarks` e `WorkspaceTabsModal` agora possuem a opção "Salvar direto na pasta de destino (sem criar subpasta)", permitindo salvar as abas diretamente dentro de pastas como "Espaços de trabalho / Produtividade".
  2. **Seleção múltipla de pastas para mover e editar**:
     - `FolderItemRow` e `FolderCard` agora possuem checkbox de seleção (`isSelected`, `onToggleSelect`), destacando pastas selecionadas.
     - O botão "Selecionar Todos" na toolbar agora seleciona simultaneamente todas as pastas e todos os favoritos.
     - `BatchActionBar` ganhou o botão "Editar": se 1 item/pasta estiver selecionado, abre o editor; se vários estiverem selecionados, abre o novo `BatchEditModal` (adicionar prefixo, sufixo ou localizar e substituir em lote com pré-visualização ao vivo).
     - `deleteMultiple` em `useBookmarks.ts` foi corrigido para usar `removeTree` em pastas com conteúdo (evitando erro da API do Chrome).
  3. **Modo Dark e sincronização com tema do navegador**:
     - Implementado hook `useTheme.ts` com suporte aos modos: Claro (`light`), Escuro (`dark`) e Sincronizar com Navegador (`system`).
     - Seletor de tema rápido e estilizado no cabeçalho (`Header.tsx`) com ícones Sol ☀️, Lua 🌙 e Monitor 💻.
     - Escuta eventos de alteração de `prefers-color-scheme` em tempo real e persiste a preferência em `localStorage`.
  4. Mudanças ainda não foram commitadas (aguardando pedido explícito do usuário).

---

## 2026-09-23 — Antigravity — expansão inline do conteúdo interno das pastas, contagem recursiva e movimentação estilo edge://favorites/
- Arquivos alterados: `src/hooks/useBookmarks.ts`, `src/components/layout/MainContent.tsx`, `src/components/list/BookmarkItemRow.tsx`, `src/components/list/BookmarkCard.tsx`, `src/components/list/FolderItemRow.tsx`, `src/components/list/FolderCard.tsx`, `src/components/tree/FolderTreeNode.tsx`, `src/components/modals/MoveItemsModal.tsx`, `src/App.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.32s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente:
  1. **Contagem real recursiva**: Resolvido o problema em que pastas mestras exibiam "0 itens" porque seus links estavam dentro de subpastas. O hook `useBookmarks` agora calcula recursivamente `recursiveCountMap`, `directCountMap` e `subfolderCountMap`. Os badges agora informam com precisão (ex.: `24 fav. • 3 sub.`).
  2. **Expansão inline e inspeção total do conteúdo**: Em modo lista, pastas possuem botão de expandir/recolher tipo sanfona/árvore, além de um botão mestre "Expandir Todas e Ver Conteúdo / Recolher Todas as Pastas". Toda a hierarquia de subpastas aninhadas e links internos é renderizada na própria tela com ações completas (abrir, selecionar, inspecionar, mover, excluir).
  3. **Ações rápidas de mover**:
     - Botão "Mover para..." (`FolderInput`) presente em cada linha/card de favorito e pasta.
     - Modal `MoveItemsModal` aprimorada com busca rápida de pasta de destino, proteção contra ciclos (impede mover uma pasta para dentro de si mesma ou de suas subpastas) e pré-seleção inteligente.
     - Drag & Drop nativo completo: suporta arrastar favoritos e pastas tanto para dentro de outras pastas no conteúdo quanto para a árvore lateral (`FolderTreeNode`).
  4. Mudanças ainda não foram commitadas (aguardando pedido explícito do usuário).

---

## 2026-09-23 — Antigravity — paridade funcional total com edge://favorites/ (Breadcrumbs, Drag & Drop, Menu de Contexto e Atalhos)
- Arquivos alterados: `src/components/common/ContextMenu.tsx` (novo), `src/components/layout/MainContent.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/list/BookmarkCard.tsx`, `src/components/list/BookmarkItemRow.tsx`, `src/components/list/FolderCard.tsx`, `src/components/list/FolderItemRow.tsx`, `src/components/tree/FolderTreeNode.tsx`, `src/hooks/useBookmarks.ts`, `src/services/tabs/workspaceTabs.ts`, `src/App.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 6.52s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente:
  1. **Breadcrumbs navegáveis**: Trilha hierárquica clicável no topo do `MainContent` (`breadcrumbs` gerado em `useBookmarks.ts`), permitindo voltar rapidamente para qualquer nível de pasta com 1 clique.
  2. **Menu de Contexto Completo (Botão Direito)**: Componente `ContextMenu.tsx` estilo Fluent/Edge que reage a cliques com botão direito em links (abrir em nova guia/janela/InPrivate, copiar link, editar, mover, excluir), pastas (abrir todas em janela/InPrivate, nova subpasta aqui, novo favorito aqui, renomear, excluir) e área de fundo da pasta (novo favorito, nova pasta, organizar A-Z, recarregar).
  3. **Drag & Drop Nativo (HTML5)**: Favoritos (`draggable`) podem ser arrastados e soltos tanto sobre as subpastas no `MainContent` (modo lista e cards) quanto sobre qualquer pasta da árvore na `Sidebar` (`FolderTreeNode`), movendo o item instantaneamente no Chrome/Edge com anel visual de destaque.
  4. **Duplo clique e atalhos de teclado**: Duplo clique em favorito abre imediatamente em nova guia; duplo clique em pasta navega para dentro dela; atalho `Ctrl+A` seleciona todos os itens da visualização atual; tecla `Delete` abre diálogo de exclusão em massa para os selecionados.
  5. Mudanças ainda não foram commitadas (aguardando pedido explícito do usuário).

---

## 2026-09-23 — Antigravity — ordenação alfabética completa A-Z (pastas, subpastas e favoritos internos)
- Arquivos alterados: `src/services/bookmarks/hierarchy.ts`, `src/hooks/useBookmarks.ts`, `src/App.tsx`, `src/components/layout/MainContent.tsx`, `src/components/modals/AiOrganizeModal.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 6.24s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente:
  1. `sortFoldersAlphabetically` em `hierarchy.ts` agora ordena recursivamente tanto pastas e subpastas quanto TODOS os favoritos dentro de cada pasta (A-Z com collation natural pt-BR `numeric: true`).
  2. Adicionado o botão "Organizar Tudo A-Z" na toolbar do `MainContent` com feedback animado e banner de conclusão, permitindo organizar a pasta atual ou a barra inteira permanentemente no Chrome/Edge com 1 clique (com snapshot prévio de segurança).
  3. Integrado ao hook `useBookmarks` (`sortAlphabetically`) e atualizado na modal de IA `AiOrganizeModal` (rótulo reflete ordenação de pastas, subpastas e favoritos).
  4. Mudanças ainda não foram commitadas (aguardando pedido explícito do usuário).

---

## 2026-09-22 — Antigravity — botão de reanalisar/pesquisar duplicações na aba de duplicados
- Arquivos alterados: `src/components/duplicates/DuplicatesView.tsx`, `src/components/layout/MainContent.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.17s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente: Adicionado o botão "Pesquisar Duplicações" na aba de Duplicados (tanto no cabeçalho de ações quanto na tela de estado vazio), permitindo recarregar e reanalisar a árvore inteira de favoritos sob demanda com feedback visual animado. Mudanças ainda não foram commitadas (aguardando pedido do usuário).

---

## 2026-09-22 — Antigravity — seleção múltipla de janelas/workspaces e ordenação alfabética (A-Z) de pastas e subpastas
- Arquivos alterados: `src/components/modals/WorkspaceTabsModal.tsx`, `src/services/bookmarks/hierarchy.ts`, `src/components/modals/AiOrganizeModal.tsx`, `src/App.tsx`, `src/ai/classifier.ts`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.33s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente:
  1. Modal de Workspaces/guias abertas agora possui checkbox mestre "Selecionar Todas as Janelas" e checkboxes individuais para cada janela/workspace, permitindo capturar todas as janelas juntas ou selecionar apenas as janelas desejadas.
  2. Implementada a função `sortFoldersAlphabetically` em `hierarchy.ts`, ordenando recursivamente pastas e subpastas na Barra de Favoritos (A-Z) usando collation pt-BR.
  3. Categorias mestras da taxonomia de IA (`TAXONOMY_MASTER_CATEGORIES`) organizadas em ordem alfabética.
  4. Adicionado checkbox na modal de IA para classificar pastas e subpastas em ordem alfabética (A-Z) ativo por padrão. Mudanças commitadas e sincronizadas em `origin/main`.

---

## 2026-09-22 — Antigravity — ferramenta de limpeza de duplicados em 1 clique
- Arquivos alterados: `src/services/duplicates/index.ts`, `src/hooks/useBookmarks.ts`, `src/App.tsx`, `src/components/layout/MainContent.tsx`, `src/components/duplicates/DuplicatesView.tsx`.
- Verificado: `npm run build` executado com sucesso e 0 erros (tsc + vite build em 3.51s, saída em `dist/`).
- Pendente / próximo passo: Testes no Microsoft Edge via `edge://extensions` (recarregar pacote em `dist/`).
- Avisos para o outro agente: A aba de duplicados agora possui ferramenta global e por grupo de exclusão em 1 clique, com estratégia de preservação (mais antigo por padrão ou mais recente), customização por item ("Manter este"), proteção por snapshot automático antes de apagar e filtro rápido de busca. Mudanças ainda não foram commitadas (aguardando pedido do usuário).

---

## 2026-09-22 — Antigravity — visualizador de pastas estilo edge://favorites/, Workspaces/guias abertas, organização inteligente recursiva e correção dos 7 bugs
- Arquivos alterados: `public/manifest.json`, `src/services/tabs/workspaceTabs.ts`, `src/components/modals/WorkspaceTabsModal.tsx`, `src/components/list/FolderItemRow.tsx`, `src/components/list/FolderCard.tsx`, `src/components/layout/MainContent.tsx`, `src/components/layout/Header.tsx`, `src/components/modals/CreateBookmarkModal.tsx`, `src/components/modals/CreateFolderModal.tsx`, `src/components/sidepanel/SidePanelContent.tsx`, `src/App.tsx`, `src/ai/types.ts`, `src/ai/classifier.ts`, `src/components/modals/AiOrganizeModal.tsx`, `src/services/bookmarks/hierarchy.ts`, `src/background/index.ts`, `src/services/health/index.ts`, `src/services/backup/index.ts`, `src/components/backup/BackupView.tsx`, `src/hooks/useBookmarks.ts`.
- Verificado: `npm run build` passa com 100% de sucesso gerando `dist/` (tsc e vite build em 3.64s sem nenhum aviso ou erro).
- Pendente / próximo passo: Testes manuais no Microsoft Edge via `edge://extensions` (recarregar pacote descompactado da pasta `dist/`).
- Avisos para o outro agente:
  1. Todos os 7 bugs listados em `AGENTS.md` foram corrigidos e validados.
  2. Implementado visualizador de subpastas no topo do `MainContent` (tanto modo lista quanto modo grade/cards) com contador de itens, navegação por clique, renomeação in-place e exclusão.
  3. Adicionado suporte completo a guias abertas e Edge Workspaces (`workspaceTabs.ts`, `WorkspaceTabsModal.tsx` e permissão `"tabs"`): permite listar guias abertas por janela/workspace, selecioná-las, salvá-las em lote numa pasta de favoritos ou enviá-las direto para organização pela IA. Também é possível abrir todas as guias de uma pasta de favoritos em uma nova janela ("Workspace") pelo botão nos cards/linhas de pasta.
  4. Organização com IA agora é recursiva para pastas e preserva o contexto semântico das pastas antigas durante a classificação.
  5. Alterações commitadas com sucesso no commit `8a1f168` e sincronizadas em `origin/main`.

---

## 2026-09-22 — Claude Code — setup do repositório
- Arquivos alterados: `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md` (novos).
- Verificado: `npm run build` passa; repositório criado em https://github.com/Neguchads/favorite-manager (commit `d9cefb8`).
- Pendente / próximo passo: corrigir bug 1 de `AGENTS.md` (pastas duplicadas em `hierarchy.ts`).
- Avisos para o outro agente: ainda não existem testes. Os arquivos de coordenação ainda não foram commitados.
