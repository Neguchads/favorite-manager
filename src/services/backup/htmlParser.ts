import { BookmarkNode } from '../../types/bookmarks';

export interface ParsedBookmarkItem {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  icon?: string;
  children?: ParsedBookmarkItem[];
  path?: string;
}

export interface ParseHtmlResult {
  totalBookmarks: number;
  totalFolders: number;
  rootNodes: ParsedBookmarkItem[];
  flatBookmarks: { title: string; url: string; path: string; icon?: string; dateAdded?: number }[];
}

/**
 * Escapes or unescapes common HTML entities in both browser and headless/service-worker environments
 */
function decodeHtmlEntities(str: string): string {
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Universal streaming parser for Netscape bookmark files (works in browser, Service Worker, and Node).
 */
function parseNetscapeStreaming(htmlContent: string): ParseHtmlResult {
  let totalBookmarks = 0;
  let totalFolders = 0;
  const flatBookmarks: { title: string; url: string; path: string; icon?: string; dateAdded?: number }[] = [];
  const rootNodes: ParsedBookmarkItem[] = [];

  const folderStack: ParsedBookmarkItem[] = [];
  let idCounter = 1;

  const lines = htmlContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for folder: <H3 ...>FolderName</H3>
    const h3Match = /<H3[^>]*>([^<]+)<\/H3>/i.exec(trimmed);
    if (h3Match) {
      totalFolders++;
      const folderTitle = decodeHtmlEntities(h3Match[1]).trim();
      const currentParent = folderStack[folderStack.length - 1];
      const nextPath = currentParent
        ? (currentParent.path ? `${currentParent.path} / ${folderTitle}` : folderTitle)
        : folderTitle;

      const folderItem: ParsedBookmarkItem = {
        id: `parsed_folder_${idCounter++}`,
        title: folderTitle,
        path: nextPath,
        children: [],
      };

      if (currentParent && currentParent.children) {
        currentParent.children.push(folderItem);
      } else {
        rootNodes.push(folderItem);
      }

      folderStack.push(folderItem);
    }

    // Check for closing DL (folder end)
    if (/<\/DL>/i.test(trimmed)) {
      if (folderStack.length > 0) {
        folderStack.pop();
      }
    }

    // Check for bookmark link: <A HREF="..." ...>Title</A>
    const aMatch = /<A\s+[^>]*HREF="([^"]+)"[^>]*>([^<]*)<\/A>/i.exec(trimmed);
    if (aMatch) {
      totalBookmarks++;
      const url = aMatch[1];
      const title = decodeHtmlEntities(aMatch[2] || url).trim();

      const addDateMatch = /ADD_DATE="(\d+)"/i.exec(trimmed);
      const dateAdded = addDateMatch ? parseInt(addDateMatch[1], 10) * 1000 : Date.now();

      const iconMatch = /ICON="([^"]+)"/i.exec(trimmed);
      const icon = iconMatch ? iconMatch[1] : undefined;

      const currentParent = folderStack[folderStack.length - 1];
      const path = currentParent ? (currentParent.path || '') : '';

      const bmItem: ParsedBookmarkItem = {
        id: `parsed_bm_${idCounter++}`,
        title,
        url,
        dateAdded,
        icon,
        path,
      };

      if (currentParent && currentParent.children) {
        currentParent.children.push(bmItem);
      } else {
        rootNodes.push(bmItem);
      }

      flatBookmarks.push({
        title,
        url,
        path,
        icon,
        dateAdded,
      });
    }
  }

  return {
    totalBookmarks,
    totalFolders,
    rootNodes,
    flatBookmarks,
  };
}

/**
 * Robust Netscape Bookmark HTML parser.
 * Converts Netscape Bookmark HTML (used by Edge, Chrome, Safari, Firefox)
 * into a structured BookmarkNode hierarchy with live metrics.
 */
export function parseNetscapeHtml(htmlContent: string): ParseHtmlResult {
  if (typeof DOMParser === 'undefined') {
    return parseNetscapeStreaming(htmlContent);
  }

  let totalBookmarks = 0;
  let totalFolders = 0;
  const flatBookmarks: { title: string; url: string; path: string; icon?: string; dateAdded?: number }[] = [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  let idCounter = 1;

  function parseContainer(container: Element, currentPath: string): ParsedBookmarkItem[] {
    const items: ParsedBookmarkItem[] = [];

    // In Netscape HTML format, items are grouped in DL and each item starts with DT
    const childNodes = Array.from(container.children);

    for (let i = 0; i < childNodes.length; i++) {
      const el = childNodes[i];

      // Check if element is DT or contains H3/A
      const dtElement = el.tagName === 'DT' ? el : el.querySelector('dt') || el;

      // Check if this DT is a Folder (contains H3)
      const h3 = dtElement.querySelector('h3') || (el.tagName === 'H3' ? el : null);
      if (h3) {
        totalFolders++;
        const folderTitle = decodeHtmlEntities(h3.textContent || 'Pasta sem título').trim();
        const nextPath = currentPath ? `${currentPath} / ${folderTitle}` : folderTitle;
        const folderId = `parsed_folder_${idCounter++}`;

        // Find associated DL container (can be inside DT or immediately following DT in sibling list)
        let subDl = dtElement.querySelector('dl');
        if (!subDl && el.nextElementSibling && el.nextElementSibling.tagName === 'DL') {
          subDl = el.nextElementSibling as HTMLDListElement;
          i++; // skip next DL since we processed it
        }

        const subChildren = subDl ? parseContainer(subDl, nextPath) : [];

        items.push({
          id: folderId,
          title: folderTitle,
          children: subChildren,
          path: nextPath,
        });
        continue;
      }

      // Check if this DT is a Bookmark Link (contains A)
      const a = dtElement.querySelector('a') || (el.tagName === 'A' ? el : null);
      if (a) {
        const rawUrl = a.getAttribute('href') || '';
        if (rawUrl) {
          totalBookmarks++;
          const title = decodeHtmlEntities(a.textContent || rawUrl).trim();
          const rawDate = a.getAttribute('add_date');
          const dateAdded = rawDate ? parseInt(rawDate, 10) * 1000 : Date.now();
          const icon = a.getAttribute('icon') || undefined;

          const bookmarkItem: ParsedBookmarkItem = {
            id: `parsed_bm_${idCounter++}`,
            title,
            url: rawUrl,
            dateAdded,
            icon,
            path: currentPath,
          };

          items.push(bookmarkItem);
          flatBookmarks.push({
            title,
            url: rawUrl,
            path: currentPath,
            icon,
            dateAdded,
          });
        }
      }
    }

    return items;
  }

  // Find root DL container in document
  const rootDl = doc.querySelector('dl');
  let rootNodes: ParsedBookmarkItem[] = [];

  if (rootDl) {
    rootNodes = parseContainer(rootDl, '');
  } else {
    // Fallback: If no standard DL tag, query all <a> tags directly
    const allLinks = Array.from(doc.querySelectorAll('a'));
    for (const a of allLinks) {
      const rawUrl = a.getAttribute('href');
      if (rawUrl) {
        totalBookmarks++;
        const title = decodeHtmlEntities(a.textContent || rawUrl).trim();
        const rawDate = a.getAttribute('add_date');
        const dateAdded = rawDate ? parseInt(rawDate, 10) * 1000 : Date.now();

        const item: ParsedBookmarkItem = {
          id: `parsed_bm_${idCounter++}`,
          title,
          url: rawUrl,
          dateAdded,
          path: 'Importados',
        };
        rootNodes.push(item);
        flatBookmarks.push({
          title,
          url: rawUrl,
          path: 'Importados',
          dateAdded,
        });
      }
    }
  }

  return {
    totalBookmarks,
    totalFolders,
    rootNodes,
    flatBookmarks,
  };
}

/**
 * Converts ParsedBookmarkItem into native BookmarkNode format
 */
export function convertParsedToBookmarkNodes(parsedItems: ParsedBookmarkItem[]): BookmarkNode[] {
  return parsedItems.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    dateAdded: item.dateAdded,
    children: item.children ? convertParsedToBookmarkNodes(item.children) : undefined,
  }));
}
