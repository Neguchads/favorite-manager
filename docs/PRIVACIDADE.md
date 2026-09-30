# Política de Privacidade — Favorite Manager for Microsoft Edge

_Última atualização: 30 de setembro de 2026_

## Português

O Favorite Manager é uma extensão que organiza os favoritos do seu navegador. Ela funciona dentro do seu computador e **não coleta, vende nem compartilha dados pessoais**. Não há conta, servidor próprio, analytics nem rastreamento.

### Que dados a extensão usa

- **Seus favoritos** (títulos, endereços e pastas), lidos e alterados pela API de favoritos do navegador para organizar, buscar, deduplicar e fazer backup.
- **Configurações e snapshots de backup**, guardados no armazenamento local do navegador (`chrome.storage.local`). Eles não saem da sua máquina.

### Quando a extensão se conecta à internet

Só nestes casos, e só quando você usa o recurso:

1. **Verificar links quebrados e buscar títulos:** a extensão acessa diretamente o site de cada favorito verificado, como se você o abrisse. Para isso, ela pede a permissão opcional de acesso a todos os sites no primeiro uso. Nenhum dado é enviado a terceiros.
2. **Wayback Machine:** o botão de link arquivado abre ou salva um endereço de `web.archive.org` para o favorito escolhido.
3. **Sincronização entre navegadores (opcional, desligada até você gerar ou colar uma chave):** as mensagens passam por um servidor MQTT público (`broker.hivemq.com`) **cifradas ponta a ponta com AES-GCM de 256 bits**. A chave de cifra é derivada da sua chave de sincronização e nunca é enviada. O servidor só vê bytes ilegíveis e um identificador de canal que não revela a chave.
4. **IA local (Ollama, opcional):** as perguntas e a lista de favoritos para organizar vão somente para o Ollama rodando no seu próprio computador (`localhost:11434`).

### Permissões

- `bookmarks`: ler e organizar seus favoritos.
- `storage` e `unlimitedStorage`: guardar configurações e snapshots de backup localmente.
- `tabs`: salvar a aba atual e abrir favoritos.
- `sidePanel`, `notifications`: painel lateral e avisos de sincronização.
- `declarativeNetRequest`: ajustar o cabeçalho `Origin` apenas das chamadas da própria extensão ao Ollama local.
- Acesso a `localhost:11434`: falar com o Ollama local.
- Acesso a todos os sites (**opcional**, pedido só no primeiro uso da verificação de links ou da busca de títulos).

### Contato

Dúvidas: abra uma issue no repositório da extensão ou escreva para o endereço de contato informado na página da loja.

---

## English

Favorite Manager organizes your browser bookmarks. It runs on your computer and **does not collect, sell or share personal data**. There is no account, no own server, no analytics and no tracking.

### Data the extension uses

- **Your bookmarks** (titles, URLs and folders), read and changed through the browser bookmarks API to organize, search, deduplicate and back them up.
- **Settings and backup snapshots**, kept in the browser's local storage (`chrome.storage.local`). They never leave your machine.

### When the extension connects to the internet

Only in these cases, and only when you use the feature:

1. **Broken link check and title lookup:** the extension requests each checked bookmark's site directly, as if you opened it. It asks for the optional all-sites permission on first use. No data is sent to third parties.
2. **Wayback Machine:** the archived-link button opens or saves a `web.archive.org` address for the chosen bookmark.
3. **Cross-browser sync (optional, off until you create or paste a key):** messages go through a public MQTT server (`broker.hivemq.com`) **end-to-end encrypted with 256-bit AES-GCM**. The encryption key is derived from your sync key and is never sent. The server only sees unreadable bytes and a channel id that does not reveal the key.
4. **Local AI (Ollama, optional):** prompts and the bookmark list to organize go only to Ollama running on your own computer (`localhost:11434`).

### Permissions

- `bookmarks`: read and organize your bookmarks.
- `storage` and `unlimitedStorage`: keep settings and backup snapshots locally.
- `tabs`: save the current tab and open bookmarks.
- `sidePanel`, `notifications`: side panel and sync notices.
- `declarativeNetRequest`: rewrite the `Origin` header only on the extension's own requests to local Ollama.
- Access to `localhost:11434`: talk to local Ollama.
- Access to all sites (**optional**, requested only the first time you run the link check or title lookup).

### Contact

Questions: open an issue in the extension repository or use the contact address shown on the store listing.
