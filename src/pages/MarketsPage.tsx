// ─── ZERØ COMMAND — MarketsPage.tsx ──────────────────────────────────────────
// Live market data: CoinGecko (crypto) + Yahoo Finance (stocks) + Fear & Greed
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Activity, Wifi, WifiOff } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  currency: string;
  group: 'crypto' | 'stocks' | 'commodities' | 'macro' | 'sentiment';
  label?: string;
  marketCap?: number;
}

interface MarketState {
  items: Record<string, MarketItem>;
  lastUpdate: string | null;
}

const STORAGE_KEY = 'zero-markets-live-v3';

function loadCache(): MarketState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { items: {}, lastUpdate: null }; }
  catch { return { items: {}, lastUpdate: null }; }
}
function saveCache(s: MarketState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchCoinGecko(): Promise<Partial<Record<string, MarketItem>>> {
  const [priceRes, globalRes] = await Promise.all([
    fetchWithTimeout(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
      9000
    ),
    fetchWithTimeout('https://api.coingecko.com/api/v3/global', 9000),
  ]);

  const items: Partial<Record<string, MarketItem>> = {};

  if (priceRes.ok) {
    const cg = await priceRes.json();
    if (cg.bitcoin) items['BTC'] = {
      symbol: 'BTC', name: 'Bitcoin',
      price: cg.bitcoin.usd, change24h: cg.bitcoin.usd_24h_change,
      currency: 'USD', group: 'crypto', marketCap: cg.bitcoin.usd_market_cap,
    };
    if (cg.ethereum) items['ETH'] = {
      symbol: 'ETH', name: 'Ethereum',
      price: cg.ethereum.usd, change24h: cg.ethereum.usd_24h_change,
      currency: 'USD', group: 'crypto', marketCap: cg.ethereum.usd_market_cap,
    };
  }

  if (globalRes.ok) {
    const gd = (await globalRes.json()).data;
    if (gd) {
      items['MCAP'] = {
        symbol: 'MCAP', name: 'Crypto Market Cap',
        price: gd.total_market_cap?.usd || 0,
        change24h: gd.market_cap_change_percentage_24h_usd || 0,
        currency: 'USD', group: 'crypto',
      };
      items['BTCD'] = {
        symbol: 'BTC.D', name: 'BTC Dominance',
        price: gd.market_cap_percentage?.btc || 0,
        change24h: 0, currency: '%', group: 'crypto',
      };
    }
  }

  return items;
}

async function fetchFearGreed(): Promise<MarketItem | null> {
  try {
    const res = await fetchWithTimeout('https://api.alternative.me/fng/?limit=1', 6000);
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.data?.[0];
    if (!d) return null;
    return {
      symbol: 'F&G', name: 'Fear & Greed',
      price: parseInt(d.value), change24h: 0,
      currency: 'index', group: 'sentiment',
      label: d.value_classification,
    };
  } catch { return null; }
}

const YF_SYMBOLS = [
  { key: 'SPX',  yahoo: '%5EGSPC',  name: 'S&P 500',    group: 'stocks'      as const },
  { key: 'NDX',  yahoo: '%5EIXIC',  name: 'NASDAQ',      group: 'stocks'      as const },
  { key: 'IHSG', yahoo: '%5EJKSE',  name: 'IHSG',        group: 'stocks'      as const },
  { key: 'GOLD', yahoo: 'GC%3DF',   name: 'Gold XAU',    group: 'commodities' as const },
  { key: 'WTI',  yahoo: 'CL%3DF',   name: 'WTI Crude',   group: 'commodities' as const },
  { key: 'DXY',  yahoo: 'DX-Y.NYB', name: 'DXY',         group: 'macro'       as const },
];

async function fetchYahooFinance(): Promise<Partial<Record<string, MarketItem>>> {
  const items: Partial<Record<string, MarketItem>> = {};
  await Promise.allSettled(
    YF_SYMBOLS.map(async ({ key, yahoo, name, group }) => {
      try {
        const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${yahoo}?interval=1d&range=1d`;
        const res = await fetchWithTimeout(url, 10000);
        if (!res.ok) return;
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return;
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change24h = prev ? ((price - prev) / prev) * 100 : 0;
        items[key] = { symbol: key, name, price, change24h, currency: meta.currency || 'USD', group };
      } catch {}
    })
  );
  return items;
}

// ─── QUICK LINKS ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: 'Coinglass',     url: 'https://coinglass.com',               desc: 'Liquidation + OI + Funding', group: 'crypto' },
  { label: 'CryptoQuant',   url: 'https://cryptoquant.com',             desc: 'On-chain analytics',         group: 'crypto' },
  { label: 'Glassnode',     url: 'https://glassnode.com',               desc: 'NUPL + on-chain',            group: 'crypto' },
  { label: 'LookIntoBTC',   url: 'https://lookintobitcoin.com',         desc: 'Cycle indicators',           group: 'crypto' },
  { label: 'TradingView',   url: 'https://tradingview.com',             desc: 'Charts + scripting',         group: 'chart'  },
  { label: 'Bybit',         url: 'https://bybit.com',                   desc: 'Futures trading',            group: 'chart'  },
  { label: 'Farside ETF',   url: 'https://farside.co.uk',               desc: 'BTC ETF flow',              group: 'macro'  },
  { label: 'FRED',          url: 'https://fred.stlouisfed.org',         desc: 'Fed data',                  group: 'macro'  },
  { label: 'ForexFactory',  url: 'https://forexfactory.com',            desc: 'Econ kalender',             group: 'macro'  },
  { label: 'DeFi Llama',    url: 'https://defillama.com',               desc: 'TVL + DeFi stats',          group: 'research'},
  { label: 'Dune',          url: 'https://dune.com',                    desc: 'On-chain SQL',               group: 'research'},
  { label: 'Token Terminal',url: 'https://tokenterminal.com',           desc: 'Protocol fundamentals',     group: 'research'},
];
const GROUP_LABELS: Record<string, string> = {
  crypto: '₿ CRYPTO / FUTURES', chart: '📊 CHARTS & TRADING',
  macro: '🌍 MACRO', research: '🔬 RESEARCH',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtPrice(price: number, currency: string, isMcap = false): string {
  if (currency === '%') return `${price.toFixed(2)}%`;
  if (currency === 'index') return price.toString();
  if (isMcap || price > 1_000_000_000) {
    if (price >= 1e12) return `$${(price / 1e12).toFixed(2)}T`;
    if (price >= 1e9) return `$${(price / 1e9).toFixed(2)}B`;
    return `$${(price / 1e6).toFixed(0)}M`;
  }
  if (price >= 10000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(4)}`;
}

function fgColor(val: number): string {
  if (val >= 75) return '#ef4444';
  if (val >= 55) return '#f59e0b';
  if (val >= 45) return '#94a3b8';
  if (val >= 25) return '#3b82f6';
  return '#8b5cf6';
}

const GROUP_ORDER: MarketItem['group'][] = ['crypto', 'stocks', 'commodities', 'macro', 'sentiment'];
const GROUP_TITLE: Record<string, string> = {
  crypto: '₿ Crypto', stocks: '📈 Equities', commodities: '🥇 Commodities',
  macro: '🌍 Macro', sentiment: '😱 Sentiment',
};

// ─── PRICE CARD ───────────────────────────────────────────────────────────────
function PriceCard({ item }: { item: MarketItem }) {
  const isUp = item.change24h >= 0;
  const isMcap = item.symbol === 'MCAP';
  const isFG = item.group === 'sentiment';
  const fgVal = isFG ? item.price : 0;

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'border-color .15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: 1, margin: 0 }}>
            {item.symbol}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0, marginTop: 1 }}>{item.name}</p>
        </div>
        {!isFG && item.change24h !== 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isUp ? '#22c55e' : '#ef4444',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? '+' : ''}{item.change24h.toFixed(2)}%
          </span>
        )}
        {isFG && (
          <span style={{ fontSize: 11, fontWeight: 700, color: fgColor(fgVal) }}>
            {item.label}
          </span>
        )}
      </div>
      <p style={{
        fontSize: isMcap ? 16 : 20, fontWeight: 700,
        fontFamily: 'monospace', color: 'var(--color-text)',
        margin: 0,
        ...(isFG ? { color: fgColor(fgVal) } : {}),
      }}>
        {fmtPrice(item.price, item.currency, isMcap)}
      </p>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function MarketsPage() {
  const [state, setState] = useState<MarketState>(loadCache);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const refresh = useCallback(async () => {
    if (!online) return;
    setLoading(true);
    setErrors([]);

    const newErrors: string[] = [];
    const newItems: Record<string, MarketItem> = {};

    // 1. CoinGecko
    try {
      const cgItems = await fetchCoinGecko();
      Object.assign(newItems, cgItems);
    } catch { newErrors.push('CoinGecko'); }

    // 2. Fear & Greed
    try {
      const fg = await fetchFearGreed();
      if (fg) newItems['FNG'] = fg;
    } catch { newErrors.push('Fear&Greed'); }

    // 3. Yahoo Finance
    try {
      const yfItems = await fetchYahooFinance();
      Object.assign(newItems, yfItems);
    } catch { newErrors.push('Stocks'); }

    if (Object.keys(newItems).length === 0 && state.items && Object.keys(state.items).length > 0) {
      // All failed — keep cache, show error
      newErrors.push('Semua sumber gagal, menampilkan cache terakhir.');
    }

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const next: MarketState = {
      items: Object.keys(newItems).length > 0 ? newItems : state.items,
      lastUpdate: now,
    };
    setState(next);
    saveCache(next);
    if (newErrors.length) setErrors(newErrors);
    setLoading(false);
  }, [online, state.items]);

  // Auto-fetch on mount if cache is empty or stale
  useEffect(() => {
    if (!state.lastUpdate || Object.keys(state.items).length === 0) {
      refresh();
    }
  }, []); // eslint-disable-line

  const grouped = GROUP_ORDER.map(g => ({
    group: g,
    items: Object.values(state.items).filter(i => i.group === g),
  })).filter(g => g.items.length > 0);

  const qlGrouped = QUICK_LINKS.reduce<Record<string, typeof QUICK_LINKS>>((acc, l) => {
    if (!acc[l.group]) acc[l.group] = [];
    acc[l.group].push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="font-heading text-lg" style={{ color: 'var(--color-text)' }}>Market Prices</h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {online
              ? <><Wifi size={11} color="#22c55e" /> Live data</>
              : <><WifiOff size={11} color="#ef4444" /> Offline</>}
            {state.lastUpdate && ` · Updated ${state.lastUpdate}`}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading || !online}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--color-text)', color: 'var(--color-bg)',
            border: 'none', borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            cursor: loading || !online ? 'not-allowed' : 'pointer',
            opacity: loading || !online ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          {loading ? 'Fetching...' : 'Refresh'}
        </button>
      </div>

      {/* Errors (non-blocking) */}
      {errors.length > 0 && !loading && (
        <div style={{
          fontSize: 12, color: '#f59e0b',
          background: '#f59e0b10', padding: '8px 12px',
          borderRadius: 8, border: '1px solid #f59e0b20',
        }}>
          ⚠️ Partial data: {errors.join(', ')} gagal. Data lain tetap ditampilkan.
        </div>
      )}

      {/* Loading skeleton */}
      {loading && Object.keys(state.items).length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              height: 90, borderRadius: 12,
              background: 'var(--color-card)', border: '1px solid var(--color-border)',
              animation: 'pulse 1.5s ease-in-out infinite',
              opacity: 0.6,
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && Object.keys(state.items).length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'var(--color-card)', borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}>
          <Activity size={36} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Klik Refresh untuk load harga live</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>
            Sumber: CoinGecko · Yahoo Finance · Alternative.me
          </p>
        </div>
      )}

      {/* Price Groups */}
      {grouped.map(({ group, items }) => (
        <div key={group}>
          <p style={{
            fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
            letterSpacing: 1.5, color: 'var(--color-muted)',
            marginBottom: 10, textTransform: 'uppercase',
          }}>
            {GROUP_TITLE[group]}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {items.map(item => <PriceCard key={item.symbol} item={item} />)}
          </div>
        </div>
      ))}

      {/* Quick Links */}
      {Object.entries(qlGrouped).map(([group, links]) => (
        <div key={group} style={{
          background: 'var(--color-card)', borderRadius: 12,
          border: '1px solid var(--color-border)', padding: '14px 16px',
        }}>
          <p style={{
            fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
            color: 'var(--color-muted)', letterSpacing: 1.5, marginBottom: 10,
          }}>
            {GROUP_LABELS[group]}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {links.map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  textDecoration: 'none', transition: 'border-color .15s',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {link.label} <ExternalLink size={9} color="var(--color-muted)" />
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{link.desc}</span>
              </a>
            ))}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
