// ─── ZERØ COMMAND — fx.ts ─────────────────────────────────────────────────────
// Kurs USD→IDR dari API GRATIS & keyless (CORS-friendly, verified 2026):
//   1) Frankfurter (ECB reference rates)  2) open.er-api.com (fallback)
// Dipakai untuk menggabung neraca multi-mata-uang jadi satu total IDR.
// Kalau semua gagal → return null (jujur: total gabungan tidak ditampilkan).

import { useEffect, useState } from "react";

const CACHE_KEY = "zero-fx-usdidr";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 jam — kurs harian, tak perlu sering

async function fetchUsdIdr(): Promise<number | null> {
  // Frankfurter (ECB)
  try {
    const r = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR");
    if (r.ok) {
      const d = await r.json();
      const v = d?.rates?.IDR;
      if (typeof v === "number" && v > 0) return v;
    }
  } catch { /* try next */ }
  // open.er-api.com
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    if (r.ok) {
      const d = await r.json();
      const v = d?.rates?.IDR;
      if (typeof v === "number" && v > 0) return v;
    }
  } catch { /* give up */ }
  return null;
}

/** USD→IDR rate. Returns null while loading or if all sources fail (never a guess). */
export function useUsdIdr(): number | null {
  const [rate, setRate] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { v, t } = JSON.parse(raw);
        if (typeof v === "number" && Date.now() - t < TTL_MS) return v;
      }
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    let alive = true;
    // Refresh if no fresh cache
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { t } = JSON.parse(raw);
        if (Date.now() - t < TTL_MS) return;
      }
    } catch { /* ignore */ }
    fetchUsdIdr().then((v) => {
      if (!alive || v == null) return;
      setRate(v);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ v, t: Date.now() })); } catch { /* ignore */ }
    });
    return () => { alive = false; };
  }, []);

  return rate;
}

/** Parse a loose money string ("Rp 3.750.000", "1,200.50", "5jt", "500rb") to a number.
 *  Dukungan sufiks SAMA dengan parser Keuangan (parseAmountInput) — sebelumnya
 *  "5jt" dibaca 5 (huruf dibuang diam-diam) dan merusak Net Worth jutaan kali lipat. */
export function parseAmount(s: string): number {
  if (!s) return 0;
  const compact = s.toLowerCase().replace(/\s+/g, "");
  const suffix = compact.match(/^(?:rp)?([0-9.,]+)(rb|ribu|k|jt|juta)$/);
  if (suffix) {
    const mult = suffix[2] === "jt" || suffix[2] === "juta" ? 1e6 : 1e3;
    return parseAmount(suffix[1]) * mult;
  }
  // strip everything but digits, separators
  const cleaned = s.replace(/[^0-9.,]/g, "");
  if (!cleaned) return 0;
  // If both . and , present, assume the LAST one is the decimal sep
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  let normalized = cleaned;
  if (lastDot !== -1 && lastComma !== -1) {
    const dec = Math.max(lastDot, lastComma);
    const intPart = cleaned.slice(0, dec).replace(/[.,]/g, "");
    const decPart = cleaned.slice(dec + 1).replace(/[.,]/g, "");
    normalized = `${intPart}.${decPart}`;
  } else if (lastComma !== -1) {
    // only commas — treat as thousands unless it looks like a decimal (,dd at end)
    normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  } else {
    // only dots — treat as thousands unless .dd at end
    normalized = /\.\d{1,2}$/.test(cleaned) ? cleaned.replace(/,/g, "") : cleaned.replace(/\./g, "");
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

/** Convert an amount in a currency to IDR using the live rate.
 *  Mata uang dinormalisasi ("usd", " US$ " → USD) — field lama berupa teks
 *  bebas, dan "usd" huruf kecil sempat dihitung sebagai Rupiah mentah. */
export function toIDR(amount: number, currency: string, usdIdr: number | null): number | null {
  const c = (currency || "").trim().toUpperCase();
  if (c.includes("USD") || c.includes("$")) return usdIdr != null ? amount * usdIdr : null;
  return amount; // IDR / kosong / tak dikenal: nilai apa adanya (basis Rupiah)
}

export function formatIDR(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
