// Cifra ponta a ponta do sync: o broker público só vê bytes ilegíveis.
// Chave AES-GCM e tópico derivados da chave de sync via HKDF (Web Crypto nativa).
const enc = new TextEncoder();
const dec = new TextDecoder();

export interface SyncMaterial {
  key: CryptoKey;
  topic: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export async function deriveSyncMaterial(syncKey: string): Promise<SyncMaterial> {
  const base = await crypto.subtle.importKey('raw', enc.encode(syncKey.trim().toUpperCase()), 'HKDF', false, [
    'deriveKey',
    'deriveBits',
  ]);
  const hkdf = (info: string): HkdfParams => ({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: new Uint8Array(0),
    info: enc.encode(info),
  });
  const key = await crypto.subtle.deriveKey(hkdf('favmanager-enc-v2'), base, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  const topicBits = await crypto.subtle.deriveBits(hkdf('favmanager-topic-v2'), base, 128);
  return { key, topic: `favmanager/v2/${toHex(new Uint8Array(topicBits))}` };
}

export async function sealMessage(key: CryptoKey, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return toBase64(out);
}

/** Retorna null para chave errada, payload corrompido ou lixo: nunca lança. */
export async function openMessage(key: CryptoKey, payload: string): Promise<unknown | null> {
  try {
    const bytes = fromBase64(payload);
    if (bytes.length < 13) return null;
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    return JSON.parse(dec.decode(plain));
  } catch {
    return null;
  }
}

/** Divide o catálogo em lotes para não passar do tamanho máximo de mensagem do broker. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
