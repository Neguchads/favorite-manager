import { describe, it, expect } from 'vitest';
import { shouldHandleListShortcut, parseSearchHash } from '../src/utils/keyboard';

describe('shouldHandleListShortcut', () => {
  it('ignora teclas digitadas em input, textarea e select', () => {
    expect(shouldHandleListShortcut({ tagName: 'INPUT', key: 'ArrowDown', overlayOpen: false })).toBe(false);
    expect(shouldHandleListShortcut({ tagName: 'TEXTAREA', key: 'Delete', overlayOpen: false })).toBe(false);
    expect(shouldHandleListShortcut({ tagName: 'SELECT', key: 'ArrowUp', overlayOpen: false })).toBe(false);
  });

  it('ignora elementos contentEditable', () => {
    expect(shouldHandleListShortcut({ tagName: 'DIV', isContentEditable: true, key: 'a', overlayOpen: false })).toBe(false);
  });

  it('ignora atalhos com modal ou menu aberto', () => {
    expect(shouldHandleListShortcut({ tagName: 'BODY', key: 'Delete', overlayOpen: true })).toBe(false);
    expect(shouldHandleListShortcut({ tagName: 'BODY', key: 'ArrowDown', overlayOpen: true })).toBe(false);
  });

  it('não intercepta Enter/Espaço em botão, link ou role="button"', () => {
    expect(shouldHandleListShortcut({ tagName: 'BUTTON', key: 'Enter', overlayOpen: false })).toBe(false);
    expect(shouldHandleListShortcut({ tagName: 'A', key: ' ', overlayOpen: false })).toBe(false);
    expect(shouldHandleListShortcut({ tagName: 'DIV', role: 'button', key: 'Enter', overlayOpen: false })).toBe(false);
  });

  it('mantém setas em botão focado', () => {
    expect(shouldHandleListShortcut({ tagName: 'BUTTON', key: 'ArrowDown', overlayOpen: false })).toBe(true);
  });

  it('ignora teclas já consumidas por um overlay (defaultPrevented)', () => {
    // Esc que fechou o menu de contexto: o menu já saiu do DOM, mas o evento veio com preventDefault
    expect(shouldHandleListShortcut({ tagName: 'BODY', key: 'Escape', overlayOpen: false, defaultPrevented: true })).toBe(false);
    expect(shouldHandleListShortcut({ tagName: 'BODY', key: 'Escape', overlayOpen: false, defaultPrevented: false })).toBe(true);
  });

  it('trata ArrowDown e Enter no body sem overlay', () => {
    expect(shouldHandleListShortcut({ tagName: 'BODY', key: 'ArrowDown', overlayOpen: false })).toBe(true);
    expect(shouldHandleListShortcut({ tagName: 'BODY', key: 'Enter', overlayOpen: false })).toBe(true);
  });
});

describe('parseSearchHash', () => {
  it('extrai o termo de um hash válido', () => {
    expect(parseSearchHash('#search=react')).toBe('react');
  });

  it('decodifica termos codificados', () => {
    expect(parseSearchHash('#search=caf%C3%A9')).toBe('café');
  });

  it('retorna null para termo malformado', () => {
    expect(parseSearchHash('#search=%E0%A4%A')).toBeNull();
  });

  it('retorna null para outros hashes', () => {
    expect(parseSearchHash('#palette')).toBeNull();
    expect(parseSearchHash('')).toBeNull();
  });
});
