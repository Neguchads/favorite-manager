# Regras compartilhadas entre agentes (Claude Code e Antigravity)

Este arquivo vale para qualquer agente de IA que trabalhe neste projeto.

## Projeto

- Extensão Manifest V3 para Microsoft Edge: gerenciador de favoritos.
- Stack: React 18, TypeScript, Vite 5, Tailwind 3. Sem backend.
- Pasta local: `A:\AI\Claude Code Projects\Favorite Manager`
- Repositório: https://github.com/Neguchads/favorite-manager (privado, branch `main`)
- Sistema: Windows 11 + PowerShell.

## Comandos

- Instalar dependências: `npm install`
- Build e checagem de tipos: `npm run build` (roda `tsc` e depois `vite build`, saída em `dist/`)
- Testar no navegador: `edge://extensions`, modo desenvolvedor, "Carregar sem compactação", pasta `dist/`
- Ainda não existem testes nem lint.

## Estrutura

- `src/background/index.ts`: service worker (omnibox, auto-organização no Ctrl+D, verificação de links, busca de títulos).
- `src/ai/classifier.ts`: classificador heurístico por domínio e regex. `src/ai/ollama.ts`: IA local opcional.
- `src/services/bookmarks/`: adaptador `chrome.bookmarks`, mock para dev e `hierarchy.ts` (criação de pastas e execução do plano de IA).
- `src/hooks/useBookmarks.ts`: estado central da UI.
- `src/components/`: telas (página completa, popup, side panel, modais).

## Como trabalhar junto

Os dois agentes usam a MESMA pasta e a MESMA branch. Cada um vê as mudanças do outro direto no disco e pelo `git diff`.

1. Só um agente trabalha por vez, nunca ao mesmo tempo. O usuário alterna entre eles: um termina, atualiza `HANDOFF.md`, e só então o outro começa. Mudanças não commitadas encontradas no início da sessão são trabalho do outro agente, não sujeira.
2. Ao começar uma sessão, antes de editar qualquer coisa:
   - Leia `HANDOFF.md`.
   - Rode `git status` e `git diff` para ver o que o outro agente mudou e ainda não foi commitado.
   - Rode `git log --oneline -10`.
3. Ao terminar, atualize `HANDOFF.md`: o que mudou (arquivos), o que foi verificado, o que ficou pendente.
4. Não troque de branch, não rode `git reset`, `git checkout -- .`, `git stash` nem `git clean`. Isso apagaria o trabalho do outro agente.
5. Não reverta nem reescreva mudanças do outro agente sem motivo. Se discordar, anote em `HANDOFF.md` e explique ao usuário.
6. Commit e push só quando o usuário pedir.

## Padrões de código

- Identificadores e mensagens de commit em inglês. Comentários e textos da UI em português do Brasil.
- Siga o estilo do código ao redor. Poucas dependências: não adicione bibliotecas sem justificar ao usuário.
- Nunca entregue código truncado, com `...` no lugar de código, TODO vazio, import faltando ou função vazia.
- Pronto = `npm run build` passando sem erros.
- Nunca coloque segredos no código. Use `.env` (já está no `.gitignore`).

## Bugs conhecidos (Status: 100% resolvidos)

1. [RESOLVIDO] `hierarchy.ts`: `buildExistingFolderMap` indexa por `parentId:folderTitle.toLowerCase()` e `ensureHierarchicalFolder` busca com essa mesma chave. Subpastas duplicadas eliminadas.
2. [RESOLVIDO] `background/index.ts`: auto-organização no `onCreated` é estritamente opt-in (`autoOrganizeOnCreate === true`) e respeita subpastas manuais do usuário.
3. [RESOLVIDO] `restoreSnapshot`: restauração segura implementada em `backup/index.ts` e conectada ao botão de restauração na UI com snapshot de segurança prévio.
4. [RESOLVIDO] `App.tsx`: `resolveSafeParentId` sanitiza seleções virtuais (`'all'`, `'recent'`) para IDs de pasta válidos ('1' ou pasta selecionada).
5. [RESOLVIDO] `hierarchy.ts`: `pruneEmptyFolders` opera seletivamente sobre `candidateFolderIds` (pastas esvaziadas pela operação).
6. [RESOLVIDO] `useBookmarks.ts`: `loadTree()` com debounce de 300ms contra sobrecarga de eventos.
7. [RESOLVIDO] Verificação de links: HEAD com 403/405/400 faz fallback suave via GET com cabeçalho de faixa de bytes para evitar falsos "links quebrados".
