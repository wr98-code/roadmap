import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { callClaude, formatTimestamp, hasApiKey } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changeDir: 'up' | 'down' | 'neutral';
  extra?: string;
}

interface MarketSnapshot {
  items: PriceData[];
  timestamp: string;
  summary: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const MARKETS_KEY = 'zero-markets-snapshot';

function loadSnapshot(): MarketSnapshot | null {
  try {
    return JSON.parse(localStorage.getItem(MARKETS_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSnapshot(s: MarketSnapshot) {
  localStorage.setItem(MARKETS_KEY, JSON.stringify(s));
}

// ─── Price Card ───────────────────────────────────────────────────────────────

function PriceCard({ item }: { item: PriceData }) {
  const isUp = item.changeDir === 'up';
  const isDown = item.changeDir === 'down';

  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
      padding: '18px 20px',
      borderTop: `3px solid ${isUp ? '#10b981' : isDown ? '#ef4444' : '#e5e7eb'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', fontWeight: 700, letterSpacing: 1 }}>
            {item.symbol}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {item.name}
          </div>
        </div>
        {isUp ? (
          <TrendingUp size={16} color="#10b981" />
        ) : isDown ? (
          <TrendingDown size={16} color="#ef4444" />
        ) : (
          <Minus size={16} color="#9ca3af" />
        )}
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', fontFamily: 'monospace', marginBottom: 4 }}>
        {item.price}
      </div>

      <div style={{
        fontSize: 13, fontWeight: 600,
        color: isUp ? '#10b981' : isDown ? '#ef4444' : '#9ca3af',
      }}>
        {item.change}
      </div>

      {item.extra && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
          {item.extra}
        </div>
      )}
    </div>
  );
}

// ─── Parse AI response ────────────────────────────────────────────────────────

function parseMarketResponse(text: string): PriceData[] {
  const lines = text.split('\n').filter(l => l.trim());
  const items: PriceData[] = [];

  const ASSETS = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'S&P500', name: 'S&P 500' },
    { symbol: 'NASDAQ', name: 'NASDAQ' },
    { symbol: 'IHSG', name: 'IDX Composite' },
    { symbol: 'GOLD', name: 'Gold (XAU/USD)' },
    { symbol: 'DXY', name: 'US Dollar Index' },
    { symbol: 'OIL', name: 'Crude Oil (WTI)' },
  ];

  // Try to extract price data from text
  for (const asset of ASSETS) {
    const regex = new RegExp(
      `${asset.symbol}[^\\n]*?(\\$?[\\d,]+\\.?\\d*).*?([+\\-]?\\d+\\.?\\d*%?)`,
      'i'
    );
    const match = text.match(regex);

    if (match) {
      const priceStr = match[1] || 'N/A';
      const changeStr = match[2] || '';
      const isUp = changeStr.includes('+') || (text.toLowerCase().includes(asset.symbol.toLowerCase() + '.*up'));
      const isDown = changeStr.includes('-');

      items.push({
        symbol: asset.symbol,
        name: asset.name,
        price: priceStr.startsWith('$') ? priceStr : `$${priceStr}`,
        change: changeStr || 'N/A',
        changeDir: isUp ? 'up' : isDown ? 'down' : 'neutral',
      });
    } else {
      items.push({
        symbol: asset.symbol,
        name: asset.name,
        price: 'See summary',
        change: 'N/A',
        changeDir: 'neutral',
      });
    }
  }

  return items;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MarketsPage() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(loadSnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!hasApiKey()) {
      setError('API key belum diset. Pergi ke Intel Feed untuk setup.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const text = await callClaude(
        `Current date/time: ${dateStr}. Give me EXACT current market prices for ALL of these assets:\n\n` +
        `1. BTC (Bitcoin) - price in USD + 24h change %\n` +
        `2. ETH (Ethereum) - price in USD + 24h change %\n` +
        `3. S&P500 index - current value + today change %\n` +
        `4. NASDAQ - current value + today change %\n` +
        `5. IHSG (Indonesia Stock Exchange / IDX Composite) - current value + today change %\n` +
        `6. GOLD (XAU/USD) - price per troy oz + today change %\n` +
        `7. DXY (US Dollar Index) - current value + today change\n` +
        `8. WTI Crude Oil - price per barrel + today change %\n\n` +
        `Format each line as: SYMBOL: $PRICE (+/-X.XX%)\n` +
        `Then add a 2-sentence market summary at the end.\n` +
        `Use real current data. Be precise.`
      );

      const items = parseMarketResponse(text);
      // Extract summary (last paragraph)
      const lines = text.split('\n').filter(l => l.trim());
      const summary = lines.slice(-3).join(' ').slice(0, 300);

      const newSnapshot: MarketSnapshot = {
        items,
        timestamp: formatTimestamp(),
        summary: text, // Store full text as summary for display
      };

      setSnapshot(newSnapshot);
      saveSnapshot(newSnapshot);
    } catch (e: any) {
      setError(e.message);
    }

    setLoading(false);
  };

  const MARKET_GROUPS = [
    { label: 'Crypto', symbols: ['BTC', 'ETH'] },
    { label: 'US Markets', symbols: ['S&P500', 'NASDAQ'] },
    { label: 'Indonesia', symbols: ['IHSG'] },
    { label: 'Commodities & FX', symbols: ['GOLD', 'OIL', 'DXY'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="font-heading text-lg">Market Prices</h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {snapshot
              ? `Last updated: ${snapshot.timestamp}`
              : 'Klik Refresh untuk dapat harga terkini'}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#111827', color: 'white', border: 'none',
            borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          {loading ? 'Fetching...' : 'Refresh Prices'}
        </button>
      </div>

      {error && (
        <div style={{
          fontSize: 13, color: '#dc2626', background: '#fee2e2',
          padding: '10px 14px', borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      {!snapshot && !loading && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
        }}>
          <TrendingUp size={40} color="#d1d5db" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', fontSize: 15, fontWeight: 500 }}>No price data yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
            Klik Refresh Prices untuk fetch harga live
          </p>
        </div>
      )}

      {loading && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: 'white',
          borderRadius: 12, border: '1px solid #e5e7eb', color: '#6b7280',
        }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} color="#2563eb" />
          <p style={{ fontSize: 14 }}>Scanning market data...</p>
        </div>
      )}

      {snapshot && !loading && (
        <>
          {/* Full AI response - readable */}
          <div style={{
            background: '#0d1b2a', borderRadius: 12, padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={12} color="#64748b" />
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
                LIVE MARKET DATA · {snapshot.timestamp}
              </span>
            </div>
            <div style={{
              fontSize: 14, color: '#e2e8f0', lineHeight: 1.9,
              whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif",
            }}>
              {snapshot.summary}
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
