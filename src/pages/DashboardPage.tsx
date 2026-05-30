// ─── ZERØ COMMAND — DashboardPage.tsx v6.0 ───────────────────────────────────
// Stat cards + Cinematic Hero + Daily Intentions + Command Modules grid
// Matches Stitch design: 3 stat cards, vision board split, 3x2 module grid
import { useState, useEffect } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import { Zap, TrendingUp, Globe, Calendar, DollarSign, User, Loader2 } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

const SLIDES = [
  { photo: "photo-1486406146926-c627a92ad1ab", tag: "Vision",     quote: "Financial freedom is built in the hours others waste." },
  { photo: "photo-1512453979798-5ea266f8880c", tag: "Ambition",   quote: "Cities are built by those who refused to settle." },
  { photo: "photo-1470075801209-17f9ec0099cd", tag: "Discipline", quote: "While the world sleeps, you build your empire." },
  { photo: "photo-1497366216548-37526070297c", tag: "Clarity",    quote: "Clarity is the most underrated form of wealth." },
  { photo: "photo-1449824913935-59a10b8d2000", tag: "Growth",     quote: "Every sunrise is a new balance sheet." },
  { photo: "photo-1568992687947-868a62a9f521", tag: "Excellence", quote: "Precision is the language of the elite." },
];

const MODULES = [
  { key: "build-lab", label: "Build Lab",  sub: "Projects & sprint",  Icon: Zap,        color: "#f59e0b", border: "#f59e0b" },
  { key: "trading",   label: "Trading",    sub: "Game plan & signals", Icon: TrendingUp, color: "#3b82f6", border: "#3b82f6" },
  { key: "crypto",    label: "Crypto",     sub: "Portfolio & on-chain",Icon: Globe,      color: "#f97316", border: "#f97316" },
  { key: "roadmap",   label: "Roadmap",    sub: "Milestones & goals",  Icon: Calendar,   color: "#8b5cf6", border: "#8b5cf6" },
  { key: "keuangan",  label: "Keuangan",   sub: "Cash flow & tracker", Icon: DollarSign, color: "#10b981", border: "#10b981" },
  { key: "personal",  label: "Personal",   sub: "Mindset & habits",    Icon: User,       color: "#ec4899", border: "#ec4899" },
];

function statusStyle(s: string) {
  if (s.includes("AKTIF"))    return { dot: "#22c55e", cls: "status-aktif",    lightBg: "rgba(34,197,94,0.1)",   lightText: "#15803d" };
  if (s.includes("✅"))       return { dot: "#3b82f6", cls: "status-done",     lightBg: "rgba(59,130,246,0.1)",  lightText: "#1d4ed8" };
  if (s.includes("CRITICAL")) return { dot: "#ef4444", cls: "status-critical", lightBg: "rgba(239,68,68,0.1)",   lightText: "#dc2626" };
  return { dot: "#9ca3af",  cls: "status-default",  lightBg: "rgba(156,163,175,0.1)", lightText: "#6b7280" };
}

export function DashboardPage({ data, update, onNavigate }: Props) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [btcData, setBtcData] = useState<{ price: string; change: string; up: boolean } | null>(null);
  const [intentionsDone, setIntentionsDone] = useState<boolean[]>([true, false, false]);

  const goTo = (idx: number) => {
    if (idx === cur || busy) return;
    setBusy(true); setPrev(cur); setCur(idx);
    setTimeout(() => { setPrev(null); setBusy(false); }, 900);
  };

  useEffect(() => {
    const id = setInterval(() => goTo((cur + 1) % SLIDES.length), 10000);
    return () => clearInterval(id);
  }, [cur]);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
      .then(r => r.json())
      .then(d => {
        const p = d?.bitcoin?.usd;
        const c = d?.bitcoin?.usd_24h_change;
        if (p) setBtcData({ price: p.toLocaleString("en-US", { maximumFractionDigits: 0 }), change: Math.abs(c).toFixed(2), up: c >= 0 });
      }).catch(() => {});
  }, []);

  const slide = SLIDES[cur];
  const statuses = data.buildLab.statusBoard;
  const activeProjects = statuses.filter(s => s.status.includes("AKTIF")).length;

  const INTENTIONS = [
    { text: "Morning review & planning", done: intentionsDone[0] },
    { text: "Execute top priority task", done: intentionsDone[1] },
    { text: "Evening reflection journal", done: intentionsDone[2] },
  ];

  const toggleIntention = (i: number) => {
    setIntentionsDone(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── STAT CARDS ROW ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {/* Net Worth */}
        <div style={{
          borderRadius: 16, padding: "16px 18px",
          background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--card-shadow), var(--card-inset)",
        }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 8 }}>Net Worth</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>—</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 3 }}>
              ↑ growing
            </span>
          </div>
        </div>

        {/* Active Projects */}
        <div style={{
          borderRadius: 16, padding: "16px 18px",
          background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--card-shadow), var(--card-inset)",
        }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 8 }}>Active Projects</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>{activeProjects}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[...Array(Math.min(activeProjects, 5))].map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", opacity: 0.6 + i * 0.08 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Today Signal */}
        <div style={{
          borderRadius: 16, padding: "16px 18px",
          background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--card-shadow), var(--card-inset)",
        }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 8 }}>Today Signal</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.08em" }}>
              {btcData ? (btcData.up ? "ACCUMULATE" : "HOLD") : "LOADING…"}
            </span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6", animation: "statPulse 2s infinite" }} />
          </div>
        </div>
      </div>

      {/* ── CINEMATIC HERO + INTENTIONS ────────────────────── */}
      <div style={{
        borderRadius: 20, overflow: "hidden", height: 220,
        display: "flex", border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
      }}>
        {/* Left 60%: vision board */}
        <div style={{ width: "60%", position: "relative", background: "#04040c", flexShrink: 0 }}>
          {/* Prev slide */}
          {prev !== null && (
            <div key={`p-${prev}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: "heroCrossFadeOut 0.9s ease forwards" }}>
              <img src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=1200&q=80`} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) saturate(1.2)" }} />
            </div>
          )}
          {/* Current slide */}
          <div key={`c-${cur}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: "heroCrossFadeIn 0.9s ease forwards" }}>
            <img src={`https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=1200&q=80`} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) saturate(1.2)", animation: "heroKenBurns 11s ease-out forwards" }} />
          </div>
          {/* Overlays */}
          <div style={{ position: "absolute", inset: 0, zIndex: 3, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 3, background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
          {/* UI layer */}
          <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "14px 18px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "2px 10px", borderRadius: 20 }}>
                {slide.tag}
              </span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.9)", lineHeight: 1.45, letterSpacing: "-0.01em", maxWidth: 340, marginBottom: 12, textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
                "{slide.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {SLIDES.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} style={{
                    width: i === cur ? 18 : 4, height: 3, borderRadius: 2,
                    background: i === cur ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                    border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s ease",
                  }} />
                ))}
                <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 1, overflow: "hidden", marginLeft: 8 }}>
                  <div key={cur} style={{ height: "100%", background: "rgba(255,255,255,0.3)", borderRadius: 1, animation: "slideProgress 10s linear forwards" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 40%: daily intentions */}
        <div style={{
          flex: 1, background: "rgba(8,8,24,0.9)", backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 14 }}>Daily Intentions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {INTENTIONS.map((int, i) => (
              <button key={i} onClick={() => toggleIntention(i)} style={{
                display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: int.done ? "rgba(16,185,129,0.15)" : "transparent",
                  border: `1.5px solid ${int.done ? "#10b981" : "rgba(255,255,255,0.18)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {int.done && <span style={{ fontSize: 9, color: "#10b981" }}>✓</span>}
                </div>
                <span style={{
                  fontFamily: "var(--font-sans)", fontSize: 12, color: int.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.65)",
                  textDecoration: int.done ? "line-through" : "none", transition: "all 0.2s", lineHeight: 1.3,
                }}>{int.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMMAND MODULES ─────────────────────────────────── */}
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Command Modules</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {MODULES.map(m => (
            <button key={m.key} onClick={() => onNavigate(m.key)}
              className="z-card-hover"
              style={{
                display: "flex", flexDirection: "column", padding: "16px 16px 0", cursor: "pointer",
                borderRadius: 16, border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
                boxShadow: "var(--card-shadow), var(--card-inset)",
                transition: "all 0.22s ease", position: "relative", overflow: "hidden",
                textAlign: "left", minHeight: 90,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = m.color + "50";
                el.style.background = m.color + "0c";
                el.style.boxShadow = `0 0 20px ${m.color}18, var(--card-shadow-hover)`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--glass-border)";
                el.style.background = "var(--glass-bg)";
                el.style.boxShadow = "var(--card-shadow), var(--card-inset)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: m.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={15} color={m.color} />
                </div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, opacity: 0.6 }} />
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em", marginBottom: 2 }}>{m.label}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", marginBottom: 0 }}>{m.sub}</span>
              {/* Bottom color strip */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${m.color}80, ${m.color}20)`, borderRadius: "0 0 2px 2px" }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── STATUS BOARD ─────────────────────────────────────── */}
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Status Board</span>
        <div style={{
          borderRadius: 16, overflow: "hidden", border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
          boxShadow: "var(--card-shadow), var(--card-inset)",
        }}>
          {statuses.map((s, i) => {
            const st = statusStyle(s.status);
            return (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", padding: "12px 18px",
                borderBottom: i < statuses.length - 1 ? "1px solid var(--color-border)" : "none", gap: 14,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, flexShrink: 0, boxShadow: `0 0 7px ${st.dot}90` }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text)", flex: 1 }}>{s.area}</span>
                <span className={st.cls} style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, background: st.lightBg, color: st.lightText, padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                  {s.status}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", minWidth: 30, textAlign: "right" }}>{s.prioritas}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TODAY'S FOCUS ─────────────────────────────────────── */}
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Today's Focus</span>
        <div style={{ borderRadius: 16, border: "1px solid var(--glass-border)", background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--card-shadow), var(--card-inset)", padding: "14px 18px" }}>
          <EditableText
            value={data.dashboard.todayFocus}
            onChange={val => update(d => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))}
          />
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.06em" }}>
        Updated {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}
      </p>

      <style>{`
        @keyframes heroCrossFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes heroCrossFadeOut { from{opacity:1} to{opacity:0} }
        @keyframes slideProgress    { from{width:100%} to{width:0%} }
        @keyframes heroKenBurns     { from{transform:scale(1)} to{transform:scale(1.045)} }
        @keyframes statPulse        { 0%,100%{box-shadow:0 0 8px #3b82f6}50%{box-shadow:0 0 16px #3b82f6,0 0 24px rgba(59,130,246,0.3)} }
      `}</style>
    </div>
  );
}
