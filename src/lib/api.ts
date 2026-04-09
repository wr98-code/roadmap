// ─── ZERO COMMAND — api.ts ────────────────────────────────────────────────────
// Menggunakan Gemini API (GRATIS) dari Google
// Set VITE_GEMINI_KEY di Cloudflare Environment Variables

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

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
