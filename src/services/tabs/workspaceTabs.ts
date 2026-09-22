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
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://')
  ) && !lower.includes('chrome-extension://');
}

/**
 * Fetches all open browser windows and their tabs, grouped by window (Workspace)
 */
export async function getOpenWindowsAndTabs(): Promise<OpenWindowGroup[]> {
  if (typeof chrome !== 'undefined' && chrome.windows?.getAll) {
    return new Promise((resolve) => {
      chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
        const result: OpenWindowGroup[] = [];
        let windowIndex = 1;

        for (const win of windows) {
          const rawTabs = win.tabs || [];
          const validTabs: OpenTab[] = rawTabs
            .filter((t) => isRealWebUrl(t.url))
            .map((t) => ({
              id: t.id || Math.random(),
              title: t.title || t.url || 'Nova Guia',
              url: t.url || '',
              favIconUrl: t.favIconUrl,
              windowId: win.id || 0,
              active: t.active,
            }));

          const windowTitle = win.focused
            ? `Janela Atual / Workspace (${validTabs.length} guias)`
            : `Janela / Workspace #${windowIndex} (${validTabs.length} guias)`;

          result.push({
            id: win.id || windowIndex,
            title: windowTitle,
            isCurrent: win.focused || false,
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
 * Saves a list of tabs into a newly created folder under parentId ('1' = Bookmarks Bar)
 */
export async function saveTabsAsBookmarks(
  tabs: { title: string; url: string }[],
  folderTitle: string,
  parentId: string = '1'
): Promise<{ folderId: string; createdCount: number }> {
  if (tabs.length === 0) {
    throw new Error('Nenhuma guia selecionada para salvar.');
  }

  await createLocalSnapshot(`Salvamento de Workspace: ${folderTitle}`);

  // Create workspace destination folder
  const folder = await bookmarksService.create({
    parentId,
    title: folderTitle,
  });

  let createdCount = 0;
  const CHUNK_SIZE = 15;

  for (let i = 0; i < tabs.length; i += CHUNK_SIZE) {
    const chunk = tabs.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (tab) => {
        try {
          await bookmarksService.create({
            parentId: folder.id,
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

  return { folderId: folder.id, createdCount };
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
