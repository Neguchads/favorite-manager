// Acesso a todos os sites é opcional: só é pedido quando o usuário usa um recurso que precisa dele
// (verificar links, buscar títulos). Instalação nova não pede essa permissão.
const ALL_SITES = { origins: ['<all_urls>'] };

/**
 * Pede acesso a todos os sites. Chame como PRIMEIRO await dentro do clique do usuário:
 * o navegador só mostra o pedido durante um gesto do usuário.
 * Se a permissão já foi dada, resolve true sem mostrar nada.
 */
export async function requestAllSitesAccess(): Promise<boolean> {
  // Fora da extensão (npm run dev), não há sistema de permissões
  if (typeof chrome === 'undefined' || !chrome.permissions?.request) return true;
  try {
    return await chrome.permissions.request(ALL_SITES);
  } catch {
    return false;
  }
}

export const ALL_SITES_DENIED_MESSAGE =
  'Para verificar links e buscar títulos, a extensão precisa acessar os sites dos seus favoritos. ' +
  'Nada é enviado para terceiros: cada site é consultado direto do seu navegador. Clique de novo e permita o acesso para continuar.';
