// ─── ZERØ COMMAND — IntelPage.tsx v3.0 ────────────────────────────────────────
// Bloomberg-grade Intelligence Terminal
// v3.0: Auto-refresh + Batch AI Translation ID + Breaking badges + Sentiment tags
//       Background prefetch all categories + Smart dedup + Live ticker + Billionaire UX
// v3.1: Institutional terminal restructure — flat hairline-seam panels (Slab),
//       theme-aware CSS-var color hygiene (light + dark). Logic unchanged.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, RefreshCw, Trash2, Download, Globe, Flag, Bitcoin,
  Cpu, Flame, MapPin, Sunrise, ChevronDown, ChevronUp,
  Rss, ExternalLink, Clock, AlertCircle, Languages, TrendingUp,
  TrendingDown, Minus, Activity, Radio,
} from 'lucide-react';
import {
  callClaude, hasApiKey, isEnvKey,
  formatTimestamp, formatFullDate, todayKey,
} from '@/lib/api';
import { cloudSet } from '@/lib/cloudStorage';
import { Slab, PanelHead, Divider, Badge, tLabelStyle, SEAM } from '@/components/terminal';

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
  id: string;          // hash untuk dedup
  title: string;
  titleID?: string;    // terjemahan Bahasa Indonesia
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  isBreaking?: boolean;
}

// ─── RSS FEEDS ─────────────────────────────────────────────────────────────────
const RSS_FEEDS: Record<string, { url: string; name: string }[]> = {
  world: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',               name: 'BBC World'    },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',     name: 'NYT World'    },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml',                  name: 'Al Jazeera'   },
  ],
  us: [
    { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', name: 'BBC US'       },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',  name: 'NYT Politics' },
  ],
  crypto: [
    { url: 'https://cointelegraph.com/rss',                              name: 'CoinTelegraph' },
    { url: 'https://coindesk.com/arc/outboundfeeds/rss/',               name: 'CoinDesk'      },
    { url: 'https://decrypt.co/feed',                                    name: 'Decrypt'       },
  ],
  tech: [
    { url: 'https://feeds.arstechnica.com/arstechnica/index',            name: 'Ars Technica'  },
    { url: 'https://techcrunch.com/feed/',                               name: 'TechCrunch'    },
    { url: 'https://www.theverge.com/rss/index.xml',                     name: 'The Verge'     },
  ],
  viral: [
    { url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', name: 'BBC Ent'    },
    { url: 'https://buzzfeed.com/index.xml',                             name: 'BuzzFeed'      },
  ],
  indonesia: [
    { url: 'https://www.antaranews.com/rss/terkini.xml',                 name: 'Antara'        },
    { url: 'https://rss.kompas.com/rss/news/terkini.xml',               name: 'Kompas'        },
    { url: 'https://cnbcindonesia.com/rss',                              name: 'CNBC ID'       },
  ],
};

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ─── UTILS ────────────────────────────────────────────────────────────────────
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function isBreaking(pubDate: string): boolean {
  if (!pubDate) return false;
  const diff = Date.now() - new Date(pubDate).getTime();
  return diff < 30 * 60 * 1000; // 30 menit
}

function getRelativeTime(pubDate: string): string {
  if (!pubDate) return '';
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

// ─── RSS FETCH ─────────────────────────────────────────────────────────────────
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
    return data.items.map((item: any) => {
      const title = item.title?.trim() || '';
      return {
        id: simpleHash(title + feedName),
        title,
        link: item.link || '',
        description: (item.description || item.content || '').replace(/<[^>]*>/g, '').trim().slice(0, 280),
        pubDate: item.pubDate || '',
        source: feedName,
        isBreaking: isBreaking(item.pubDate || ''),
      };
    });
  } catch { return []; }
}

async function fetchAllRssForCategory(category: string): Promise<RssArticle[]> {
  const feeds = RSS_FEEDS[category] || [];
  const results = await Promise.allSettled(feeds.map(f => fetchRssFeed(f.url, f.name, 5)));
  const articles: RssArticle[] = [];
  const seen = new Set<string>();
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      r.value.forEach(a => {
        if (!seen.has(a.id)) { seen.add(a.id); articles.push(a); }
      });
    }
  });
  return articles.slice(0, 14);
}

function rssToText(articles: RssArticle[]): string {
  return articles.map((a, i) =>
    `${i + 1}. [${a.source}] ${a.title}${a.description ? `\n   ${a.description}` : ''}`
  ).join('\n\n');
}

// ─── AI BATCH TRANSLATION + SENTIMENT ─────────────────────────────────────────
// 1 API call = translate + tag sentiment semua artikel sekaligus — ultra efficient
async function batchTranslateAndSentiment(articles: RssArticle[], category: string): Promise<RssArticle[]> {
  if (!articles.length) return articles;
  // Indonesia already in Bahasa — skip translate, just sentiment
  const needsTranslation = category !== 'indonesia';

  try {
    const titles = articles.map((a, i) => `${i}|${a.title}`).join('\n');
    const prompt = needsTranslation
      ? `Kamu adalah financial news analyst. Terjemahkan headline berita berikut ke Bahasa Indonesia yang natural dan ringkas. Juga berikan sentiment tag: BULLISH, BEARISH, atau NEUTRAL untuk tiap berita (khusus kategori ${category}).

Respond ONLY dengan JSON array (no markdown, no explanation):
[{"i":0,"t":"terjemahan","s":"BULLISH"},{"i":1,"t":"terjemahan","s":"NEUTRAL"},...]

Headlines:
${titles}`
      : `Kamu adalah financial news analyst. Berikan sentiment tag: BULLISH, BEARISH, atau NEUTRAL untuk tiap headline berikut.

Respond ONLY dengan JSON array:
[{"i":0,"s":"BULLISH"},{"i":1,"s":"NEUTRAL"},...]

Headlines:
${titles}`;

    const raw = await callClaude(prompt, { maxTokens: 800 });
    // Strip markdown fences kalau ada
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(clean) as Array<{ i: number; t?: string; s: string }>;

    return articles.map((a, idx) => {
      const match = parsed.find(p => p.i === idx);
      return {
        ...a,
        titleID: match?.t || a.title,
        sentiment: (match?.s as RssArticle['sentiment']) || 'NEUTRAL',
      };
    });
  } catch {
    return articles;
  }
}

// ─── CACHE ────────────────────────────────────────────────────────────────────
const FEED_KEY       = 'zero-intel-feed';
const BRIEF_KEY      = 'zero-intel-brief';
const RSS_CACHE_TTL  = 10 * 60 * 1000; // 10 menit

interface RssCache { articles: RssArticle[]; ts: number }

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

// In-memory RSS store (biar ga nulis ke localStorage tiap refresh)
const rssMemCache: Record<string, RssCache> = {};

function getRssCache(cat: string): RssArticle[] | null {
  const c = rssMemCache[cat];
  if (!c) return null;
  if (Date.now() - c.ts > RSS_CACHE_TTL) return null;
  return c.articles;
}
function setRssCache(cat: string, articles: RssArticle[]) {
  rssMemCache[cat] = { articles, ts: Date.now() };
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
// NOTE: per-category `color`/`bg` are semantic brand hues used ONLY for small
// decorative markers (icons, source chips, breaking dots) — allowed to stay fixed.
const CATEGORIES = [
  { key: 'world',     label: 'World',     icon: Globe,      color: '#2563eb', bg: '#2563eb18',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Latest RSS:\n\n${rss}\n\nWrite a sharp 5-story world intel brief. Bold headline + 3 sentences each. Real data, no fluff.` },
  { key: 'us',        label: 'US/Trump',  icon: Flag,       color: '#dc2626', bg: '#dc262618',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. RSS:\n\n${rss}\n\nSummarize Trump/US political news today. Executive orders, controversies, top 3 stories. Be detailed.` },
  { key: 'crypto',    label: 'Crypto',    icon: Bitcoin,    color: '#d97706', bg: '#d9770618',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Crypto RSS:\n\n${rss}\n\nFull crypto intel: top news + market context (BTC trend, sentiment, key signals). Sharp and specific.` },
  { key: 'tech',      label: 'Tech/AI',   icon: Cpu,        color: '#7c3aed', bg: '#7c3aed18',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Tech RSS:\n\n${rss}\n\nTop 5 tech/AI stories. Bold headline + 3 sentences. Focus AI releases, funding, major launches.` },
  { key: 'viral',     label: 'Viral',     icon: Flame,      color: '#ea580c', bg: '#ea580c18',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Viral RSS:\n\n${rss}\n\nWhat's trending? 5 most interesting viral stories. Be entertaining.` },
  { key: 'indonesia', label: 'Indonesia', icon: MapPin,     color: '#059669', bg: '#05906918',
    aiPrompt: (date: string, rss: string) =>
      `Today is ${date}. Indonesia RSS:\n\n${rss}\n\nTop 5 Indonesia news in Bahasa Indonesia: politik (Prabowo), ekonomi (Rupiah/IHSG), bisnis, sosial. Spesifik.` },
] as const;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

// Live countdown timer sampai refresh berikutnya
function RefreshCountdown({ nextRefresh, onRefresh, loading }: {
  nextRefresh: number; onRefresh: () => void; loading: boolean;
}) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const update = () => setSecs(Math.max(0, Math.round((nextRefresh - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextRefresh]);

  const pct = Math.min(100, ((600 - secs) / 600) * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Circular progress */}
      <div style={{ position: 'relative', width: 28, height: 28 }}>
        <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-border)" strokeWidth="2" />
          <circle cx="14" cy="14" r="11" fill="none" stroke="var(--gain)" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 11}`}
            strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <button onClick={onRefresh} disabled={loading} style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          <RefreshCw size={10} color="var(--gain)" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {loading ? 'Updating…' : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}
      </span>
    </div>
  );
}

// Sentiment badge
function SentimentBadge({ s }: { s?: RssArticle['sentiment'] }) {
  if (!s) return null;
  const cfg = {
    BULLISH:  { color: 'var(--gain)',        bg: 'var(--gain-soft)',    Icon: TrendingUp,   label: 'BULLISH'  },
    BEARISH:  { color: 'var(--loss)',        bg: 'var(--loss-soft)',    Icon: TrendingDown, label: 'BEARISH'  },
    NEUTRAL:  { color: 'var(--color-muted)', bg: 'var(--color-surface)', Icon: Minus,       label: 'NEUTRAL'  },
  }[s];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
      color: cfg.color, background: cfg.bg,
      padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
    }}>
      <cfg.Icon size={8} /> {cfg.label}
    </span>
  );
}

// Morning Brief
function MorningBrief({ hasKey }: { hasKey: boolean }) {
  const [brief, setBrief]     = useState<Brief | null>(loadBrief);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [expanded, setExpanded] = useState(true);

  // Auto-generate kalau belum ada & ada key
  useEffect(() => {
    if (!brief && hasKey && !loading) {
      generate();
    }
  }, [hasKey]); // eslint-disable-line

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const [worldRss, cryptoRss, idRss] = await Promise.all([
        fetchAllRssForCategory('world'),
        fetchAllRssForCategory('crypto'),
        fetchAllRssForCategory('indonesia'),
      ]);
      const rssCtx = `\nLive RSS:\nWORLD: ${worldRss.slice(0,4).map(a=>a.title).join(' | ')}\nCRYPTO: ${cryptoRss.slice(0,3).map(a=>a.title).join(' | ')}\nINDONESIA: ${idRss.slice(0,3).map(a=>a.title).join(' | ')}`;

      const content = await callClaude(
        `Today is ${formatFullDate()}.${rssCtx}\n\nBuat morning intelligence briefing tajam untuk solo crypto fintech founder di Surabaya, Indonesia. Gunakan Bahasa Indonesia. Format EXACT:\n\n🌍 DUNIA\n[3 berita global, ringkasan 2 kalimat each]\n\n🇺🇸 US / TRUMP\n[Situasi politik AS hari ini]\n\n₿ CRYPTO\n[BTC, sentimen market, top crypto news]\n\n🤖 TECH / AI\n[2 berita tech/AI terpenting]\n\n🔥 VIRAL\n[Yang lagi trending]\n\n🇮🇩 INDONESIA\n[Berita penting — ekonomi, politik, IHSG, Rupiah]\n\n⚡ SINYAL HARI INI\n[SATU hal terpenting yang harus diketahui — 1 kalimat, bold, langsung]\n\nTajam. Pakai data RSS di atas. Tanpa basa-basi.`,
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
    <Slab style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{
        padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', borderBottom: expanded ? `1px solid ${SEAM}` : 'none',
      }} onClick={() => setExpanded(e => !e)}>
        <div style={{ position: 'relative', display: 'flex' }}>
          <Sunrise size={15} color="var(--color-primary)" />
          {!brief && hasKey && !loading && (
            <div style={{
              position: 'absolute', top: -3, right: -3, width: 6, height: 6,
              borderRadius: '50%', background: 'var(--color-primary)', animation: 'rpulse 2s infinite',
            }} />
          )}
        </div>
        <span style={{ ...tLabelStyle, fontSize: 10, flex: 1 }}>
          MORNING BRIEF
        </span>
        {brief && (
          <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {brief.timestamp} · auto-generated
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); generate(); }} disabled={loading || !hasKey} style={{
          background: loading ? 'var(--color-surface)' : 'var(--color-primary)',
          color: loading ? 'var(--color-muted)' : 'var(--on-primary)',
          border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700,
          cursor: loading || !hasKey ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, opacity: !hasKey ? 0.5 : 1,
        }}>
          {loading
            ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
            : brief ? <><RefreshCw size={11} /> Refresh</> : <><Zap size={11} /> Generate</>}
        </button>
        {expanded ? <ChevronUp size={14} color="var(--color-muted)" /> : <ChevronDown size={14} color="var(--color-muted)" />}
      </div>

      {expanded && (
        <div style={{ padding: '16px 18px' }}>
          {error && <p style={{ fontSize: 12, color: 'var(--loss)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} /> {error}</p>}
          {loading && (
            <div style={{ color: 'var(--color-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={13} color="var(--color-primary)" style={{ animation: 'rpulse 1s infinite' }} />
                Fetching RSS feeds + generating brief dalam Bahasa Indonesia…
              </div>
              <div style={{ height: 3, background: 'var(--color-surface)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '60%', background: 'var(--color-primary)', borderRadius: 99, animation: 'progress 1.8s ease-in-out infinite' }} />
              </div>
            </div>
          )}
          {!brief && !loading && !error && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              Auto-generating brief… atau klik Generate manual.
            </p>
          )}
          {brief && !loading && (
            <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 2.0, whiteSpace: 'pre-wrap' }}>
              {brief.content}
            </div>
          )}
        </div>
      )}
    </Slab>
  );
}

// RSS Panel v3 — dengan auto-refresh, translation, sentiment, breaking badge
function RssPanel({ category, color, hasKey, forceRefresh }: {
  category: string; color: string; hasKey: boolean; forceRefresh: number;
}) {
  const [articles, setArticles]     = useState<RssArticle[]>(() => getRssCache(category) || []);
  const [loading, setLoading]       = useState(false);
  const [translating, setTranslating] = useState(false);
  const [expanded, setExpanded]     = useState(true);
  const [showID, setShowID]         = useState(true);
  const [nextRefresh, setNextRefresh] = useState(Date.now() + RSS_CACHE_TTL);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const fresh = await fetchAllRssForCategory(category);
    if (fresh.length > 0) {
      // Kalau ada API key, batch translate + sentiment
      if (hasKey) {
        setTranslating(true);
        const enriched = await batchTranslateAndSentiment(fresh, category);
        setTranslating(false);
        setArticles(enriched);
        setRssCache(category, enriched);
      } else {
        setArticles(fresh);
        setRssCache(category, fresh);
      }
      setNextRefresh(Date.now() + RSS_CACHE_TTL);
    }
    if (!silent) setLoading(false);
  }, [category, hasKey]);

  // Auto-fetch on mount kalau cache kosong
  useEffect(() => {
    const cached = getRssCache(category);
    if (!cached || cached.length === 0) load();
  }, [category]); // eslint-disable-line

  // Auto-refresh setiap 10 menit
  useEffect(() => {
    const id = setInterval(() => load(true), RSS_CACHE_TTL);
    return () => clearInterval(id);
  }, [load]);

  // Respond to external force refresh
  useEffect(() => {
    if (forceRefresh > 0) load();
  }, [forceRefresh]); // eslint-disable-line

  const feeds = RSS_FEEDS[category] || [];
  const breaking = articles.filter(a => a.isBreaking);
  const isIDCat = category === 'indonesia';

  return (
    <Slab>
      {/* Header */}
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: expanded ? `1px solid ${SEAM}` : 'none' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading || translating ? 'var(--warning)' : 'var(--gain)', animation: 'rpulse 2s infinite' }} />
        <Rss size={13} color={color} />
        <span style={{ ...tLabelStyle, fontSize: 10, flex: 1 }}>
          LIVE RSS
        </span>
        {breaking.length > 0 && (
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--loss)', background: 'var(--loss-soft)', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', animation: 'rpulse 1.5s infinite' }}>
            {breaking.length} BREAKING
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
          {feeds.map(f => f.name).join(' · ')}
        </span>
        {/* Translate toggle */}
        {hasKey && !isIDCat && articles.some(a => a.titleID) && (
          <button onClick={e => { e.stopPropagation(); setShowID(v => !v); }} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5,
            background: showID ? 'var(--rail-active-bg)' : 'var(--color-surface)',
            border: `1px solid ${showID ? 'var(--rail-active-border)' : 'var(--color-border)'}`,
            color: showID ? 'var(--color-primary)' : 'var(--color-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          }}>
            <Languages size={10} /> {showID ? 'ID' : 'EN'}
          </button>
        )}
        <RefreshCountdown nextRefresh={nextRefresh} onRefresh={() => load()} loading={loading || translating} />
        {translating && <span style={{ fontSize: 9, color: 'var(--warning)', fontFamily: 'var(--font-mono)', animation: 'rpulse 1s infinite' }}>Translating…</span>}
        {expanded ? <ChevronUp size={12} color="var(--color-muted)" /> : <ChevronDown size={12} color="var(--color-muted)" />}
      </div>

      {expanded && (
        <div style={{ maxHeight: 440, overflowY: 'auto' }}>
          {loading && articles.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 6 }} />
              Fetching live RSS feeds…
            </div>
          ) : articles.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Belum ada artikel.
            </div>
          ) : articles.map((a, i) => (
            <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', padding: '11px 16px',
              borderBottom: i < articles.length - 1 ? `1px solid ${SEAM}` : 'none',
              textDecoration: 'none', transition: 'background .12s',
              background: a.isBreaking ? 'var(--loss-soft)' : 'transparent',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = a.isBreaking ? 'var(--loss-soft)' : 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  {/* Breaking badge */}
                  {a.isBreaking && (
                    <span style={{ fontSize: 8, fontWeight: 800, color: 'var(--loss)', background: 'var(--loss-soft)', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginRight: 6 }}>BREAKING</span>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1.45 }}>
                    {showID && a.titleID ? a.titleID : a.title}
                  </p>
                  {/* Original kalau lagi mode ID */}
                  {showID && a.titleID && a.titleID !== a.title && (
                    <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: '2px 0 0', fontStyle: 'italic' }}>{a.title}</p>
                  )}
                  {a.description && !showID && (
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: '3px 0 0', lineHeight: 1.4 }}>{a.description}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color, background: color + '15', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                      {a.source}
                    </span>
                    {a.sentiment && <SentimentBadge s={a.sentiment} />}
                    {a.pubDate && (
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                        <Clock size={9} /> {getRelativeTime(a.pubDate)}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink size={11} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 3 }} />
              </div>
            </a>
          ))}
        </div>
      )}
    </Slab>
  );
}

// Feed Item Card — flat panel, hairline-separated inside the AI feed Slab
function FeedItemCard({ item, onDelete, catConfig }: {
  item: FeedItem; onDelete: (id: string) => void; catConfig: typeof CATEGORIES[number] | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = catConfig?.icon || Globe;
  const preview = item.content.slice(0, 280);
  const hasMore = item.content.length > 280;

  return (
    <div style={{ background: 'var(--glass-bg)' }}>
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <Icon size={13} color={catConfig?.color ?? 'var(--color-muted)'} />
        <span style={{ ...tLabelStyle, letterSpacing: '0.1em', color: catConfig?.color ?? 'var(--color-muted)' }}>
          {catConfig?.label ?? item.category}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{item.timestamp}</span>
        {item.source === 'rss' && <Badge tone="accent">RSS</Badge>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, display: 'flex', alignItems: 'center' }}>
            <Trash2 size={12} />
          </button>
          {expanded ? <ChevronUp size={13} color="var(--color-muted)" /> : <ChevronDown size={13} color="var(--color-muted)" />}
        </div>
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
          {expanded ? item.content : preview}
          {!expanded && hasMore && (
            <span onClick={() => setExpanded(true)} style={{ color: catConfig?.color ?? 'var(--color-primary)', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}>
              … selengkapnya
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function IntelPage() {
  const [feed, setFeed]           = useState<FeedItem[]>(loadFeed);
  const [activeCategory, setActive] = useState('world');
  const [loading, setLoading]     = useState(false);
  const [rssLoading, setRssLoading] = useState(false);
  const [error, setError]         = useState('');
  const [hasKey]                  = useState(() => hasApiKey() || isEnvKey());
  const [forceRefresh, setForceRefresh] = useState(0);
  const prefetchedRef             = useRef(false);

  // Background prefetch SEMUA kategori pas mount — biar pas user klik udah ada data
  useEffect(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    const cats = Object.keys(RSS_FEEDS);
    cats.forEach((cat, i) => {
      setTimeout(async () => {
        const cached = getRssCache(cat);
        if (!cached) {
          const articles = await fetchAllRssForCategory(cat);
          if (articles.length > 0) {
            if (hasKey) {
              const enriched = await batchTranslateAndSentiment(articles, cat);
              setRssCache(cat, enriched);
            } else {
              setRssCache(cat, articles);
            }
          }
        }
      }, i * 1500); // stagger 1.5s per kategori biar ga ngebom API
    });
  }, []); // eslint-disable-line

  const cat = CATEGORIES.find(c => c.key === activeCategory)!;

  const fetchIntel = async () => {
    if (!hasKey) { setError('API key belum diset.'); return; }
    setLoading(true); setError('');
    try {
      let rssArticles = getRssCache(activeCategory) || [];
      if (rssArticles.length === 0) {
        setRssLoading(true);
        rssArticles = await fetchAllRssForCategory(activeCategory);
        if (rssArticles.length > 0) setRssCache(activeCategory, rssArticles);
        setRssLoading(false);
      }
      const rssText = rssArticles.length > 0 ? rssToText(rssArticles) : 'No RSS data.';
      const prompt  = cat.aiPrompt(formatFullDate(), rssText);
      const content = await callClaude(prompt, { maxTokens: 1200 });
      const item: FeedItem = {
        id: Date.now().toString(), category: activeCategory,
        content, timestamp: formatTimestamp(), dateKey: todayKey(), source: 'ai',
      };
      const updated = [item, ...feed];
      setFeed(updated); saveFeed(updated);
    } catch (e: any) {
      setError(e.message === 'NO_API_KEY' ? 'API key belum diset.' : e.message);
    }
    setLoading(false);
  };

  const deleteItem = (id: string) => { const u = feed.filter(i => i.id !== id); setFeed(u); saveFeed(u); };
  const clearAll   = () => { if (confirm('Clear semua intel feed?')) { setFeed([]); saveFeed([]); } };
  const downloadFeed = () => {
    const text = feed.map(i => `[${i.timestamp}] [${i.category.toUpperCase()}]\n${i.content}\n\n${'─'.repeat(60)}\n`).join('\n');
    const blob = new Blob([`ZERØ INTEL FEED\n${'═'.repeat(60)}\n\n${text}`], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `zero-intel-${new Date().toISOString().split('T')[0]}.txt`; a.click();
  };

  const filteredFeed = feed.filter(i => i.category === activeCategory);

  // Shared terminal button style (secondary actions)
  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    borderRadius: 7, padding: '6px 12px', fontSize: 12, color: 'var(--color-text)', cursor: 'pointer',
  };

  return (
    <div className="space-y-6">
      <MorningBrief hasKey={hasKey} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={16} color="var(--loss)" style={{ animation: 'rpulse 1.5s infinite' }} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.08em', margin: 0 }}>INTEL FEED</h2>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', margin: '3px 0 0', letterSpacing: '0.02em' }}>
              {feed.length} items · Live RSS · AI analysis · Auto-translate ID · Auto-refresh 10m
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setForceRefresh(v => v + 1)} style={btnStyle}>
            <RefreshCw size={12} /> Refresh All
          </button>
          {feed.length > 0 && <>
            <button onClick={downloadFeed} style={btnStyle}>
              <Download size={12} /> Export
            </button>
            <button onClick={clearAll} style={{ ...btnStyle, border: '1px solid transparent', background: 'var(--loss-soft)', color: 'var(--loss)' }}>
              <Trash2 size={12} /> Clear
            </button>
          </>}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          const isActive = activeCategory === c.key;
          const count    = feed.filter(i => i.category === c.key).length;
          const cached   = getRssCache(c.key);
          const hasBreaking = cached?.some(a => a.isBreaking);
          return (
            <button key={c.key} onClick={() => setActive(c.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7,
              border: `1px solid ${isActive ? 'var(--rail-active-border)' : 'var(--color-border)'}`,
              background: isActive ? 'var(--rail-active-bg)' : 'var(--color-surface)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
              fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer', transition: 'all .15s',
              position: 'relative',
            }}>
              <Icon size={13} color={isActive ? 'var(--color-primary)' : c.color} /> {c.label}
              {count > 0 && (
                <span style={{ fontSize: 10, background: isActive ? 'var(--rail-active-border)' : 'var(--color-border)', color: isActive ? 'var(--color-primary)' : 'var(--color-muted)', borderRadius: 4, padding: '0 5px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
              )}
              {/* Breaking dot */}
              {hasBreaking && !isActive && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--loss)', animation: 'rpulse 1s infinite' }} />
              )}
            </button>
          );
        })}

        <button onClick={fetchIntel} disabled={loading || !hasKey} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          background: !hasKey ? 'var(--color-surface)' : 'var(--color-primary)',
          color: !hasKey ? 'var(--color-muted)' : 'var(--on-primary)', border: 'none', borderRadius: 7, padding: '8px 16px',
          fontSize: 13, fontWeight: 600, cursor: loading || !hasKey ? 'not-allowed' : 'pointer',
          opacity: !hasKey ? 0.6 : loading ? 0.85 : 1,
        }}>
          {loading || rssLoading
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />{rssLoading ? 'Fetching RSS…' : 'Analyzing…'}</>
            : <><Zap size={13} /> Fetch {cat.label}</>}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: 'var(--loss)', background: 'var(--loss-soft)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--loss-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* RSS Panel */}
      <RssPanel category={activeCategory} color={cat.color} hasKey={hasKey} forceRefresh={forceRefresh} />

      {/* AI Feed */}
      <Slab>
        <PanelHead title={`AI ANALYSIS · ${cat.label}`} right={<Badge tone="muted">{filteredFeed.length} ITEMS</Badge>} />
        {filteredFeed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--glass-bg)' }}>
            <Zap size={28} color={cat.color} style={{ display: 'block', margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No {cat.label} AI intel yet</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>
              RSS live di atas · Klik "Fetch {cat.label}" untuk AI analysis
            </p>
          </div>
        ) : filteredFeed.map((item, i) => (
          <div key={item.id}>
            <FeedItemCard item={item} onDelete={deleteItem} catConfig={CATEGORIES.find(c => c.key === item.category)} />
            {i < filteredFeed.length - 1 && <Divider />}
          </div>
        ))}
      </Slab>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes rpulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
      `}</style>
    </div>
  );
}
