// ─── ZERØ COMMAND — cloudStorage.ts ──────────────────────────────────────────
// Universal cloud-backed storage: auto-sync ke Cloudflare KV, fallback localStorage
// Pakai ini di semua page sebagai ganti localStorage langsung

const CLOUD_API = '/api/data-kv';
const DEBOUNCE_MS = 1500;

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

// ─── SYNC TOKEN ──────────────────────────────────────────────────────────────
// Endpoint /api/data* sekarang diproteksi (fail-closed) — request wajib bawa
// header X-Sync-Token yang cocok dengan env SYNC_TOKEN di Cloudflare Pages.
// Token user disimpan HANYA di localStorage (di-input manual via Settings),
// tidak pernah di-hardcode/di-bundle. Tanpa token, app tetap jalan penuh
// secara lokal (localStorage) — cuma cloud sync yang non-aktif.

const SYNC_TOKEN_STORAGE = 'zero-sync-token';

export function getSyncToken(): string {
  try { return localStorage.getItem(SYNC_TOKEN_STORAGE) || ''; } catch { return ''; }
}

export function setSyncToken(token: string): void {
  try { localStorage.setItem(SYNC_TOKEN_STORAGE, token.trim()); } catch {}
}

export function clearSyncToken(): void {
  try { localStorage.removeItem(SYNC_TOKEN_STORAGE); } catch {}
}

export function hasSyncToken(): boolean {
  return !!getSyncToken();
}

export function syncHeaders(): Record<string, string> {
  const t = getSyncToken();
  return t ? { 'X-Sync-Token': t } : {};
}

// ─── CORE: get/set dengan cloud sync ─────────────────────────────────────────

export async function cloudGet<T>(key: string, fallback: T): Promise<T> {
  // 1. Coba ambil dari cloud dulu (hanya kalau sync token terpasang)
  if (hasSyncToken()) {
    try {
      const res = await fetch(`${CLOUD_API}?key=${encodeURIComponent(key)}`, {
        cache: 'no-store',
        headers: syncHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.value !== undefined) {
          // Sync ke localStorage buat offline access
          try { localStorage.setItem(key, JSON.stringify(json.value)); } catch {}
          return json.value as T;
        }
      }
    } catch {}
  }

  // 2. Fallback ke localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}

  return fallback;
}

export function cloudSet<T>(key: string, value: T): void {
  // Tulis localStorage seketika (tidak pernah hilang)
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}

  // Debounce cloud write (hanya kalau sync token terpasang)
  if (!hasSyncToken()) return;
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(async () => {
    try {
      await fetch(CLOUD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...syncHeaders() },
        body: JSON.stringify({ key, value }),
      });
    } catch {}
    delete debounceTimers[key];
  }, DEBOUNCE_MS);
}

// ─── HOOK: drop-in replacement untuk useState + localStorage ─────────────────
// Usage: const [tasks, setTasks] = useCloudState('my-key', [])

import { useState, useEffect, useRef, useCallback } from 'react';

export function useCloudState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // Init dari localStorage dulu (instant), lalu cloud override kalau ada
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const [syncing, setSyncing] = useState(false);
  const initialized = useRef(false);

  // On mount: pull dari cloud, replace local kalau ada
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setSyncing(true);
    cloudGet<T>(key, defaultValue).then((cloudVal) => {
      // Kalau cloud kasih data (bukan defaultValue persis), pakai itu
      const localRaw = localStorage.getItem(key);
      if (!localRaw) {
        // Kalau local kosong, pakai cloud
        setState(cloudVal);
      }
      setSyncing(false);
    });
  }, [key]);

  const setter = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
      cloudSet(key, next);
      return next;
    });
  }, [key]);

  return [state, setter, syncing];
}
