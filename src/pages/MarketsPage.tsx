// ─── ZERO COMMAND — MarketsPage.tsx ──────────────────────────────────────────
import { useState } from 'react';
import { RefreshCw, TrendingUp, ExternalLink, Activity } from 'lucide-react';
import { callClaude, formatTimestamp, hasApiKey } from '@/lib/api';

interface MarketSnapshot { rawText: string; timestamp: string; }

const MARKETS_KEY = 'zero-markets-snapshot-v2';
function loadSnapshot(): MarketSnapshot | null {
  try { return JSON.parse(localStorage.getItem(MARKETS_KEY) || 'null'); } catch { return null; }
}
function saveSnapshot(s: MarketSnapshot) { localStorage.setItem(MARKETS_KEY, JSON.stringify(s)); }

// ─── Quick Links ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  // On-chain / Futures
  { label: 'Coinglass', url: 'https://coinglass.com', desc: 'Liquidation + OI + Funding', color: '#f59e0b', group: 'crypto' },
  { label: 'CryptoQuant', url: 'https://cryptoquant.com', desc: 'On-chain analytics', color: '#f59e0b', group: 'crypto' },
  { label: 'Glassnode', url: 'https://glassnode.com', desc: 'NUPL + on-chain', color: '#f59e0b', group: 'crypto' },
  { label: 'LookIntoBTC', url: 'https://lookintobitcoin.com', desc: 'Cycle indicators', color: '#f59e0b', group: 'crypto' },
  // Charts
  { label: 'TradingView', url: 'https://tradingview.com', desc: 'Charts + scripting', color: '#2563eb', group: 'chart' },
  { label: 'Bybit', url: 'https://bybit.com', desc: 'Futures trading', color: '#2563eb', group: 'chart' },
  // Macro
  { label: 'Farside ETF', url: 'https://farside.co.uk', desc: 'BTC ETF flow', color: '#7c3aed', group: 'macro' },
  { label: 'FRED', url: 'https://fred.stlouisfed.org', desc: 'Fed data', color: '#7c3aed', group: 'macro' },
  { label: 'ForexFactory', url: 'https://forexfactory.com', desc: 'Econ kalender', color: '#7c3aed', group: 'macro' },
  { label: 'Fear & Greed', url: 'https://alternative.me/crypto/fear-and-greed-index', desc: 'Sentiment index', color: '#7c3aed', group: 'macro' },
  // Research
  { label: 'Nansen', url: 'https://nansen.ai', desc: 'Smart money tracking', color: '#059669', group: 'research' },
  { label: 'Token Terminal', url: 'https://tokenterminal.com', desc: 'Protocol fundamentals', color: '#059669', group: 'research' },
  { label: 'DeFi Llama', url: 'https://defillama.com', desc: 'TVL + DeFi stats', color: '#059669', group: 'research' },
  { label: 'Dune', url: 'https://dune.com', desc: 'On-chain SQL queries', color: '#059669', group: 'research' },
];

const GROUP_LABELS: Record<string, string> = {
  crypto: '₿ CRYPTO / FUTURES',
  chart: '📊 CHARTS & TRADING',
  macro: '🌍 MACRO',
  research: '🔬 RESEARCH',
};

export function MarketsPage() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(loadSnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!hasApiKey()) {
      setError('API key belum diset. Pergi ke Intel Feed untuk setup.');
      return;
    }
    setLoading(true); setError('');
    try {
      const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      const text = await callClaude(
        `Current date/time: ${dateStr}. Give me EXACT current market prices and status:\n\n` +
        `₿ BTC — price USD + 24h change %\n` +
        `Ξ ETH — price USD + 24h change %\n` +
        `📈 S&P 500 — current value + today change %\n` +
        `💻 NASDAQ — current value + today change %\n` +
        `🇮🇩 IHSG — current value + today change %\n` +
        `🥇 GOLD XAU/USD — price per troy oz + today change %\n` +
        `💵 DXY — current value + today change\n` +
        `🛢️ WTI Crude — price per barrel + today change %\n` +
        `😱 Fear & Greed — current value and label\n` +
        `🔵 BTC Dominance — current %\n` +
        `💰 Crypto Market Cap — total USD\n\n` +
        `Format each asset on its own line clearly. Then add a 3-sentence macro summary. Real data only.`
      );
      const snap: MarketSnapshot = { rawText: text, timestamp: formatTimestamp() };
      setSnapshot(snap); saveSnapshot(snap);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  // Group quick links
  const grouped = QUICK_LINKS.reduce<Record<string, typeof QUICK_LINKS>>((acc, l) => {
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
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {snapshot ? `Last updated: ${snapshot.timestamp}` : 'Klik Refresh untuk dapat harga terkini'}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--color-text)', color: 'var(--color-bg)',
            border: 'none', borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          {loading ? 'Fetching...' : 'Refresh Prices'}
        </button>
      </div>

      {error && (
        <div style={{
          fontSize: 13, color: '#dc2626', background: '#fee2e210',
          padding: '10px 14px', borderRadius: 8, border: '1px solid #fee2e230',
        }}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!snapshot && !loading && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'var(--color-card)', borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}>
          <TrendingUp size={40} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: 15, fontWeight: 500 }}>No price data yet</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>
            Klik Refresh Prices untuk fetch harga live
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--color-card)', borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}>
          <Activity size={28} style={{ display: 'block', margin: '0 auto 12px', color: '#2563eb' }} />
          <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>Scanning market data...</p>
        </div>
      )}

      {/* Snapshot */}
      {snapshot && !loading && (
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Terminal-style header */}
          <div style={{
            padding: '10px 20px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: '#84cc16',
              boxShadow: '0 0 6px #84cc16',
            }} />
            <span style={{
              fontSize: 10, fontFamily: 'monospace',
              color: 'var(--color-muted)', letterSpacing: 2, fontWeight: 700,
            }}>
              LIVE MARKET DATA · {snapshot.timestamp}
            </span>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{
              fontSize: 14, color: 'var(--color-text)',
              lineHeight: 2, whiteSpace: 'pre-wrap',
              fontFamily: "'DM Mono', 'Courier New', monospace",
            }}>
              {snapshot.rawText}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links — Grouped */}
      {Object.entries(grouped).map(([group, links]) => (
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
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  textDecoration: 'none', transition: 'border-color .15s',
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--color-text)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {link.label}
                  <ExternalLink size={9} color="var(--color-muted)" />
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{link.desc}</span>
              </a>
            ))}
          </div>
        </div>
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
