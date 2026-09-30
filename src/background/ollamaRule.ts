// Regra DNR que reescreve o Origin das chamadas da própria extensão ao Ollama local.
// Módulo puro: não acessa `chrome` em tempo de importação (testável no Vitest sem o global).

export const OLLAMA_ORIGIN_RULE_ID = 2001;

// Só a porta padrão do Ollama (11434) em localhost, 127.0.0.1 e [::1]. Sintaxe compatível com RE2.
export const OLLAMA_URL_REGEX = '^http://(localhost|127\\.0\\.0\\.1|\\[::1\\]):11434/';

export function buildOllamaOriginRule(extensionId: string): chrome.declarativeNetRequest.Rule {
  return {
    id: OLLAMA_ORIGIN_RULE_ID,
    priority: 1,
    action: {
      // Valores literais dos enums: os enums de @types/chrome não existem em runtime fora do navegador
      type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
      requestHeaders: [
        {
          header: 'origin',
          operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
          value: 'http://localhost',
        },
      ],
    },
    condition: {
      initiatorDomains: [extensionId],
      regexFilter: OLLAMA_URL_REGEX,
      resourceTypes: ['xmlhttprequest' as chrome.declarativeNetRequest.ResourceType],
    },
  };
}
