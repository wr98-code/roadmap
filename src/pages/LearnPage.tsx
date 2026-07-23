// ─── ZERO COMMAND — LearnPage.tsx ────────────────────────────────────────────
// AI Tutor Finance/Crypto/Investing — semua topik dari Obsidian Windu
// Terminal restructure: flat hairline-seam panels (Slab), theme-aware CSS-var
// color hygiene (light + dark). All logic, callClaude usage & topic data preserved.
import { useMemo, useState } from 'react';
import {
  GraduationCap, Zap, RefreshCw, Search, ChevronDown, BookMarked,
  TrendingUp, Globe, Cpu, Shield, DollarSign, BarChart2, Lock,
} from 'lucide-react';
import { callClaude, hasApiKey } from '@/lib/api';
import { cloudSet } from '@/lib/cloudStorage';
import { Slab, Panel, SeamGrid, PanelHead, Divider, Badge, tLabelStyle } from '@/components/terminal';
import { GLOSSARY, GLOSSARY_CATEGORIES, GlossaryCategory, searchGlossary } from '@/lib/glossary';
import { Register, useRegister, setRegister } from '@/lib/lang';

// ─── TOPIC CATALOG ────────────────────────────────────────────────────────────
const TOPICS = [
  // Category: Trading Mastery
  {
    id: 'coinglass-expert',
    category: 'trading',
    title: 'Coinglass Expert Guide',
    desc: 'Baca data seperti market maker — Liquidation Heatmap, Funding Rate, Open Interest',
    icon: BarChart2, color: '#f59e0b',
    prompt: `You are an expert crypto trader and educator. Teach me the COMPLETE Coinglass expert guide for a crypto futures trader in Indonesia. Cover:\n1. Liquidation Heatmap — cara baca warna merah/hijau, keputusan LONG/SHORT, timeframe\n2. Funding Rate — level kritis (>+0.1%), kapan reversal, jangan short hanya karena funding tinggi\n3. Open Interest — baca arah (OI naik + harga naik = bullish, dll)\n4. Flowchart keputusan LONG vs SHORT (5 langkah expert level)\n5. Kesalahan fatal trader berpengalaman\n6. Checklist 5 menit sebelum entry\n\nBe extremely specific and practical. Use examples dengan angka real.`,
  },
  {
    id: 'nupl-onchain',
    category: 'trading',
    title: 'NUPL & On-Chain Mastery',
    desc: 'NUPL, SOPR, Exchange Netflow, Glassnode indicators untuk timing market',
    icon: TrendingUp, color: '#7c3aed',
    prompt: `Teach me NUPL (Net Unrealized Profit/Loss) and on-chain indicators like a CryptoQuant expert. Cover:\n1. NUPL — apa itu, cara baca (NUPL < 0 = murah, > 0.75 = mahal), contoh market cycle\n2. SOPR — apa itu, cara baca (SOPR < 1 = tekanan jual), penggunaan praktis\n3. Exchange Netflow — BTC keluar exchange = bullish, masuk = bearish, cara trade ini\n4. Glassnode vs CryptoQuant — mana untuk apa\n5. Cara combine on-chain + price action + Coinglass untuk keputusan terbaik\n6. Contoh real trade dengan on-chain konfirmasi\n\nBerikan contoh konkret. Gunakan angka dan scenario nyata.`,
  },
  {
    id: 'funding-arbitrage',
    category: 'trading',
    title: 'Funding Rate Arbitrage',
    desc: 'Cash & carry trade, funding arbitrage strategy untuk passive income dari crypto',
    icon: DollarSign, color: '#059669',
    prompt: `Teach me Funding Rate Arbitrage strategy for crypto futures — like a professional quant trader. Cover:\n1. Apa itu funding rate dan mengapa ada — mekanisme penuh\n2. Cash & Carry Trade — long spot + short perpetual futures, step by step\n3. Delta-neutral position — bagaimana hedge posisi sempurna\n4. Platform terbaik untuk funding arb (Bybit, Binance, dkk)\n5. Kapan funding arbitrage worth it — threshold minimum\n6. Risk yang harus diwaspadai (liquidation risk, basis risk, exchange risk)\n7. Contoh kalkulasi: modal $2000, funding 0.1%/8jam = berapa profit/hari?\n\nSangat praktis. Fokus implementasi langsung.`,
  },
  {
    id: 'risk-management',
    category: 'trading',
    title: 'Risk Management Institusi',
    desc: 'VaR, Max Drawdown, Sharpe Ratio, hedging tools — level hedge fund',
    icon: Shield, color: '#dc2626',
    prompt: `Teach me risk management at institutional level — the way hedge funds like Bridgewater think about risk. Cover:\n1. Value at Risk (VaR) — apa itu, cara hitung, interpretasi\n2. Max Drawdown — cara hitung, kenapa ini metric terpenting, cara batasi\n3. Sharpe Ratio — apa itu, angka ideal (>1.5), cara improve\n4. Position sizing — Kelly Criterion vs fixed percentage, mana lebih aman\n5. Hedging tools untuk retail trader Indonesia: gold ETF, USDC yield, options\n6. Portfolio Visualizer — cara pakai untuk backtest dan risk analysis\n7. Aturan 2% risk per trade — kenapa ini sacred rule\n\nFokus pada implementasi untuk trader dengan modal Rp15-33 juta.`,
  },
  // Category: Finance Education
  {
    id: 'kosmos-keuangan',
    category: 'finance',
    title: 'Kosmos Keuangan Global',
    desc: 'Infrastruktur keuangan dunia — NYSE, Fed, hedge funds, tokenisasi aset',
    icon: Globe, color: '#2563eb',
    prompt: `Teach me the global financial cosmos like Ray Dalio would explain it to a young Indonesian trader. Cover:\n1. Infrastruktur Inti — bursa saham global (NYSE, NASDAQ, IDX), bank sentral (Fed, ECB, BI), sistem settlement\n2. Wall Street Machine — Goldman, JPMorgan, hedge funds, private equity\n3. Hedge fund strategies — macro, quant, algo trading, apa yang bisa dipelajari retail\n4. Tokenisasi aset — BlackRock BUIDL, Ondo Finance, masa depan keuangan\n5. Big Debt Cycle — cara Dalio melihat ekonomi, 5 Big Forces yang shape market\n6. Arus modal global — SWIFT, CIPS, geopolitik dan investasi\n7. Cara akses dari Indonesia — jalur nyata untuk modal $2K-$100K\n\nBuat se-konkret mungkin untuk pemuda Indonesia yang mau kaya dari zero.`,
  },
  {
    id: 'dalio-framework',
    category: 'finance',
    title: "Ray Dalio's Principles",
    desc: 'Big Debt Cycle, How the Economic Machine Works, All Weather Portfolio',
    icon: TrendingUp, color: '#d97706',
    prompt: `Teach me Ray Dalio's core frameworks as if you are Ray Dalio teaching me directly. Cover:\n1. How the Economic Machine Works — 3 forces (productivity, short debt cycle, long debt cycle)\n2. Big Debt Cycles — deleveraging phases, beautiful vs ugly deleveraging, saat ini kita di mana\n3. All Weather Portfolio — kenapa gold 15% penting, balance risiko bukan return\n4. Radical Transparency & Radical Truthfulness — cara think clearly\n5. 5 Big Forces hari ini: debt/money, internal conflict, rising power vs existing power, tech, climate\n6. Cara apply Dalio thinking untuk trader di Indonesia sekarang (2025-2026)\n7. Template morning reading routine ala Bridgewater\n\nBe direct, data-driven, no fluff. This is for a serious student of markets.`,
  },
  {
    id: 'naval-wealth',
    category: 'finance',
    title: "Naval Ravikant's Wealth Playbook",
    desc: 'Get rich without getting lucky — specific knowledge, leverage, permissionless',
    icon: Zap, color: '#059669',
    prompt: `Teach me Naval Ravikant's wealth creation framework — specifically applicable to a young crypto/fintech builder in Indonesia. Cover:\n1. Specific knowledge — apa itu, cara identify, kenapa ini tidak bisa di-automate\n2. Leverage: capital, code, media, labor — mana paling accessible untuk Indonesian founder\n3. Permissionless leverage — kenapa crypto/open source penting\n4. Compound knowledge — Naval baca apa, cara belajar seperti Naval\n5. Build wealth, not salary — perbedaan mindset gaji vs equity\n6. Patience in investing — kenapa most trading loses, kapan speculation ok\n7. Konkrit: kalau modal Rp33jt dan waktu 12 bulan, apa yang Naval lakukan?\n\nDirect and ruthlessly practical. No inspirational fluff — give me the playbook.`,
  },
  // Category: Crypto Deep
  {
    id: 'btc-cycle',
    category: 'crypto',
    title: 'Bitcoin Market Cycles',
    desc: 'Halving cycle, NUPL fases, accumulation vs distribution, timing entry exit',
    icon: TrendingUp, color: '#f59e0b',
    prompt: `Teach me Bitcoin market cycles like the world's top BTC analyst. Cover:\n1. Halving cycle — mengapa 4 tahun, supply shock mechanism, historical pattern\n2. NUPL phases: capitulation → hope → optimism → belief → thrill → euphoria → anxiety\n3. Accumulation vs Distribution indicators — on-chain signals untuk setiap fase\n4. Rainbow chart, Stock-to-Flow model — cara baca, limitasi\n5. HOW TO TIME: kapan accumulate, kapan hold, kapan reduce exposure\n6. Current cycle (2025-2026) — kita ada di fase mana sekarang\n7. Strategi DCA vs lump sum vs trading di setiap fase\n\nBeri angka konkret dan historical examples. Sangat praktis.`,
  },
  {
    id: 'altcoin-strategy',
    category: 'crypto',
    title: 'Altcoin Strategy Expert',
    desc: 'Alpha vs BTC, sector rotation, narrative trading, how to find 10x coins',
    icon: BarChart2, color: '#2563eb',
    prompt: `Teach me altcoin strategy like a top crypto fund manager. Cover:\n1. Altcoin season indicators — BTC Dominance, total3, altseason index\n2. Sector rotation — DeFi → L1 → L2 → meme → AI → RWA — pola yang berulang\n3. Narrative trading — cara identify narrative early, entry/exit strategy\n4. Due diligence framework: tokenomics, team, TVL, on-chain, holders\n5. Cara find 10x coins — dari mana hunt alpha: CT, Dune, Token Terminal\n6. Risk management untuk altcoins — position sizing, correlation dengan BTC\n7. Altcoin pools — sizing: low cap vs mid cap vs blue chip split\n\nFokus pada strategi yang proven dengan real examples (Solana 2021, AI narrative 2024, dll).`,
  },
  // Category: Macro & Global
  {
    id: 'macro-trading',
    category: 'macro',
    title: 'Macro Trading Framework',
    desc: 'Fed, DXY, yield curve, inflasi — cara trade macro events seperti hedge fund',
    icon: Globe, color: '#7c3aed',
    prompt: `Teach me macro trading framework used by top hedge funds and applicable to crypto/forex trader. Cover:\n1. Fed Policy & DXY relationship — saat Fed hawkish vs dovish, impact ke crypto dan gold\n2. Yield Curve — inverted yield curve = recession signal, cara trade ini\n3. Inflasi & CPI — cara baca data, trading di sekitar CPI release\n4. Dollar Index (DXY) — inverse correlation dengan crypto/gold, cara pakai\n5. FOMC calendar trading — setup pre/post FOMC, pattern yang berulang\n6. Geopolitical events — Ukraine/Russia, Taiwan, Middle East impact ke markets\n7. Cara build macro view daily: tools wajib, data yang harus cek tiap pagi\n\nBeri concrete trading setups berdasarkan macro signals. Sangat actionable.`,
  },
  {
    id: 'stablecoin-yield',
    category: 'macro',
    title: 'Stablecoin Yield Strategy',
    desc: 'USDC/USDT yield, Bybit Earn, T-Bills exposure, compound shield strategy',
    icon: Lock, color: '#059669',
    prompt: `Teach me stablecoin yield strategy for a crypto trader who wants passive income on idle capital. Cover:\n1. Types of stablecoin yield: CeFi (Bybit Earn, Coinbase Yield) vs DeFi (Aave, Compound, Curve)\n2. USDC yield via Circle — cara akses, current rates, safety\n3. Bybit Earn — how to use, flexible vs fixed, auto-compound\n4. T-Bills via tokenization — Ondo Finance USDY, BlackRock BUIDL, cara akses dari Indonesia\n5. Risk comparison: bank vs stablecoin yield vs DeFi yield\n6. Compound Shield strategy dari Obsidian: 30% profit masuk yield\n7. Kalkulasi: kalau $500 masuk Bybit Earn 5% APY, berapa per bulan?\n\nFokus pada safety dan accessibility untuk trader Indonesia. Real numbers.`,
  },
  // Category: AI & Tech
  {
    id: 'ai-finance',
    category: 'ai',
    title: 'AI Tools for Finance & Trading',
    desc: 'AlphaSense, Numerai, Perplexity, AI-powered research workflow untuk trader',
    icon: Cpu, color: '#7c3aed',
    prompt: `Teach me how to use AI tools for finance and trading research — from a professional perspective. Cover:\n1. AI research tools: AlphaSense, Perplexity, Sentieo — perbedaan dan cara pakai\n2. Numerai — apa itu, cara participate, machine learning untuk trading signals\n3. LLM untuk trading research: cara prompt Claude/GPT untuk market analysis\n4. Token Metrics — AI coin ratings, cara baca, limitasi\n5. Sentiment analysis tools: LunarCrush untuk crypto social sentiment\n6. Cara build daily AI research workflow: dari waking up sampai placing a trade\n7. AI untuk backtesting: QuantConnect, cara pakai untuk test strategi\n\nFokus pada tools yang accessible (freemium/gratis) untuk trader individual Indonesia.`,
  },
  {
    id: 'fintech-builder',
    category: 'ai',
    title: 'Fintech Builder Playbook',
    desc: 'Stripe Atlas, LLC setup, Web3 klien hunting, Zero Build Labs roadmap',
    icon: Zap, color: '#2563eb',
    prompt: `Teach me how to build a fintech/Web3 business from Indonesia — practical playbook. Cover:\n1. Legal entity: cara setup LLC di AS via Stripe Atlas, benefit untuk Indonesian founder\n2. Banking: Wise Business, Mercury, cara buka rekening USD dari Indonesia\n3. Client acquisition: cara cari klien Web3/crypto dari Indonesia — platform (Telegram, Discord, Upwork)\n4. Pricing: cara price UI/UX atau dev work untuk Web3 klien\n5. ZERØ BUILD LAB strategy: product (ZeroMeridian, ZeroWatch), go-to-market\n6. Revenue streams: freelance → retainer → product → SaaS\n7. Roadmap 90 hari untuk founder dengan modal Rp33jt: apa yang fokus?\n\nSangat practical. Untuk founder muda Indonesia yang mau bootstrap dari nol.`,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'trading', label: 'Trading' },
  { key: 'finance', label: 'Finance' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'macro', label: 'Macro' },
  { key: 'ai', label: 'AI & Build' },
];

interface Lesson { topicId: string; content: string; timestamp: string; }
const LESSONS_KEY = 'zero-lessons-v2';
function loadLessons(): Record<string, Lesson> {
  try { return JSON.parse(localStorage.getItem(LESSONS_KEY) || '{}'); } catch { return {}; }
}
function saveLessons(l: Record<string, Lesson>) { localStorage.setItem(LESSONS_KEY, JSON.stringify(l)); cloudSet(LESSONS_KEY, l); }

// ─── TOPIC ROW ──────────────────────────────────────────────────────────────
// Flat panel, hairline-separated inside the topic library Slab.
function TopicCard({
  topic, lesson, onLearn, loading,
}: {
  topic: typeof TOPICS[0];
  lesson?: Lesson;
  onLearn: (topic: typeof TOPICS[0]) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: 'var(--glass-bg)' }}>
      {/* Row header */}
      <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Emoji chip (neutral) */}
        <div style={{
          width: 34, height: 34, borderRadius: 7, flexShrink: 0,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <topic.icon size={16} color={topic.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            {/* Small decorative category hue dot */}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: topic.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
              {topic.title}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {topic.desc}
          </div>
          {lesson && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--gain)', background: 'var(--gain-soft)', padding: '2px 7px', borderRadius: 4, fontVariantNumeric: 'tabular-nums' }}>
                LEARNED · {lesson.timestamp}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {lesson && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: '6px 12px', borderRadius: 7,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            onClick={() => onLearn(topic)}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: 7,
              background: loading ? 'var(--color-surface)' : 'var(--color-primary)',
              color: loading ? 'var(--color-muted)' : 'var(--on-primary)',
              border: 'none', fontSize: 12, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {loading
              ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Learning…</>
              : lesson
                ? <><RefreshCw size={11} /> Refresh</>
                : <><Zap size={11} /> Learn</>}
          </button>
        </div>
      </div>

      {/* Lesson content (inset) */}
      {lesson && expanded && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '16px',
          background: 'var(--color-surface)',
        }}>
          <div style={{
            fontSize: 14, color: 'var(--color-text)',
            lineHeight: 1.9, whiteSpace: 'pre-wrap',
          }}>
            {lesson.content}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN LearnPage ───────────────────────────────────────────────────────────
export function LearnPage() {
  const [lessons, setLessons] = useState<Record<string, Lesson>>(loadLessons);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [error, setError] = useState('');

  const learn = async (topic: typeof TOPICS[0]) => {
    if (!hasApiKey()) { setError('API key required.'); return; }
    setLoadingId(topic.id); setError('');
    try {
      const content = await callClaude(topic.prompt, {
        search: true,
        maxTokens: 2500,
        systemPrompt: 'You are an expert finance and crypto educator. Teach clearly, use specific examples, real numbers, and concrete action steps. Write in clear paragraphs with plain text headers (no emojis). Be direct and practical — no fluff.',
      });
      const lesson: Lesson = { topicId: topic.id, content, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) };
      const updated = { ...lessons, [topic.id]: lesson };
      setLessons(updated); saveLessons(updated);
    } catch (e: any) { setError(e.message === 'NO_API_KEY' ? 'API key required.' : e.message); }
    setLoadingId(null);
  };

  const askCustom = async () => {
    if (!customQuestion.trim() || !hasApiKey()) return;
    setCustomLoading(true); setCustomAnswer(''); setError('');
    try {
      const answer = await callClaude(
        `Context: Saya adalah trader crypto di Indonesia, fokus pada crypto futures, forex, gold. Punya modal Rp33jt dengan target X30 dalam 12 bulan.\n\nPertanyaan saya: ${customQuestion}`,
        {
          search: true, maxTokens: 2000,
          systemPrompt: 'You are an expert finance/crypto/investing tutor. Answer directly and practically. Use real examples. Focus on what is actionable for a self-taught Indonesian trader.',
        }
      );
      setCustomAnswer(answer);
    } catch (e: any) { setError(e.message); }
    setCustomLoading(false);
  };

  const filteredTopics = activeCategory === 'all'
    ? TOPICS
    : TOPICS.filter(t => t.category === activeCategory);

  const learnedCount = Object.keys(lessons).length;
  const pct = TOPICS.length ? (learnedCount / TOPICS.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header — paneled slab with progress readout */}
      <Slab>
        <SeamGrid cols="1.7fr 1fr">
          <Panel style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              background: 'var(--rail-active-bg)', border: '1px solid var(--rail-active-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={22} color="var(--color-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', margin: 0 }}>
                ZERØ LEARN HUB
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '3px 0 0', lineHeight: 1.45 }}>
                AI tutor — semua topik dari Obsidian lo. Belajar dari Naval, Dalio, sampai Coinglass expert.
              </p>
            </div>
          </Panel>
          <Panel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
              <span style={tLabelStyle}>Topics Learned</span>
              <span className="num" style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {learnedCount}/{TOPICS.length}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--color-surface)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
          </Panel>
        </SeamGrid>
      </Slab>

      {error && (
        <div style={{ fontSize: 13, color: 'var(--loss)', background: 'var(--loss-soft)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--loss-soft)' }}>
          {error}
        </div>
      )}

      {/* ── KAMUS ISTILAH — bisnis / ekonomi / akuntansi ── */}
      <GlossarySection />

      {/* Category Filter — terminal tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all' ? TOPICS.length : TOPICS.filter(t => t.category === cat.key).length;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '7px 14px', borderRadius: 7, fontSize: 13,
                border: `1px solid ${isActive ? 'var(--rail-active-border)' : 'var(--color-border)'}`,
                background: isActive ? 'var(--rail-active-bg)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s',
              }}
            >
              {cat.label}
              <span className="num" style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
                background: isActive ? 'var(--rail-active-bg)' : 'var(--color-border)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                borderRadius: 4, padding: '0 5px',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Topic Library — one Slab, flat rows, hairline seams */}
      <Slab>
        <PanelHead
          title="TOPIC LIBRARY"
          right={<Badge tone="muted">{filteredTopics.length} TOPICS</Badge>}
        />
        {filteredTopics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--glass-bg)' }}>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Belum ada topik di kategori ini.</p>
          </div>
        ) : filteredTopics.map((topic, i) => (
          <div key={topic.id}>
            <TopicCard
              topic={topic}
              lesson={lessons[topic.id]}
              onLearn={learn}
              loading={loadingId === topic.id}
            />
            {i < filteredTopics.length - 1 && <Divider />}
          </div>
        ))}
      </Slab>

      {/* Custom Question / AI Tutor */}
      <Slab>
        <PanelHead
          title="TANYA AI TUTOR · FREE QUESTION"
          right={<Badge tone="accent">AI</Badge>}
        />
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Tanya apapun soal finance, crypto, trading, investing..."
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askCustom()}
              style={{
                flex: 1, padding: '10px 14px',
                border: '1px solid var(--color-border)', borderRadius: 7,
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={askCustom}
              disabled={customLoading || !customQuestion.trim()}
              style={{
                padding: '10px 18px', borderRadius: 7,
                background: customLoading ? 'var(--color-surface)' : 'var(--color-primary)',
                color: customLoading ? 'var(--color-muted)' : 'var(--on-primary)',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: customLoading || !customQuestion.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0,
              }}
            >
              {customLoading
                ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Thinking…</>
                : <><Zap size={13} /> Ask</>}
            </button>
          </div>

          {customAnswer && (
            <div style={{
              marginTop: 14,
              padding: '14px 16px', borderRadius: 8,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            }}>
              <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                {customAnswer}
              </div>
            </div>
          )}
        </div>
      </Slab>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── KAMUS ISTILAH — bisnis / ekonomi / akuntansi ─────────────────────────────
// Satu sumber kebenaran: src/lib/glossary.ts (juga dipakai semua tooltip
// <MetricInfo> di halaman Keuangan & Wealth, dan "Istilah Hari Ini" di Home).
function GlossarySection() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GlossaryCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const register = useRegister();

  const results = useMemo(() => searchGlossary(q, cat), [q, cat]);

  return (
    <Slab>
      <PanelHead
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <BookMarked size={13} /> KAMUS ISTILAH · BISNIS & EKONOMI
          </span>
        }
        right={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {/* switch register bahasa — berlaku app-wide, tersimpan */}
            <span style={{ display: 'inline-flex', gap: 2, background: 'var(--color-surface)', borderRadius: 999, padding: 3 }}>
              {([['santai', 'Santai'], ['pro', 'Profesional']] as [Register, string][]).map(([r, label]) => (
                <button
                  key={r}
                  onClick={() => setRegister(r)}
                  style={{
                    padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    fontSize: 11.5, fontFamily: 'var(--font-sans)', fontWeight: register === r ? 700 : 500,
                    background: register === r ? 'var(--raised)' : 'transparent',
                    color: register === r ? 'var(--color-primary)' : 'var(--color-muted)',
                    boxShadow: register === r ? 'var(--card-shadow)' : 'none',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}
                >
                  {label}
                </button>
              ))}
            </span>
            <Badge tone="muted">{GLOSSARY.length} ISTILAH</Badge>
          </span>
        }
      />
      <div style={{ padding: '0 16px 6px' }}>
        <p style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.55, margin: '0 0 12px' }}>
          Biar nyambung waktu dengar CAGR, EBITDA, ARA/ARB, atau bedanya COO vs CFO —
          bahasa santai, bukan textbook. Istilah yang sama muncul sebagai tooltip "?"
          di halaman Keuangan & Wealth.
        </p>

        {/* search + category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={13} color="var(--color-dim)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari istilah… (cth: CAGR, dividen, runway)"
              style={{
                width: '100%', padding: '8px 12px 8px 32px',
                border: '1px solid var(--color-border)', borderRadius: 10,
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {([{ key: 'all' as const, label: 'Semua' }, ...GLOSSARY_CATEGORIES]).map(c => {
              const count = c.key === 'all' ? GLOSSARY.length : GLOSSARY.filter(t => t.category === c.key).length;
              const on = cat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key as GlossaryCategory | 'all')}
                  style={{
                    padding: '5px 11px', borderRadius: 999, fontSize: 12,
                    border: `1px solid ${on ? 'var(--rail-active-border)' : 'var(--color-border)'}`,
                    background: on ? 'var(--rail-active-bg)' : 'var(--color-surface)',
                    color: on ? 'var(--color-primary)' : 'var(--color-muted)',
                    fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {c.label} <span className="num" style={{ fontSize: 10, opacity: 0.7 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* term rows */}
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 16px' }}>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, margin: 0 }}>
            Tidak ada istilah yang cocok dengan "{q}".
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          {results.map((t, i) => {
            const open = openId === t.id;
            const catInfo = GLOSSARY_CATEGORIES.find(c => c.key === t.category);
            return (
              <div key={t.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setOpenId(open ? null : t.id)}
                  aria-expanded={open}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', background: open ? 'var(--color-surface)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    transition: 'background var(--dur-fast) var(--ease-out)',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                    {t.term}
                  </span>
                  {t.full && (
                    <span style={{ fontSize: 12, color: 'var(--color-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {t.full}
                    </span>
                  )}
                  {!t.full && <span style={{ flex: 1 }} />}
                  {t.priority && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-primary)', background: 'var(--ember-soft)', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                      SERING MUNCUL
                    </span>
                  )}
                  <span style={{ fontSize: 10.5, color: 'var(--color-dim)', whiteSpace: 'nowrap' }}>
                    {catInfo?.label}
                  </span>
                  <ChevronDown size={13} color="var(--color-dim)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-med) var(--ease-out)', flexShrink: 0 }} />
                </button>
                {open && (
                  <div style={{ padding: '2px 16px 15px', background: 'var(--color-surface)' }}>
                    {/* dua register berdampingan — versi terpilih dulu; keduanya
                        terlihat karena justru perbandingannya yang mengajarkan */}
                    {([
                      register === 'pro'
                        ? [['Profesional', t.defPro ?? t.def], ['Santai', t.def]]
                        : [['Santai', t.def], ['Profesional', t.defPro ?? t.def]],
                    ] as [string, string][][])[0].map(([label, text], idx) => (
                      <div key={label} style={{ marginTop: idx === 0 ? 0 : 10 }}>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                          color: idx === 0 ? 'var(--color-primary)' : 'var(--color-dim)',
                        }}>
                          {label}
                        </span>
                        <p style={{ fontSize: idx === 0 ? 13.5 : 12.5, color: idx === 0 ? 'var(--color-text)' : 'var(--color-muted)', lineHeight: 1.7, margin: '3px 0 0' }}>
                          {text}
                        </p>
                      </div>
                    ))}
                    {t.formula && (
                      <p className="num" style={{
                        fontSize: 12.5, margin: '9px 0 0', padding: '8px 12px', borderRadius: 9,
                        background: 'var(--raised)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', overflowX: 'auto', whiteSpace: 'nowrap',
                      }}>
                        {t.formula}
                      </p>
                    )}
                    {t.example && (
                      <p style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6, margin: '9px 0 0', fontStyle: 'italic' }}>
                        Contoh: {t.example}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Slab>
  );
}
