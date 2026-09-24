import { OllamaConfig, ChatMessage } from './types';

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  endpoint: 'http://localhost:11434',
  model: 'qwen3.5:9b',
};

export async function checkOllamaConnection(endpoint: string = DEFAULT_OLLAMA_CONFIG.endpoint): Promise<{
  connected: boolean;
  models: string[];
  latencyMs?: number;
  error?: string;
  isCorsForbidden?: boolean;
}> {
  const startTime = Date.now();
  try {
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    const res = await fetch(`${cleanEndpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const latencyMs = Date.now() - startTime;

    if (res.status === 403) {
      return {
        connected: false,
        models: [],
        latencyMs,
        error: 'CORS_403',
        isCorsForbidden: true,
      };
    }

    if (!res.ok) {
      return { connected: false, models: [], latencyMs, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name || m.model);
    return { connected: true, models, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const msg = err?.message || 'Servidor Ollama indisponível';
    return {
      connected: false,
      models: [],
      latencyMs,
      error: msg,
    };
  }
}

/**
 * Sends a structured prompt to Ollama with explicit num_ctx to prevent context overflow,
 * temperature=0 for deterministic outputs, and AbortSignal support.
 */
export async function queryOllama(
  prompt: string,
  config: OllamaConfig = DEFAULT_OLLAMA_CONFIG,
  signal?: AbortSignal
): Promise<string> {
  const cleanEndpoint = config.endpoint.replace(/\/$/, '');
  const res = await fetch(`${cleanEndpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        num_ctx: 8192,
        temperature: 0,
        num_predict: 2048,
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Ollama CORS 403: Configure OLLAMA_ORIGINS="chrome-extension://*"');
    }
    throw new Error(`Erro no Ollama: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Conversational Mini-Agent helper communicating with local Ollama model (/api/chat).
 */
export async function chatWithOllama(
  messages: ChatMessage[],
  config: OllamaConfig = DEFAULT_OLLAMA_CONFIG,
  signal?: AbortSignal
): Promise<string> {
  const cleanEndpoint = config.endpoint.replace(/\/$/, '');
  const res = await fetch(`${cleanEndpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      options: {
        num_ctx: 4096,
        temperature: 0.6,
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Ollama CORS 403: Configure OLLAMA_ORIGINS="chrome-extension://*"');
    }
    throw new Error(`Erro no Ollama: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.message?.content || 'Nenhuma resposta recebida do modelo.';
}
