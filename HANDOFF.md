# Handoff entre agentes

Registro curto de passagem de turno. Entrada mais recente no topo.

Formato de cada entrada:

```
## AAAA-MM-DD — <agente> — <objetivo>
- Arquivos alterados:
- Verificado (comando e resultado):
- Pendente / próximo passo:
- Avisos para o outro agente:
```

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
