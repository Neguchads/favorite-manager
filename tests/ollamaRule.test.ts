import { describe, it, expect } from 'vitest';
import { buildOllamaOriginRule, OLLAMA_ORIGIN_RULE_ID } from '../src/background/ollamaRule';

describe('buildOllamaOriginRule', () => {
  const rule = buildOllamaOriginRule('ext-id-123');
  const regex = new RegExp(rule.condition.regexFilter!);

  it('aceita só a porta 11434 em localhost, 127.0.0.1 e [::1]', () => {
    expect(regex.test('http://localhost:11434/api/tags')).toBe(true);
    expect(regex.test('http://127.0.0.1:11434/api/chat')).toBe(true);
    expect(regex.test('http://[::1]:11434/api/tags')).toBe(true);
  });

  it('recusa outras portas e outros sites', () => {
    expect(regex.test('http://localhost:3000/')).toBe(false);
    expect(regex.test('https://example.com/')).toBe(false);
    expect(regex.test('http://localhost:114340/')).toBe(false);
  });

  it('mantém o restante da regra: só a própria extensão, só XHR, Origin fixo', () => {
    expect(rule.id).toBe(OLLAMA_ORIGIN_RULE_ID);
    expect(rule.id).toBe(2001);
    expect(rule.condition.initiatorDomains).toEqual(['ext-id-123']);
    expect(rule.condition.requestDomains).toBeUndefined();
    expect(rule.condition.resourceTypes).toEqual(['xmlhttprequest']);
    expect(rule.action.type).toBe('modifyHeaders');
    expect(rule.action.requestHeaders).toEqual([{ header: 'origin', operation: 'set', value: 'http://localhost' }]);
  });
});
