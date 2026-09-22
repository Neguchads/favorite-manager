import { OllamaConfig } from './types';

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  endpoint: 'http://localhost:11434',
  model: 'llama3',
};

export async function checkOllamaConnection(endpoint: string = DEFAULT_OLLAMA_CONFIG.endpoint): Promise<{
  connected: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    const res = await fetch(`${cleanEndpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return { connected: false, models: [], error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name || m.model);
    return { connected: true, models };
  } catch (err: any) {
    return { connected: false, models: [], error: err?.message || 'Servidor Ollama indisponível' };
  }
}

export async function queryOllama(
  prompt: string,
  config: OllamaConfig = DEFAULT_OLLAMA_CONFIG
): Promise<string> {
  const cleanEndpoint = config.endpoint.replace(/\/$/, '');
  const res = await fetch(`${cleanEndpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      format: 'json',
    }),
  });

  if (!res.ok) {
    throw new Error(`Erro no Ollama: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.response;
}
