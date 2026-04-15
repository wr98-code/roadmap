// ─── ZERO COMMAND — IntelPage.tsx ────────────────────────────────────────────
import { useState, useEffect } from 'react';
import {
  Zap, RefreshCw, Trash2, Download, Globe, Flag, Bitcoin,
  Cpu, Flame, MapPin, Sunrise, Key, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  callClaude, getApiKey, setApiKey, hasApiKey, isEnvKey,
  formatTimestamp, formatFullDate, todayKey,
} from '@/lib/api';
import { cloudGet, cloudSet } from '@/lib/cloudStorage';

interface FeedItem {
  id: string;
  category: string;
  content: string;
  timestamp: string;
  dateKey: string;
}
interface Brief {
  content: string;
  timestamp: string;
  dateKey: string;
}

const CATEGORIES = [
  {
    key: 'world', label: 'World', icon: Globe, color: '#2563eb', bg: '#2563eb20',
    prompt: (date: string) =>
      `Today is ${date}. Give me the 5 most important world news stories RIGHT NOW. For each: headline + 3-4 sentences context. Cover geopolitics, conflicts, economy. Be specific and factual with real data.`,
  },
  {
    key: 'us', label: 'US / Trump', icon: Flag, color: '#dc2626', bg: '#dc262620',
    prompt: (date: string) =>
      `Today is ${date}. What is Donald Trump doing today? Cover: executive orders, public statements, controversies, court cases, policy moves. Also major US political news. Be detailed with dates/times.`,
  },
  {
    key: 'crypto', label: 'Crypto', icon: Bitcoin, color: '#d97706', bg: '#d9770620',
    prompt: (date: string) =>
      `Today is ${date}. Full crypto market update: BTC price (exact USD), ETH price, total market cap, 24h change, top gainers/losers, biggest crypto news today, on-chain highlights (funding rate, liquidations), market sentiment. Real numbers only.`,
  },
  {
    key: 'tech', label: 'Tech / AI', icon: Cpu, color: '#7c3aed', bg: '#7c3aed20',
    prompt: (date: string) =>
      `Today is ${date}. Top 5 tech and AI news today: product launches, funding rounds, AI model releases, big announcements, regulatory news. Each: headline + 3 sentences context.`,
  },
  {
    key: 'viral', label: 'Viral', icon: Flame, color: '#ea580c', bg: '#ea580c20',
    prompt: (date: string) =>
      `Today is ${date}. What's going viral right now? X/Twitter trending, Reddit front page, TikTok trends, YouTube viral, memes, controversies, celebrity news. Be specific.`,
  },
  {
    key: 'indonesia', label: 'Indonesia', icon: MapPin, color: '#059669', bg: '#05906920',
    prompt: (date: string) =>
      `Today is ${date}. Most important news in Indonesia right now: politics (Prabowo government), economy (Rupiah, IHSG, inflasi), business, social issues, Surabaya/East Java news. Write in English, be specific.`,
  },
];

const FEED_KEY = 'zero-intel-feed';
const BRIEF_KEY = 'zero-intel-brief';
function loadFeed(): FeedItem[] {
  try { return JSON.parse(localStorage.getItem(FEED_KEY) || '[]'); } catch { return []; }
}
function saveFeed(items: FeedItem[]) {
  const capped = items.slice(0, 100);
  localStorage.setItem(FEED_KEY, JSON.stringify(capped));
  cloudSet(FEED_KEY, capped);
}
function loadBrief(): Brief | null {
  try {
    const b = JSON.parse(localStorage.getItem(BRIEF_KEY) || 'null');
    if (b?.dateKey === todayKey()) return b;
    return null;
  } catch { return null; }
}
function saveBrief(brief: Brief) {
  localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
  cloudSet(BRIEF_KEY, brief);
}

// ─── API Key Banner (only if no env key) ─────────────────────────────────────
function ApiKeyBanner({ onSave }: { onSave: () => void }) {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);
  const save = () => { if (val.trim()) { setApiKey(val.trim()); onSave(); } };
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '14px 18px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <Key size={16} color="var(--color-muted)" />
      <span style={{ fontSize: 13, color: 'var(--color-text)', flex: 1 }}>
        Masukkan Anthropic API key, atau isi{' '}
        <code style={{ fontSize: 12, background: 'var(--color-border)', padding: '1px 6px', borderRadius: 4 }}>
          VITE_ANTHROPIC_KEY
        </code>{' '}
        di file{' '}
        <code style={{ fontSize: 12, background: 'var(--color-border)', padding: '1px 6px', borderRadius: 4 }}>
          .env
        </code>
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder="sk-ant-..."
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          style={{
            border: '1px solid var(--color-border)', borderRadius: 6,
            padding: '6px 10px', fontSize: 13, width: 220, outline: 'none',
            background: 'var(--color-card)', color: 'var(--color-text)',
          }}
        />
        <button onClick={() => setShow(!show)} style={{
          border: '1px solid var(--color-border)', borderRadius: 6,
          padding: '6px 10px', background: 'var(--color-card)',
          fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer',
        }}>{show ? 'Hide' : 'Show'}</button>
        <button onClick={save} style={{
          background: '#2563eb', color: 'white', border: 'none',
          borderRadius: 6, padding: '6px 14px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}>Save</button>
      </div>
    </div>
  );
}

// ─── Morning Brief ────────────────────────────────────────────────────────────
function MorningBrief() {
  const [brief, setBrief] = useState<Brief | null>(loadBrief());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const date = formatFullDate();
      const content = await callClaude(
        `Today is ${date}. Generate a sharp private morning intelligence briefing for a solo crypto fintech founder in Surabaya, Indonesia. Format with these EXACT sections:\n\n🌍 WORLD\n[Top 3 global stories with 2-sentence summaries]\n\n🇺🇸 TRUMP / US\n[What Trump did today + major US news]\n\n₿ CRYPTO MARKET\n[BTC price exact, ETH price, market sentiment, top news]\n\n🤖 TECH / AI\n[Top 2 tech/AI stories today]\n\n🔥 VIRAL\n[What's going viral right now]\n\n🇮🇩 INDONESIA\n[Key Indonesia news today - economy, politics, IHSG]\n\n⚡ SIGNAL OF THE DAY\n[One single most important thing to know today — 1 sentence, be bold and direct]\n\nBe sharp. Real data. No fluff. No disclaimers.`
      );
      const b: Brief = { content, timestamp: formatTimestamp(), dateKey: todayKey() };
      setBrief(b); saveBrief(b);
    } catch (e: any) {
      setError(e.message === 'NO_API_KEY' ? 'API key required.' : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, overflow: 'hidden', marginBottom: 24,
    }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center',
          gap: 10, cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
          background: 'var(--color-surface)',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Sunrise size={16} color="#84cc16" />
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
          flex: 1, fontFamily: 'monospace', letterSpacing: 2,
        }}>
          MORNING BRIEF
        </span>
        {brief && (
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
            {brief.timestamp}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); generate(); }}
          disabled={loading}
          style={{
            background: loading ? 'var(--color-border)' : '#2563eb',
            color: loading ? 'var(--color-muted)' : 'white',
            border: 'none', borderRadius: 6, padding: '5px 12px',
            fontSize: 12, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          {loading
            ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
            : brief
              ? <><RefreshCw size={11} /> Refresh</>
              : <><Zap size={11} /> Generate</>}
        </button>
        {expanded
          ? <ChevronUp size={14} color="var(--color-muted)" />
          : <ChevronDown size={14} color="var(--color-muted)" />}
      </div>

      {expanded && (
        <div style={{ padding: '16px 20px' }}>
          {error && (
            <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</p>
          )}
          {!brief && !loading && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              Klik Generate untuk dapat morning intel brief hari ini.
            </p>
          )}
          {loading && (
            <div style={{ color: 'var(--color-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
              Scanning global feeds...
            </div>
          )}
          {brief && !loading && (
            <div style={{
              fontSize: 14, color: 'var(--color-text)', lineHeight: 1.9,
              whiteSpace: 'pre-wrap',
            }}>
              {brief.content}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Feed Item Card ───────────────────────────────────────────────────────────
function FeedItemCard({
  item, onDelete, catConfig,
}: {
  item: FeedItem;
  onDelete: (id: string) => void;
  catConfig: typeof CATEGORIES[0] | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = catConfig?.icon || Globe;
  const preview = item.content.slice(0, 220);
  const hasMore = item.content.length > 220;

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 10,
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center',
        gap: 10, borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: catConfig?.bg || 'var(--color-surface)',
          color: catConfig?.color || 'var(--color-text)',
          fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Icon size={10} /> {item.category.toUpperCase()}
        </span>
        <span style={{
          fontSize: 11, fontFamily: 'monospace',
          color: 'var(--color-muted)', marginLeft: 'auto',
        }}>
          {item.timestamp}
        </span>
        <button onClick={() => onDelete(item.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-muted)', padding: 2,
        }}>
          <Trash2 size={12} />
        </button>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontSize: 14, color: 'var(--color-text)',
          lineHeight: 1.8, whiteSpace: 'pre-wrap',
        }}>
          {expanded ? item.content : preview}{hasMore && !expanded && '...'}
        </div>
        {hasMore && (
          <button onClick={() => setExpanded(!expanded)} style={{
            marginTop: 8, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 12, color: '#2563eb',
            fontWeight: 600, padding: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {expanded
              ? <><ChevronUp size={12} /> Show less</>
              : <><ChevronDown size={12} /> Read full intel</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main IntelPage ───────────────────────────────────────────────────────────
export function IntelPage() {
  const [feed, setFeed] = useState<FeedItem[]>(loadFeed);
  const [activeCategory, setActiveCategory] = useState('world');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasKey, setHasKey] = useState(hasApiKey());

  const cat = CATEGORIES.find(c => c.key === activeCategory)!;

  const fetchIntel = async () => {
    setLoading(true); setError('');
    try {
      const content = await callClaude(cat.prompt(formatFullDate()));
      const item: FeedItem = {
        id: Date.now().toString(),
        category: activeCategory,
        content,
        timestamp: formatTimestamp(),
        dateKey: todayKey(),
      };
      const updated = [item, ...feed];
      setFeed(updated); saveFeed(updated);
    } catch (e: any) {
      setError(e.message === 'NO_API_KEY' ? 'API key required.' : e.message);
    }
    setLoading(false);
  };

  const deleteItem = (id: string) => {
    const u = feed.filter(i => i.id !== id); setFeed(u); saveFeed(u);
  };
  const clearAll = () => {
    if (confirm('Clear all intel feed?')) { setFeed([]); saveFeed([]); }
  };
  const downloadFeed = () => {
    const text = feed
      .map(i => `[${i.timestamp}] [${i.category.toUpperCase()}]\n${i.content}\n\n${'─'.repeat(60)}\n`)
      .join('\n');
    const blob = new Blob([`ZERØ INTEL FEED\n${'═'.repeat(60)}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zero-intel-${new Date().toISOString().split('T')[0]}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filteredFeed = feed.filter(i => i.category === activeCategory);

  return (
    <div className="space-y-6">
      {!hasKey && !isEnvKey() && <ApiKeyBanner onSave={() => setHasKey(true)} />}

      <MorningBrief />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="font-heading text-lg" style={{ color: 'var(--color-text)' }}>Intel Feed</h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {feed.length} items · timestamped · persistent
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {feed.length > 0 && (
            <>
              <button onClick={downloadFeed} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: '1px solid var(--color-border)', background: 'var(--color-card)',
                borderRadius: 7, padding: '6px 12px', fontSize: 12,
                color: 'var(--color-text)', cursor: 'pointer',
              }}>
                <Download size={12} /> Export
              </button>
              <button onClick={clearAll} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: '1px solid #fee2e250', background: '#fee2e210',
                borderRadius: 7, padding: '6px 12px', fontSize: 12,
                color: '#dc2626', cursor: 'pointer',
              }}>
                <Trash2 size={12} /> Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Category Tabs + Fetch Button */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          const isActive = activeCategory === c.key;
          const count = feed.filter(i => i.category === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 20,
                border: isActive ? 'none' : '1px solid var(--color-border)',
                background: isActive ? c.color : 'var(--color-card)',
                color: isActive ? 'white' : 'var(--color-muted)',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <Icon size={13} /> {c.label}
              {count > 0 && (
                <span style={{
                  fontSize: 10,
                  background: isActive ? 'rgba(255,255,255,.25)' : c.bg,
                  color: isActive ? 'white' : c.color,
                  borderRadius: 10, padding: '0 5px', fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={fetchIntel}
          disabled={loading || !hasKey}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            background: loading ? 'var(--color-muted)' : cat.color,
            color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: loading || !hasKey ? 'not-allowed' : 'pointer',
            opacity: !hasKey ? 0.5 : 1,
          }}
        >
          {loading
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</>
            : <><Zap size={13} /> Fetch {cat.label}</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontSize: 13, color: '#dc2626',
          background: '#fee2e210', padding: '8px 12px',
          borderRadius: 8, border: '1px solid #fee2e230',
        }}>
          {error}
        </div>
      )}

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredFeed.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--color-card)', borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No {cat.label} intel yet</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>
              Click "Fetch {cat.label}" to pull latest intelligence
            </p>
          </div>
        ) : (
          filteredFeed.map(item => (
            <FeedItemCard
              key={item.id}
              item={item}
              onDelete={deleteItem}
              catConfig={CATEGORIES.find(c => c.key === item.category)}
            />
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
