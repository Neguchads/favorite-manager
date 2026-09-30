# Ficha da loja — Microsoft Edge Add-ons (Partner Center)

Texto pronto para colar no Partner Center no primeiro envio. Limites da loja entre parênteses.

## Nome (até 45 caracteres)
Favorite Manager for Microsoft Edge

## Descrição curta (até 132 caracteres)
Organize, busque e limpe seus favoritos: pastas automáticas, duplicados, links quebrados, backup e IA local opcional.

## Descrição completa (pt-BR)

Organize milhares de favoritos em segundos, sem enviar seus dados para servidor nenhum.

**Organização automática**
- Classifica cada favorito em pastas e subpastas por assunto (Dev & IA, Estudos, Compras, Finanças...).
- Opcional: organização ao salvar com Ctrl+D.
- Ordenação A-Z de pastas e favoritos.

**Busca rápida**
- Busca com relevância (título exato primeiro) e tolerância a erros de digitação.
- Paleta de comandos com Ctrl+K e busca na barra de endereço: digite `fav` e o termo.

**Limpeza**
- Encontra e remove favoritos duplicados, com opção de qual cópia manter.
- Verifica links quebrados (404, servidor fora do ar) e oferece a versão arquivada da Wayback Machine.
- Remove rastreadores de URL (utm, afiliados) e recupera títulos genéricos.
- Apaga pastas vazias com segurança.

**Backup e importação**
- Snapshots locais antes de cada operação em massa, com restauração em um clique.
- Importa e exporta HTML (compatível com Edge, Chrome e Firefox), JSON e Markdown.

**Extras**
- Painel lateral do Edge, tema claro e escuro.
- IA local opcional com Ollama, rodando no seu computador.
- Sincronização opcional entre Edge, Chrome e Brave, cifrada ponta a ponta.

**Privacidade**
Sem conta, sem analytics, sem rastreamento. Seus favoritos ficam no seu navegador. O acesso a todos os sites é opcional e só é pedido quando você usa a verificação de links ou a busca de títulos.

## Full description (English)

Organize thousands of bookmarks in seconds, without sending your data to any server.

- Automatic folder organization by topic, optional auto-organize on Ctrl+D, A-Z sorting.
- Fast relevance search, typo tolerance, Ctrl+K command palette and `fav` omnibox search.
- Duplicate finder, broken link checker with Wayback Machine fallback, URL tracker removal, generic title recovery, safe empty-folder cleanup.
- Local snapshots before every bulk change; HTML, JSON and Markdown import/export.
- Edge side panel, light and dark theme, optional local AI (Ollama), optional end-to-end encrypted sync across Edge, Chrome and Brave.

No account, no analytics, no tracking. All-sites access is optional and requested only when you use the link checker or title lookup.

## Categoria
Produtividade

## Justificativa das permissões (campo "Notes for certification")
- `bookmarks`: ler e organizar os favoritos do usuário, função principal da extensão.
- `storage`, `unlimitedStorage`: configurações e snapshots de backup locais (árvores grandes de favoritos).
- `tabs`: salvar a aba atual como favorito e abrir favoritos.
- `sidePanel`: interface no painel lateral do Edge.
- `notifications`: aviso quando favoritos chegam pela sincronização.
- `declarativeNetRequest`: reescreve o cabeçalho Origin apenas nas requisições da própria extensão ao Ollama local (`initiatorDomains` = id da extensão); o Ollama recusa o Origin `chrome-extension://`.
- Host `localhost:11434` / `127.0.0.1:11434`: IA local opcional (Ollama).
- `optional_host_permissions: <all_urls>`: pedida só quando o usuário clica em "Verificar links" ou "Buscar títulos", para consultar o próprio site de cada favorito.
- Sincronização opcional usa WebSocket para `broker.hivemq.com` com mensagens cifradas ponta a ponta (AES-GCM 256); nenhum dado legível sai do navegador.

## URL da política de privacidade
Pendente: publicar `docs/PRIVACIDADE.md` em um endereço público (gist público ou repositório público) e colar a URL aqui.

## Capturas de tela (1280×800 ou 640×400, até 10)
1. Página completa com a árvore de pastas e a lista de favoritos (tema claro).
2. Modal "Organizar com IA" mostrando o plano de pastas antes de aplicar.
3. Aba Duplicados com um grupo expandido.
4. Aba Limpeza › Verificar links com resultados (ok, 404, redirecionado).
5. Paleta de comandos (Ctrl+K) com uma busca.
6. Painel lateral do Edge em tema escuro.
7. Backup: lista de snapshots com o botão Restaurar.

Use dados fictícios nas capturas, nunca os seus favoritos reais.

## Ícones exigidos
- 300×300 PNG (logo da loja): gerar a partir de `public/icons/icon128.png` em alta resolução.
- Os ícones 16/32/48/128 já estão no pacote.
