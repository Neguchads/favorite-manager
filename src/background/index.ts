// Microsoft Edge / Chromium Manifest V3 Background Service Worker
import { classifyBookmarkIntelligently } from '../ai/classifier';
import { ensureHierarchicalFolder, buildExistingFolderMap } from '../services/bookmarks/hierarchy';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function setupOllamaCorsRules() {
  if (typeof chrome !== 'undefined' && chrome.declarativeNetRequest?.updateDynamicRules) {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1001, 1002],
      addRules: [
        {
          id: 1001,
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
            responseHeaders: [
              {
                header: 'Access-Control-Allow-Origin',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: '*',
              },
              {
                header: 'Access-Control-Allow-Methods',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: 'GET, POST, PUT, DELETE, OPTIONS',
              },
              {
                header: 'Access-Control-Allow-Headers',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: '*',
              },
            ],
          },
          condition: {
            urlFilter: '||127.0.0.1:11434/',
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
          },
        },
        {
          id: 1002,
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
            responseHeaders: [
              {
                header: 'Access-Control-Allow-Origin',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: '*',
              },
              {
                header: 'Access-Control-Allow-Methods',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: 'GET, POST, PUT, DELETE, OPTIONS',
              },
              {
                header: 'Access-Control-Allow-Headers',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: '*',
              },
            ],
          },
          condition: {
            urlFilter: '||localhost:11434/',
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
          },
        },
      ],
    }).catch((err) => {
      console.warn('Ollama dynamic rules registration skipped:', err);
    });
  }
}

// Run rules setup immediately
setupOllamaCorsRules();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Edge Favorite Manager installed successfully');
  setupOllamaCorsRules();

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

chrome.omnibox.onInputEntered.addListener((url, disposition) => {
  if (!url) return;
  const targetUrl = url.startsWith('http')
    ? url
    : `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
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
          title: '⚡ Edge Favorite Manager',
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

        const text = await res.text();
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
