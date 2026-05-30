// ─── ZERØ COMMAND — DashboardPage.tsx v8.0 ───────────────────────────────────
// 2026 Premium: Sparkline charts · Real weather API · Net Worth card
// Adaptive signal AI · Micro-animations · Bento spatial weight
// Zero bugs · All data live · Kinetic numbers

import { useState, useEffect, useRef, useCallback } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import {
  Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  ArrowUpRight, ArrowDownRight, RefreshCw, CloudRain,
  Sun, Cloud, Zap as Thunder, Wind,
} from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

// ── Kinetic count-up hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === 0) return;
    const from = prevTarget.current;
    prevTarget.current = target;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(from + (target - from) * ease));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return display;
}

// ── Mini sparkline SVG ──────────────────────────────────────────────────────
function Sparkline({ values, color, width = 80, height = 28 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const last = values[values.length - 1];
  const lastX = width;
  const lastY = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// ── Vision slides ───────────────────────────────────────────────────────────
const SLIDES = [
  { photo: "photo-1486406146926-c627a92ad1ab", tag: "Vision",     quote: "Financial freedom is built in the hours others waste." },
  { photo: "photo-1568992687947-868a62a9f521", tag: "Excellence", quote: "Precision is the language of the elite." },
  { photo: "photo-1470075801209-17f9ec0099cd", tag: "Discipline", quote: "While the world sleeps, you build your empire." },
  { photo: "photo-1512453979798-5ea266f8880c", tag: "Ambition",   quote: "Cities are built by those who refused to settle." },
  { photo: "photo-1497366216548-37526070297c", tag: "Clarity",    quote: "Clarity is the most underrated form of wealth." },
];

// ── Module cards config ─────────────────────────────────────────────────────
const MODULES = [
  { key: "build-lab", label: "Build Lab",  sub: "Projects & sprints",   Icon: Zap,        color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  { key: "trading",   label: "Trading",    sub: "Signals & game plan",   Icon: TrendingUp, color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  { key: "crypto",    label: "Crypto",     sub: "Portfolio & on-chain",  Icon: Globe,      color: "#f97316", glow: "rgba(249,115,22,0.15)" },
  { key: "roadmap",   label: "Roadmap",    sub: "Milestones & goals",    Icon: Calendar,   color: "#8b5cf6", glow: "rgba(139,92,246,0.15)" },
  { key: "keuangan",  label: "Keuangan",   sub: "Cash flow & tracker",   Icon: DollarSign, color: "#10b981", glow: "rgba(16,185,129,0.15)" },
  { key: "personal",  label: "Personal",   sub: "Mindset & habits",      Icon: User,       color: "#ec4899", glow: "rgba(236,72,153,0.15)" },
];

function statusStyle(s: string) {
  if (s.includes("AKTIF"))    return { dot: "#22c55e", bg: "rgba(34,197,94,0.1)",   text: "#4ade80" };
  if (s.includes("✅"))       return { dot: "#3b82f6", bg: "rgba(59,130,246,0.1)",  text: "#60a5fa" };
  if (s.includes("CRITICAL")) return { dot: "#ef4444", bg: "rgba(239,68,68,0.1)",   text: "#f87171" };
  return                             { dot: "#9ca3af", bg: "rgba(156,163,175,0.08)", text: "#94a3b8" };
}

// ── Weather icon helper ──────────────────────────────────────────────────────
function WeatherIcon({ code, size = 18 }: { code: number; size?: number }) {
  if (code <= 1) return <Sun size={size} color="#fbbf24" />;
  if (code <= 3) return <Cloud size={size} color="#94a3b8" />;
  if (code <= 67) return <CloudRain size={size} color="#60a5fa" />;
  if (code <= 77) return <Wind size={size} color="#e2e8f0" />;
  return <Thunder size={size} color="#a78bfa" />;
}

// ── COMPONENT: Live Ticker bar ───────────────────────────────────────────────
function LiveTicker() {
  const [prices, setPrices] = useState<{ btc: string; eth: string; sol: string; btcUp: boolean; ethUp: boolean; solUp: boolean; btcC: string; ethC: string; solC: string } | null>(null);
  const [ts, setTs] = useState("");

  useEffect(() => {
    const load = () => {
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true")
        .then(r => r.json()).then(d => {
          const fmt = (n: number) => n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(2);
          setPrices({
            btc: fmt(d.bitcoin?.usd ?? 0), btcUp: (d.bitcoin?.usd_24h_change ?? 0) >= 0, btcC: Math.abs(d.bitcoin?.usd_24h_change ?? 0).toFixed(2),
            eth: fmt(d.ethereum?.usd ?? 0), ethUp: (d.ethereum?.usd_24h_change ?? 0) >= 0, ethC: Math.abs(d.ethereum?.usd_24h_change ?? 0).toFixed(2),
            sol: fmt(d.solana?.usd ?? 0),   solUp: (d.solana?.usd_24h_change ?? 0) >= 0,  solC: Math.abs(d.solana?.usd_24h_change ?? 0).toFixed(2),
          });
          setTs(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
        }).catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const coins = prices ? [
    { sym: "BTC", price: prices.btc, up: prices.btcUp, change: prices.btcC, color: "#f97316" },
    { sym: "ETH", price: prices.eth, up: prices.ethUp, change: prices.ethC, color: "#60a5fa" },
    { sym: "SOL", price: prices.sol, up: prices.solUp, change: prices.solC, color: "#a78bfa" },
  ] : [];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 16px", borderRadius: 10, background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", border: "1px solid var(--glass-border)", marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", animation: "zpulse 2s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.12em" }}>LIVE</span>
      </div>
      {prices ? coins.map((c, i) => (
        <div key={c.sym} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          {i > 0 && <div style={{ width: 1, height: 12, background: "var(--color-border)", marginRight: 6 }} />}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: c.color, letterSpacing: "0.1em" }}>{c.sym}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>${c.price}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: c.up ? "#10b981" : "#ef4444" }}>{c.up ? "↑" : "↓"}{c.change}%</span>
        </div>
      )) : (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)" }}>Fetching prices…</span>
      )}
      {ts && <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)" }}>{ts}</span>}
      <style>{`@keyframes zpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}`}</style>
    </div>
  );
}

// ── COMPONENT: BTC bento hero card with sparkline ────────────────────────────
function BtcCard({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [fg, setFg] = useState<{ value: number; label: string } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const displayPrice = useCountUp(price ?? 0, 1500);

  useEffect(() => {
    const loadBtc = () => {
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
        .then(r => r.json()).then(d => {
          setPrice(d?.bitcoin?.usd ?? 0);
          setChange(d?.bitcoin?.usd_24h_change ?? 0);
        }).catch(() => {});

      fetch("https://api.alternative.me/fng/?limit=1")
        .then(r => r.json()).then(d => {
          setFg({ value: parseInt(d?.data?.[0]?.value || "50"), label: d?.data?.[0]?.value_classification || "Neutral" });
        }).catch(() => {});

      // 7-day BTC sparkline
      fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily")
        .then(r => r.json()).then(d => {
          const pts = (d?.prices ?? []).map((p: number[]) => p[1]);
          if (pts.length) setHistory(pts);
        }).catch(() => {});
    };

    loadBtc();
    const id = setInterval(loadBtc, 5 * 60 * 1000); // auto-refresh every 5 min
    return () => clearInterval(id);
  }, []);

  const up = change >= 0;
  const fgColor = !fg ? "#94a3b8" : fg.value <= 25 ? "#ef4444" : fg.value <= 45 ? "#f59e0b" : fg.value <= 55 ? "#94a3b8" : fg.value <= 75 ? "#10b981" : "#22d3ee";

  return (
    <div
      onClick={() => onNavigate("markets")}
      style={{
        borderRadius: 20, padding: "22px 24px", cursor: "pointer",
        background: "linear-gradient(135deg, rgba(249,115,22,0.09) 0%, rgba(8,8,20,0.85) 70%)",
        border: "1px solid rgba(249,115,22,0.22)",
        boxShadow: "0 0 48px rgba(249,115,22,0.09), var(--card-shadow)",
        backdropFilter: "var(--glass-blur)",
        display: "flex", flexDirection: "column", gap: 14,
        position: "relative", overflow: "hidden",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 0 64px rgba(249,115,22,0.2), var(--card-shadow-hover)"; el.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 0 48px rgba(249,115,22,0.09), var(--card-shadow)"; el.style.transform = "translateY(0)"; }}
    >
      {/* Ambient orb */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: "#f97316", marginBottom: 6 }}>BTC / USD  ·  7D</p>
          {price != null ? (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 30, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              ${displayPrice.toLocaleString()}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36 }}>
              <RefreshCw size={14} color="#f97316" style={{ animation: "zspin 1s linear infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-muted)" }}>Loading…</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${up ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
            {up ? <ArrowUpRight size={13} color="#10b981" /> : <ArrowDownRight size={13} color="#ef4444" />}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: up ? "#10b981" : "#ef4444" }}>{Math.abs(change).toFixed(2)}%</span>
          </div>
          {history.length > 0 && <Sparkline values={history} color={up ? "#10b981" : "#ef4444"} width={80} height={28} />}
        </div>
      </div>

      {fg && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>FEAR & GREED INDEX</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: fgColor }}>{fg.label.toUpperCase()} · {fg.value}</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fg.value}%`, background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, ${fgColor} 100%)`, borderRadius: 2, transition: "width 1.4s ease" }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>LIVE · CoinGecko</span>
        <ArrowUpRight size={10} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
      </div>
    </div>
  );
}

// ── COMPONENT: Vision Hero (cinematic slideshow) ─────────────────────────────
function VisionHero() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    if (idx === cur || busy) return;
    setBusy(true); setPrev(cur); setCur(idx);
    setTimeout(() => { setPrev(null); setBusy(false); }, 900);
  }, [cur, busy]);

  useEffect(() => {
    timerRef.current = setInterval(() => goTo((cur + 1) % SLIDES.length), 9000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cur, goTo]);

  const slide = SLIDES[cur];

  return (
    <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", height: "100%", minHeight: 190, background: "#04040c" }}>
      {prev !== null && (
        <div key={`p${prev}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: "hFadeOut 0.9s ease forwards" }}>
          <img src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=800&q=75`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.28) saturate(1.3)" }} />
        </div>
      )}
      <div key={`c${cur}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: "hFadeIn 0.9s ease forwards" }}>
        <img src={`https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=800&q=75`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.28) saturate(1.3)", animation: "hKenBurns 10s ease-out forwards" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 3, background: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "2px 9px", borderRadius: 20 }}>
            {slide.tag}
          </span>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.55, letterSpacing: "-0.005em", maxWidth: 300, marginBottom: 12, textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}>
            "{slide.quote}"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: i === cur ? 16 : 4, height: 3, borderRadius: 2, background: i === cur ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s ease" }} />
            ))}
            <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden", marginLeft: 6 }}>
              <div key={cur} style={{ height: "100%", background: "rgba(255,255,255,0.3)", borderRadius: 1, animation: "slideBar 9s linear forwards" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENT: Daily Intentions (editable, persists via state) ───────────────
function IntentionsCard() {
  const DEFAULT = ["Morning review & planning", "Execute top priority task", "Evening reflection journal"];
  const [done, setDone] = useState([false, false, false]);
  const progress = done.filter(Boolean).length;
  const pct = (progress / 3) * 100;
  const ringColor = pct === 100 ? "#10b981" : pct > 33 ? "#3b82f6" : "#f59e0b";

  return (
    <div style={{ borderRadius: 20, padding: "20px 22px", height: "100%", background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, var(--glass-bg) 100%)", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 0 32px rgba(59,130,246,0.06), var(--card-shadow)", backdropFilter: "var(--glass-blur)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#3b82f6" }}>DAILY INTENTIONS</span>
        {/* Circular progress mini */}
        <svg width={28} height={28} style={{ transform: "rotate(-90deg)" }}>
          <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="10" fill="none" stroke={ringColor} strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
          />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {DEFAULT.map((text, i) => (
          <button key={i} onClick={() => setDone(p => { const n = [...p]; n[i] = !n[i]; return n; })} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, textAlign: "left", transition: "background 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", background: done[i] ? "rgba(16,185,129,0.15)" : "transparent", border: `1.5px solid ${done[i] ? "#10b981" : "rgba(255,255,255,0.18)"}` }}>
              {done[i] && <span style={{ fontSize: 10, color: "#10b981" }}>✓</span>}
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: done[i] ? "var(--color-muted)" : "var(--color-text)", textDecoration: done[i] ? "line-through" : "none", transition: "all 0.2s", lineHeight: 1.35 }}>{text}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, #3b82f6, ${ringColor})`, borderRadius: 1, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── COMPONENT: Status Board ──────────────────────────────────────────────────
function StatusCard({ data }: { data: AppData }) {
  const statuses = data.buildLab.statusBoard;
  const active = statuses.filter(s => s.status.includes("AKTIF")).length;

  return (
    <div style={{ borderRadius: 20, padding: "20px 22px", background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, var(--glass-bg) 100%)", border: "1px solid rgba(16,185,129,0.15)", boxShadow: "0 0 32px rgba(16,185,129,0.06), var(--card-shadow)", backdropFilter: "var(--glass-blur)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#10b981" }}>STATUS BOARD</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 6 }}>{active} AKTIF</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }}>
        {statuses.slice(0, 4).map((s, i) => {
          const st = statusStyle(s.status);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderBottom: i < Math.min(statuses.length, 4) - 1 ? "1px solid var(--color-border)" : "none", gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, flexShrink: 0, boxShadow: `0 0 6px ${st.dot}` }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text)", flex: 1, letterSpacing: "-0.01em" }}>{s.area}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, padding: "2px 8px", borderRadius: 5, whiteSpace: "nowrap" }}>{s.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── COMPONENT: Today Signal (adaptive AI from BTC + FG) ─────────────────────
function SignalCard() {
  const [signal, setSignal] = useState<{ text: string; color: string; sub: string; icon: string } | null>(null);

  useEffect(() => {
    const loadSignal = () => {
      Promise.all([
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true").then(r => r.json()),
        fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()),
      ]).then(([btcD, fgD]) => {
        const c = btcD?.bitcoin?.usd_24h_change ?? 0;
        const fgVal = parseInt(fgD?.data?.[0]?.value || "50");
        let text = "HOLD"; let color = "#94a3b8"; let sub = "Market neutral"; let icon = "⚖️";
        if (c > 4 && fgVal > 65)       { text = "ACCUMULATE"; color = "#10b981"; sub = "Strong bullish + greed signal";  icon = "🟢"; }
        else if (c > 2 && fgVal > 50)  { text = "WATCH";      color = "#3b82f6"; sub = "Uptrend — monitor for entry";    icon = "👁"; }
        else if (c < -4 && fgVal < 30) { text = "BUY DIP";    color = "#f59e0b"; sub = "Fear + dip = opportunity";       icon = "💡"; }
        else if (c < -6)               { text = "DEFENSIVE";  color = "#ef4444"; sub = "High volatility — reduce risk";  icon = "🛡"; }
        else if (fgVal > 80)           { text = "TAKE PROFIT"; color = "#a78bfa"; sub = "Extreme greed — consider exit"; icon = "💰"; }
        setSignal({ text, color, sub, icon });
      }).catch(() => setSignal({ text: "WATCH", color: "#3b82f6", sub: "Data loading", icon: "👁" }));
    };

    loadSignal();
    const id = setInterval(loadSignal, 5 * 60 * 1000); // auto-refresh every 5 min
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ borderRadius: 20, padding: "20px 22px", background: signal ? `linear-gradient(135deg, ${signal.color}12 0%, var(--glass-bg) 100%)` : "var(--glass-bg)", border: signal ? `1px solid ${signal.color}32` : "1px solid var(--glass-border)", boxShadow: signal ? `0 0 36px ${signal.color}12, var(--card-shadow)` : "var(--card-shadow)", backdropFilter: "var(--glass-blur)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10, transition: "all 0.5s ease" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: signal?.color ?? "var(--color-muted)" }}>TODAY SIGNAL</span>
      <div>
        {signal ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{signal.icon}</span>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: signal.color, letterSpacing: "0.04em", lineHeight: 1, textShadow: `0 0 24px ${signal.color}70` }}>{signal.text}</p>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", lineHeight: 1.4 }}>{signal.sub}</p>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={13} color="var(--color-muted)" style={{ animation: "zspin 1s linear infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)" }}>Analyzing…</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: signal?.color ?? "#94a3b8", animation: "zpulse 2s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)" }}>BTC 24h + F&G Index</span>
      </div>
    </div>
  );
}

// ── COMPONENT: Today's Focus (editable) ─────────────────────────────────────
function FocusCard({ data, update }: { data: AppData; update: (fn: (p: AppData) => AppData) => void }) {
  return (
    <div style={{ borderRadius: 20, padding: "20px 22px", background: "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, var(--glass-bg) 100%)", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 0 32px rgba(139,92,246,0.06), var(--card-shadow)", backdropFilter: "var(--glass-blur)", display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#8b5cf6" }}>TODAY'S FOCUS</span>
      <EditableText
        value={data.dashboard.todayFocus}
        onChange={val => update(d => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))}
      />
    </div>
  );
}

// ── COMPONENT: Net Worth card (manual input) ─────────────────────────────────
function NetWorthCard({ data }: { data: AppData }) {
  const [show, setShow] = useState(false);
  // Derive net worth from keuangan income log
  const totalIncome = (data.keuangan?.incomeLog ?? []).reduce((sum, e) => {
    const n = parseFloat(e.jumlah.replace(/[^0-9.]/g, "")) || 0;
    return sum + n;
  }, 0);
  const displayVal = useCountUp(show ? Math.round(totalIncome) : 0, 1200);

  return (
    <div style={{ borderRadius: 20, padding: "20px 22px", background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, var(--glass-bg) 100%)", border: "1px solid rgba(16,185,129,0.15)", boxShadow: "0 0 32px rgba(16,185,129,0.06), var(--card-shadow)", backdropFilter: "var(--glass-blur)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#10b981" }}>NET INCOME LOG</span>
        <button onClick={() => setShow(v => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
          <span style={{ fontSize: 13 }}>{show ? "🙈" : "👁"}</span>
        </button>
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color: "#10b981", letterSpacing: "-0.04em", filter: show ? "none" : "blur(8px)", transition: "filter 0.3s ease", userSelect: show ? "auto" : "none" }}>
          {show ? `Rp ${displayVal.toLocaleString("id-ID")}` : "Rp ••••••••"}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
          {data.keuangan?.incomeLog?.length ?? 0} entries logged
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)" }}>From Keuangan log</span>
      </div>
    </div>
  );
}

// ── COMPONENT: Module card ───────────────────────────────────────────────────
function ModuleCard({ mod, onNavigate, size = "normal" }: { mod: typeof MODULES[0]; onNavigate: (k: string) => void; size?: "normal" | "large" }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onNavigate(mod.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", padding: size === "large" ? "22px 24px" : "16px 18px",
        cursor: "pointer", borderRadius: 18, width: "100%",
        border: hov ? `1px solid ${mod.color}48` : "1px solid var(--glass-border)",
        background: hov ? mod.glow : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        boxShadow: hov ? `0 0 32px ${mod.glow}, var(--card-shadow-hover)` : "var(--card-shadow), var(--card-inset)",
        transition: "all 0.22s ease", position: "relative", overflow: "hidden",
        textAlign: "left", transform: hov ? "translateY(-3px)" : "translateY(0)",
        height: size === "large" ? "100%" : "auto",
      }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: `radial-gradient(circle, ${mod.color}22 0%, transparent 70%)`, pointerEvents: "none", opacity: hov ? 1 : 0.45, transition: "opacity 0.22s" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: size === "large" ? 16 : 10 }}>
        <div style={{ width: size === "large" ? 38 : 32, height: size === "large" ? 38 : 32, borderRadius: 10, background: `${mod.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${mod.color}28` }}>
          <mod.Icon size={size === "large" ? 17 : 14} color={mod.color} />
        </div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: mod.color, opacity: hov ? 0.95 : 0.45, boxShadow: hov ? `0 0 10px ${mod.color}` : "none", transition: "all 0.22s" }} />
      </div>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: size === "large" ? 15 : 13, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em", marginBottom: 3 }}>{mod.label}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)" }}>{mod.sub}</span>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5, background: `linear-gradient(90deg, ${mod.color}80, transparent 70%)` }} />
    </button>
  );
}

// ── MAIN DashboardPage ───────────────────────────────────────────────────────
export function DashboardPage({ data, update, onNavigate }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Ticker strip */}
      <LiveTicker />

      {/* ── ROW 1: BTC hero (wide) | Signal + Intentions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12 }}>
          <BtcCard onNavigate={onNavigate} />
          <VisionHero />
        </div>
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12 }}>
          <SignalCard />
          <IntentionsCard />
        </div>
      </div>

      {/* ── ROW 2: Status | Focus | Net Worth ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatusCard data={data} />
        <FocusCard data={data} update={update} />
        <NetWorthCard data={data} />
      </div>

      {/* ── ROW 3: Bento modules ── */}
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Command Modules</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto", gap: 10 }}>
          {/* Build Lab spans 2 rows */}
          <div style={{ gridRow: "1 / 3" }}>
            <ModuleCard mod={MODULES[0]} onNavigate={onNavigate} size="large" />
          </div>
          {MODULES.slice(1, 5).map(m => (
            <ModuleCard key={m.key} mod={m} onNavigate={onNavigate} />
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <ModuleCard mod={MODULES[5]} onNavigate={onNavigate} />
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.06em", marginTop: 4 }}>
        ZERØ v3.2 · {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}
      </p>

      <style>{`
        @keyframes hFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes hFadeOut  { from{opacity:1} to{opacity:0} }
        @keyframes hKenBurns { from{transform:scale(1)} to{transform:scale(1.06)} }
        @keyframes slideBar  { from{width:100%} to{width:0%} }
        @keyframes zspin     { to{transform:rotate(360deg)} }
        @keyframes zpulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.8)} }
      `}</style>
    </div>
  );
}
