// ─── ZERØ COMMAND — prices.ts ─────────────────────────────────────────────────
// Harga kripto resilient dari API GRATIS keyless, dgn fallback berlapis supaya
// harga tidak blank saat satu sumber rate-limit / CORS:
//   1) CoinGecko  2) Coinpaprika  3) Binance (last resort; blokir IP US → 451)
// Output meniru shape CoinGecko simple/price: { [geckoId]: { usd, usd_24h_change } }
// jadi konsumen lama cukup ganti fetch-nya, sisanya tetap.

type PriceMap = Record<string, { usd: number; usd_24h_change: number }>;

const PAPRIKA: Record<string, string> = {
  bitcoin: "btc-bitcoin", ethereum: "eth-ethereum", solana: "sol-solana",
  binancecoin: "bnb-binance-coin", ripple: "xrp-xrp",
};
const BINANCE: Record<string, string> = {
  bitcoin: "BTCUSDT", ethereum: "ETHUSDT", solana: "SOLUSDT",
  binancecoin: "BNBUSDT", ripple: "XRPUSDT",
};

async function withTimeout(url: string, ms = 8000): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { signal: ac.signal, cache: "no-store" }); }
  finally { clearTimeout(t); }
}

async function fromCoinGecko(ids: string[]): Promise<PriceMap | null> {
  try {
    const r = await withTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`);
    if (!r.ok) return null;
    const d = await r.json();
    const out: PriceMap = {};
    for (const id of ids) {
      if (typeof d?.[id]?.usd === "number") out[id] = { usd: d[id].usd, usd_24h_change: d[id].usd_24h_change ?? 0 };
    }
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

async function fromCoinpaprika(ids: string[]): Promise<PriceMap | null> {
  try {
    const results = await Promise.all(ids.map(async (id) => {
      const pid = PAPRIKA[id];
      if (!pid) return null;
      const r = await withTimeout(`https://api.coinpaprika.com/v1/tickers/${pid}`, 7000);
      if (!r.ok) return null;
      const d = await r.json();
      const usd = d?.quotes?.USD?.price;
      if (typeof usd !== "number") return null;
      return [id, { usd, usd_24h_change: d.quotes.USD.percent_change_24h ?? 0 }] as const;
    }));
    const out: PriceMap = {};
    for (const row of results) if (row) out[row[0]] = row[1];
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

async function fromBinance(ids: string[]): Promise<PriceMap | null> {
  try {
    const results = await Promise.all(ids.map(async (id) => {
      const sym = BINANCE[id];
      if (!sym) return null;
      const r = await withTimeout(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`, 7000);
      if (!r.ok) return null;
      const d = await r.json();
      const usd = parseFloat(d?.lastPrice);
      if (!isFinite(usd)) return null;
      return [id, { usd, usd_24h_change: parseFloat(d?.priceChangePercent) || 0 }] as const;
    }));
    const out: PriceMap = {};
    for (const row of results) if (row) out[row[0]] = row[1];
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

/**
 * Resilient CoinGecko-compatible price fetch.
 * Returns {} only if every source failed (caller keeps last good values).
 */
export async function getSimplePrice(ids: string[]): Promise<PriceMap> {
  return (await fromCoinGecko(ids))
      ?? (await fromCoinpaprika(ids))
      ?? (await fromBinance(ids))
      ?? {};
}
