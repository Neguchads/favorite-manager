import { bookmarksService } from '../bookmarks';
import { createLocalSnapshot } from '../backup';

export interface OpenTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  windowId: number;
  active?: boolean;
}

export interface OpenWindowGroup {
  id: number;
  title: string;
  isCurrent: boolean;
  tabs: OpenTab[];
}

/**
 * Checks if a URL is a real web page (excludes internal browser and empty URLs)
 */
export function isRealWebUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.startsWith('chrome-extension://') || lower.startsWith('edge-extension://')) {
    return false;
  }
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('file://')
  );
}

/**
 * Fetches all open browser windows and their tabs, grouped by window (Workspace)
 */
export async function getOpenWindowsAndTabs(): Promise<OpenWindowGroup[]> {
  if (typeof chrome !== 'undefined' && chrome.windows?.getAll) {
    return new Promise((resolve) => {
      // Query all windows without restrictive windowTypes so Edge Workspaces are fully captured
      chrome.windows.getAll({ populate: true }, async (windows) => {
        // Also query chrome.tabs to ensure no tabs from any workspace or detached window are missed
        let allTabs: chrome.tabs.Tab[] = [];
        try {
          allTabs = await new Promise<chrome.tabs.Tab[]>((res) => {
            if (chrome.tabs?.query) {
              chrome.tabs.query({}, (tabs) => res(tabs || []));
            } else {
              res([]);
            }
          });
        } catch {
          allTabs = [];
        }

        const windowMap = new Map<number, chrome.windows.Window>();
        for (const win of windows || []) {
          if (win.id !== undefined) windowMap.set(win.id, win);
        }

        // Group tabs by windowId
        const tabsByWindow = new Map<number, OpenTab[]>();

        // First add tabs from windows.getAll
        for (const win of windows || []) {
          const rawTabs = win.tabs || [];
          for (const t of rawTabs) {
            if (isRealWebUrl(t.url)) {
              const winId = win.id || 0;
              if (!tabsByWindow.has(winId)) tabsByWindow.set(winId, []);
              tabsByWindow.get(winId)!.push({
                id: t.id || Math.random(),
                title: t.title || t.url || 'Nova Guia',
                url: t.url || '',
                favIconUrl: t.favIconUrl,
                windowId: winId,
                active: t.active,
              });
            }
          }
        }

        // Check if any tabs from chrome.tabs.query belong to windows not in windows.getAll
        for (const t of allTabs) {
          if (isRealWebUrl(t.url) && t.windowId) {
            const list = tabsByWindow.get(t.windowId);
            if (!list) {
              tabsByWindow.set(t.windowId, [{
                id: t.id || Math.random(),
                title: t.title || t.url || 'Nova Guia',
                url: t.url || '',
                favIconUrl: t.favIconUrl,
                windowId: t.windowId,
                active: t.active,
              }]);
            } else if (!list.some((existing) => existing.id === t.id)) {
              list.push({
                id: t.id || Math.random(),
                title: t.title || t.url || 'Nova Guia',
                url: t.url || '',
                favIconUrl: t.favIconUrl,
                windowId: t.windowId,
                active: t.active,
              });
            }
          }
        }

        const result: OpenWindowGroup[] = [];
        let windowIndex = 1;

        for (const [winId, validTabs] of tabsByWindow.entries()) {
          if (validTabs.length === 0) continue;

          const win = windowMap.get(winId);
          const isCurrent = win?.focused || false;
          const activeTab = validTabs.find((t) => t.active) || validTabs[0];
          const activeTitleSnippet = activeTab ? ` — ${activeTab.title.slice(0, 30)}` : '';

          const windowTitle = isCurrent
            ? `Janela Atual / Workspace (${validTabs.length} guias)`
            : `Workspace / Janela #${windowIndex}${activeTitleSnippet} (${validTabs.length} guias)`;

          result.push({
            id: winId,
            title: windowTitle,
            isCurrent,
            tabs: validTabs,
          });

          windowIndex++;
        }

        // Put current focused window first
        result.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
        resolve(result);
      });
    });
  }

  // Development Mock Fallback
  return [
    {
      id: 1,
      title: 'Janela Atual / Workspace (Dev Mock)',
      isCurrent: true,
      tabs: [
        {
          id: 101,
          title: 'GitHub: Onde o mundo constrói software',
          url: 'https://github.com',
          windowId: 1,
          active: true,
        },
        {
          id: 102,
          title: 'Claude AI Assistant',
          url: 'https://claude.ai',
          windowId: 1,
        },
        {
          id: 103,
          title: 'MDN Web Docs - Mozilla',
          url: 'https://developer.mozilla.org',
          windowId: 1,
        },
        {
          id: 104,
          title: 'Microsoft Learn: Documentação oficial',
          url: 'https://learn.microsoft.com',
          windowId: 1,
        },
      ],
    },
  ];
}

/**
 * Saves a list of tabs into a newly created folder or directly under parentId
 */
export async function saveTabsAsBookmarks(
  tabs: { title: string; url: string }[],
  folderTitle: string,
  parentId: string = '1',
  saveDirectlyIntoParent: boolean = false
): Promise<{ folderId: string; createdCount: number }> {
  if (tabs.length === 0) {
    throw new Error('Nenhuma guia selecionada para salvar.');
  }

  await createLocalSnapshot(`Salvamento de Workspace: ${folderTitle}`);

  let destinationFolderId = parentId;
  if (!saveDirectlyIntoParent) {
    const folder = await bookmarksService.create({
      parentId,
      title: folderTitle,
    });
    destinationFolderId = folder.id;
  }

  let createdCount = 0;
  const CHUNK_SIZE = 15;

  for (let i = 0; i < tabs.length; i += CHUNK_SIZE) {
    const chunk = tabs.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (tab) => {
        try {
          await bookmarksService.create({
            parentId: destinationFolderId,
            title: tab.title,
            url: tab.url,
          });
          createdCount++;
        } catch (err) {
          console.warn(`Erro ao salvar guia ${tab.url}:`, err);
        }
      })
    );
  }

  return { folderId: destinationFolderId, createdCount };
}

/**
 * Opens a list of URLs in a brand new dedicated browser window (recreates an Edge Workspace session)
 */
export async function openUrlsInNewWindow(urls: string[]): Promise<boolean> {
  const validUrls = urls.filter(isRealWebUrl);
  if (validUrls.length === 0) return false;

  if (typeof chrome !== 'undefined' && chrome.windows?.create) {
    await new Promise<void>((resolve) => {
      chrome.windows.create({ url: validUrls, focused: true }, () => resolve());
    });
    return true;
  }

  // Fallback for browser dev mode
  for (const url of validUrls) {
    window.open(url, '_blank');
  }
  return true;
}

/**
 * Opens a URL in a new browser tab
 */
export function openUrlInNewTab(url: string): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Opens a URL or list of URLs in a new browser window
 */
export function openUrlInNewWindow(url: string, incognito: boolean = false): void {
  if (typeof chrome !== 'undefined' && chrome.windows?.create) {
    chrome.windows.create({ url: [url], incognito, focused: true });
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Opens a list of URLs in an InPrivate/Incognito window
 */
export async function openUrlsInIncognitoWindow(urls: string[]): Promise<boolean> {
  const validUrls = urls.filter(isRealWebUrl);
  if (validUrls.length === 0) return false;

  if (typeof chrome !== 'undefined' && chrome.windows?.create) {
    await new Promise<void>((resolve) => {
      chrome.windows.create({ url: validUrls, incognito: true, focused: true }, () => resolve());
    });
    return true;
  }

  for (const url of validUrls) {
    window.open(url, '_blank');
  }
  return true;
}
