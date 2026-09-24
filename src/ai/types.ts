export interface AiBookmarkItem {
  id: string;
  title: string;
  url: string;
  folderPath?: string;
}

export interface AiSuggestion {
  id: string;
  originalTitle: string;
  suggestedTitle?: string;
  url: string;
  suggestedFolder: string;
  confidence: number;
}

export interface AiProposedPlan {
  suggestedFolders: string[];
  moves: {
    bookmarkId: string;
    bookmarkTitle: string;
    url: string;
    targetFolder: string;
    targetFolderExists: boolean;
    source?: 'domain' | 'ollama' | 'heuristic';
  }[];
  stats?: {
    total: number;
    viaDomain: number;
    viaOllama: number;
    viaHeuristic: number;
    failedBatches: number;
  };
}

export interface OllamaConfig {
  endpoint: string; // default http://localhost:11434
  model: string;    // default llama3 or qwen or user typed
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}
