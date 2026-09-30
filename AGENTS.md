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
- Testes: `npm test` (Vitest, pasta `tests/`, roda contra o `MockBookmarksService`, sem dados pessoais).
- Pacote para a loja: `npm run package` (gera `Favorite-Manager.zip`, ignorado pelo git).
- Sem lint: o `tsc` strict do build cobre o essencial.
- Versão: só no `package.json`. O build grava essa versão em `dist/manifest.json` (`scripts/manifestVersion.ts`); o `0.0.0` de `public/manifest.json` é ignorado.
- CI: `.github/workflows/ci.yml` roda `npm test` e `npm run build` em todo PR e push na `main`.

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
- Pronto = `npm test` e `npm run build` passando sem erros.
- Nunca coloque segredos no código. Use `.env` (já está no `.gitignore`).

## Bugs conhecidos

Os 7 bugs da auditoria de 25/09/2026 foram resolvidos. A auditoria de 30/09/2026 achou outros; as correções da Fase 0 estão em `docs/ROADMAP.md` e no `HANDOFF.md`, cada uma com teste em `tests/` quando dá para testar fora do navegador.

Pendências conhecidas que dependem de teste manual no Edge: regra do Ollama (A2), sync cifrado entre dois navegadores (A1), atalhos com modal (D1), cancelar chat do Ollama (D2), desfazer na posição original (C6) e permissão opcional de sites (E2).
