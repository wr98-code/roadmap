// ─── ZERØ COMMAND — MarketsPage.tsx ──────────────────────────────────────────
// Live market data: CoinGecko (crypto) + Yahoo Finance (stocks/macro) + Fear & Greed
// No API keys needed. All free public APIs.
import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Activity, Wifi, WifiOff } from 'lucide-react';
import { Slab, PanelHead, Badge, PageTitle, tLabelStyle, SEAM } from '@/components/terminal';

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

const STORAGE_KEY = 'zero-markets-live-v4';

function loadCache(): MarketState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { items: {}, lastUpdate: null }; }
  catch { return { items: {}, lastUpdate: null }; }
}
function saveCache(s: MarketState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────
async function fetchTimeout(url: string, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(id); }
}

// ─── COINGECKO ────────────────────────────────────────────────────────────────
async function fetchCoinGecko(): Promise<Partial<Record<string, MarketItem>>> {
  const [priceRes, globalRes] = await Promise.all([
    fetchTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'),
    fetchTimeout('https://api.coingecko.com/api/v3/global'),
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

// ─── FEAR & GREED ─────────────────────────────────────────────────────────────
async function fetchFearGreed(): Promise<MarketItem | null> {
  try {
    const res = await fetchTimeout('https://api.alternative.me/fng/?limit=1', 6000);
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.data?.[0];
    if (!d) return null;
    return {
      symbol: 'F&G', name: 'Fear & Greed',
      price: parseInt(d.value), change24h: 0,
      currency: 'index', group: 'sentiment', label: d.value_classification,
    };
  } catch { return null; }
}

// ─── YAHOO FINANCE via allorigins proxy ───────────────────────────────────────
// Raw Yahoo symbols (NOT pre-encoded — URL encoding handled by encodeURIComponent)
const YF_SYMBOLS = [
  { key: 'SPX',  yahoo: '^GSPC',    name: 'S&P 500',   group: 'stocks'      as const },
  { key: 'NDX',  yahoo: '^IXIC',    name: 'NASDAQ',    group: 'stocks'      as const },
  { key: 'IHSG', yahoo: '^JKSE',    name: 'IHSG',      group: 'stocks'      as const },
  { key: 'GOLD', yahoo: 'GC=F',     name: 'Gold XAU',  group: 'commodities' as const },
  { key: 'WTI',  yahoo: 'CL=F',     name: 'WTI Crude', group: 'commodities' as const },
  { key: 'DXY',  yahoo: 'DX-Y.NYB', name: 'DXY',       group: 'macro'       as const },
];

// Try multiple proxy strategies in order
async function fetchYahooSymbol(yahoo: string): Promise<{ price: number; change: number; currency: string } | null> {
  const cleanSymbol = yahoo;

  // Strategy 1: allorigins wrapping Yahoo Finance v8
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=1d&range=1d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    const res = await fetchTimeout(proxyUrl, 9000);
    if (res.ok) {
      const outer = await res.json();
      const inner = JSON.parse(outer.contents);
      const meta = inner?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = prev ? ((price - prev) / prev) * 100 : 0;
        return { price, change, currency: meta.currency || 'USD' };
      }
    }
  } catch {}

  // Strategy 2: corsproxy.io fallback
  try {
    const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=1d&range=1d`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;
    const res = await fetchTimeout(proxyUrl, 9000);
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = prev ? ((price - prev) / prev) * 100 : 0;
        return { price, change, currency: meta.currency || 'USD' };
      }
    }
  } catch {}

  return null;
}

async function fetchYahooFinance(): Promise<Partial<Record<string, MarketItem>>> {
  const items: Partial<Record<string, MarketItem>> = {};
  await Promise.allSettled(
    YF_SYMBOLS.map(async ({ key, yahoo, name, group }) => {
      try {
        const result = await fetchYahooSymbol(yahoo);
        if (result) {
          items[key] = {
            symbol: key, name, group,
            price: result.price,
            change24h: result.change,
            currency: result.currency,
          };
        }
      } catch {}
    })
  );
  return items;
}

// ─── QUICK LINKS ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: 'Coinglass',      url: 'https://coinglass.com',             desc: 'Liquidation + OI + Funding', group: 'crypto'   },
  { label: 'CryptoQuant',    url: 'https://cryptoquant.com',           desc: 'On-chain analytics',         group: 'crypto'   },
  { label: 'Glassnode',      url: 'https://glassnode.com',             desc: 'NUPL + on-chain',            group: 'crypto'   },
  { label: 'LookIntoBTC',    url: 'https://lookintobitcoin.com',       desc: 'Cycle indicators',           group: 'crypto'   },
  { label: 'TradingView',    url: 'https://tradingview.com',           desc: 'Charts + scripting',         group: 'chart'    },
  { label: 'Bybit',          url: 'https://bybit.com',                 desc: 'Futures trading',            group: 'chart'    },
  { label: 'Farside ETF',    url: 'https://farside.co.uk',             desc: 'BTC ETF flow',               group: 'macro'    },
  { label: 'FRED',           url: 'https://fred.stlouisfed.org',       desc: 'Fed data',                   group: 'macro'    },
  { label: 'ForexFactory',   url: 'https://forexfactory.com',          desc: 'Economic calendar',          group: 'macro'    },
  { label: 'DeFi Llama',     url: 'https://defillama.com',             desc: 'TVL + DeFi stats',           group: 'research' },
  { label: 'Dune',           url: 'https://dune.com',                  desc: 'On-chain SQL',               group: 'research' },
  { label: 'Token Terminal', url: 'https://tokenterminal.com',         desc: 'Protocol fundamentals',      group: 'research' },
];

const GROUP_LABELS: Record<string, string> = {
  crypto: '₿ CRYPTO / FUTURES', chart: '📊 CHARTS & TRADING',
  macro: '🌍 MACRO', research: '🔬 RESEARCH',
};

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
function fmtPrice(price: number, currency: string, isMcap = false): string {
  if (currency === '%') return `${price.toFixed(2)}%`;
  if (currency === 'index') return price.toString();
  if (isMcap || price > 1_000_000_000) {
    if (price >= 1e12) return `$${(price / 1e12).toFixed(2)}T`;
    if (price >= 1e9)  return `$${(price / 1e9).toFixed(2)}B`;
    return `$${(price / 1e6).toFixed(0)}M`;
  }
  if (price >= 10000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1)     return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(4)}`;
}

// Contrarian Fear & Greed palette — all CSS vars so it holds in light AND dark.
// extreme greed = loss/red (overheated) … extreme fear = gain/green (opportunity)
function fgColor(val: number): string {
  if (val >= 75) return 'var(--loss)';
  if (val >= 55) return 'var(--warning)';
  if (val >= 45) return 'var(--color-muted)';
  if (val >= 25) return 'var(--color-primary)';
  return 'var(--gain)';
}

const GROUP_ORDER: MarketItem['group'][] = ['crypto', 'stocks', 'commodities', 'macro', 'sentiment'];
const GROUP_TITLE: Record<string, string> = {
  crypto: '₿ Crypto', stocks: '📈 Equities',
  commodities: '🥇 Commodities', macro: '🌍 Macro', sentiment: '😱 Sentiment',
};

// Small decorative category dots — muted brand hues, all CSS vars (theme-safe).
const GROUP_DOT: Record<string, string> = {
  crypto: 'var(--gold)',
  stocks: 'var(--color-primary)',
  commodities: 'var(--warning)',
  macro: 'var(--color-muted)',
  sentiment: 'var(--gain)',
};

// ─── PRICE CELL — flat terminal readout, joined by hairline seams ─────────────
function PriceCell({ item }: { item: MarketItem }) {
  const isUp = item.change24h >= 0;
  const isMcap = item.symbol === 'MCAP';
  const isFG = item.group === 'sentiment';
  const fgVal = isFG ? item.price : 0;
  const dot = isFG ? fgColor(fgVal) : (GROUP_DOT[item.group] || 'var(--color-muted)');

  return (
    <div style={{
      borderTop: `1px solid ${SEAM}`, borderLeft: `1px solid ${SEAM}`,
      padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
            {item.symbol}
          </span>
        </span>
        {!isFG && item.change24h !== 0 && (
          <span className="num" style={{
            display: 'flex', alignItems: 'center', gap: 2,
            fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
            fontSize: 10, fontWeight: 700,
            color: isUp ? 'var(--gain)' : 'var(--loss)',
            background: isUp ? 'var(--gain-soft)' : 'var(--loss-soft)',
            padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
          }}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? '+' : ''}{item.change24h.toFixed(2)}%
          </span>
        )}
        {isFG && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: fgColor(fgVal), background: 'var(--color-surface)',
            padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
          }}>
            {item.label}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {item.name}
        </span>
        <span className="num" style={{
          fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
          fontSize: isMcap ? 14 : 17, fontWeight: 700,
          color: isFG ? fgColor(fgVal) : 'var(--color-text)',
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          {fmtPrice(item.price, item.currency, isMcap)}
        </span>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const AUTO_REFRESH_SEC = 3 * 60; // 3 minutes

export function MarketsPage() {
  const [state, setState] = useState<MarketState>(loadCache);
  const [loading, setLoading] = useState(false);
  const [partialErrors, setPartialErrors] = useState<string[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SEC);

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
    setPartialErrors([]);

    const errors: string[] = [];
    const newItems: Record<string, MarketItem> = {};

    // Fetch all 3 sources in parallel
    const [cgResult, fgResult, yfResult] = await Promise.allSettled([
      fetchCoinGecko(),
      fetchFearGreed(),
      fetchYahooFinance(),
    ]);

    if (cgResult.status === 'fulfilled') Object.assign(newItems, cgResult.value);
    else errors.push('CoinGecko');

    if (fgResult.status === 'fulfilled' && fgResult.value) newItems['FNG'] = fgResult.value;
    else errors.push('Fear & Greed');

    if (yfResult.status === 'fulfilled') Object.assign(newItems, yfResult.value);
    else errors.push('Yahoo Finance');

    const hasData = Object.keys(newItems).length > 0;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const next: MarketState = {
      items: hasData ? newItems : state.items,
      lastUpdate: hasData ? now : state.lastUpdate,
    };
    setState(next);
    saveCache(next);
    if (errors.length) setPartialErrors(errors);
    setLoading(false);
  }, [online, state.items, state.lastUpdate]);

  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    refreshRef.current(); // load on mount always
    setCountdown(AUTO_REFRESH_SEC);
    const intervalId = setInterval(() => {
      refreshRef.current();
      setCountdown(AUTO_REFRESH_SEC);
    }, AUTO_REFRESH_SEC * 1000);
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line

  // Countdown ticker (1s)
  useEffect(() => {
    const tickId = setInterval(() => {
      setCountdown(c => c <= 1 ? AUTO_REFRESH_SEC : c - 1);
    }, 1000);
    return () => clearInterval(tickId);
  }, []);

  // Auto-fetch on mount is handled by the auto-refresh interval above

  const grouped = GROUP_ORDER.map(g => ({
    group: g,
    items: Object.values(state.items).filter(i => i.group === g),
  })).filter(g => g.items.length > 0);

  const qlGrouped = QUICK_LINKS.reduce<Record<string, typeof QUICK_LINKS>>((acc, l) => {
    if (!acc[l.group]) acc[l.group] = [];
    acc[l.group].push(l);
    return acc;
  }, {});

  const hasData = Object.keys(state.items).length > 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageTitle
        title="Market Prices"
        subtitle="Live multi-asset board · crypto · equities · commodities · macro"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              color: online ? 'var(--gain)' : 'var(--warning)',
              background: online ? 'var(--gain-soft)' : 'rgba(224,162,49,0.12)',
              padding: '5px 9px', borderRadius: 6, whiteSpace: 'nowrap',
            }}>
              {online ? <Wifi size={11} /> : <WifiOff size={11} />}
              {online ? 'LIVE' : 'OFFLINE'}
            </span>
            <button
              onClick={refresh}
              disabled={loading || !online}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--rail-active-bg)', color: 'var(--color-primary)',
                border: '1px solid var(--rail-active-border)', borderRadius: 7, padding: '8px 14px',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: loading || !online ? 'not-allowed' : 'pointer',
                opacity: loading || !online ? 0.55 : 1,
                transition: 'opacity .15s',
              }}
            >
              <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              {loading ? 'Fetching' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Partial errors — non-blocking warning (offline feed banner) */}
      {partialErrors.length > 0 && !loading && (
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--warning)',
          background: 'rgba(224,162,49,0.12)', padding: '9px 13px',
          borderRadius: 8, border: '1px solid rgba(224,162,49,0.30)',
        }}>
          ⚠️ {partialErrors.join(', ')} gagal fetch. Data lain tetap ditampilkan.
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !hasData && (
        <Slab>
          <PanelHead title="Global Price Board" right={<Badge tone="muted">Loading</Badge>} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', background: 'var(--glass-bg)', marginTop: -1, marginLeft: -1 }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{
                  borderTop: `1px solid ${SEAM}`, borderLeft: `1px solid ${SEAM}`,
                  height: 74, background: 'var(--color-surface)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          </div>
        </Slab>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <Slab>
          <PanelHead title="Global Price Board" right={<Badge tone="muted">No Data</Badge>} />
          <div style={{ textAlign: 'center', padding: '72px 20px', background: 'var(--glass-bg)' }}>
            <Activity size={34} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-muted)', fontSize: 14 }}>Klik Refresh untuk load harga live</p>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontSize: 11, marginTop: 6, letterSpacing: '0.04em' }}>
              CoinGecko · Yahoo Finance · Alternative.me — semua gratis
            </p>
          </div>
        </Slab>
      )}

      {/* Price Board — flat panels, hairline seams, dense readouts */}
      {hasData && (
        <Slab>
          <PanelHead
            title="Global Price Board"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {state.lastUpdate && (
                  <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                    UPD {state.lastUpdate}
                  </span>
                )}
                <Badge tone={online ? 'gain' : 'warning'}>{Object.keys(state.items).length} FEEDS</Badge>
              </div>
            }
          />
          {grouped.map(({ group, items }, gi) => (
            <div key={group}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', background: 'var(--color-surface)',
                borderBottom: `1px solid ${SEAM}`,
                ...(gi > 0 ? { borderTop: `1px solid ${SEAM}` } : {}),
              }}>
                <span style={tLabelStyle}>{GROUP_TITLE[group]}</span>
                <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.08em' }}>{items.length}</span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', background: 'var(--glass-bg)', marginTop: -1, marginLeft: -1 }}>
                  {items.map(item => <PriceCell key={item.symbol} item={item} />)}
                </div>
              </div>
            </div>
          ))}
          {/* Footer status line — sources + auto-refresh countdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '9px 16px', borderTop: `1px solid ${SEAM}`, background: 'var(--glass-bg)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)', letterSpacing: '0.1em' }}>DATA · COINGECKO · YAHOO FINANCE · ALTERNATIVE.ME</span>
            {!loading && (
              <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                AUTO-REFRESH IN {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        </Slab>
      )}

      {/* Quick Links — external desks */}
      <Slab>
        <PanelHead title="External Desks" right={<Badge tone="muted">{QUICK_LINKS.length} Links</Badge>} />
        {Object.entries(qlGrouped).map(([group, links], gi) => (
          <div key={group}>
            <div style={{
              padding: '8px 16px', background: 'var(--color-surface)',
              borderBottom: `1px solid ${SEAM}`,
              ...(gi > 0 ? { borderTop: `1px solid ${SEAM}` } : {}),
            }}>
              <span style={tLabelStyle}>{GROUP_LABELS[group]}</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', background: 'var(--glass-bg)', marginTop: -1, marginLeft: -1 }}>
                {links.map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                      padding: '11px 14px',
                      borderTop: `1px solid ${SEAM}`, borderLeft: `1px solid ${SEAM}`,
                      background: 'transparent', textDecoration: 'none',
                      transition: 'background .15s', minWidth: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {link.label} <ExternalLink size={9} color="var(--color-muted)" />
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-muted)' }}>{link.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Slab>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.25; } }
      `}</style>
    </div>
  );
}
