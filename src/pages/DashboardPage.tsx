// ─── ZERØ COMMAND — DashboardPage.tsx v7.0 ───────────────────────────────────
// BENTO GRID · Asymmetric layout · Ambient glow · Live data · Number flip anim
// 2026 terdepan: inner glow per card, kinetic numbers, Apple bento spatial weight
import { useState, useEffect, useRef } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import {
  Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  ArrowUpRight, ArrowDownRight, Wifi, RefreshCw, Eye, EyeOff
} from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

// ── Kinetic number animation hook ──────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * ease));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return display;
}

// ── Slide data ──────────────────────────────────────────────────────────────
const SLIDES = [
  { photo: "photo-1486406146926-c627a92ad1ab", tag: "Vision",     quote: "Financial freedom is built in the hours others waste." },
  { photo: "photo-1568992687947-868a62a9f521", tag: "Excellence", quote: "Precision is the language of the elite." },
  { photo: "photo-1470075801209-17f9ec0099cd", tag: "Discipline", quote: "While the world sleeps, you build your empire." },
  { photo: "photo-1512453979798-5ea266f8880c", tag: "Ambition",   quote: "Cities are built by those who refused to settle." },
  { photo: "photo-1497366216548-37526070297c", tag: "Clarity",    quote: "Clarity is the most underrated form of wealth." },
  { photo: "photo-1464082354059-27db6ce50048", tag: "Confidence", quote: "The ocean doesn't apologize for its depth." },
];

// ── Module cards ────────────────────────────────────────────────────────────
const MODULES = [
  { key: "build-lab", label: "Build Lab",  sub: "Projects & sprint",   Icon: Zap,        color: "#f59e0b", glow: "rgba(245,158,11,0.18)" },
  { key: "trading",   label: "Trading",    sub: "Game plan & signals",  Icon: TrendingUp, color: "#3b82f6", glow: "rgba(59,130,246,0.18)" },
  { key: "crypto",    label: "Crypto",     sub: "Portfolio & on-chain", Icon: Globe,      color: "#f97316", glow: "rgba(249,115,22,0.18)" },
  { key: "roadmap",   label: "Roadmap",    sub: "Milestones & goals",   Icon: Calendar,   color: "#8b5cf6", glow: "rgba(139,92,246,0.18)" },
  { key: "keuangan",  label: "Keuangan",   sub: "Cash flow & tracker",  Icon: DollarSign, color: "#10b981", glow: "rgba(16,185,129,0.18)" },
  { key: "personal",  label: "Personal",   sub: "Mindset & habits",     Icon: User,       color: "#ec4899", glow: "rgba(236,72,153,0.18)" },
];

// ── Status style ────────────────────────────────────────────────────────────
function statusStyle(s: string) {
  if (s.includes("AKTIF"))    return { dot: "#22c55e", bg: "rgba(34,197,94,0.1)",   text: "#4ade80",  textLight: "#15803d" };
  if (s.includes("✅"))       return { dot: "#3b82f6", bg: "rgba(59,130,246,0.1)",  text: "#60a5fa",  textLight: "#1d4ed8" };
  if (s.includes("CRITICAL")) return { dot: "#ef4444", bg: "rgba(239,68,68,0.1)",   text: "#f87171",  textLight: "#dc2626" };
  return                             { dot: "#9ca3af", bg: "rgba(156,163,175,0.08)", text: "#94a3b8", textLight: "#6b7280" };
}

// ── Live BTC Ticker (top of page) ───────────────────────────────────────────
function LiveTicker() {
  const [data, setData] = useState<{ btc: string; eth: string; btcUp: boolean; ethUp: boolean; btcChange: string; ethChange: string } | null>(null);
  const [ts, setTs] = useState<string>("");

  const fetch_ = () => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true")
      .then(r => r.json())
      .then(d => {
        const btcP = d?.bitcoin?.usd;
        const ethP = d?.ethereum?.usd;
        const btcC = d?.bitcoin?.usd_24h_change ?? 0;
        const ethC = d?.ethereum?.usd_24h_change ?? 0;
        if (btcP) {
          setData({
            btc: btcP.toLocaleString("en-US", { maximumFractionDigits: 0 }),
            eth: ethP.toLocaleString("en-US", { maximumFractionDigits: 0 }),
            btcUp: btcC >= 0, ethUp: ethC >= 0,
            btcChange: Math.abs(btcC).toFixed(2),
            ethChange: Math.abs(ethC).toFixed(2),
          });
          setTs(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
        }
      }).catch(() => {});
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 60000); return () => clearInterval(id); }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20, padding: "8px 14px",
      borderRadius: 10, background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
      border: "1px solid var(--glass-border)", marginBottom: 16,
      boxShadow: "var(--card-shadow)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 6px #f97316", animation: "tickPulse 2s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.1em" }}>LIVE</span>
      </div>
      {data ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", letterSpacing: "0.08em" }}>BTC</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>${data.btc}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: data.btcUp ? "#10b981" : "#ef4444" }}>
              {data.btcUp ? "↑" : "↓"}{data.btcChange}%
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: "var(--color-border)" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", letterSpacing: "0.08em" }}>ETH</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>${data.eth}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: data.ethUp ? "#10b981" : "#ef4444" }}>
              {data.ethUp ? "↑" : "↓"}{data.ethChange}%
            </span>
          </div>
          <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)" }}>
            Updated {ts}
          </div>
        </>
      ) : (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)" }}>Fetching prices…</span>
      )}
      <style>{`@keyframes tickPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ── BTC Live Card (bento hero) ──────────────────────────────────────────────
function BtcCard({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [fg, setFg] = useState<{ value: number; label: string } | null>(null);
  const displayPrice = useCountUp(price ?? 0, 1500);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
      .then(r => r.json()).then(d => {
        setPrice(d?.bitcoin?.usd ?? 0);
        setChange(d?.bitcoin?.usd_24h_change ?? 0);
      }).catch(() => {});
    fetch("https://api.alternative.me/fng/?limit=1")
      .then(r => r.json()).then(d => {
        setFg({ value: parseInt(d?.data?.[0]?.value || "50"), label: d?.data?.[0]?.value_classification || "Neutral" });
      }).catch(() => {});
  }, []);

  const up = change >= 0;
  const fgColor = fg ? (fg.value <= 25 ? "#ef4444" : fg.value <= 45 ? "#f59e0b" : fg.value <= 55 ? "#94a3b8" : fg.value <= 75 ? "#10b981" : "#22d3ee") : "#94a3b8";

  return (
    <div onClick={() => onNavigate("markets")} style={{
      borderRadius: 20, padding: "22px 24px", cursor: "pointer",
      background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(8,8,20,0.9) 60%)",
      border: "1px solid rgba(249,115,22,0.2)",
      boxShadow: "0 0 40px rgba(249,115,22,0.08), var(--card-shadow)",
      backdropFilter: "var(--glass-blur)",
      display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden",
      transition: "all 0.25s ease",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(249,115,22,0.18), var(--card-shadow-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(249,115,22,0.08), var(--card-shadow)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Ambient glow orb */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: "#f97316", marginBottom: 6 }}>BTC / USD</p>
          {price ? (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              ${displayPrice.toLocaleString()}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
              <RefreshCw size={14} color="#f97316" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-muted)" }}>Loading…</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${up ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
          {up ? <ArrowUpRight size={13} color="#10b981" /> : <ArrowDownRight size={13} color="#ef4444" />}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: up ? "#10b981" : "#ef4444" }}>{Math.abs(change).toFixed(2)}%</span>
        </div>
      </div>

      {/* Fear & Greed mini */}
      {fg && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>FEAR & GREED</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: fgColor, letterSpacing: "0.08em" }}>{fg.label.toUpperCase()} · {fg.value}</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fg.value}%`, background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, ${fgColor} 100%)`, borderRadius: 2, transition: "width 1.2s ease" }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>LIVE · CoinGecko</span>
        <ArrowUpRight size={10} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
      </div>
    </div>
  );
}

// ── Vision Hero (cinematic slideshow) ───────────────────────────────────────
function VisionHero() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const goTo = (idx: number) => {
    if (idx === cur || busy) return;
    setBusy(true); setPrev(cur); setCur(idx);
    setTimeout(() => { setPrev(null); setBusy(false); }, 900);
  };

  useEffect(() => {
    const id = setInterval(() => goTo((cur + 1) % SLIDES.length), 9000);
    return () => clearInterval(id);
  }, [cur, busy]);

  const slide = SLIDES[cur];

  return (
    <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", height: "100%", minHeight: 200, background: "#04040c" }}>
      {prev !== null && (
        <div key={`p${prev}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: "hFadeOut 0.9s ease forwards" }}>
          <img src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=900&q=80`} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.28) saturate(1.3)" }} />
        </div>
      )}
      <div key={`c${cur}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: "hFadeIn 0.9s ease forwards" }}>
        <img src={`https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=900&q=80`} alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.28) saturate(1.3)", animation: "hKenBurns 10s ease-out forwards" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 3, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "2px 9px", borderRadius: 20 }}>
            {slide.tag}
          </span>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.92)", lineHeight: 1.5, letterSpacing: "-0.01em", maxWidth: 320, marginBottom: 12, textShadow: "0 2px 14px rgba(0,0,0,0.6)" }}>
            "{slide.quote}"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: i === cur ? 16 : 4, height: 3, borderRadius: 2, background: i === cur ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s ease" }} />
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

// ── Daily Intentions Card ────────────────────────────────────────────────────
function IntentionsCard() {
  const DEFAULT = ["Morning review & planning", "Execute top priority task", "Evening reflection journal"];
  const [done, setDone] = useState([true, false, false]);
  const progress = done.filter(Boolean).length;

  return (
    <div style={{
      borderRadius: 20, padding: "20px 22px", height: "100%",
      background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, var(--glass-bg) 100%)",
      border: "1px solid rgba(59,130,246,0.15)",
      boxShadow: "0 0 32px rgba(59,130,246,0.06), var(--card-shadow)",
      backdropFilter: "var(--glass-blur)",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#3b82f6" }}>DAILY INTENTIONS</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: progress === 3 ? "#10b981" : "var(--color-muted)" }}>{progress}/3</span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(progress / 3) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #10b981)", borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {DEFAULT.map((text, i) => (
          <button key={i} onClick={() => setDone(p => { const n = [...p]; n[i] = !n[i]; return n; })} style={{
            display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, textAlign: "left",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", background: done[i] ? "rgba(16,185,129,0.15)" : "transparent", border: `1.5px solid ${done[i] ? "#10b981" : "rgba(255,255,255,0.18)"}` }}>
              {done[i] && <span style={{ fontSize: 10, color: "#10b981" }}>✓</span>}
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: done[i] ? "var(--color-muted)" : "var(--color-text)", textDecoration: done[i] ? "line-through" : "none", transition: "all 0.2s", lineHeight: 1.35 }}>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Status Board Card ────────────────────────────────────────────────────────
function StatusCard({ data }: { data: AppData }) {
  const statuses = data.buildLab.statusBoard;
  const active = statuses.filter(s => s.status.includes("AKTIF")).length;

  return (
    <div style={{
      borderRadius: 20, padding: "20px 22px",
      background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, var(--glass-bg) 100%)",
      border: "1px solid rgba(16,185,129,0.15)",
      boxShadow: "0 0 32px rgba(16,185,129,0.06), var(--card-shadow)",
      backdropFilter: "var(--glass-blur)",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#10b981" }}>STATUS BOARD</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 6 }}>{active} AKTIF</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }}>
        {statuses.slice(0, 4).map((s, i) => {
          const st = statusStyle(s.status);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", borderBottom: i < Math.min(statuses.length, 4) - 1 ? "1px solid var(--color-border)" : "none", gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, flexShrink: 0, boxShadow: `0 0 6px ${st.dot}` }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text)", flex: 1, letterSpacing: "-0.01em" }}>{s.area}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, padding: "1px 8px", borderRadius: 5, whiteSpace: "nowrap" }}>{s.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Today Signal Card (AI-driven) ───────────────────────────────────────────
function SignalCard() {
  const [signal, setSignal] = useState<{ text: string; color: string; sub: string } | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
      .then(r => r.json()).then(d => {
        const c = d?.bitcoin?.usd_24h_change ?? 0;
        fetch("https://api.alternative.me/fng/?limit=1").then(r2 => r2.json()).then(d2 => {
          const fgVal = parseInt(d2?.data?.[0]?.value || "50");
          let text = "HOLD"; let color = "#94a3b8"; let sub = "Market neutral";
          if (c > 3 && fgVal > 60)  { text = "ACCUMULATE"; color = "#10b981"; sub = "Bullish momentum + greed"; }
          else if (c > 1)            { text = "WATCH";      color = "#3b82f6"; sub = "Uptrend developing"; }
          else if (c < -3 && fgVal < 30) { text = "BUY DIP";   color = "#f59e0b"; sub = "Fear + correction = entry"; }
          else if (c < -5)           { text = "DEFENSIVE";  color = "#ef4444"; sub = "High volatility — reduce risk"; }
          setSignal({ text, color, sub });
        }).catch(() => setSignal({ text: "WATCH", color: "#3b82f6", sub: "Data loading" }));
      }).catch(() => setSignal({ text: "WATCH", color: "#3b82f6", sub: "Data loading" }));
  }, []);

  return (
    <div style={{
      borderRadius: 20, padding: "20px 22px",
      background: signal ? `linear-gradient(135deg, ${signal.color}10 0%, var(--glass-bg) 100%)` : "var(--glass-bg)",
      border: signal ? `1px solid ${signal.color}30` : "1px solid var(--glass-border)",
      boxShadow: signal ? `0 0 32px ${signal.color}10, var(--card-shadow)` : "var(--card-shadow)",
      backdropFilter: "var(--glass-blur)",
      display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10,
      transition: "all 0.5s ease",
    }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: signal?.color ?? "var(--color-muted)" }}>TODAY SIGNAL</span>
      <div>
        {signal ? (
          <>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: signal.color, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 6, textShadow: `0 0 20px ${signal.color}60` }}>
              {signal.text}
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", lineHeight: 1.4 }}>{signal.sub}</p>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={13} color="var(--color-muted)" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)" }}>Analyzing…</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: signal?.color ?? "#94a3b8", boxShadow: signal ? `0 0 5px ${signal.color}` : "none", animation: "tickPulse 2s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)" }}>Live · BTC + F&G</span>
      </div>
    </div>
  );
}

// ── Focus Card (editable) ────────────────────────────────────────────────────
function FocusCard({ data, update }: { data: AppData; update: (fn: (p: AppData) => AppData) => void }) {
  return (
    <div style={{
      borderRadius: 20, padding: "20px 22px",
      background: "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, var(--glass-bg) 100%)",
      border: "1px solid rgba(139,92,246,0.15)",
      boxShadow: "0 0 32px rgba(139,92,246,0.06), var(--card-shadow)",
      backdropFilter: "var(--glass-blur)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#8b5cf6" }}>TODAY'S FOCUS</span>
      <EditableText
        value={data.dashboard.todayFocus}
        onChange={val => update(d => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))}
      />
    </div>
  );
}

// ── Module Grid Card ─────────────────────────────────────────────────────────
function ModuleCard({ mod, onNavigate, size = "normal" }: { mod: typeof MODULES[0]; onNavigate: (k: string) => void; size?: "normal" | "large" }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={() => onNavigate(mod.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", padding: size === "large" ? "22px 24px" : "16px 18px",
        cursor: "pointer", borderRadius: 20,
        border: hov ? `1px solid ${mod.color}45` : "1px solid var(--glass-border)",
        background: hov ? mod.glow : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        boxShadow: hov ? `0 0 28px ${mod.glow}, var(--card-shadow-hover)` : "var(--card-shadow), var(--card-inset)",
        transition: "all 0.22s ease", position: "relative", overflow: "hidden",
        textAlign: "left", transform: hov ? "translateY(-3px)" : "translateY(0)",
      }}>
      {/* Ambient glow orb */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${mod.color}20 0%, transparent 70%)`, pointerEvents: "none", opacity: hov ? 1 : 0.4, transition: "opacity 0.22s" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: size === "large" ? 16 : 10 }}>
        <div style={{ width: size === "large" ? 38 : 32, height: size === "large" ? 38 : 32, borderRadius: 10, background: mod.color + "18", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${mod.color}25` }}>
          <mod.Icon size={size === "large" ? 17 : 14} color={mod.color} />
        </div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: mod.color, opacity: hov ? 0.9 : 0.45, boxShadow: hov ? `0 0 8px ${mod.color}` : "none", transition: "all 0.22s" }} />
      </div>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: size === "large" ? 15 : 13, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em", marginBottom: 3 }}>{mod.label}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)" }}>{mod.sub}</span>
      {/* Bottom strip */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${mod.color}70, transparent)` }} />
    </button>
  );
}

// ── Main DashboardPage ───────────────────────────────────────────────────────
export function DashboardPage({ data, update, onNavigate }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Live ticker strip */}
      <LiveTicker />

      {/* ── BENTO ROW 1: BTC hero (wide) + Signal + Intentions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12 }}>
        {/* Left: BTC + Vision stacked */}
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12 }}>
          <BtcCard onNavigate={onNavigate} />
          <VisionHero />
        </div>
        {/* Right: Signal + Intentions */}
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12 }}>
          <SignalCard />
          <IntentionsCard />
        </div>
      </div>

      {/* ── BENTO ROW 2: Status (wide) + Focus ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatusCard data={data} />
        <FocusCard data={data} update={update} />
      </div>

      {/* ── BENTO ROW 3: Modules — Build Lab large, rest 2x2 ── */}
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Command Modules</span>
        {/* Asymmetric bento: Build Lab spans 2 rows on left, 4 modules 2x2 on right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto", gap: 10 }}>
          {/* Build Lab — large, spans 2 rows */}
          <div style={{ gridRow: "1 / 3" }}>
            <ModuleCard mod={MODULES[0]} onNavigate={onNavigate} size="large" />
          </div>
          {/* Trading, Crypto, Roadmap, Keuangan — 2x2 */}
          {MODULES.slice(1, 5).map(m => (
            <ModuleCard key={m.key} mod={m} onNavigate={onNavigate} />
          ))}
        </div>
        {/* Personal — full width strip */}
        <div style={{ marginTop: 10 }}>
          <ModuleCard mod={MODULES[5]} onNavigate={onNavigate} />
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.06em", marginTop: 4 }}>
        ZERØ v3.1 · {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}
      </p>

      <style>{`
        @keyframes hFadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes hFadeOut   { from{opacity:1} to{opacity:0} }
        @keyframes hKenBurns  { from{transform:scale(1)} to{transform:scale(1.05)} }
        @keyframes slideBar   { from{width:100%} to{width:0%} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes tickPulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
