// ─── ZERØ COMMAND — IntelPage.tsx ────────────────────────────────────────────
// AI Intel Feed + RSS live news + Morning Brief
// AI via Groq (VITE_GEMINI_KEY) + RSS via rss2json proxy (free, no key needed)
import { useState, useEffect, useCallback } from 'react';
import {
  Zap, RefreshCw, Trash2, Download, Globe, Flag, Bitcoin,
  Cpu, Flame, MapPin, Sunrise, ChevronDown, ChevronUp,
  Rss, ExternalLink, Clock, AlertCircle,
} from 'lucide-react';
import {
  callClaude, hasApiKey, isEnvKey,
  formatTimestamp, formatFullDate, todayKey,
} from '@/lib/api';
import { cloudSet } from '@/lib/cloudStorage';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface FeedItem {
  id: string;
  category: string;
  content: string;
  timestamp: string;
  dateKey: string;
  source?: 'ai' | 'rss';
}
interface Brief {
  content: string;
  timestamp: string;
  dateKey: string;
}
interface RssArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

// ─── RSS FEEDS per category ───────────────────────────────────────────────────
const RSS_FEEDS: Record<string, { url: string; name: string }[]> = {
  world: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',               name: 'BBC World'       },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',     name: 'NYT World'       },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml',                  name: 'Al Jazeera'      },
  ],
  us: [
    { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', name: 'BBC US'          },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',  name: 'NYT Politics'    },
  ],
  crypto: [
    { url: 'https://cointelegraph.com/rss',                              name: 'CoinTelegraph'   },
    { url: 'https://coindesk.com/arc/outboundfeeds/rss/',               name: 'CoinDesk'        },
    { url: 'https://decrypt.co/feed',                                    name: 'Decrypt'         },
  ],
  tech: [
    { url: 'https://feeds.arstechnica.com/arstechnica/index',            name: 'Ars Technica'    },
    { url: 'https://techcrunch.com/feed/',                               name: 'TechCrunch'      },
    { url: 'https://www.theverge.com/rss/index.xml',                     name: 'The Verge'       },
  ],
  viral: [
    { url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', name: 'BBC Entertainment' },
    { url: 'https://buzzfeed.com/index.xml',                             name: 'BuzzFeed'        },
  ],
  indonesia: [
    { url: 'https://www.antaranews.com/rss/terkini.xml',                 name: 'Antara'          },
    { url: 'https://rss.kompas.com/rss/news/terkini.xml',               name: 'Kompas'          },
    { url: 'https://cnbcindonesia.com/rss',                              name: 'CNBC Indonesia'  },
  ],
};

// rss2json free proxy — no key needed, 10k req/day
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

async function fetchRssFeed(feedUrl: string, feedName: string, count = 5): Promise<RssArticle[]> {
  try {
    const url = `${RSS2JSON}${encodeURIComponent(feedUrl)}&count=${count}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok' || !data.items) return [];
    return data.items.map((item: any) => ({
      title: item.title?.trim() || '',
      link: item.link || '',
      description: (item.description || item.content || '').replace(/<[^>]*>/g, '').trim().slice(0, 300),
      pubDate: item.pubDate || '',
      source: feedName,
    }));
  } catch { return []; }
}

async function fetchAllRssForCategory(category: string): Promise<RssArticle[]> {
  const feeds = RSS_FEEDS[category] || [];
  const results = await Promise.allSettled(
    feeds.map(f => fetchRssFeed(f.url, f.name, 4))
  );
  const articles: RssArticle[] = [];
  results.forEach(r => { if (r.status === 'fulfilled') articles.push(...r.value); });
  // Deduplicate by title
  const seen = new Set<string>();
  return articles.filter(a => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

function rssToText(articles: RssArticle[]): string {
  return articles.map((a, i) =>
    `${i + 1}. [${a.source}] ${a.title}\n${a.description ? `   ${a.description}` : ''}`
  ).join('\n\n');
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'world', label: 'World', icon: Globe, color: '#2563eb', bg: '#2563eb20',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Here are latest RSS headlines:\n\n${rss}\n\nWrite a sharp intel briefing of the 5 most important world stories. Each: bold headline + 3 sentences context. Be specific with real data.`,
  },
  {
    key: 'us', label: 'US / Trump', icon: Flag, color: '#dc2626', bg: '#dc262620',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. RSS headlines:\n\n${rss}\n\nSummarize Trump/US news today. Cover executive orders, statements, controversies. Then top 3 US political stories. Be detailed.`,
  },
  {
    key: 'crypto', label: 'Crypto', icon: Bitcoin, color: '#d97706', bg: '#d9770620',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Crypto RSS:\n\n${rss}\n\nWrite a full crypto market intel: summarize top news, add market context (BTC trend, sentiment, key on-chain signals). Be sharp and specific.`,
  },
  {
    key: 'tech', label: 'Tech / AI', icon: Cpu, color: '#7c3aed', bg: '#7c3aed20',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Tech RSS:\n\n${rss}\n\nSummarize top 5 tech/AI stories. Bold headline + 3 sentences each. Focus on AI releases, funding, major announcements.`,
  },
  {
    key: 'viral', label: 'Viral', icon: Flame, color: '#ea580c', bg: '#ea580c20',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Entertainment/viral RSS:\n\n${rss}\n\nWhat's viral right now? Summarize 5 most interesting trending stories. Be entertaining.`,
  },
  {
    key: 'indonesia', label: 'Indonesia', icon: MapPin, color: '#059669', bg: '#05906920',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Indonesia RSS (may be in Indonesian):\n\n${rss}\n\nSummarize top 5 Indonesia news in English: politics (Prabowo), economy (Rupiah/IHSG), business, social. Be specific.`,
  },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const FEED_KEY = 'zero-intel-feed';
const BRIEF_KEY = 'zero-intel-brief';
const RSS_CACHE_PREFIX = 'zero-rss-cache-';

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
function saveBrief(b: Brief) {
  localStorage.setItem(BRIEF_KEY, JSON.stringify(b));
  cloudSet(BRIEF_KEY, b);
}
function loadRssCache(cat: string): RssArticle[] {
  try {
    const raw = localStorage.getItem(RSS_CACHE_PREFIX + cat);
    if (!raw) return [];
    const { articles, ts } = JSON.parse(raw);
    // Cache valid 15 mins
    if (Date.now() - ts < 15 * 60 * 1000) return articles;
    return [];
  } catch { return []; }
}
function saveRssCache(cat: string, articles: RssArticle[]) {
  try { localStorage.setItem(RSS_CACHE_PREFIX + cat, JSON.stringify({ articles, ts: Date.now() })); } catch {}
}

// ─── MORNING BRIEF ────────────────────────────────────────────────────────────
function MorningBrief({ hasKey }: { hasKey: boolean }) {
  const [brief, setBrief] = useState<Brief | null>(loadBrief());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);

  const generate = async () => {
    setLoading(true); setError('');
    try {
      // Grab RSS for key categories to enrich brief
      const [worldRss, cryptoRss, idRss] = await Promise.all([
        fetchAllRssForCategory('world'),
        fetchAllRssForCategory('crypto'),
        fetchAllRssForCategory('indonesia'),
      ]);
      const rssContext = worldRss.length
        ? `\nLatest headlines from RSS:\nWORLD: ${worldRss.slice(0, 4).map(a => a.title).join(' | ')}\nCRYPTO: ${cryptoRss.slice(0, 3).map(a => a.title).join(' | ')}\nINDONESIA: ${idRss.slice(0, 3).map(a => a.title).join(' | ')}`
        : '';

      const content = await callClaude(
        `Today is ${formatFullDate()}.${rssContext}\n\nGenerate a sharp private morning intelligence briefing for a solo crypto fintech founder in Surabaya, Indonesia. Format with EXACT sections:\n\n🌍 WORLD\n[Top 3 global stories with 2-sentence summaries]\n\n🇺🇸 TRUMP / US\n[What's happening in US politics today]\n\n₿ CRYPTO MARKET\n[BTC context, market sentiment, top crypto news]\n\n🤖 TECH / AI\n[Top 2 tech/AI stories today]\n\n🔥 VIRAL\n[What's trending right now]\n\n🇮🇩 INDONESIA\n[Key Indonesia news — economy, politics, IHSG]\n\n⚡ SIGNAL OF THE DAY\n[Single most important thing to know today — 1 sentence, bold and direct]\n\nBe sharp. Use RSS data above as grounding. No fluff. No disclaimers.`,
        { maxTokens: 1500 }
      );
      const b: Brief = { content, timestamp: formatTimestamp(), dateKey: todayKey() };
      setBrief(b); saveBrief(b);
    } catch (e: any) {
      setError(e.message === 'NO_API_KEY' ? 'API key belum diset.' : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, overflow: 'hidden', marginBottom: 24,
    }}>
      <div
        style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center',
          gap: 10, cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
          background: 'var(--color-surface)',
        }}
        onClick={() => setExpanded(e => !e)}
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
          disabled={loading || !hasKey}
          style={{
            background: loading ? 'var(--color-border)' : '#2563eb',
            color: loading ? 'var(--color-muted)' : 'white',
            border: 'none', borderRadius: 6, padding: '5px 12px',
            fontSize: 12, fontWeight: 600,
            cursor: loading || !hasKey ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            opacity: !hasKey ? 0.5 : 1,
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
            <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertCircle size={12} /> {error}
            </p>
          )}
          {!brief && !loading && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              Klik Generate — brief dibikin dari RSS + AI, gratis, tiap pagi.
            </p>
          )}
          {loading && (
            <div style={{ color: 'var(--color-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Fetching RSS feeds + generating brief...
              </div>
              <div style={{
                height: 4, borderRadius: 2, background: 'var(--color-border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: '40%', background: '#2563eb', borderRadius: 2,
                  animation: 'progress 1.5s ease-in-out infinite',
                }} />
              </div>
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
      `}</style>
    </div>
  );
}

// ─── RSS PANEL ────────────────────────────────────────────────────────────────
function RssPanel({ category, color }: { category: string; color: string }) {
  const [articles, setArticles] = useState<RssArticle[]>(() => loadRssCache(category));
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(articles.length > 0);

  const load = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchAllRssForCategory(category);
    if (fresh.length > 0) {
      setArticles(fresh);
      saveRssCache(category, fresh);
    }
    setLoading(false);
    setFetched(true);
    setExpanded(true);
  }, [category]);

  // Auto-fetch on first expand if no cache
  useEffect(() => {
    if (expanded && !fetched && !loading) load();
  }, [expanded, fetched, loading, load]);

  const feeds = RSS_FEEDS[category] || [];

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '10px 14px', display: 'flex', alignItems: 'center',
          gap: 8, cursor: 'pointer',
        }}
      >
        <Rss size={13} color={color} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>
          Live RSS Headlines
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
          {feeds.map(f => f.name).join(' · ')}
        </span>
        {loading && <RefreshCw size={11} color={color} style={{ animation: 'spin 1s linear infinite' }} />}
        <button
          onClick={e => { e.stopPropagation(); load(); }}
          style={{
            padding: '3px 8px', borderRadius: 5, border: `1px solid ${color}40`,
            background: color + '15', color: color, fontSize: 10, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
        {expanded ? <ChevronUp size={12} color="var(--color-muted)" /> : <ChevronDown size={12} color="var(--color-muted)" />}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', maxHeight: 360, overflowY: 'auto' }}>
          {loading && articles.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 6 }} />
              Fetching live RSS...
            </div>
          ) : articles.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Belum ada artikel. Klik Refresh.
            </div>
          ) : (
            articles.map((a, i) => (
              <a
                key={i}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '10px 14px',
                  borderBottom: i < articles.length - 1 ? '1px solid var(--color-border)' : 'none',
                  textDecoration: 'none', transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-card)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                      margin: 0, lineHeight: 1.4,
                    }}>
                      {a.title}
                    </p>
                    {a.description && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0, marginTop: 3, lineHeight: 1.4 }}>
                        {a.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: color,
                        background: color + '15', padding: '1px 6px', borderRadius: 4,
                        fontFamily: 'monospace', letterSpacing: 0.5,
                      }}>
                        {a.source}
                      </span>
                      {a.pubDate && (
                        <span style={{ fontSize: 10, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={9} />
                          {new Date(a.pubDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink size={11} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 3 }} />
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── FEED ITEM CARD ───────────────────────────────────────────────────────────
function FeedItemCard({
  item, onDelete, catConfig,
}: {
  item: FeedItem;
  onDelete: (id: string) => void;
  catConfig: typeof CATEGORIES[0] | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = catConfig?.icon || Globe;
  const preview = item.content.slice(0, 240);
  const hasMore = item.content.length > 240;

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 10,
      border: `1px solid ${catConfig?.color ?? '#334155'}30`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        background: (catConfig?.bg ?? '#33415510'),
        cursor: 'pointer',
      }} onClick={() => setExpanded(e => !e)}>
        <Icon size={13} color={catConfig?.color ?? 'var(--color-muted)'} />
        <span style={{
          fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
          color: catConfig?.color ?? 'var(--color-muted)', letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          {catConfig?.label ?? item.category}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginLeft: 4 }}>
          {item.timestamp}
        </span>
        {item.source === 'rss' && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#84cc16',
            background: '#84cc1615', padding: '1px 5px', borderRadius: 3,
          }}>RSS</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(item.id); }}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--color-muted)', padding: 2, display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={12} />
          </button>
          {expanded ? <ChevronUp size={13} color="var(--color-muted)" /> : <ChevronDown size={13} color="var(--color-muted)" />}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          fontSize: 14, color: 'var(--color-text)', lineHeight: 1.85,
          whiteSpace: 'pre-wrap',
        }}>
          {expanded ? item.content : preview}
          {!expanded && hasMore && (
            <span
              onClick={() => setExpanded(true)}
              style={{ color: catConfig?.color ?? '#2563eb', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}
            >
              ... baca selengkapnya
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function IntelPage() {
  const [feed, setFeed] = useState<FeedItem[]>(loadFeed);
  const [activeCategory, setActiveCategory] = useState('world');
  const [loading, setLoading] = useState(false);
  const [rssLoading, setRssLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasKey, setHasKey] = useState(hasApiKey() || isEnvKey());

  // Re-check key on mount
  useEffect(() => { setHasKey(hasApiKey() || isEnvKey()); }, []);

  const cat = CATEGORIES.find(c => c.key === activeCategory)!;

  // ── Fetch with RSS grounding ──
  const fetchIntel = async () => {
    if (!hasKey) { setError('API key belum diset di Cloudflare Variables.'); return; }
    setLoading(true); setError('');
    try {
      // 1. Get RSS for context
      let rssArticles = loadRssCache(activeCategory);
      if (rssArticles.length === 0) {
        setRssLoading(true);
        rssArticles = await fetchAllRssForCategory(activeCategory);
        if (rssArticles.length > 0) saveRssCache(activeCategory, rssArticles);
        setRssLoading(false);
      }

      // 2. Build prompt with RSS grounding
      const rssText = rssArticles.length > 0
        ? rssToText(rssArticles)
        : 'No RSS data available. Use your training knowledge.';
      const prompt = cat.aiPrompt(formatFullDate(), rssText);

      // 3. Call Groq
      const content = await callClaude(prompt, { maxTokens: 1200 });
      const item: FeedItem = {
        id: Date.now().toString(),
        category: activeCategory,
        content,
        timestamp: formatTimestamp(),
        dateKey: todayKey(),
        source: 'ai',
      };
      const updated = [item, ...feed];
      setFeed(updated); saveFeed(updated);
    } catch (e: any) {
      setError(e.message === 'NO_API_KEY' ? 'API key belum diset.' : e.message);
    }
    setLoading(false);
  };

  const deleteItem = (id: string) => {
    const u = feed.filter(i => i.id !== id); setFeed(u); saveFeed(u);
  };
  const clearAll = () => {
    if (confirm('Clear semua intel feed?')) { setFeed([]); saveFeed([]); }
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

      <MorningBrief hasKey={hasKey} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="font-heading text-lg" style={{ color: 'var(--color-text)' }}>Intel Feed</h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {feed.length} items · RSS + AI · persistent
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

      {/* Category Tabs + Fetch */}
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
            background: !hasKey ? 'var(--color-muted)' : loading ? (cat.color + 'aa') : cat.color,
            color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: loading || !hasKey ? 'not-allowed' : 'pointer',
            opacity: !hasKey ? 0.5 : 1,
          }}
        >
          {loading || rssLoading
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              {rssLoading ? 'Fetching RSS...' : 'Analyzing...'}</>
            : <><Zap size={13} /> Fetch {cat.label}</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontSize: 13, color: '#dc2626', background: '#fee2e210',
          padding: '8px 12px', borderRadius: 8, border: '1px solid #fee2e230',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* RSS Panel */}
      <RssPanel category={activeCategory} color={cat.color} />

      {/* AI Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredFeed.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--color-card)', borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}>
            <Zap size={28} color={cat.color} style={{ display: 'block', margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No {cat.label} AI intel yet</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>
              RSS headlines ada di atas · Klik "Fetch {cat.label}" untuk AI analysis
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
      `}</style>
    </div>
  );
}
