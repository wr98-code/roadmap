// ─── ZERØ COMMAND — DashboardPage.tsx v9.0 "Terminal Slab" ───────────────────
// Structural redesign: from floating-bento to an institutional terminal —
// full-bleed paneled grid, hairline seams (no radius/shadow/glow/gaps), one
// dominant hero + a stacked readout spine, dense triad, module function bar,
// and a footer status line. All live data, features & wiring preserved.

import { useState, useEffect, useRef, useCallback } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import { getSimplePrice } from "@/lib/prices";
import { Zap, TrendingUp, Globe, Calendar, DollarSign, User, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

const SEAM = "var(--color-border)";
const LBL: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase" };
const PANEL: React.CSSProperties = { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11, height: "100%", background: "var(--glass-bg)", minWidth: 0 };

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
function Sparkline({ values, color, width = 120, height = 34 }: { values: number[]; color: string; width?: number; height?: number }) {
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
  const lastY = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={width} cy={lastY} r="2.5" fill={color} />
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

// ── Module config (dense function bar) ───────────────────────────────────────
const MODULES = [
  { key: "build-lab", label: "Build Lab",  sub: "Projects & sprints",  Icon: Zap,        color: "#c9a96a" },
  { key: "trading",   label: "Trading",    sub: "Signals & plan",      Icon: TrendingUp, color: "#5b8def" },
  { key: "crypto",    label: "Crypto",     sub: "Portfolio & chain",   Icon: Globe,      color: "#d99a4e" },
  { key: "roadmap",   label: "Roadmap",    sub: "Milestones",          Icon: Calendar,   color: "#9a86d4" },
  { key: "keuangan",  label: "Keuangan",   sub: "Cash flow",           Icon: DollarSign, color: "#45c07f" },
  { key: "personal",  label: "Personal",   sub: "Mindset & habits",    Icon: User,       color: "#cf7ba6" },
];

function statusStyle(s: string) {
  if (s.includes("AKTIF"))    return { dot: "var(--gain)", bg: "var(--gain-soft)",  text: "var(--gain)" };
  if (s.includes("✅"))       return { dot: "#5b8def",     bg: "rgba(91,141,239,0.12)", text: "#5b8def" };
  if (s.includes("CRITICAL")) return { dot: "var(--loss)", bg: "var(--loss-soft)",  text: "var(--loss)" };
  return                             { dot: "var(--color-muted)", bg: "var(--color-surface)", text: "var(--color-muted)" };
}

// ── ZONE 1: Ticker strip (flat, full-width) ──────────────────────────────────
function TickerStrip() {
  const [prices, setPrices] = useState<{ btc: string; eth: string; sol: string; btcUp: boolean; ethUp: boolean; solUp: boolean; btcC: string; ethC: string; solC: string } | null>(null);
  const [ts, setTs] = useState("");
  useEffect(() => {
    const load = () => {
      getSimplePrice(["bitcoin", "ethereum", "solana"]).then(d => {
        if (!d.bitcoin && !d.ethereum && !d.solana) return;
        const fmt = (n: number) => n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(2);
        setPrices(prev => ({
          btc: d.bitcoin ? fmt(d.bitcoin.usd) : prev?.btc ?? "—", btcUp: (d.bitcoin?.usd_24h_change ?? 0) >= 0, btcC: Math.abs(d.bitcoin?.usd_24h_change ?? 0).toFixed(2),
          eth: d.ethereum ? fmt(d.ethereum.usd) : prev?.eth ?? "—", ethUp: (d.ethereum?.usd_24h_change ?? 0) >= 0, ethC: Math.abs(d.ethereum?.usd_24h_change ?? 0).toFixed(2),
          sol: d.solana ? fmt(d.solana.usd) : prev?.sol ?? "—", solUp: (d.solana?.usd_24h_change ?? 0) >= 0, solC: Math.abs(d.solana?.usd_24h_change ?? 0).toFixed(2),
        }));
        setTs(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
      });
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);
  const coins = prices ? [
    { sym: "BTC", price: prices.btc, up: prices.btcUp, change: prices.btcC },
    { sym: "ETH", price: prices.eth, up: prices.ethUp, change: prices.ethC },
    { sym: "SOL", price: prices.sol, up: prices.solUp, change: prices.solC },
  ] : [];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, height: 38, background: "var(--glass-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRight: `1px solid ${SEAM}`, height: "100%" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gain)", boxShadow: "0 0 6px var(--gain)", animation: "zpulse 2s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.14em" }}>LIVE</span>
      </div>
      {prices ? coins.map((c) => (
        <div key={c.sym} style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "0 16px", borderRight: `1px solid ${SEAM}`, height: "100%", alignSelf: "center", lineHeight: "38px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.1em" }}>{c.sym}</span>
          <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>${c.price}</span>
          <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: c.up ? "var(--gain)" : "var(--loss)" }}>{c.up ? "↑" : "↓"}{c.change}%</span>
        </div>
      )) : <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", padding: "0 16px" }}>Fetching prices…</span>}
      {ts && <span className="num" style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", padding: "0 16px" }}>{ts}</span>}
      <style>{`@keyframes zpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}`}</style>
    </div>
  );
}

// ── ZONE 2a: BTC hero (dominant, flat) ───────────────────────────────────────
function BtcHero({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [fg, setFg] = useState<{ value: number; label: string } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const displayPrice = useCountUp(price ?? 0, 1500);
  useEffect(() => {
    const loadBtc = () => {
      getSimplePrice(["bitcoin"]).then(d => {
        if (typeof d?.bitcoin?.usd === "number") { setPrice(d.bitcoin.usd); setChange(d.bitcoin.usd_24h_change ?? 0); }
      });
      fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()).then(d => {
        setFg({ value: parseInt(d?.data?.[0]?.value || "50"), label: d?.data?.[0]?.value_classification || "Neutral" });
      }).catch(() => {});
      fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily")
        .then(r => r.json()).then(d => { const pts = (d?.prices ?? []).map((p: number[]) => p[1]); if (pts.length) setHistory(pts); }).catch(() => {});
    };
    loadBtc();
    const id = setInterval(loadBtc, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const up = change >= 0;
  const fgColor = !fg ? "var(--color-muted)" : fg.value <= 25 ? "var(--loss)" : fg.value <= 45 ? "var(--warning)" : fg.value <= 55 ? "var(--color-muted)" : "var(--gain)";
  return (
    <div onClick={() => onNavigate("markets")} style={{ ...PANEL, padding: "20px 22px", gap: 16, cursor: "pointer", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ ...LBL, marginBottom: 8 }}>BTC / USD · 7D</p>
          {price != null ? (
            <p className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 40, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>${displayPrice.toLocaleString()}</p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40 }}>
              <RefreshCw size={15} color="var(--color-muted)" style={{ animation: "zspin 1s linear infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-muted)" }}>Loading…</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: up ? "var(--gain-soft)" : "var(--loss-soft)" }}>
            {up ? <ArrowUpRight size={13} color="var(--gain)" /> : <ArrowDownRight size={13} color="var(--loss)" />}
            <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: up ? "var(--gain)" : "var(--loss)" }}>{Math.abs(change).toFixed(2)}%</span>
          </div>
          {history.length > 0 && <Sparkline values={history} color={up ? "var(--gain)" : "var(--loss)"} width={140} height={40} />}
        </div>
      </div>
      {fg && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={LBL}>FEAR & GREED INDEX</span>
            <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: fgColor, letterSpacing: "0.06em" }}>{fg.label.toUpperCase()} · {fg.value}</span>
          </div>
          <div style={{ height: 4, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fg.value}%`, background: `linear-gradient(90deg, var(--loss) 0%, var(--warning) 45%, ${fgColor} 100%)`, borderRadius: 2, transition: "width 1.2s var(--ease-out)" }} />
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gain)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.06em" }}>LIVE · COINGECKO</span>
        <ArrowUpRight size={10} color="var(--color-muted)" style={{ marginLeft: "auto" }} />
      </div>
    </div>
  );
}

// ── ZONE 2b: Signal readout (flat) ───────────────────────────────────────────
function SignalReadout() {
  const [signal, setSignal] = useState<{ text: string; color: string; sub: string; icon: string } | null>(null);
  useEffect(() => {
    const loadSignal = () => {
      Promise.all([
        getSimplePrice(["bitcoin"]),
        fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()),
      ]).then(([btcD, fgD]) => {
        const c = btcD?.bitcoin?.usd_24h_change ?? 0;
        const fgVal = parseInt(fgD?.data?.[0]?.value || "50");
        let text = "HOLD", color = "var(--color-muted)", sub = "Market neutral", icon = "⚖️";
        if (c > 4 && fgVal > 65)       { text = "ACCUMULATE"; color = "var(--gain)"; sub = "Strong bullish + greed"; icon = "🟢"; }
        else if (c > 2 && fgVal > 50)  { text = "WATCH";      color = "#5b8def";     sub = "Uptrend — monitor entry"; icon = "👁"; }
        else if (c < -4 && fgVal < 30) { text = "BUY DIP";    color = "var(--warning)"; sub = "Fear + dip = opportunity"; icon = "💡"; }
        else if (c < -6)               { text = "DEFENSIVE";  color = "var(--loss)"; sub = "High volatility — reduce risk"; icon = "🛡"; }
        else if (fgVal > 80)           { text = "TAKE PROFIT"; color = "#9a86d4";    sub = "Extreme greed — consider exit"; icon = "💰"; }
        setSignal({ text, color, sub, icon });
      }).catch(() => setSignal({ text: "WATCH", color: "#5b8def", sub: "Data loading", icon: "👁" }));
    };
    loadSignal();
    const id = setInterval(loadSignal, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ ...PANEL, gap: 8, justifyContent: "space-between" }}>
      <span style={{ ...LBL, color: signal?.color ?? "var(--color-muted)" }}>Today Signal</span>
      {signal ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 17 }}>{signal.icon}</span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 700, color: signal.color, letterSpacing: "0.03em", lineHeight: 1 }}>{signal.text}</p>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", lineHeight: 1.4 }}>{signal.sub}</p>
        </div>
      ) : <div style={{ display: "flex", alignItems: "center", gap: 8 }}><RefreshCw size={13} color="var(--color-muted)" style={{ animation: "zspin 1s linear infinite" }} /><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)" }}>Analyzing…</span></div>}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: signal?.color ?? "var(--color-muted)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.04em" }}>BTC 24H + F&G INDEX</span>
      </div>
    </div>
  );
}

// ── ZONE 2b: Net worth readout (flat) ────────────────────────────────────────
function NetWorthReadout({ data }: { data: AppData }) {
  const [show, setShow] = useState(false);
  const totalIncome = (data.keuangan?.incomeLog ?? []).reduce((sum, e) => sum + (parseFloat((e.jumlah || "").replace(/[^0-9.]/g, "")) || 0), 0);
  const displayVal = useCountUp(show ? Math.round(totalIncome) : 0, 1200);
  return (
    <div style={{ ...PANEL, gap: 8, justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={LBL}>Net Income Log</span>
        <button onClick={() => setShow(v => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, fontSize: 13 }}>{show ? "🙈" : "👁"}</button>
      </div>
      <div>
        <p className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: "var(--gain)", letterSpacing: "-0.03em", filter: show ? "none" : "blur(8px)", transition: "filter 0.3s", userSelect: show ? "auto" : "none" }}>
          {show ? `Rp ${displayVal.toLocaleString("id-ID")}` : "Rp ••••••••"}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>{data.keuangan?.incomeLog?.length ?? 0} entries logged</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gain)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.04em" }}>FROM KEUANGAN LOG</span>
      </div>
    </div>
  );
}

// ── ZONE 3a: Status board (dense table, flat) ────────────────────────────────
function StatusBoard({ data }: { data: AppData }) {
  const statuses = data.buildLab.statusBoard;
  const active = statuses.filter(s => s.status.includes("AKTIF")).length;
  return (
    <div style={{ ...PANEL, gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={LBL}>Status Board</span>
        <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--gain)", background: "var(--gain-soft)", padding: "2px 7px", borderRadius: 4 }}>{active} AKTIF</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {statuses.slice(0, 4).map((s, i) => {
          const st = statusStyle(s.status);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "9px 2px", borderBottom: i < Math.min(statuses.length, 4) - 1 ? `1px solid ${SEAM}` : "none", gap: 9 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text)", flex: 1, letterSpacing: "-0.01em", minWidth: 0 }}>{s.area}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>{s.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ZONE 3b: Daily intentions (checklist rows, flat) ─────────────────────────
function IntentionsPanel() {
  const DEFAULT = ["Morning review & planning", "Execute top priority task", "Evening reflection journal"];
  const [done, setDone] = useState([false, false, false]);
  const pct = (done.filter(Boolean).length / 3) * 100;
  return (
    <div style={{ ...PANEL, gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={LBL}>Daily Intentions</span>
        <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)" }}>{done.filter(Boolean).length}/3</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {DEFAULT.map((text, i) => (
          <button key={i} onClick={() => setDone(p => { const n = [...p]; n[i] = !n[i]; return n; })} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", borderBottom: i < DEFAULT.length - 1 ? `1px solid ${SEAM}` : "none", cursor: "pointer", padding: "9px 2px", textAlign: "left" }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done[i] ? "var(--gain-soft)" : "transparent", border: `1.5px solid ${done[i] ? "var(--gain)" : "var(--color-border)"}` }}>
              {done[i] && <span style={{ fontSize: 10, color: "var(--gain)" }}>✓</span>}
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: done[i] ? "var(--color-muted)" : "var(--color-text)", textDecoration: done[i] ? "line-through" : "none", lineHeight: 1.3 }}>{text}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 2, background: "var(--color-surface)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-primary)", transition: "width 0.5s var(--ease-out)" }} />
      </div>
    </div>
  );
}

// ── ZONE 3c: Today's focus (editable, flat) ──────────────────────────────────
function FocusPanel({ data, update }: { data: AppData; update: (fn: (p: AppData) => AppData) => void }) {
  return (
    <div style={{ ...PANEL, gap: 10 }}>
      <span style={LBL}>Today's Focus</span>
      <EditableText value={data.dashboard.todayFocus} onChange={val => update(d => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))} />
    </div>
  );
}

// ── ZONE 4: Vision band (slim cinematic strip) ───────────────────────────────
function VisionBand() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const busy = useRef(false);
  const goTo = useCallback((idx: number) => {
    if (idx === cur || busy.current) return;
    busy.current = true; setPrev(cur); setCur(idx);
    setTimeout(() => { setPrev(null); busy.current = false; }, 900);
  }, [cur]);
  useEffect(() => { const id = setInterval(() => goTo((cur + 1) % SLIDES.length), 9000); return () => clearInterval(id); }, [cur, goTo]);
  const slide = SLIDES[cur];
  return (
    <div style={{ position: "relative", overflow: "hidden", height: 130, background: "#0a0b0d" }}>
      {prev !== null && (
        <div key={`p${prev}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: "hFadeOut 0.9s ease forwards" }}>
          <img src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=900&q=75`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) saturate(1.2)" }} />
        </div>
      )}
      <div key={`c${cur}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: "hFadeIn 0.9s ease forwards" }}>
        <img src={`https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=900&q=75`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) saturate(1.2)", animation: "hKenBurns 10s ease-out forwards" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 3, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em" }}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.18)", padding: "2px 7px", borderRadius: 3 }}>{slide.tag.toUpperCase()}</span>
        </div>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "rgba(255,255,255,0.92)", lineHeight: 1.45, maxWidth: 460, textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}>"{slide.quote}"</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: i === cur ? 16 : 4, height: 3, borderRadius: 2, background: i === cur ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s ease" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ZONE 5: Module function bar ──────────────────────────────────────────────
function ModuleBar({ onNavigate }: { onNavigate: (k: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${MODULES.length}, 1fr)`, gap: 1, background: SEAM }}>
      {MODULES.map(m => (
        <button key={m.key} onClick={() => onNavigate(m.key)} style={{ background: "var(--glass-bg)", border: "none", cursor: "pointer", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, textAlign: "left", transition: "background 0.15s", minWidth: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--glass-bg)"; }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--color-surface)", border: `1px solid ${SEAM}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <m.Icon size={14} color={m.color} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em" }}>{m.label}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.sub}</span>
          </div>
          <ArrowUpRight size={11} color="var(--color-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}

// ── MAIN — Terminal Slab ─────────────────────────────────────────────────────
export function DashboardPage({ data, update, onNavigate }: Props) {
  return (
    <div style={{ border: `1px solid ${SEAM}`, borderRadius: 10, overflow: "hidden", background: "var(--glass-bg)", boxShadow: "var(--card-shadow)" }}>
      {/* Zone 1 — ticker strip */}
      <div style={{ borderBottom: `1px solid ${SEAM}` }}><TickerStrip /></div>

      {/* Zone 2 — dominant hero + readout spine */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 1, background: SEAM, borderBottom: `1px solid ${SEAM}` }}>
        <BtcHero onNavigate={onNavigate} />
        <div style={{ display: "grid", gridTemplateRows: "1fr 1px 1fr", background: "var(--glass-bg)" }}>
          <SignalReadout />
          <div style={{ background: SEAM }} />
          <NetWorthReadout data={data} />
        </div>
      </div>

      {/* Zone 3 — dense triad */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: SEAM, borderBottom: `1px solid ${SEAM}` }}>
        <StatusBoard data={data} />
        <IntentionsPanel />
        <FocusPanel data={data} update={update} />
      </div>

      {/* Zone 4 — vision band */}
      <div style={{ borderBottom: `1px solid ${SEAM}` }}><VisionBand /></div>

      {/* Zone 5 — module function bar */}
      <div style={{ borderBottom: `1px solid ${SEAM}` }}><ModuleBar onNavigate={onNavigate} /></div>

      {/* Zone 6 — footer status line */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", gap: 12, flexWrap: "wrap", background: "var(--glass-bg)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.08em" }}>ZERØ COMMAND v6 · {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.1em" }}>DATA · COINGECKO · ALT.ME · OPEN-METEO</span>
      </div>

      <style>{`
        @keyframes hFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes hFadeOut  { from{opacity:1} to{opacity:0} }
        @keyframes hKenBurns { from{transform:scale(1)} to{transform:scale(1.06)} }
        @keyframes zspin     { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
