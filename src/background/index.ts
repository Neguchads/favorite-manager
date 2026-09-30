// Microsoft Edge / Chromium Manifest V3 Background Service Worker
import { classifyBookmarkIntelligently } from '../ai/classifier';
import { ensureHierarchicalFolder, buildExistingFolderMap } from '../services/bookmarks/hierarchy';
import { isBulkLockActive } from '../services/bookmarks/bulkLock';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Só reescreve o Origin das chamadas da PRÓPRIA extensão ao Ollama local.
// Páginas da extensão com host_permissions já ignoram CORS; o Ollama só rejeita o Origin chrome-extension://.
async function setupOllamaOriginRule() {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest?.updateSessionRules) return;
  try {
    // Limpa as regras antigas, que valiam para qualquer site
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1001, 1002] });
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [2001],
      addRules: [
        {
          id: 2001,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              {
                header: 'origin',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: 'http://localhost',
              },
            ],
          },
          condition: {
            initiatorDomains: [chrome.runtime.id],
            requestDomains: ['localhost', '127.0.0.1'],
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
          },
        },
      ],
    });
  } catch (err) {
    console.warn('Ollama origin rule registration skipped:', err);
  }
}

// Run rules setup immediately
setupOllamaOriginRule();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Favorite Manager installed successfully');
  setupOllamaOriginRule();

  // Configure side panel behavior if API is present
  if (chrome.sidePanel && 'setPanelBehavior' in chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((err) => {
      console.warn('Failed to set side panel behavior:', err);
    });
  }
});

// Omnibox Quick Search: type "fav <termo>" in Microsoft Edge address bar
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  if (!text || text.trim().length === 0) return;
  const q = text.toLowerCase().trim();
  try {
    const results = await chrome.bookmarks.search(q);
    const suggestions = results
      .filter((b) => b.url)
      .slice(0, 6)
      .map((b) => ({
        content: b.url!,
        description: `<match>${escapeXml(b.title || 'Favorito')}</match> - <url>${escapeXml(b.url!)}</url>`,
      }));
    suggest(suggestions);
  } catch (err) {
    console.warn('Omnibox search error:', err);
  }
});

chrome.omnibox.setDefaultSuggestion({ description: 'Buscar nos favoritos: <match>%s</match>' });

chrome.omnibox.onInputEntered.addListener((url, disposition) => {
  if (!url) return;
  // Sugestão escolhida traz a URL; texto digitado abre a busca da própria extensão
  const targetUrl = /^https?:\/\//i.test(url)
    ? url
    : chrome.runtime.getURL(`index.html#search=${encodeURIComponent(url.trim())}`);
  if (disposition === 'currentTab') {
    chrome.tabs.update({ url: targetUrl });
  } else {
    chrome.tabs.create({ url: targetUrl });
  }
});

// Keyboard Command Listener (e.g. Ctrl+Shift+F)
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'open_command_palette') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html#palette') });
  }
});

// Real-time Auto-Organization on Bookmark Creation (Ctrl+D) - Bug 2 Fix: Opt-in only
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  if (!bookmark.url) return; // Skip folder creation

  try {
    // Global Mutex Check: Suppress auto-organization and event loops during bulk imports or sync
    if (chrome.storage?.session) {
      try {
        const lockState = await chrome.storage.session.get(['isBulkOperating', 'bulkReleasedAt']);
        if (isBulkLockActive(lockState)) return;
      } catch {}
    }

    const { autoOrganizeOnCreate } = await chrome.storage.local.get(['autoOrganizeOnCreate']);
    // Bug 2 Fix: MUST be explicitly set to true. Disabled by default to prevent sync/import race conditions.
    if (autoOrganizeOnCreate !== true) return;

    // If the user explicitly saved into a custom subfolder (not root '1' or '2'), respect their choice
    if (bookmark.parentId && bookmark.parentId !== '1' && bookmark.parentId !== '2') {
      return;
    }

    const targetCategory = classifyBookmarkIntelligently(bookmark.title || '', bookmark.url);
    if (!targetCategory || targetCategory === 'Outros' || targetCategory === 'Outros & Geral') return;

    const tree = await chrome.bookmarks.getTree();
    const existingFolderMap = buildExistingFolderMap(tree as any);

    const targetFolderId = await ensureHierarchicalFolder(targetCategory, '1', existingFolderMap);

    if (bookmark.parentId !== targetFolderId) {
      await chrome.bookmarks.move(id, { parentId: targetFolderId });

      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '⚡ Favorite Manager',
          message: `Favorito salvo e organizado em:\n📁 ${targetCategory}`,
          priority: 1,
        });
      }
    }
  } catch (err) {
    console.warn('Auto-organize error on bookmark creation:', err);
  }
});

// Message listener for popup, options, or background fetch utilities
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_FULL_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_VERSION') {
    sendResponse({ version: chrome.runtime.getManifest().version });
    return true;
  }

  // Helper: CORS-free background link status check (Bug 7 Fix: Fallback for 403/405 HEAD responses)
  if (message.type === 'CHECK_LINK_STATUS') {
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        let res: Response | null = null;

        try {
          res = await fetch(message.url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EdgeFavoriteManager/1.1' },
          });
        } catch {
          // HEAD threw network or abort error
        }

        // Bug 7 Fix: If HEAD failed or returned 403/405/400 (many servers block HEAD requests), fallback to lightweight GET
        if (!res || (!res.ok && (res.status === 403 || res.status === 405 || res.status === 400 || res.status === 401))) {
          try {
            res = await fetch(message.url, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EdgeFavoriteManager/1.1',
                'Range': 'bytes=0-1024',
              },
            });
          } catch (err2: any) {
            clearTimeout(timeoutId);
            sendResponse({ status: 0, ok: false, error: err2?.name === 'AbortError' ? 'timeout' : 'network_error' });
            return;
          }
        }

        clearTimeout(timeoutId);

        if (res) {
          const status = res.status;
          // If status is 2xx/3xx, or 403 (server exists and responded, but forbids bot reading), consider online
          const ok = res.ok || (status >= 200 && status < 400) || status === 403;
          const finalUrl = res.url || message.url;
          const isRedirected = Boolean(
            res.redirected || (res.url && res.url !== message.url && res.url.replace(/\/$/, '') !== message.url.replace(/\/$/, ''))
          );
          sendResponse({
            status,
            ok,
            redirected: isRedirected,
            finalUrl: isRedirected ? finalUrl : undefined,
            error: ok ? null : (status === 404 ? 'not_found' : `http_${status}`),
          });
        } else {
          sendResponse({ status: 0, ok: false, error: 'network_error' });
        }
      } catch (e: any) {
        sendResponse({ status: 0, ok: false, error: e?.message || 'unknown' });
      }
    })();
    return true;
  }

  // Helper: CORS-free title scraper for generic/missing bookmark titles
  if (message.type === 'FETCH_PAGE_TITLE') {
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(message.url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EdgeFavoriteManager/1.1' },
        });
        clearTimeout(timeoutId);

        // Stream the response and abort as soon as we find </title> or exceed 100 KB.
        // Avoids downloading entire large pages / binary blobs for title extraction.
        const MAX_BYTES = 100 * 1024; // 100 KB
        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        let chunk = '';
        let bytesRead = 0;

        if (reader) {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              bytesRead += value.byteLength;
              chunk += decoder.decode(value, { stream: true });
              // Early abort once we've found the closing </title> tag
              if (/<\/title>/i.test(chunk)) { reader.cancel(); break; }
              if (bytesRead >= MAX_BYTES) { reader.cancel(); break; }
            }
          } catch {
            // reader already cancelled or network error — use whatever we have
          }
        } else {
          // Fallback for environments without streaming body support
          chunk = await res.text();
        }

        const text = chunk;
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        let title = titleMatch ? titleMatch[1].trim() : '';

        // Fallback to og:title
        if (!title) {
          const ogMatch =
            text.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
            text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
          if (ogMatch) title = ogMatch[1].trim();
        }

        // Clean common HTML entities
        title = title
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ');

        sendResponse({ success: true, title });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'failed' });
      }
    })();
    return true;
  }
});
