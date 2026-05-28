// ─── ZERO COMMAND — api.ts ────────────────────────────────────────────────────
// Menggunakan Groq API (GRATIS, limit jauh lebih besar dari Gemini)
// Set VITE_GEMINI_KEY di Cloudflare Environment Variables (nama sama, isi Groq key)

const API_KEY_STORAGE = 'zero-gemini-key';

export function isEnvKey(): boolean {
  return !!import.meta.env.VITE_GEMINI_KEY;
}

export function getApiKey(): string {
  if (import.meta.env.VITE_GEMINI_KEY) {
    return import.meta.env.VITE_GEMINI_KEY as string;
  }
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export interface ClaudeOptions {
  search?: boolean;
  maxTokens?: number;
  systemPrompt?: string;
}

export async function callClaude(
  prompt: string,
  { maxTokens = 2000, systemPrompt }: ClaudeOptions = {}
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';

  return text.trim() || 'No response received.';
}

export function formatTimestamp(date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatFullDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function todayKey(): string {
  return new Date().toDateString();
}
