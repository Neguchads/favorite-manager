import { SupportedBrowser } from './types';

let cachedBrowser: SupportedBrowser | null = null;

// Proactively detect Brave via asynchronous navigator.brave API if available
if (typeof navigator !== 'undefined') {
  const nav = navigator as any;
  if (nav.brave && typeof nav.brave.isBrave === 'function') {
    nav.brave.isBrave().then((isBrave: boolean) => {
      if (isBrave) {
        cachedBrowser = 'Brave';
      }
    }).catch(() => {});
  }
}

/**
 * Detects whether the current environment is running on Microsoft Edge, Google Chrome, Brave, or generic Chromium.
 */
export function detectBrowserName(): SupportedBrowser {
  if (cachedBrowser) return cachedBrowser;
  if (typeof navigator === 'undefined') return 'Browser';

  const nav = navigator as any;
  // Synchronous Brave indicator check
  if (nav.brave && typeof nav.brave.isBrave === 'function') {
    return 'Brave';
  }

  const ua = navigator.userAgent;

  // Microsoft Edge user agent contains 'Edg/'
  if (/Edg\//i.test(ua)) {
    return 'Edge';
  }

  // Google Chrome user agent contains 'Chrome/' without 'Edg/'
  if (/Chrome\//i.test(ua)) {
    return 'Chrome';
  }

  return 'Browser';
}

const INSTALL_ID_KEY = 'fav_manager_install_id';

/**
 * Returns a persistent unique identifier for this browser profile installation
 */
export function getOrCreateInstallationId(): string {
  try {
    let id = localStorage.getItem(INSTALL_ID_KEY);
    if (!id) {
      const browser = detectBrowserName().toLowerCase();
      const rand = Math.random().toString(36).substring(2, 10);
      id = `${browser}_${Date.now().toString(36)}_${rand}`;
      localStorage.setItem(INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    return `inst_${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * Generates an easy-to-read Sync Key like "FAV-8492-X7K1"
 */
export function generateSyncKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Math.floor(1000 + Math.random() * 9000);
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FAV-${part1}-${part2}`;
}
