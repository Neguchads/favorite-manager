import { IBookmarksService } from './types';
import { ChromeBookmarksService } from './chromeAdapter';
import { MockBookmarksService } from './mockAdapter';

function createBookmarksService(): IBookmarksService {
  // Check if running in browser extension context with chrome.bookmarks available
  const hasChromeBookmarks =
    typeof chrome !== 'undefined' &&
    Boolean(chrome.bookmarks) &&
    typeof chrome.bookmarks.getTree === 'function';

  if (hasChromeBookmarks) {
    return new ChromeBookmarksService();
  }

  // Fallback to Mock provider for local development in browser
  return new MockBookmarksService();
}

export const bookmarksService = createBookmarksService();
export * from './types';
export * from './hierarchy';
