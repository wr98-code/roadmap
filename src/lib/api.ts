// ─── ZERO COMMAND — api.ts ────────────────────────────────────────────────────
// Env key takes priority over localStorage key.
// Set VITE_ANTHROPIC_KEY in your .env file for zero-friction usage.

const API_KEY_STORAGE = 'zero-anthropic-key';

export function isEnvKey(): boolean {
  return !!import.meta.env.VITE_ANTHROPIC_KEY;
}

export function getApiKey(): string {
  // Env var takes priority
  if (import.meta.env.VITE_ANTHROPIC_KEY) {
    return import.meta.env.VITE_ANTHROPIC_KEY as string;
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
  { search = true, maxTokens = 2000, systemPrompt }: ClaudeOptions = {}
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');

  const body: Record<string, unknown> = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  if (search) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = ((data.content as any[]) || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return text || 'No response received.';
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
