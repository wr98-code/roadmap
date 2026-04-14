// ─── ZERØ COMMAND — MasterBizPage.tsx ─────────────────────────────────────────
// Master Business Intelligence · All Industries · 2025–2035
// Research: Claude (Anthropic) · Updated: April 2026

import { useState } from 'react';
import {
  Brain, Zap, Target, TrendingUp, Globe, Shield, Gamepad2,
  Bitcoin, Code2, Layers, HeartPulse, ChevronDown, ChevronUp,
  Rocket, Star, AlertTriangle, CheckCircle2, ArrowRight, Package,
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MarketData {
  name: string;
  icon: any;
  color: string;
  market2025: string;
  market2030: string;
  cagr: string;
  gap: string;
  skillMatch: 'HIGH' | 'MED' | 'LOW';
  products: string[];
  pricingRange: string;
}

interface BuildItem {
  name: string;
  tagline: string;
  status: 'EXISTING' | 'BUILD' | 'EXPAND';
  phase: 1 | 2 | 3 | 4;
  pricing: string;
  effort: 'LOW' | 'MED' | 'HIGH';
  upside: string;
  action: string;
}

interface DistChannel {
  platform: string;
  tactic: string;
  expectedResult: string;
  priority: 'NOW' | 'SOON' | 'LATER';
}

// ─── DATA: WHO YOU ARE ────────────────────────────────────────────────────────
const SKILLS = [
  { label: 'Real-time Systems', detail: 'WebSocket sub-100ms, multi-exchange aggregation', tier: 'S' },
  { label: 'AI Pipeline Builder', detail: 'Whisper + Gemini + BullMQ · production, bukan tutorial', tier: 'S' },
  { label: 'Edge Architecture', detail: 'Cloudflare Workers · $0/month infra · global deployment', tier: 'S' },
  { label: 'Full Product Owner', detail: 'Ideation → ship → monetize · paying users · solo', tier: 'S' },
  { label: 'Crypto Fintech', detail: 'On-chain analytics · Solana · multi-exchange integration', tier: 'A' },
  { label: 'Full-Stack TypeScript', detail: 'React · Next.js · Hono · Supabase · TailwindCSS', tier: 'A' },
  { label: 'SaaS Monetization', detail: 'Gumroad · LemonSqueezy · Stripe · lifetime + subscription', tier: 'A' },
];

// ─── DATA: ALL INDUSTRIES + MARKET SIZE ──────────────────────────────────────
const MARKETS: MarketData[] = [
  {
    name: 'AI Agents',
    icon: Brain,
    color: '#7c3aed',
    market2025: '$7.84B',
    market2030: '$52.62B',
    cagr: '46.3%',
    gap: 'Vertical AI agents (CAGR 62.7%) — niche-specific agents untuk satu industri shortage parah. Supply hampir nol, demand enterprise terus naik.',
    skillMatch: 'HIGH',
    products: ['AI workflow automation untuk UMKM', 'WhatsApp AI agent untuk bisnis', 'Industry-specific AI copilot', 'Multi-agent orchestration system'],
    pricingRange: '$150–$300/jam · $2k–$10k/bulan retainer',
  },
  {
    name: 'DeFi & Crypto Tools',
    icon: Bitcoin,
    color: '#d97706',
    market2025: '$32.36B',
    market2030: '$256.4B+',
    cagr: '43.3%',
    gap: 'Data & analytics segment dominan — gap di retail/mid-tier yang butuh tools Nansen/Glassnode tapi affordable. Solana+EVM developer tools masih underbuilt.',
    skillMatch: 'HIGH',
    products: ['ZERØ SIGNALS — AI trading signal aggregator', 'ZERØ ARBITRAGE — cross-exchange scanner', 'On-chain whale intelligence (retail price)', 'Crypto data API (B2B, $99–$499/bulan)'],
    pricingRange: '$9–$99/bulan · API B2B $99–$499/bulan',
  },
  {
    name: 'Micro-SaaS',
    icon: Package,
    color: '#059669',
    market2025: '$15.7B',
    market2030: '$59.6B',
    cagr: '30%',
    gap: '73% successful SaaS dari solopreneurs target micro-segment yang diabaikan kompetitor besar. Sweet spot: $29–$199/month, satu pain point, niche spesifik.',
    skillMatch: 'HIGH',
    products: ['Vertical AI meeting notes (healthcare/legal)', 'Booking system klinik/salon Indo', 'E-commerce analytics dashboard', 'Reputation management local business'],
    pricingRange: '$29–$199/bulan · $199–$999 lifetime',
  },
  {
    name: 'Game Dev Tools & Backend',
    icon: Gamepad2,
    color: '#ec4899',
    market2025: '$4.85B (indie)',
    market2030: '$9.55B',
    cagr: '14.54%',
    gap: 'Indie developer butuh: analytics pipeline, leaderboard-as-a-service, real-time matchmaking. Enterprise tools (PlayFab) terlalu mahal, open-source terlalu ribet. Gap besar, supply hampir nol di Indonesia.',
    skillMatch: 'HIGH',
    products: ['Game analytics dashboard ($19/bulan)', 'Leaderboard & matchmaking API ($9/bulan)', 'Game backend starter kit ($49 one-time)', 'Real-time player event pipeline'],
    pricingRange: '$9–$49/bulan · $49–$199 one-time',
  },
  {
    name: 'Online Gaming (Total)',
    icon: Gamepad2,
    color: '#10b981',
    market2025: '$208.58B',
    market2030: '$333.20B',
    cagr: '8.12%',
    gap: 'Indonesia #1.3B mobile spend on mobile games, 96% mobile preference. Asia-Pacific 44.35% market share. Cloud gaming revenue $1.4B → $18.3B by 2030 (CAGR 50%+).',
    skillMatch: 'MED',
    products: ['Game analytics untuk indie studio lokal', 'UGC platform tooling', 'Cloud gaming backend infra'],
    pricingRange: '$19–$99/bulan',
  },
  {
    name: 'AI Content Tools',
    icon: Zap,
    color: '#2563eb',
    market2025: '$3.24B (meetings)',
    market2030: '$7.33B',
    cagr: '~12% base / 30%+ niche',
    gap: 'Generic tools (Otter, Fireflies) sudah ada — gap di VERTICAL: healthcare HIPAA, legal summaries, sales coaching. Video clipper & AI dubbing untuk Bahasa Indonesia hampir tidak ada.',
    skillMatch: 'HIGH',
    products: ['ZERØ CLIP — AI video clipper & repurposing', 'AI subtitle + dubbing Bahasa Indonesia', 'AI meeting notes untuk UMKM (WA delivery)', 'Vertical AI notes untuk klinik Indonesia'],
    pricingRange: '$19–$49/bulan · $199 lifetime',
  },
  {
    name: 'Cybersecurity Services',
    icon: Shield,
    color: '#dc2626',
    market2025: 'Shortage 4M profesional',
    market2030: '+15%/tahun',
    cagr: '15% pa',
    gap: 'Indonesia: Managed Security Services 33% revenue share IT market karena wajib comply regulasi data. Demand naik tapi hampir tidak ada spesialis lokal.',
    skillMatch: 'LOW',
    products: ['Security audit untuk startup', 'WebSocket penetration testing tool', 'API monitoring & anomaly detection'],
    pricingRange: '$90–$180/jam · enterprise contract',
  },
  {
    name: 'Healthtech / Telemedicine',
    icon: HeartPulse,
    color: '#059669',
    market2025: '$46.03B',
    market2030: '$380.3B',
    cagr: '30%',
    gap: 'Healthcare IT Indonesia CAGR 12.75% sampai 2031. Ribuan klinik kecil masih pakai WA manual. Telemedicine scheduling, AI documentation, patient management — semua gap.',
    skillMatch: 'MED',
    products: ['Booking system untuk klinik kecil ($39/bulan)', 'AI meeting notes HIPAA-compliant', 'Telemedicine scheduling + WA reminder', 'Patient management SaaS untuk dokter praktek'],
    pricingRange: '$29–$99/bulan',
  },
  {
    name: 'Cloud / SaaS (Total)',
    icon: Layers,
    color: '#6366f1',
    market2025: '$399.10B',
    market2030: '$819.23B',
    cagr: '~12.8%',
    gap: 'IT services Indonesia dari $4.76B (2025) → $9.52B (2031), CAGR 12%. SME segment tumbuh 13% CAGR. AI & ML teknologi tumbuh paling cepat di dalamnya.',
    skillMatch: 'HIGH',
    products: ['Custom SaaS MVP untuk klien global ($35k–$60k)', 'Vertical micro-SaaS series', 'Developer tools B2B'],
    pricingRange: 'Project: $35k–$60k · SaaS: $29–$499/bulan',
  },
  {
    name: 'Blockchain Dev Tools',
    icon: Code2,
    color: '#f59e0b',
    market2025: '$49.99B',
    market2030: '$220.93B (by 2029)',
    cagr: '~34% (blockchain market total)',
    gap: 'Broader blockchain market forecast ~$1.43 TRILLION by 2030. Developer tooling, middleware, cross-chain infra — all underbuilt. Solana onboarded 11,534 devs H1 2025 saja.',
    skillMatch: 'HIGH',
    products: ['WebSocket stress testing tool ($49/bulan)', 'Multi-chain dev dashboard', 'On-chain data API as a service', 'Cross-chain analytics middleware'],
    pricingRange: '$19–$499/bulan · API pricing',
  },
  {
    name: 'AI Automation Consulting',
    icon: TrendingUp,
    color: '#84cc16',
    market2025: 'CAGR 28.8% to 2029',
    market2030: 'AI consulting market explosive',
    cagr: '28.8%',
    gap: 'n8n specialist charge $50–$150/jam. Independent AI consultant: $150–$300/jam, retainer $2k–$10k/bulan. 65 juta UMKM Indonesia belum bisa automate WA Business mereka.',
    skillMatch: 'HIGH',
    products: ['WA automation untuk UMKM (n8n + AI)', 'Order management automation', 'Invoice & follow-up automation system', 'AI workflow consulting retainer'],
    pricingRange: '$50–$300/jam · $2k–$10k/bulan retainer',
  },
  {
    name: 'Creator Economy Tools',
    icon: Globe,
    color: '#ea580c',
    market2025: '$104B',
    market2030: 'Growing',
    cagr: '~340% growth micro-niches (Gartner Q4 2025)',
    gap: 'Podcast repurposing, video clipping, content automation — 440,000 active podcasters butuh tools ini tiap minggu. Gil Hildebrand pre-sold $20K lifetime deals sebelum nulis 1 baris kode.',
    skillMatch: 'HIGH',
    products: ['ZERØ CLIP (AI video → clips)', 'AI content repurposing suite', 'AI thumbnail generator untuk YouTuber Indo', 'Content scheduling + analytics SaaS'],
    pricingRange: '$19–$99/bulan · $199 lifetime',
  },
];

// ─── DATA: MASTER BUILD LIST ──────────────────────────────────────────────────
const BUILD_LIST: BuildItem[] = [
  // Phase 1
  {
    name: 'ZERØ ORDER BOOK', tagline: 'Multi-exchange order book, depth chart, liquidations',
    status: 'EXISTING', phase: 1,
    pricing: 'UBAH: $9 lifetime → $9/bulan atau $79/tahun',
    effort: 'LOW', upside: 'Immediate recurring revenue dari existing users',
    action: 'Ganti pricing model + tambah Coinbase, Kraken, dYdX, footprint chart, funding rate overlay',
  },
  {
    name: 'ZERØ WATCH MONITOR', tagline: 'Multi-chain wallet monitor, whale alerts, push notif',
    status: 'EXISTING', phase: 1,
    pricing: 'UBAH: $9 lifetime → $15/bulan',
    effort: 'MED', upside: 'Expand: Base, Polygon, Avalanche + Telegram bot alerts',
    action: 'Tambah chains EVM + Telegram delivery + ganti ke subscription pricing',
  },
  {
    name: 'ZERØ SNIPER', tagline: 'Solana new token scanner, rug risk scoring, DEX actions',
    status: 'EXISTING', phase: 1,
    pricing: 'UBAH: $19 lifetime → $29/bulan',
    effort: 'MED', upside: 'Expand ke EVM chains (Base, ETH) — meme coin demand brutal',
    action: 'Expand ke Base + ETH token launch detection + ganti pricing',
  },
  {
    name: 'ZERØ CLIP', tagline: 'AI video → clips pipeline (Whisper built, deploy pending)',
    status: 'EXISTING', phase: 1,
    pricing: '$29/bulan atau $199/lifetime',
    effort: 'LOW', upside: 'Pipeline udah ada, tinggal landing page + distribusi',
    action: 'Deploy landing page + setup Gumroad/Stripe + distribusi ke YouTuber Discord/komunitas',
  },
  // Phase 2
  {
    name: 'ZERØ SIGNALS', tagline: 'AI trading signal aggregator via Telegram/Discord',
    status: 'BUILD', phase: 2,
    pricing: '$29–$49/bulan',
    effort: 'MED', upside: 'Gabungin ZERØ WATCH on-chain + technical indicators + Gemini AI scoring',
    action: 'Build signal scoring engine + Telegram delivery + landing page + distribusi ke trader community',
  },
  {
    name: 'ZERØ ARBITRAGE', tagline: 'Cross-exchange spread + funding rate scanner real-time',
    status: 'BUILD', phase: 2,
    pricing: '$49/bulan',
    effort: 'MED', upside: 'Lo udah punya WebSocket infra Binance/Bybit/OKX — tinggal build logic',
    action: 'Build arbitrage detection engine + UI dashboard + launch ke delta-neutral trader community',
  },
  {
    name: 'AI DUBBING INDONESIA', tagline: 'Auto-subtitle + translate + dub konten Bahasa Indonesia',
    status: 'BUILD', phase: 2,
    pricing: '$19–$49/bulan',
    effort: 'MED', upside: 'Whisper pipeline sudah ada. Extend ke auto-subtitle ID, translate, dubbed audio. Gap gila, tool serupa hampir tidak ada.',
    action: 'Extend Whisper pipeline + tambah Bahasa Indonesia TTS + landing page + komunitas kreator',
  },
  {
    name: 'GAME ANALYTICS API', tagline: 'Player retention, session, funnel — indie game dashboard',
    status: 'BUILD', phase: 2,
    pricing: '$19/bulan per studio',
    effort: 'MED', upside: 'WebSocket + real-time infra lo direct hit. Indie dev pasang SDK kecil, data masuk ke dashboard lo.',
    action: 'Build SDK (Unity/Godot) + dashboard + distribusi ke indie game Discord/forums',
  },
  {
    name: 'LEADERBOARD + MATCHMAKING API', tagline: 'As-a-service untuk indie game developer',
    status: 'BUILD', phase: 2,
    pricing: '$9/bulan',
    effort: 'LOW', upside: 'Literally WebSocket + edge infra yang lo sudah expert. LootLocker ada tapi mahal untuk solo dev.',
    action: 'Build REST + WebSocket endpoints + docs + distribusi di indie dev forums',
  },
  {
    name: 'WA AUTOMATION PLATFORM', tagline: 'n8n + AI + WhatsApp Business API untuk UMKM',
    status: 'BUILD', phase: 3,
    pricing: '$29/bulan per bisnis',
    effort: 'HIGH', upside: '65 juta UMKM, demand ada, supply hampir nol. Retainer potential $2k–$10k/bulan untuk implementation.',
    action: 'Pelajari n8n + WA Business API + build template workflow + soft launch ke UMKM Surabaya',
  },
  {
    name: 'KLINIK BOOKING SYSTEM', tagline: 'Simple booking untuk klinik/salon kecil, WA-connected',
    status: 'BUILD', phase: 3,
    pricing: '$39/bulan',
    effort: 'MED', upside: 'Ribuan klinik Indo masih pakai WA manual. Simple, focused, recurring.',
    action: 'Build MVP booking + WA reminder + landing page + cold outreach ke klinik lokal',
  },
  {
    name: 'ZERØ MERIDIAN', tagline: 'Full trading intel platform — paywall pending',
    status: 'EXPAND', phase: 3,
    pricing: 'Freemium + $29/bulan Pro',
    effort: 'MED', upside: 'Kompetitor langsung TradingView/Nansen/DeFiLlama dalam satu interface. Lo udah build ini — tinggal monetize.',
    action: 'Setup ProtectedRoute + paywall + Stripe + soft launch ke crypto community',
  },
  {
    name: 'CRYPTO DATA API (B2B)', tagline: 'WebSocket infrastructure lo sebagai API untuk developer lain',
    status: 'BUILD', phase: 4,
    pricing: '$99–$499/bulan',
    effort: 'MED', upside: 'Lo udah build infra-nya — tinggal expose endpoint-nya. B2B model, dollar rate.',
    action: 'Package WebSocket infra + API docs + developer portal + launch di crypto dev forums',
  },
  {
    name: 'AI WORKFLOW CONSULTING', tagline: 'AI automation consulting untuk enterprise Indonesia',
    status: 'BUILD', phase: 4,
    pricing: '$150–$300/jam · $2k–$10k/bulan retainer',
    effort: 'HIGH', upside: 'Highest rate per hour. Shortage brutal. Tapi perlu 1-2 klien dulu untuk track record.',
    action: 'Kuasai n8n + Telegram Bot + Docker + mulai dengan 1 klien UMKM referensi',
  },
];

// ─── DATA: DISTRIBUTION CHANNELS ─────────────────────────────────────────────
const DISTRIBUTION: DistChannel[] = [
  {
    platform: 'Crypto Twitter / X', tactic: 'Post daily alpha: market insight, on-chain data thread, product showcase. Bukan jualan — sharing. CTA di bio ke Gumroad.',
    expectedResult: 'Organic following → product discovery', priority: 'NOW',
  },
  {
    platform: 'Crypto Discord Communities', tactic: 'Join 5-10 Discord crypto aktif (Binance, Bybit, trader lokal). Jadi helpful member dulu 2 minggu. Baru soft pitch produk lo pas ada yang nanya tentang tools.',
    expectedResult: 'First paying users dalam 30 hari', priority: 'NOW',
  },
  {
    platform: 'Reddit (r/algotrading, r/CryptoCurrency)', tactic: 'Post case study: "Saya build X dalam Y hari, ini hasilnya." Screenshot real. Bukan iklan — value first.',
    expectedResult: 'Traffic + credibility build', priority: 'NOW',
  },
  {
    platform: 'Product Hunt', tactic: 'Launch ZERØ CLIP atau ZERØ SIGNALS. Persiapkan 2 minggu sebelumnya. Minta support dari network.',
    expectedResult: '200–2000 visitors, potential early adopters', priority: 'SOON',
  },
  {
    platform: 'Indie Hackers', tactic: 'Buat profile + milestones post: "Building ZERØ — crypto tools solo founder." Update tiap minggu. Community ini suka cerita builder.',
    expectedResult: 'Community + feedback + potential klien SaaS', priority: 'SOON',
  },
  {
    platform: 'TikTok / Reels (Showcase)', tactic: '60-detik video: "Gw bikin X dalam 3 hari." Process video, bukan tutorial. Hasilnya, bukan caranya. CTA ke link.',
    expectedResult: 'Viral potential → bisa replace 6 bulan cold outreach', priority: 'SOON',
  },
  {
    platform: 'Indie Game Discord/Forums', tactic: 'Untuk game analytics & leaderboard API — join r/indiegaming, GameDev.net, Unity/Godot Discord. Tawarin beta gratis, minta feedback.',
    expectedResult: 'First game studio clients', priority: 'SOON',
  },
  {
    platform: 'Toptal / Arc.dev / Gun.io', tactic: 'Apply sebagai crypto/fintech engineer. Bukan Upwork biasa — ini dollar rate ($75–$100/jam). Portfolio ZERØ yang lo punya udah cukup.',
    expectedResult: '$75–$150/jam contract rate', priority: 'SOON',
  },
  {
    platform: 'Direct Outreach UMKM', tactic: 'Cari bisnis yang websitenya jelek/gak ada di Google Maps/Instagram. DM personal + spesifik: sebut masalahnya, tawarin mockup gratis dulu.',
    expectedResult: 'Closing 1–3 dari 20 outreach', priority: 'LATER',
  },
  {
    platform: 'Threads (Indonesia)', tactic: 'Posting insight, behind the scenes kerja, hasil project. Bukan hard-sell. Threads audience Indonesia cocok untuk exposure organik UMKM & startup.',
    expectedResult: 'Brand awareness lokal', priority: 'LATER',
  },
];

// ─── DATA: TECH TO LEARN ─────────────────────────────────────────────────────
const TECH_STRONG = [
  'React / TypeScript', 'WebSocket real-time', 'Cloudflare Workers / Edge',
  'Gemini / OpenAI API', 'Supabase / PostgreSQL', 'Gumroad / LemonSqueezy',
  'Solana Web3.js', 'Multi-exchange WebSocket', 'Whisper AI pipeline',
];
const TECH_ADD = [
  { name: 'n8n / Make', why: 'Automation consulting — $150–$300/jam rate', priority: '🔴 CRITICAL' },
  { name: 'Telegram Bot API', why: 'Alert delivery — demand tinggi dari trader', priority: '🔴 CRITICAL' },
  { name: 'Stripe Subscriptions', why: 'Ganti dari Gumroad lifetime ke recurring revenue', priority: '🔴 CRITICAL' },
  { name: 'Docker + Railway/Render', why: 'Backend yang butuh persistent server', priority: '🟡 PENTING' },
  { name: 'Unity/Godot SDK basics', why: 'Game analytics SDK untuk indie devs', priority: '🟡 PENTING' },
  { name: 'WhatsApp Business API', why: 'UMKM automation market', priority: '🟡 PENTING' },
  { name: 'Smart Contract (Solidity/Rust)', why: 'DeFi tooling expansion', priority: '🟢 NICE' },
  { name: 'EVM / Base / Polygon', why: 'Expand dari Solana-only ke multi-chain', priority: '🟢 NICE' },
];

// ─── DATA: ANTIPATTERNS ───────────────────────────────────────────────────────
const ANTIPATTERNS = [
  'Bikin produk baru tanpa benerin distribusi yang lama — sama hasilnya: 0.',
  'Ngejar semua industri sekaligus — jadi master of none, closing rate tetap 0.',
  'Lifetime pricing untuk tools yang harusnya subscription — revenue ceiling rendah.',
  'Cold DM template/broadcast — orang langsung skip, spam rate tinggi.',
  'Jualan ke orang yang belum sadar mereka butuh produk lo (wrong funnel stage).',
  'Build di secret — tanpa validasi, tanpa community, tanpa feedback loop.',
  'Hard-sell di platform yang kultur-nya tidak support itu (LinkedIn, Threads).',
  'Harga terlalu murah — devalues skill, attracts wrong clients.',
  'Nunggu portfolio "sempurna" — lo udah punya 6+ live projects, itu udah cukup.',
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const PHASE_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'FASE 1 · 0–3 Bulan', color: '#10b981' },
  2: { label: 'FASE 2 · 3–6 Bulan', color: '#2563eb' },
  3: { label: 'FASE 3 · 6–12 Bulan', color: '#7c3aed' },
  4: { label: 'FASE 4 · 12–24 Bulan', color: '#d97706' },
};
const STATUS_COLOR = { EXISTING: '#10b981', BUILD: '#2563eb', EXPAND: '#d97706' };
const EFFORT_COLOR = { LOW: '#10b981', MED: '#d97706', HIGH: '#dc2626' };
const MATCH_COLOR = { HIGH: '#10b981', MED: '#d97706', LOW: '#6b7280' };
const PRIORITY_COLOR = { NOW: '#dc2626', SOON: '#d97706', LATER: '#2563eb' };

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1,
      padding: '2px 7px', borderRadius: 4,
      background: color + '20', color,
    }}>{text}</span>
  );
}

function Section({ title, icon: Icon, color, children }: {
  title: string; icon: any; color: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 12,
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center',
          gap: 10, background: 'var(--color-surface)', border: 'none',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: 7, background: color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={14} color={color} />
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1.5, color: 'var(--color-text)', flex: 1 }}>
          {title}
        </span>
        {open ? <ChevronUp size={14} color="var(--color-muted)" /> : <ChevronDown size={14} color="var(--color-muted)" />}
      </button>
      {open && <div style={{ padding: '18px' }}>{children}</div>}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function MasterBizPage() {
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [buildFilter, setBuildFilter] = useState<number | 'all'>('all');
  const [distFilter, setDistFilter] = useState<'all' | 'NOW' | 'SOON' | 'LATER'>('all');

  const filteredBuild = buildFilter === 'all' ? BUILD_LIST : BUILD_LIST.filter(b => b.phase === buildFilter);
  const filteredDist = distFilter === 'all' ? DISTRIBUTION : DISTRIBUTION.filter(d => d.priority === distFilter);
  const phaseGroups = [1, 2, 3, 4] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: 'var(--color-text)', marginBottom: 4 }}>
          MASTER BUSINESS INTEL
        </h2>
        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          All industries · All verticals · 2025–2035 · Riset deep + data real
        </p>
      </div>

      {/* ── 1. POSITIONING ── */}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '16px 18px',
      }}>
        <p style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10 }}>
          ⚡ POSITIONING STATEMENT
        </p>
        <p style={{
          fontSize: 15, fontWeight: 700, color: 'var(--color-text)',
          lineHeight: 1.6, fontStyle: 'italic',
        }}>
          "Solo full-stack engineer yang ship real-time crypto fintech dan AI tools dengan paying users —
          spesialisasi WebSocket infrastructure, on-chain analytics, dan AI-integrated systems."
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 10 }}>
          Ini rare. Mayoritas developer Indo belum di sini. Overseas rate: <strong style={{ color: 'var(--color-text)' }}>$75–$150/jam</strong>.
        </p>
      </div>

      {/* ── 2. SKILLS ── */}
      <Section title="WHO YOU ARE · SKILL INVENTORY" icon={Star} color="#d97706">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {SKILLS.map(s => (
            <div key={s.label} style={{
              padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, fontFamily: 'monospace',
                padding: '2px 6px', borderRadius: 4,
                background: s.tier === 'S' ? '#d9770620' : '#2563eb20',
                color: s.tier === 'S' ? '#d97706' : '#2563eb',
                flexShrink: 0,
              }}>{s.tier}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 3. MARKET DATA ── */}
      <Section title="SEMUA INDUSTRI · MARKET SIZE + PELUANG" icon={Globe} color="#2563eb">
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14 }}>
          Data dari Mordor Intelligence, Grand View Research, MarkNtel, Precedence Research · Apr 2026
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MARKETS.map(m => {
            const Icon = m.icon;
            const isExpanded = expandedMarket === m.name;
            return (
              <div key={m.name} style={{
                border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden',
                background: 'var(--color-surface)',
              }}>
                <button
                  onClick={() => setExpandedMarket(isExpanded ? null : m.name)}
                  style={{
                    width: '100%', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: m.color + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={14} color={m.color} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{m.name}</span>
                      <Badge text={`SKILL ${m.skillMatch}`} color={MATCH_COLOR[m.skillMatch]} />
                      <Badge text={`CAGR ${m.cagr}`} color={m.color} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>2025: <strong style={{ color: 'var(--color-text)' }}>{m.market2025}</strong></span>
                      <ArrowRight size={10} color="var(--color-muted)" style={{ alignSelf: 'center' }} />
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>2030: <strong style={{ color: m.color }}>{m.market2030}</strong></span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={13} color="var(--color-muted)" /> : <ChevronDown size={13} color="var(--color-muted)" />}
                </button>
                {isExpanded && (
                  <div style={{ padding: '14px', borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 12 }}>
                      <strong style={{ color: 'var(--color-text)' }}>GAP / PELUANG:</strong> {m.gap}
                    </p>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1, color: 'var(--color-muted)', marginBottom: 6 }}>PRODUK YANG BISA LO BUILD</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {m.products.map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <CheckCircle2 size={12} color={m.color} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 12px', borderRadius: 7,
                      background: m.color + '15', border: `1px solid ${m.color}30`,
                    }}>
                      <span style={{ fontSize: 11, color: m.color, fontWeight: 600, fontFamily: 'monospace' }}>
                        💰 PRICING RANGE: {m.pricingRange}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 4. MASTER BUILD LIST ── */}
      <Section title="MASTER BUILD LIST · SEMUA PRODUK YANG HARUS DIBANGUN" icon={Rocket} color="#10b981">
        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['all', 1, 2, 3, 4] as const).map(f => (
            <button
              key={String(f)}
              onClick={() => setBuildFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: buildFilter === f ? 'none' : '1px solid var(--color-border)',
                background: buildFilter === f ? '#10b981' : 'var(--color-card)',
                color: buildFilter === f ? 'white' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'Semua Fase' : PHASE_LABEL[f].label}
            </button>
          ))}
        </div>

        {/* By Phase */}
        {(buildFilter === 'all' ? phaseGroups : [buildFilter] as (1|2|3|4)[]).map(phase => {
          const items = filteredBuild.filter(b => b.phase === phase);
          if (items.length === 0) return null;
          const ph = PHASE_LABEL[phase];
          return (
            <div key={phase} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: ph.color }} />
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: ph.color }}>
                  {ph.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(b => (
                  <div key={b.name} style={{
                    padding: '12px 14px', borderRadius: 9,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>{b.name}</span>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <Badge text={b.status} color={STATUS_COLOR[b.status]} />
                        <Badge text={`EFFORT ${b.effort}`} color={EFFORT_COLOR[b.effort]} />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>{b.tagline}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#d97706', fontWeight: 700, flexShrink: 0 }}>💰</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{b.pricing}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>📈</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{b.upside}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>⚡</span>
                        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}><strong style={{ color: 'var(--color-text)' }}>ACTION:</strong> {b.action}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {/* ── 5. DISTRIBUTION ── */}
      <Section title="DISTRIBUSI · CARA DAPET KLIEN + USER" icon={Target} color="#ec4899">
        {/* Why 300 DMs Failed */}
        <div style={{
          padding: '12px 14px', borderRadius: 8, marginBottom: 16,
          background: '#dc262610', border: '1px solid #dc262630',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, fontFamily: 'monospace', letterSpacing: 1 }}>
            ❌ KENAPA 300 DM = 0 CLOSING
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            DM template/copy-paste → orang langsung skip. Target audiens salah (belum sadar butuh produk lo). Offer tidak spesifik. Harga tidak jelas. Distribusi ke wrong platform. <strong style={{ color: 'var(--color-text)' }}>Masalah bukan produk — masalah distribusi dan positioning.</strong>
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['all', 'NOW', 'SOON', 'LATER'] as const).map(f => (
            <button
              key={f}
              onClick={() => setDistFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: distFilter === f ? 'none' : '1px solid var(--color-border)',
                background: distFilter === f ? '#ec4899' : 'var(--color-card)',
                color: distFilter === f ? 'white' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'Semua' : f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredDist.map(d => (
            <div key={d.platform} style={{
              padding: '12px 14px', borderRadius: 9,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>{d.platform}</span>
                <Badge text={d.priority} color={PRIORITY_COLOR[d.priority]} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6, lineHeight: 1.7 }}>{d.tactic}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <TrendingUp size={11} color="#10b981" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>{d.expectedResult}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 6. TECH ROADMAP ── */}
      <Section title="TECH STACK ROADMAP · APA YANG HARUS DIKUASAI" icon={Code2} color="#7c3aed">
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: '#10b981', marginBottom: 8 }}>✅ SUDAH KUAT</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TECH_STRONG.map(t => (
              <span key={t} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 5,
                background: '#10b98115', color: '#10b981',
                border: '1px solid #10b98130',
              }}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: '#d97706', marginBottom: 8 }}>🎯 PERLU DITAMBAH</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TECH_ADD.map(t => (
              <div key={t.name} style={{
                padding: '8px 12px', borderRadius: 7, display: 'flex', alignItems: 'flex-start', gap: 10,
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', flexShrink: 0, paddingTop: 1 }}>{t.priority.split(' ')[0]}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 6 }}>— {t.why}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 7. ANTIPATTERNS ── */}
      <Section title="ANTIPATTERNS · JANGAN LAKUKAN INI" icon={AlertTriangle} color="#dc2626">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ANTIPATTERNS.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, fontFamily: 'monospace',
                color: '#dc2626', paddingTop: 1, flexShrink: 0,
              }}>❌</span>
              <span style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.7 }}>{a}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. PRICING GUIDE ── */}
      <Section title="PRICING GUIDE · RATE & PLATFORM" icon={TrendingUp} color="#d97706">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { label: 'Micro-SaaS subscription', range: '$9–$199/bulan', note: 'Sweet spot lo: $29–$49/bulan' },
            { label: 'Lifetime deal', range: '$9–$999 one-time', note: 'Bagus buat launch, tapi limitasi revenue ceiling' },
            { label: 'Web3 freelance (global)', range: '$75–$150/jam', note: 'Platform: Toptal, Arc.dev, Gun.io, Dework' },
            { label: 'AI automation consulting', range: '$150–$300/jam', note: 'Retainer: $2k–$10k/bulan. Harus ada track record dulu.' },
            { label: 'Custom SaaS MVP (project)', range: '$35k–$60k/project', note: 'Target: startup US/EU yang butuh real-time engineer' },
            { label: 'B2B API pricing', range: '$99–$499/bulan', note: 'Developer-facing, dollar rate, recurring' },
            { label: 'Game backend as-a-service', range: '$9–$49/bulan', note: 'Per studio. Low price, high volume potential.' },
            { label: 'UMKM automation (jasa)', range: '$29–$99/bulan', note: 'Atau Rp 300k–Rp 1.5jt/bulan per klien' },
          ].map(p => (
            <div key={p.label} style={{
              padding: '12px 14px', borderRadius: 9,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{p.label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#d97706', fontFamily: 'monospace', marginBottom: 4 }}>{p.range}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{p.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FOOTER NOTE ── */}
      <div style={{
        padding: '12px 16px', borderRadius: 9,
        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Zap size={14} color="#d97706" />
        <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7 }}>
          Data dari: Mordor Intelligence · Grand View Research · MarkNtel · Indie Hackers · Superframeworks · Lovable ·
          BCG Gaming Report · CoinLaw · Precedence Research. Co-authored by Claude (Anthropic) · April 2026.
          <strong style={{ color: 'var(--color-text)' }}> Update tiap 3 bulan.</strong>
        </p>
      </div>

    </div>
  );
}
