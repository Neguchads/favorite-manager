export interface ListShortcutContext {
  /** tagName do alvo do evento (ex.: 'INPUT', 'BUTTON', 'BODY') */
  tagName?: string | null;
  isContentEditable?: boolean;
  /** atributo role do alvo, se houver */
  role?: string | null;
  /** type do alvo quando é INPUT (ex.: 'checkbox', 'text') */
  inputType?: string | null;
  /** KeyboardEvent.key */
  key: string;
  /** há modal (aria-modal="true") ou menu (role="menu") aberto */
  overlayOpen: boolean;
  /**
   * KeyboardEvent.defaultPrevented: um overlay (menu, modal, paleta) já consumiu a tecla,
   * p.ex. o Esc que acabou de fechá-lo e tirá-lo do DOM antes deste handler rodar
   */
  defaultPrevented?: boolean;
}

const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'A']);
// INPUT que não recebe texto (caixa de seleção do favorito, p.ex.): Delete, setas e Ctrl+A continuam valendo
const NON_TEXT_INPUT_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image']);

/**
 * Decide se um atalho da lista (setas, Delete, Enter, Espaço, Ctrl+A, Ctrl+Z, Esc)
 * deve ser tratado pelo handler global, sem roubar teclas de campos, modais,
 * menus ou do controle que está com foco.
 */
export function shouldHandleListShortcut({
  tagName,
  isContentEditable,
  role,
  inputType,
  key,
  overlayOpen,
  defaultPrevented,
}: ListShortcutContext): boolean {
  if (overlayOpen || defaultPrevented) return false;

  const tag = (tagName ?? '').toUpperCase();
  const isNonTextInput = tag === 'INPUT' && NON_TEXT_INPUT_TYPES.has((inputType ?? '').toLowerCase());
  if ((TEXT_ENTRY_TAGS.has(tag) && !isNonTextInput) || isContentEditable) return false;

  // Enter/Espaço em botão, link ou caixa de seleção devem ativar o próprio controle
  if (key === 'Enter' || key === ' ') {
    if (ACTIVATABLE_TAGS.has(tag) || isNonTextInput || role === 'button') return false;
  }

  return true;
}

/**
 * Extrai o termo de busca de um hash "#search=<termo>" (usado pelo omnibox).
 * Retorna null se o hash não for de busca ou se o termo estiver malformado.
 */
export function parseSearchHash(hash: string): string | null {
  const match = hash.match(/^#search=(.*)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    // termo malformado na URL: ignora
    return null;
  }
}
