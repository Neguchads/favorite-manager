import { BookmarkNode } from '../../types/bookmarks';

export const TRACKING_PARAMS = new Set([
  // Google Analytics & UTM
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_name',
  'utm_reader',
  // Social Media Click Identifiers
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'twclid',
  'igshid',
  'si', // YouTube tracking param
  // Email & Marketing Platforms
  'mc_cid',
  'mc_eid',
  'mkt_tok',
  '_hsenc',
  '_hsmi',
  'yclid',
  // Referral tracking
  'ref',
  'ref_',
  'ref_src',
  'ref_url',
  'fref',
  'source',
  'curator',
  'aff_id',
  'aff_sub',
  'affiliate_id',
]);

export interface SanitizedUrlResult {
  hasTrackers: boolean;
  cleanUrl: string;
  removedParams: string[];
}

/**
 * Strips tracking parameters from a URL while preserving legitimate functional parameters
 */
export function sanitizeUrl(urlStr: string): SanitizedUrlResult {
  try {
    const url = new URL(urlStr);
    const removedParams: string[] = [];

    // Check each query parameter
    const keys = Array.from(url.searchParams.keys());
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (TRACKING_PARAMS.has(lower) || lower.startsWith('utm_')) {
        removedParams.push(key);
        url.searchParams.delete(key);
      }
    }

    // Clean tracking anchors (e.g. #xtor=...)
    if (url.hash && /#(xtor|utm_)/i.test(url.hash)) {
      url.hash = '';
    }

    const cleanUrl = url.toString();
    return {
      hasTrackers: removedParams.length > 0,
      cleanUrl,
      removedParams,
    };
  } catch {
    return {
      hasTrackers: false,
      cleanUrl: urlStr,
      removedParams: [],
    };
  }
}

export interface TrackedBookmark {
  bookmark: BookmarkNode;
  cleanUrl: string;
  removedParams: string[];
}

/**
 * Scans a list of bookmarks to identify all URLs with tracking parameters
 */
export function findBookmarksWithTrackers(bookmarks: BookmarkNode[]): TrackedBookmark[] {
  const result: TrackedBookmark[] = [];

  for (const b of bookmarks) {
    if (!b.url) continue;
    const { hasTrackers, cleanUrl, removedParams } = sanitizeUrl(b.url);
    if (hasTrackers && cleanUrl !== b.url) {
      result.push({
        bookmark: b,
        cleanUrl,
        removedParams,
      });
    }
  }

  return result;
}
