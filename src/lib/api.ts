// ─── ZERØ COMMAND — api.ts v2.1 ───────────────────────────────────────────────
// Groq API · llama-3.3-70b-versatile (flagship free tier)
//
// KEAMANAN: API key HANYA dari localStorage (input manual user via UI).
// JANGAN pernah baca dari import.meta.env.VITE_* — variabel VITE_* di-inline ke
// bundle JS saat build, jadi kalau di-set di environment build key akan BOCOR
// publik di "view source" situs live. Isi key lewat tombol Settings (setApiKey).

const API_KEY_STORAGE = 'zero-gemini-key';

export function isEnvKey(): boolean {
  // Selalu false: key tidak pernah lagi diambil dari environment/build.
  return false;
}

export function getApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } catch { /* localStorage unavailable */ }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE);
  } catch { /* localStorage unavailable */ }
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

  // Primary: llama-3.3-70b-versatile (best quality on free tier)
  // Fallback: llama-3.1-8b-instant (high rate limit if 70B quota hit)
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (res.status === 429 && model !== models[models.length - 1]) {
        // Rate limited — try fallback model
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return text.trim() || 'No response received.';
    } catch (e) {
      if (model === models[models.length - 1]) throw e;
      // Try next model
    }
  }

  throw new Error('All models failed');
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
