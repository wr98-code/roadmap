// ─── ZERØ COMMAND — DashboardPage.tsx v10 "ATELIER" ──────────────────────────
// Post-dashboard, narrative Home. Opens with a human line, then one big
// beautiful number, then the day's intent — generous, asymmetric, warm.
// Not a widget grid, not a terminal. See DESIGN_DIRECTION.md.
// Every live feed, feature, handler and data binding is preserved.

import { useState, useEffect, useRef, useCallback } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import { getSimplePrice } from "@/lib/prices";
import {
  Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, Check, BookMarked,
} from "lucide-react";
import { termOfDay, GLOSSARY_CATEGORIES, defFor } from "@/lib/glossary";
import { useRegister } from "@/lib/lang";
import { monthTotals, currentMonth, fmtMoney, monthLabel } from "@/lib/finance";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

/* ── shared atoms ───────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "var(--glass-bg)",
  border: "1px solid var(--glass-border)",
  borderRadius: 22,
  boxShadow: "var(--card-shadow), var(--card-inset)",
  padding: "22px 24px",
  minWidth: 0,
};
const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
  letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--color-muted)",
};
const displayFace: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontOpticalSizing: "auto",
  fontVariationSettings: "'SOFT' 32, 'WONK' 1", letterSpacing: "-0.03em", lineHeight: 1.02,
};

/* ── kinetic count-up (unchanged behaviour) ─────────────────────────────── */
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

/* ── soft area sparkline ────────────────────────────────────────────────── */
function Spark({ values, tone }: { values: number[]; tone: string }) {
  if (values.length < 2) return null;
  const W = 100, H = 32;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - ((v - min) / range) * (H - 5) - 2.5] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 46, display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="sp-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${line} ${W},${H}`} fill="url(#sp-g)" />
      <polyline points={line} fill="none" stroke={tone} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── vision slides (unchanged data) ─────────────────────────────────────── */
const SLIDES = [
  { photo: "photo-1486406146926-c627a92ad1ab", tag: "Vision",     quote: "Financial freedom is built in the hours others waste." },
  { photo: "photo-1568992687947-868a62a9f521", tag: "Excellence", quote: "Precision is the language of the elite." },
  { photo: "photo-1470075801209-17f9ec0099cd", tag: "Discipline", quote: "While the world sleeps, you build your empire." },
  { photo: "photo-1512453979798-5ea266f8880c", tag: "Ambition",   quote: "Cities are built by those who refused to settle." },
  { photo: "photo-1497366216548-37526070297c", tag: "Clarity",    quote: "Clarity is the most underrated form of wealth." },
];

const MODULES = [
  { key: "wealth",    label: "Wealth",    sub: "Neraca & runway",      Icon: DollarSign },
  { key: "build-lab", label: "Build Lab", sub: "Proyek & sprint",      Icon: Zap },
  { key: "trading",   label: "Trading",   sub: "Sinyal & game plan",   Icon: TrendingUp },
  { key: "crypto",    label: "Crypto",    sub: "Portfolio & on-chain", Icon: Globe },
  { key: "roadmap",   label: "Roadmap",   sub: "Milestone & goals",    Icon: Calendar },
  { key: "personal",  label: "Personal",  sub: "Mindset & habits",     Icon: User },
];

function statusTone(s: string) {
  if (s.includes("AKTIF")) return { c: "var(--gain)", bg: "var(--gain-soft)" };
  if (s.includes("✅") || /\b(live|deploy)\b/i.test(s)) return { c: "var(--color-primary)", bg: "var(--ember-soft)" };
  if (s.includes("CRITICAL")) return { c: "var(--loss)", bg: "var(--loss-soft)" };
  return { c: "var(--color-muted)", bg: "var(--color-surface)" };
}

/* Data pengguna lama bisa memuat emoji — saring hanya untuk tampilan,
   isi penyimpanan tidak diubah. */
export function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s*\/\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

/* ══════════════════════════════════════════════════════════════════════════
   OPENING — the human line. Not a widget.
   ══════════════════════════════════════════════════════════════════════════ */
function Opening() {
  const now = new Date();
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  return (
    <header className="rise rise-1" style={{ padding: "4px 2px 2px" }}>
      <p style={{ ...eyebrow, marginBottom: 10 }}>{date}</p>
      <h1 style={{ ...displayFace, fontSize: "clamp(30px, 4.6vw, 50px)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
        {greeting()}, Windu.
      </h1>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MARKET PULSE — the one big beautiful number (BTC), + ETH/SOL rail.
   Live: getSimplePrice, alternative.me F&G, CoinGecko 7d chart.
   ══════════════════════════════════════════════════════════════════════════ */
function MarketPulse({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [fg, setFg] = useState<{ value: number; label: string } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [alts, setAlts] = useState<{ sym: string; price: string; up: boolean; chg: string }[]>([]);
  const shown = useCountUp(price ?? 0, 1500);

  useEffect(() => {
    const load = () => {
      getSimplePrice(["bitcoin", "ethereum", "solana"]).then(d => {
        if (typeof d?.bitcoin?.usd === "number") {
          setPrice(d.bitcoin.usd);
          setChange(d.bitcoin.usd_24h_change ?? 0);
        }
        const fmt = (n: number) => n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(2);
        const rows: { sym: string; price: string; up: boolean; chg: string }[] = [];
        if (d?.ethereum) rows.push({ sym: "ETH", price: fmt(d.ethereum.usd), up: (d.ethereum.usd_24h_change ?? 0) >= 0, chg: Math.abs(d.ethereum.usd_24h_change ?? 0).toFixed(2) });
        if (d?.solana) rows.push({ sym: "SOL", price: fmt(d.solana.usd), up: (d.solana.usd_24h_change ?? 0) >= 0, chg: Math.abs(d.solana.usd_24h_change ?? 0).toFixed(2) });
        if (rows.length) setAlts(rows);
      });
      fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()).then(d => {
        setFg({ value: parseInt(d?.data?.[0]?.value || "50"), label: d?.data?.[0]?.value_classification || "Neutral" });
      }).catch(() => {});
      fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily")
        .then(r => r.json()).then(d => {
          const pts = (d?.prices ?? []).map((p: number[]) => p[1]);
          if (pts.length) setHistory(pts);
        }).catch(() => {});
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const up = change >= 0;
  const tone = up ? "var(--gain)" : "var(--loss)";
  const fgPct = fg ? fg.value : 0;

  return (
    <section
      onClick={() => onNavigate("markets")}
      className="rise rise-2 z-card-hover"
      style={{ ...card, padding: "26px 28px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 18 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={eyebrow}>Bitcoin · USD</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: up ? "var(--gain-soft)" : "var(--loss-soft)", color: tone, fontSize: 13, fontWeight: 700 }}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span className="num">{Math.abs(change).toFixed(2)}%</span>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <span className="num" style={{ ...displayFace, fontSize: "clamp(42px, 6vw, 68px)", fontWeight: 600, color: "var(--color-text)" }}>
          {price == null ? "—" : `$${shown.toLocaleString("en-US")}`}
        </span>
        <span style={{ fontSize: 13, color: "var(--color-muted)", paddingBottom: 10 }}>7 hari terakhir</span>
      </div>

      <Spark values={history} tone={tone} />

      {/* Fear & Greed — a quiet, honest gauge */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
          <span style={eyebrow}>Fear &amp; Greed</span>
          {fg && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{fg.label} · <span className="num">{fg.value}</span></span>}
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "var(--color-surface)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${fgPct}%`, borderRadius: 999, background: "linear-gradient(90deg, var(--loss), var(--warning), var(--gain))", transition: "width 900ms var(--ease-soft)" }} />
        </div>
      </div>

      {/* ETH / SOL — small companions, never competing with the hero */}
      {alts.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
          {alts.map(a => (
            <div key={a.sym} style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "7px 13px", borderRadius: 14, background: "var(--color-surface)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted)", letterSpacing: "0.06em" }}>{a.sym}</span>
              <span className="num" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>${a.price}</span>
              <span className="num" style={{ fontSize: 12, fontWeight: 600, color: a.up ? "var(--gain)" : "var(--loss)" }}>{a.up ? "+" : "−"}{a.chg}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — adaptive read from BTC 24h + F&G (same rules, warmer voice)
   ══════════════════════════════════════════════════════════════════════════ */
function Signal() {
  const [sig, setSig] = useState<{ text: string; sub: string; tone: string } | null>(null);
  useEffect(() => {
    const load = () => {
      Promise.all([
        getSimplePrice(["bitcoin"]),
        fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()),
      ]).then(([btcD, fgD]) => {
        const c = btcD?.bitcoin?.usd_24h_change ?? 0;
        const v = parseInt(fgD?.data?.[0]?.value || "50");
        let text = "HOLD", sub = "Market netral", tone = "var(--color-muted)";
        if (c > 4 && v > 65) { text = "ACCUMULATE"; sub = "Bullish kuat + greed"; tone = "var(--gain)"; }
        else if (c > 2 && v > 50) { text = "WATCH"; sub = "Uptrend — pantau entry"; tone = "var(--color-primary)"; }
        else if (c < -4 && v < 30) { text = "BUY DIP"; sub = "Fear + dip = peluang"; tone = "var(--warning)"; }
        else if (c < -6) { text = "DEFENSIVE"; sub = "Volatil — kurangi risiko"; tone = "var(--loss)"; }
        else if (v > 80) { text = "TAKE PROFIT"; sub = "Extreme greed"; tone = "var(--gold)"; }
        setSig({ text, sub, tone });
      }).catch(() => setSig({ text: "WATCH", sub: "Data dimuat", tone: "var(--color-primary)" }));
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rise rise-3" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={eyebrow}>Sinyal hari ini</span>
      {sig ? (
        <>
          <span style={{ ...displayFace, fontSize: 30, fontWeight: 600, color: sig.tone }}>{sig.text}</span>
          <span style={{ fontSize: 14, color: "var(--color-muted)", lineHeight: 1.5 }}>{sig.sub}</span>
        </>
      ) : (
        <span style={{ fontSize: 14, color: "var(--color-muted)" }}>Membaca pasar…</span>
      )}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 8, fontSize: 12, color: "var(--color-dim)" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ember)", animation: "emberPulse 2.4s infinite" }} />
        BTC 24h + Fear &amp; Greed
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NET WORTH — derived from the real Keuangan income log. Blur by default.
   ══════════════════════════════════════════════════════════════════════════ */
function NetWorth({ data }: { data: AppData }) {
  const [show, setShow] = useState(false);
  const fin = data.keuangan?.finance;
  const hasFinance = (fin?.transactions?.length ?? 0) > 0;
  // sistem transaksi baru → total masuk bulan berjalan; fallback: ledger lama
  const finTotals = hasFinance && fin ? monthTotals(fin, currentMonth()) : null;
  const legacyTotal = (data.keuangan?.incomeLog ?? []).reduce(
    (s, e) => s + (parseFloat((e.jumlah || "").replace(/[^0-9.]/g, "")) || 0), 0);
  const total = finTotals ? finTotals.masuk : legacyTotal;
  const shown = useCountUp(show ? Math.round(total) : 0, 1200);
  const sub = finTotals
    ? `${finTotals.txCount} transaksi · ${monthLabel(currentMonth(), true)}`
    : (data.keuangan?.incomeLog?.length ?? 0) === 0
      ? "Belum ada catatan — isi di Keuangan"
      : `${data.keuangan.incomeLog.length} entry ledger lama`;
  return (
    <div className="rise rise-4" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={eyebrow}>{finTotals ? "Masuk bulan ini" : "Income tercatat"}</span>
        <button
          onClick={() => setShow(v => !v)}
          aria-label={show ? "Sembunyikan angka" : "Tampilkan angka"}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 12, cursor: "pointer", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <span className="num" style={{ ...displayFace, fontSize: 34, fontWeight: 600, color: "var(--color-text)", filter: show ? "none" : "blur(11px)", transition: "filter 260ms var(--ease-out)", userSelect: show ? "auto" : "none" }}>
        {finTotals && fin ? fmtMoney(shown, fin.currency) : `Rp ${shown.toLocaleString("id-ID")}`}
      </span>
      <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{sub}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ISTILAH HARI INI — belajar pasif dari kamus (deterministik per tanggal)
   ══════════════════════════════════════════════════════════════════════════ */
function TermOfDay({ onNavigate }: { onNavigate: (k: string) => void }) {
  const t = termOfDay();
  const register = useRegister();
  const catInfo = GLOSSARY_CATEGORIES.find(c => c.key === t.category);
  return (
    <section className="rise rise-5" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...eyebrow, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <BookMarked size={12} /> Istilah hari ini
        </span>
        <span style={{ fontSize: 11, color: "var(--color-dim)" }}>{catInfo?.label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...displayFace, fontSize: 27, fontWeight: 600, color: "var(--color-text)" }}>{t.term}</span>
        {t.full && <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{t.full}</span>}
      </div>
      <p style={{ fontSize: 14, color: "var(--color-muted)", lineHeight: 1.65, margin: 0 }}>
        {defFor(t, register)}
      </p>
      {t.formula && (
        <p className="num" style={{ fontSize: 12.5, margin: 0, padding: "7px 11px", borderRadius: 9, background: "var(--color-surface)", color: "var(--color-text)", overflowX: "auto", whiteSpace: "nowrap", alignSelf: "flex-start", maxWidth: "100%" }}>
          {t.formula}
        </p>
      )}
      <button
        onClick={() => onNavigate("learn")}
        style={{
          alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", cursor: "pointer", padding: 0,
          fontSize: 13, fontWeight: 600, color: "var(--color-primary)", fontFamily: "var(--font-sans)",
        }}
      >
        Buka Kamus Istilah <ArrowUpRight size={13} />
      </button>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TODAY — the day's intent. Editable focus (persists) + intentions.
   ══════════════════════════════════════════════════════════════════════════ */
function Today({ data, update }: { data: AppData; update: (fn: (p: AppData) => AppData) => void }) {
  const DEFAULT = ["Morning review & planning", "Execute top priority task", "Evening reflection journal"];
  const [done, setDone] = useState([false, false, false]);
  const count = done.filter(Boolean).length;
  return (
    <section className="rise rise-3" style={{ ...card, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={eyebrow}>Fokus hari ini</span>
        <span style={{ fontSize: 13, color: "var(--color-muted)" }}><span className="num">{count}</span>/3 niat</span>
      </div>

      {/* editable, persisted to AppData.dashboard.todayFocus */}
      <div style={{ ...displayFace, fontSize: "clamp(19px, 2.1vw, 25px)", fontWeight: 500, color: "var(--color-text)", lineHeight: 1.3 }}>
        <EditableText
          value={data.dashboard.todayFocus}
          onChange={val => update(d => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
        {DEFAULT.map((t, i) => (
          <button
            key={i}
            onClick={() => setDone(p => { const n = [...p]; n[i] = !n[i]; return n; })}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 8px", background: "transparent", border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "background var(--dur-fast) var(--ease-out)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: done[i] ? "var(--ember)" : "transparent",
              border: done[i] ? "1px solid var(--ember)" : "1.5px solid var(--color-border)",
              transition: "all var(--dur-fast) var(--ease-spring)",
            }}>
              {done[i] && <Check size={13} color="var(--on-primary)" strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 15, color: done[i] ? "var(--color-muted)" : "var(--color-text)", textDecoration: done[i] ? "line-through" : "none" }}>{t}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATUS — what is actually live in the business (from AppData.buildLab)
   ══════════════════════════════════════════════════════════════════════════ */
function Status({ data }: { data: AppData }) {
  const rows = data.buildLab.statusBoard;
  const active = rows.filter(s => s.status.includes("AKTIF")).length;
  return (
    <section className="rise rise-4" style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={eyebrow}>Status proyek</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gain)", background: "var(--gain-soft)", padding: "4px 11px", borderRadius: 999 }}>
          <span className="num">{active}</span> aktif
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.slice(0, 4).map((s, i) => {
          const t = statusTone(s.status);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.c, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 15, color: "var(--color-text)", minWidth: 0 }}>{s.area}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.c, background: t.bg, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{stripEmoji(s.status)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VISION — the cinematic band. The moment of privilege.
   ══════════════════════════════════════════════════════════════════════════ */
function Vision() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const busy = useRef(false);
  const go = useCallback((i: number) => {
    if (i === cur || busy.current) return;
    busy.current = true; setPrev(cur); setCur(i);
    setTimeout(() => { setPrev(null); busy.current = false; }, 900);
  }, [cur]);
  useEffect(() => {
    const id = setInterval(() => go((cur + 1) % SLIDES.length), 9000);
    return () => clearInterval(id);
  }, [cur, go]);
  const s = SLIDES[cur];
  return (
    // The cinematic band is always a dark stage (white type over photo) in BOTH
    // themes — so its backdrop is a constant, never a token that flips.
    <section className="rise rise-5" style={{ position: "relative", borderRadius: 22, overflow: "hidden", minHeight: 230, background: "#1b1815", boxShadow: "var(--card-shadow)" }}>
      {prev !== null && (
        <img key={`p${prev}`} src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=1200&q=76`} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.42) saturate(1.05)", animation: "heroCrossFadeOut 0.9s ease forwards" }} />
      )}
      <img key={`c${cur}`} src={`https://images.unsplash.com/${s.photo}?auto=format&fit=crop&w=1200&q=76`} alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.42) saturate(1.05)", animation: "heroCrossFadeIn 0.9s ease forwards, heroKenBurns 10s ease-out forwards" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,24,21,0.92) 0%, rgba(27,24,21,0.32) 58%, rgba(27,24,21,0.12) 100%)" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 230, padding: "22px 26px" }}>
        <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "#f6f2ec", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.24)", padding: "5px 13px", borderRadius: 999 }}>
          {s.tag}
        </span>
        <div>
          <p style={{ ...displayFace, fontSize: "clamp(20px, 2.5vw, 30px)", fontWeight: 500, fontStyle: "italic", color: "#faf7f2", margin: "0 0 16px", maxWidth: 620, lineHeight: 1.22 }}>
            “{s.quote}”
          </p>
          <div style={{ display: "flex", gap: 7 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-label={`Slide ${i + 1}`}
                style={{ width: i === cur ? 30 : 8, height: 4, borderRadius: 999, border: "none", padding: 0, cursor: "pointer", background: i === cur ? "var(--ember)" : "rgba(255,255,255,0.42)", transition: "all 320ms var(--ease-soft)" }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODULES — a warm rail, not a grid of glowing tiles
   ══════════════════════════════════════════════════════════════════════════ */
function Modules({ onNavigate }: { onNavigate: (k: string) => void }) {
  return (
    <section className="rise rise-6" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={eyebrow}>Modul</span>
      <div className="rail-x" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 12 }}>
        {MODULES.map(m => (
          <button key={m.key} onClick={() => onNavigate(m.key)} className="z-card-hover"
            style={{ ...card, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", textAlign: "left", cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 14, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <m.Icon size={18} color="var(--color-primary)" />
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em" }}>{m.label}</span>
            <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{m.sub}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE — asymmetric on purpose. Irregularity = decisions were made.
   ══════════════════════════════════════════════════════════════════════════ */
export function DashboardPage({ data, update, onNavigate }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, paddingBottom: 8 }}>
      <Opening />

      {/* Asymmetric: the hero number is wider than its companions */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, alignItems: "start" }}>
        <MarketPulse onNavigate={onNavigate} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Signal />
          <NetWorth data={data} />
        </div>
      </div>

      {/* Reversed asymmetry so the rhythm never repeats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 18, alignItems: "start" }}>
        <Status data={data} />
        <Today data={data} update={update} />
      </div>

      <Vision />
      <TermOfDay onNavigate={onNavigate} />
      <Modules onNavigate={onNavigate} />

      <p style={{ fontSize: 12, color: "var(--color-dim)", textAlign: "right", paddingTop: 2 }}>
        ZERØ · diperbarui {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
