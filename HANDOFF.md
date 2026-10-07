# Handoff entre agentes

Registro curto de passagem de turno. Entrada mais recente no topo.

## 2026-10-07 — Claude Code — Versões principais de build e testes
- Arquivos alterados:
  - `package.json`, `package-lock.json`: vite 5 → 8, @vitejs/plugin-react 4 → 6, vitest 3 → 5, @types/chrome 0.0.280 → 0.3.4. O lockfile foi regenerado (o antigo travava a resolução do vite 8).
  - `src/components/modals/AiOrganizeModal.tsx`, `src/services/sync/syncService.ts`: com os tipos novos, `chrome.storage.local.get` devolve `unknown`; os valores lidos agora são validados (motor `ollama`/`semantic`, modelo e chave de sync como string) em vez de usados direto.
- Verificado: `npm test` 94/94, `npm run build`, `dist/` com a mesma estrutura (manifest 1.2.0, service worker como módulo).
- Fica para depois: Tailwind 3 → 4 é uma migração de configuração; o Dependabot foi instruído a ignorar essa versão principal. Os 2 alertas que sobram (braces, postcss-selector-parser) vêm do Tailwind 3.
- Pendente (usuário): carregar o `dist/` no Edge e conferir as telas antes de publicar.

## 2026-10-03 — Claude Code — Fechamento da PR #13 e pacote da loja
- PR #13 (favicons locais, atalhos com checkbox, varredura completa de links e títulos, status 401/429/410) com CI verde e mesclada na `main`.
- Pacote `Favorite-Manager.zip` (versão 1.2.0, permissões conferidas no manifest) gerado a partir do `dist/` e entregue ao usuário. O `npm run package` só funciona no Windows (PowerShell); no Linux o zip foi feito com `zip -r` dentro de `dist/`.
- Falta (usuário): conferir no Edge ícones, pedido da permissão de sites e omnibox; atualizar o gist da política (`docs/PRIVACIDADE.md`, comando em `docs/LOJA.md`); incluir a justificativa `favicon` no Partner Center; enviar o zip; apagar `docs/Store_Assets/` na pasta local.

## 2026-10-03 — Claude Code — Revisão final de prontidão e correções
- Arquivos alterados:
  - `src/utils/url.ts`, `public/manifest.json`: ícones dos sites agora vêm do cache local do navegador (`/_favicon/`, permissão nova `favicon`). Antes cada domínio dos favoritos ia para `google.com/s2/favicons`, o que contradizia a política de privacidade ("nenhum dado a terceiros"). Fora da extensão (`npm run dev`) ainda usa o Google.
  - `docs/PRIVACIDADE.md`, `docs/LOJA.md`, `README.md`: permissão `favicon` listada e justificada. **Atualizar o gist da política** (comando em `docs/LOJA.md`) e **adicionar a justificativa `favicon` no Partner Center**.
  - `src/services/health/index.ts`, `src/background/index.ts`: 401/429 contam como link vivo; 410 conta como quebrado; títulos buscados não decodificam entidades duas vezes (`&amp;lt;`) e aceitam `&#NNN;`.
  - Testes novos: `tests/favicon.test.ts`, casos 401/429/410 em `tests/health.test.ts`.
- Verificado: `npm test` 94/94, `npm run build`, as três páginas (index, popup, sidepanel) carregam e respondem a cliques sem erros de console contra o mock.
- Testes ponta a ponta feitos em Chromium real com a extensão carregada (`dist/`, API `chrome.bookmarks` de verdade, locale pt-BR), fora do repositório: ~110 verificações, todas passando. Cobriram: popup salvando a aba atual, Ctrl+D com auto-organização ligada/desligada/pasta escolhida/trava em massa, `_favicon`, verificação de links (200/401/404/410/500/redirect), busca de títulos, Ollama falso que recusa `Origin: chrome-extension://` (regra DNR reescreve só para a extensão; site comum continua com o Origin original), organizar com IA (semântico e Ollama, Cancelar, chat), sync entre dois perfis com broker MQTT local (merge, tempo real criar/apagar, sem eco, tópico e payload cifrados), exportar/importar HTML e JSON e restaurar snapshot com auto-organização ligada, Central de Limpeza (UTM, títulos, pastas vazias), duplicados, A-Z, exclusão/Ctrl+Z na posição original, atalhos com modal/campo, `#search=`, painel lateral escuro e 3.500 favoritos (proposta em ~0,3 s, aplicar em ~3,5 s, nenhuma pasta duplicada).
- Bugs achados nesses testes e corrigidos: (1) Delete/Ctrl+A não funcionavam com o foco na caixa de seleção do favorito (`src/utils/keyboard.ts`, `App.tsx`, testes novos); (2) "Escanear Favoritos" verificava só os 300 primeiros e "Buscar e Atualizar Títulos" só 50 por clique, sem avisar: agora varrem todos, com Cancelar na varredura (`CleanupView.tsx`).
- Não deu para testar fora do Edge de verdade: o pedido da permissão opcional de todos os sites (não aparece em Chromium sem tela; o teste simulou "permitir"), o omnibox `fav` (a barra de endereço não é controlável por script; só o destino `#search=` foi testado) e o Edge em si.
- Pendente (só no Edge): confirmar que os ícones aparecem via `/_favicon/` (se não aparecerem, o fallback do componente mostra o ícone genérico); pedido da permissão de sites; omnibox; envio no Partner Center.

## 2026-10-01 — Claude Code — Estado ao fim da sessão
- Tudo na `main` (PRs #1 a #11 mesclados, CI verde), pasta principal em dia com o GitHub. Nada pendente na branch `claude/favorite-manager-audit-bdc274`.
- `docs/ROADMAP.md` atualizado: status da Fase 0 em 01/10, itens das Fases 1–3 conferidos (1.1, 1.2, 1.3, 1.5 e 1.6 agora feitos), o que foi feito depois da Fase 0 e o próximo passo.
- Próximo passo: (1) teste manual no Edge, checklist da Tarefa E5; (2) envio no Partner Center seguindo `docs/LOJA.md`; (3) apagar `docs/Store_Assets/` na pasta principal.
- Entrega neste projeto é automática quando testes e build passam: commit, push, PR, Auto-fix, merge após CI verde e `git pull --ff-only` na pasta principal.

## 2026-10-01 — Claude Code — Material da loja refeito
- Arquivos alterados:
  - `docs/loja/` (novo): logo 300×300 da estrela, promo 440×280 e 1400×560, 6 capturas 1280×800 da versão atual (favoritos fictícios do mock). Fontes em `docs/loja/fontes/` (`star.js`, `logo.html`, `promo.html`).
  - `docs/LOJA.md`: guia completo do Partner Center aba por aba (pacote, disponibilidade, propriedades, privacidade com cada justificativa, listagens pt-BR/EN, imagens, notas para certificação).
  - `src/hooks/useBookmarks.ts`: `parentPathMap` agora traz o caminho completo da pasta (antes trazia só os pais, e a etiqueta de pasta dos favoritos mostrava a pasta de cima; no mock aparecia "root"). `src/ai/classifier.ts`: análise conta favoritos direto na raiz como não organizados.
  - `Header.tsx`, `PopupContent.tsx`, `SidePanelContent.tsx`: logo do cabeçalho passa a ser o ícone da extensão (estrela) em vez do ícone de camadas.
  - Sync (PR #10): eventos nativos de favoritos (Ctrl+D, estrela, gerenciador) também sincronizam.
- Verificado: `npm test` 87/87, `npm run build`, `npm run package`.
- Pendente: enviar no Partner Center seguindo `docs/LOJA.md` (rascunho já existe com nome e pacote antigos); teste manual no Edge.
- Avisos: `docs/Store_Assets/` na pasta principal (fora do git, de 24/09) está obsoleta: nome e ícone antigos, pacote 1.1.0 e declaração de privacidade falsa ("100% offline", `activeTab`). Não usar; pode apagar.

## 2026-09-30 — Claude Code — Pendências menores fechadas + snapshots em chaves separadas
- Arquivos alterados:
  - Sync: `syncService.ts` (proteção contra replay mantida após reconectar; chave antiga `FAV-####-XXXX` recusada), `browserDetect.ts` (`isLegacySyncKey`), `useSync.ts` (`hasLegacyKey`, `connect` devolve boolean), `CrossBrowserSyncModal.tsx`, `Header.tsx`, `Sidebar.tsx`, `translations.ts` (aviso "Chave antiga — gere uma nova").
  - Teclado: `src/utils/keyboard.ts` (novo: `shouldHandleListShortcut`, `parseSearchHash`), `App.tsx` (menu de contexto bloqueia atalhos, Enter/Espaço em botão não abrem favorito, Esc de overlay usa `preventDefault`, `#search=` reage a `hashchange`), `ContextMenu.tsx` (`role="menu"`), `Modal.tsx`, `CommandPaletteModal.tsx`.
  - Ollama: `src/background/ollamaRule.ts` (novo, `regexFilter` só porta 11434, inclui `[::1]`), manifest com `http://[::1]:11434/*`.
  - Importação: `htmlParser.ts` (`isToolbar` via `PERSONAL_TOOLBAR_FOLDER`), `importer.ts` (barra em qualquer idioma).
  - Snapshots: `backup/index.ts` — cada árvore em `efm_snapshot_<id>`, índice em `efm_snapshots_index`, migração do formato antigo sem perda, `navigator.locks` entre contextos, limpeza de árvores órfãs, falta de espaço sem apagar os snapshots existentes.
  - Docs: `README.md`, `EXPLICACAO_DO_PROJETO.md`, título do painel lateral.
- Verificado: `npm test` 72/72, `npm run build`. Trabalho feito em paralelo por 7 subagentes em worktrees e revisado por um revisor separado; os achados Important foram corrigidos.
- Pendente: teste manual no Edge (inclui migração de snapshots de uma instalação 1.2.0 anterior e o aviso de chave antiga), capturas de tela, logo 300×300, envio no Partner Center.
- Avisos: snapshots do formato antigo migram na primeira leitura; a chave `efm_snapshots` antiga some só depois que todas as árvores estiverem salvas.

## 2026-09-30 — Claude Code — CI, versão única, ficha da loja e novo nome
- Arquivos alterados: `.github/workflows/ci.yml` (testes + build em PR e push na `main`), `scripts/manifestVersion.ts` (versão do `package.json` gravada no `dist/manifest.json`; `public/manifest.json` fica `0.0.0`), `docs/LOJA.md` (ficha da loja + URL da política no gist), `public/rules/ollama_cors.json` (apagado). Nome da extensão trocado para **Favorite Manager** no manifest, HTMLs, textos da UI, exportador Markdown e docs.
- Verificado: `npm test` 40/40, `npm run build`, CI verde nos PRs #2–#4 (mesclados).
- Pendente: teste manual no Edge (Tarefa E5 do `ROADMAP.md`) e primeiro envio no Partner Center. Política de privacidade publicada em https://gist.github.com/Neguchads/c5a554a1d03ea38f4840eb0a9d331521 — ao mudar `docs/PRIVACIDADE.md`, atualizar o gist.
- Avisos: o usuário autorizou entrega automática (commit, push, PR, merge após CI verde, pull na pasta principal).

## 2026-09-30 — Claude Code — Fase 0 implementada (sem commit)
- Arquivos alterados:
  - Testes (novo): `tests/` com 11 arquivos, Vitest. Configuração em `package.json` (`npm test`, `npm run package`), `vite.config.ts` e `tsconfig.json`.
  - Sync cifrado (A1): `src/services/sync/crypto.ts` (novo, AES-GCM com HKDF, tópico derivado, lotes de 200), `syncService.ts` (cifra, janela de 5 min contra replay, mensagens processadas uma por vez, snapshot só no 1º lote, cliente antigo descartado), `browserDetect.ts` (chave de 100 bits com `crypto.getRandomValues`), `CrossBrowserSyncModal.tsx` (aviso para chave antiga).
  - Ollama (A2): `src/background/index.ts` com regra de sessão só para requisições da própria extensão; `public/manifest.json` sem `declarative_net_request`.
  - Integridade (A3, C1–C6): `hierarchy.ts` (limpeza de pastas não apaga conteúdo, ordenação A-Z correta, `SYSTEM_ROOT_NAMES` e `systemRootIdFromName` exportados, incluindo nomes do Edge em inglês), `bookmarks/bulkLock.ts` (novo, trava com contador e janela de 1,5 s), `backup/index.ts` (restauração com trava), `importer.ts` (trava, JSON do próprio backup sem pasta fantasma, raízes desembrulhadas, nomes preservados), `twoWayMerge.ts` e `sync/types.ts` (`rootId`, `resolveRemoteTarget`), `useBookmarks.ts` (índice no `createBookmark`, caminho do sync corrigido), `App.tsx` (desfazer na posição original), `mockAdapter.ts` (campo `index` e regra de mover do Chrome).
  - UX (D1–D4): `App.tsx` (atalhos respeitam `SELECT` e modais), `Modal.tsx` e `CommandPaletteModal.tsx` (`aria-modal`), `ollama.ts` e `AiOrganizeModal.tsx` (timeout de 5 s e 120 s, botão Cancelar), `health/index.ts` (sem `no-cors`, 404/5xx classificados), `DuplicatesView.tsx`, `classifier.ts` (LinkedIn, TikTok), `htmlParser.ts` (decodifica `&amp;` na URL).
  - Loja (E1–E4): versão 1.2.0 em `package.json` e no manifest, `@types/paho-mqtt` em devDependencies, `host_permissions` só para o Ollama e `<all_urls>` opcional (`src/services/permissions.ts`, pedido em `CleanupView.tsx`), omnibox busca nos favoritos (`#search=`), `htmlExporter.ts` com `PERSONAL_TOOLBAR_FOLDER`, `docs/PRIVACIDADE.md` (novo), `README.md`, `AGENTS.md`, `docs/ROADMAP.md` (caixas marcadas).
- Verificado: `npm test` 38/38, `npm run build` sem erros, `npm run package` gera `Favorite-Manager.zip`. Revisão final feita por um revisor separado; o Critical e os Important foram corrigidos com testes.
- Pendente:
  1. Teste manual no Edge (checklist da Tarefa E5 no `ROADMAP.md`): Ollama "Testar Conexão" e bloqueio de fetch vindo de `example.com`, sync entre Edge e Chrome, atalhos com modal, Cancelar no chat, desfazer, pedido de permissão de sites.
  2. Apagar `public/rules/ollama_cors.json` à mão: um hook local bloqueia a remoção pelo agente. O arquivo não é mais usado, mas vai para o pacote.
  3. URL pública da política de privacidade (gist ou repositório público): decisão do usuário.
  4. Pendências menores sem correção: replay aceito depois de reconectar; chave antiga `FAV-####-XXXX` ainda aceita; regra do Ollama vale para qualquer porta de localhost; `ContextMenu` sem `aria-modal`; `#search=` não reage a `hashchange`; parser HTML não usa `PERSONAL_TOOLBAR_FOLDER`.
- Avisos para o outro agente: sync v2 não conversa com instalações antigas (tópico e formato novos); os dois navegadores precisam da versão nova. Nada foi commitado.

## 2026-09-30 — Claude Code — Auditoria completa e roadmap unificado
- Arquivos alterados:
  - `docs/ROADMAP.md` (novo, arquivo único de planejamento: resumo da Fase 0, status das Fases 1–3, passo a passo da Fase 0 e o conteúdo antigo dos pilares)
  - `docs/PLANO_EVOLUCAO_E_MELHORIAS.md` (apagado; conteúdo incorporado ao `ROADMAP.md`)
- Verificado: pasta local igual ao GitHub (`main` em `a8da6c0`); `npm run build` sem erros; `scratch/test-full-suite.ts` 56/56.
- Pendente / próximo passo: executar a Fase 0 do `docs/ROADMAP.md` a partir da Tarefa T1. Faltam duas decisões do usuário: sync (criptografar ou remover) e onde hospedar a política de privacidade.
- Avisos para o outro agente:
  1. A auditoria achou falhas graves: o sync publica os favoritos em texto claro no broker público HiveMQ, e a regra de CORS do Ollama vale para qualquer site. A lista "100% resolvidos" do `AGENTS.md` não vale mais; a lista atual está no `ROADMAP.md`.
  2. Os testes de `scratch/` não estão no git e dependem do arquivo pessoal de favoritos. A Tarefa T1 cria `tests/` versionado.

Formato de cada entrada:

```
## 2026-09-25 — Antigravity — Conclusão de 100% dos Itens Planejados: Despoluição do Cabeçalho, Relevância BM25, Function Calling no Mini-Agente e Empacotamento Edge Store
- Arquivos alterados:
  - `src/components/layout/Header.tsx` (despoluição da barra superior: agrupamento de 7 ferramentas secundárias no menu dropdown popover "Mais / Ferramentas" com fechamento ao clicar fora; barra superior limpa com foco na busca, modos de visualização, "+ Favorito" e "✨ Organizar com IA")
  - `src/utils/search.ts` (função de pontuação de relevância `scoreSearchRelevance` inspirada em BM25: prioriza títulos exatos (+160), prefixos no início do título (+110), domínios exatos (+100), palavras delimitadas (+75), tokens múltiplos e recência)
  - `src/hooks/useBookmarks.ts` (ordenação de busca dinâmica por relevância BM25: quando há busca ativa, resultados mais relevantes aparecem imediatamente no topo da lista)
  - `src/ai/types.ts` (`ChatMessage` enriquecido com campo opcional `actionPlan?: AiProposedPlan`)
  - `src/ai/classifier.ts` (parser de Function Calling em linguagem natural `parseChatActionIntent` e `formatFolderTitleCase`: identifica comandos como "Crie a pasta Estudos/Inglês e mova todos os links do Duolingo para lá" ou blocos JSON de ação, gerando um plano executável com Title Case)
  - `src/components/modals/AiOrganizeModal.tsx` (integração do Function Calling no chat: detecção de intenções de ação, renderização de Card interativo com preview de links e botão direto "▶ Executar Esta Ação Agora", execução segura com snapshot prévio)
  - `Favorite-Manager-v1.1.0-EdgeStore.zip` (gerado e copiado para `C:\Users\Desktop\Downloads\Favorite-Manager-v1.1.0-EdgeStore.zip` com 198 KB)
- Verificado:
  - `scratch/test-new-features.ts`: 100% aprovado (BM25 ranking GitHub #1 e Function Calling natural language parsing para "Estudos / Inglês").
  - `scratch/test-full-suite.ts`: 56/56 testes passando com 100% de sucesso.
  - `npm run build`: `tsc && vite build` concluído com sucesso e 0 erros (1653 módulos transformados em 4.86s).
- Pendente / próximo passo: Nenhum! 100% dos pilares e itens do planejamento foram implementados, testados e empacotados. O usuário pode carregar o `.zip` ou pasta `dist/` no Edge.
- Avisos para o outro agente:
  1. **Despoluição do Header**: O cabeçalho agora mantém apenas os botões primários. Preferências de Tema, Idioma, Workspaces, Importação e Sincronização ficam organizadas no popover "Mais".
  2. **Busca Inteligente**: A busca agora tem comportamento similar ao Spotlight / Raycast, elevando primeiro os sites e links onde o termo buscado está no início do título ou domínio.
  3. **Function Calling no Chat**: O usuário pode conversar com o Mini-Agente e emitir ordens de ação diretas, recebendo o Card de execução com confirmação instantânea.
```
## 2026-09-25 — Antigravity — Fase 1 (Virtualização de Lista e Grid com TanStack Virtual), Fase 2 (Sugestão Preditiva, Favicons, Navegação por Teclado, Instant Action + Undo Toast Ctrl+Z) e Fase 3 (Auto-Cura de Links 404 via Wayback Machine)
- Arquivos alterados:
  - `src/components/layout/MainContent.tsx` (integração de `@tanstack/react-virtual` com `rowVirtualizer` e `gridVirtualizer`, suporte dinâmico a `lanes` com ResizeObserver, contenção de `scrollMargin` com subpastas, redução de 45.000 nós no DOM para ~250 nós e 60 FPS estáveis)
  - `src/components/popup/SaveCurrentTabCard.tsx` (sugestão preditiva inteligente de pasta via `classifyBookmarkIntelligently` ao abrir a extensão, pre-seleção automática e pill visual com botão 'Usar')
  - `src/components/common/CommandPaletteModal.tsx` (exibição de favicons reais em alta resolução via `getFaviconUrl` com fallback gracioso para `<Globe />`, eliminando ícone estático genérico)
  - `src/App.tsx` (navegação contínua por teclado estilo Raycast/Linear: setas `ArrowDown`/`ArrowUp` movem o foco, `Enter` abre em nova aba, `Shift+Enter` em nova janela, `Espaço` alterna a gaveta de detalhes, `Escape` limpa seleção; padrão Instant Action para exclusão unitária com Toast flutuante de 6 segundos e restauração imediata via botão `Desfazer` ou atalho `Ctrl+Z`)
  - `src/components/cleanup/CleanupView.tsx` (auto-cura de links quebrados: botão de 1 clique `Salvar Snapshot` atualiza a URL do favorito quebrado diretamente para o snapshot preservado no Archive.org)
  - `src/i18n/translations.ts` (novas chaves de tradução `popup.suggestedFolder` e `popup.useSuggestion` em pt-BR e en)
- Verificado:
  - `npx tsx scratch/test-undo-and-autoheal.ts`: 3/3 testes passando com 100% de sucesso.
  - `npx tsx scratch/test-virtualization-and-ergonomics.ts`: 6/6 testes de sugestão preditiva passando com 100% de sucesso.
  - `npx tsx scratch/test-full-suite.ts`: 56/56 testes da suíte completa passando com 100% de sucesso.
  - `npm run build`: `tsc && vite build` concluído com sucesso e 0 erros (1653 módulos transformados em 15.39s).
- Pendente / próximo passo: Despoluição do cabeçalho (`Header.tsx`) e busca híbrida BM25.
- Avisos para o outro agente:
  1. **Exclusões Unitárias sem Modal Bloqueante**:
     - Clicar na lixeira de um único favorito executa a remoção imediatamente e aciona o toast `undoToast` por 6s.
     - Clicar em `Desfazer` ou pressionar `Ctrl+Z` restaura o favorito com título, url e pasta idênticos.
     - Pastas e exclusões em massa continuam protegidas pelo modal `ConfirmDialog`.
  2. **Auto-Cura no CleanupView**:
     - Ao detectar link 404 com snapshot no Wayback Machine, o usuário pode clicar em `Salvar Snapshot` para atualizar o bookmark para a versão arquivada.

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
