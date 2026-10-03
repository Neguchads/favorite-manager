# Envio para a loja — Microsoft Edge Add-ons (Partner Center)

Guia completo do envio, na ordem das abas do Partner Center. Todo texto abaixo está pronto para colar.
Imagens prontas em [`docs/loja/`](loja/). Fontes das imagens geradas (logo e promocionais) em [`docs/loja/fontes/`](loja/fontes/).

> A extensão já existe como rascunho no Partner Center com o nome antigo "Favorite Manager for Microsoft Edge" e o pacote 1.1.0. Este guia substitui tudo por 1.2.0.

## 0. Gerar o pacote

```bash
npm install
npm test
npm run package
```

Resultado: `Favorite-Manager.zip` na raiz do projeto (versão do `package.json`, hoje 1.2.0).

## 1. Pacotes

- Clique em **Substituir** (ou "Carregar novo pacote") e envie `Favorite-Manager.zip`.
- Confira na tela de validação: versão **1.2.0**, nome **Favorite Manager**.
- O formulário de Privacidade passa a listar também `declarativeNetRequest` e os hosts do Ollama, porque o manifest novo tem essas permissões.

## 2. Disponibilidade

- Visibilidade: **Pública**.
- Mercados: **Todos os mercados** (a extensão não depende de país).

## 3. Propriedades

- Categoria: **Produtividade**.
- Site / URL de suporte: https://gist.github.com/Neguchads/c5a554a1d03ea38f4840eb0a9d331521 (a política tem a forma de contato) ou deixe em branco.
- Conteúdo para adultos: **Não**.

## 4. Privacidade

### Descrição de finalidade única (até 1000)

```
Gerenciar os favoritos do navegador: organizar em pastas, buscar, remover duplicados e links quebrados, e fazer backup e restauração. Todos os recursos agem somente sobre os favoritos do próprio usuário.
```

### Justificativas de permissão

**bookmarks**
```
Função principal da extensão: ler, criar, mover, renomear e apagar os favoritos do usuário para organizá-los em pastas, remover duplicados, ordenar e restaurar backups.
```

**storage**
```
Guardar as preferências da interface (tema, idioma, opções de organização) e o estado da sincronização opcional no armazenamento local do navegador.
```

**unlimitedStorage**
```
Antes de cada operação em massa a extensão grava um snapshot local da árvore de favoritos para permitir desfazer. Com milhares de favoritos, os 15 snapshots mantidos ultrapassam o limite padrão de armazenamento local.
```

**sidePanel**
```
Oferecer a interface de busca e organização de favoritos no painel lateral do Edge.
```

**notifications**
```
Avisar o usuário quando um favorito chega de outro navegador pela sincronização opcional e quando uma auto-organização é concluída.
```

**tabs**
```
Salvar a aba atual como favorito pelo popup, abrir favoritos em novas abas ou janelas e abrir a página da extensão a partir do atalho de teclado e da barra de endereço (omnibox).
```

**favicon**
```
Mostrar o ícone de cada site ao lado dos favoritos, lido do cache local do navegador (/_favicon/). Nenhum domínio é enviado a serviços externos para buscar ícones.
```

**declarativeNetRequest** (aparece depois de enviar o pacote 1.2.0)
```
Usada apenas para a IA local opcional (Ollama em localhost:11434). Uma regra de sessão reescreve o cabeçalho Origin somente nas requisições iniciadas pela própria extensão para localhost/127.0.0.1/[::1] na porta 11434, porque o Ollama recusa o Origin chrome-extension://. Nenhuma requisição de páginas da web é alterada.
```

**Permissão de host**
```
Fixas: apenas http://localhost:11434, http://127.0.0.1:11434 e http://[::1]:11434, para conversar com a IA local opcional (Ollama) que roda no computador do usuário.
Opcional: <all_urls>, pedida somente quando o usuário clica em "Escanear Favoritos" (verificar links quebrados) ou "Buscar e Atualizar Títulos", para consultar o próprio site de cada favorito. Sem a permissão, esses dois recursos não rodam e o resto da extensão funciona normalmente.
```

### Você está usando código remoto?

**Não.** Todo o JavaScript vai dentro do pacote (build do Vite); nada é carregado de fora nem avaliado com `eval`.

### Uso de dados

Recomendação: **não marcar nenhuma caixa.** O desenvolvedor não coleta nada: não há servidor próprio, conta, analytics nem telemetria. Os favoritos só saem do navegador quando o próprio usuário liga a sincronização entre os navegadores dele, e mesmo assim cifrados ponta a ponta (AES-GCM 256), sem que o desenvolvedor ou o servidor MQTT consigam ler.

Se preferir declarar por excesso de cautela, a caixa mais próxima seria **Histórico da Web** (favoritos são URLs e títulos de páginas). A decisão é sua, porque você certifica as respostas.

### URL da política de privacidade

```
https://gist.github.com/Neguchads/c5a554a1d03ea38f4840eb0a9d331521
```

Ao mudar `docs/PRIVACIDADE.md`, atualize o gist: `gh gist edit c5a554a1d03ea38f4840eb0a9d331521 -f PRIVACIDADE.md docs/PRIVACIDADE.md`.

### Certificações

Marque as três: a extensão não vende nem transfere dados, não usa dados para outros fins e não faz análise de crédito.

## 5. Listagens da Store

Idiomas: **Português (Brasil)** como principal; adicione **English** com o texto em inglês abaixo.

### Nome
```
Favorite Manager
```

### Descrição curta (até 132)
```
Organize, busque e limpe seus favoritos: pastas automáticas, duplicados, links quebrados, backup e IA local opcional.
```

### Descrição (pt-BR)
```
Organize milhares de favoritos em segundos. Sem conta, sem anúncios e sem rastreamento: seus favoritos ficam no seu navegador.

ORGANIZAÇÃO AUTOMÁTICA
• Classifica cada favorito em pastas e subpastas por assunto (Dev & IA, Estudos, Compras, Finanças...), reaproveitando as pastas que você já tem.
• Mostra a proposta antes de aplicar e grava um backup automático.
• Opcional: organiza sozinho ao salvar com Ctrl+D.
• Ordenação A-Z de pastas e favoritos.

BUSCA RÁPIDA
• Busca por relevância, com tolerância a erros de digitação e filtros (domain:, folder:).
• Paleta de comandos com Ctrl+K e busca na barra de endereço: digite "fav" e o termo.

LIMPEZA
• Encontra e remove favoritos duplicados, escolhendo qual cópia manter.
• Verifica links quebrados (404, servidor fora do ar) e oferece a versão arquivada da Wayback Machine.
• Remove rastreadores de URL (utm, fbclid, gclid) e recupera títulos genéricos.
• Apaga pastas vazias com segurança.

BACKUP E IMPORTAÇÃO
• Snapshot local antes de cada operação em massa, com restauração em um clique.
• Importa e exporta HTML (Edge, Chrome, Firefox), JSON e Markdown.

EXTRAS
• Painel lateral do Edge, tema claro e escuro.
• IA local opcional com Ollama, rodando no seu computador.
• Sincronização opcional entre Edge, Chrome e Brave, cifrada ponta a ponta.

PRIVACIDADE
O acesso a todos os sites é opcional e só é pedido quando você usa a verificação de links ou a busca de títulos. Política completa: https://gist.github.com/Neguchads/c5a554a1d03ea38f4840eb0a9d331521
```

### Description (English)
```
Organize thousands of bookmarks in seconds. No account, no ads, no tracking: your bookmarks stay in your browser.

AUTOMATIC ORGANIZATION
• Sorts every bookmark into topic folders and subfolders, reusing the folders you already have.
• Shows the plan before applying it and saves an automatic backup.
• Optional: auto-organize when you save with Ctrl+D.
• A-Z sorting of folders and bookmarks.

FAST SEARCH
• Relevance search with typo tolerance and filters (domain:, folder:).
• Ctrl+K command palette and address bar search: type "fav" and your term.

CLEANUP
• Finds and removes duplicate bookmarks, letting you choose which copy to keep.
• Checks for broken links (404, server down) and offers the archived Wayback Machine version.
• Removes URL trackers (utm, fbclid, gclid) and recovers generic titles.
• Safely deletes empty folders.

BACKUP AND IMPORT
• Local snapshot before every bulk change, one-click restore.
• Import and export HTML (Edge, Chrome, Firefox), JSON and Markdown.

EXTRAS
• Edge side panel, light and dark theme.
• Optional local AI with Ollama, running on your own computer.
• Optional end-to-end encrypted sync across Edge, Chrome and Brave.

PRIVACY
All-sites access is optional and requested only when you use the link checker or title lookup. Full policy: https://gist.github.com/Neguchads/c5a554a1d03ea38f4840eb0a9d331521
```

### Imagens (pasta `docs/loja/`)

| Campo do Partner Center | Arquivo |
|---|---|
| Logotipo da extensão (300×300) | `logo-300x300.png` |
| Imagem promocional pequena (440×280) | `promo-pequena-440x280.png` |
| Imagem promocional grande (1400×560) | `promo-grande-1400x560.png` |
| Capturas de tela (1280×800), nesta ordem | `screenshot-1-pastas-organizadas.png`, `screenshot-2-organizar-com-ia.png`, `screenshot-3-tema-escuro.png`, `screenshot-4-duplicados.png`, `screenshot-5-central-de-limpeza.png`, `screenshot-6-backups.png` |

As capturas usam só favoritos fictícios do modo de desenvolvimento.

### Palavras-chave (se o formulário pedir)
```
favoritos, bookmarks, organizar, duplicados, links quebrados, backup, produtividade
```

## 6. Enviar

- Revise a Visão geral: todas as abas com ✓.
- Clique em **Publicar**. Em "Notas para certificação", cole:

```
Versão 1.2.0. Para testar a organização: abra a extensão (ícone na barra), clique em "Organizar com IA" > "Gerar Proposta de Organização" > "Aplicar". A IA local (Ollama) é opcional; sem ela o motor heurístico embutido é usado. A permissão de todos os sites é opcional e é pedida no primeiro clique em "Central de Limpeza" > "Integridade & Redirecionamentos" > "Escanear Favoritos". A sincronização entre navegadores é opcional e desligada por padrão.
```

- A revisão da Microsoft costuma levar alguns dias úteis. Atualizações futuras: suba a versão no `package.json`, rode `npm run package` e envie o novo zip na aba Pacotes.

## Pasta antiga `docs/Store_Assets/`

Material de 24/09/2026, anterior à versão 1.2.0: nome antigo, ícone antigo, pacote 1.1.0 e declaração de privacidade incorreta ("100% offline", permissão `activeTab` que não existe). **Não use.** Pode apagar a pasta.
