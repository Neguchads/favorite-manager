export function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Normalizes URL by:
 * - standardizing protocol (http/https)
 * - lowercasing host
 * - removing tracking params (utm_*, fbclid, gclid, etc.)
 * - removing trailing slash
 * - removing fragment if empty
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    
    // Tracking query params to remove
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'msclkid',
      'ref',
      'source'
    ];

    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    let normalized = `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${parsed.pathname}`;
    
    // Remove trailing slash if pathname is more than '/'
    if (normalized.endsWith('/') && parsed.pathname.length > 1) {
      normalized = normalized.slice(0, -1);
    }

    if (parsed.search) {
      normalized += parsed.search;
    }
    
    if (parsed.hash && parsed.hash !== '#') {
      normalized += parsed.hash;
    }

    return normalized;
  } catch {
    return url.trim().toLowerCase();
  }
}

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'edge:' || parsed.protocol === 'chrome:';
  } catch {
    return false;
  }
}

export function getFaviconUrl(url?: string): string {
  if (!url) return '';
  const domain = extractDomain(url);
  if (!domain) return '';
  // Dentro da extensão: ícone do cache local do navegador (permissão "favicon"), sem enviar domínios a terceiros
  if (typeof chrome !== 'undefined' && chrome.runtime?.id && typeof chrome.runtime.getURL === 'function') {
    return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=64`;
  }
  // Só no modo de desenvolvimento (npm run dev), fora da extensão
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}
