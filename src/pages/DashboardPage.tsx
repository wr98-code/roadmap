// ─── ZERØ COMMAND — DashboardPage.tsx ────────────────────────────────────────
// Clean Premium · Auto Slideshow · Apple × Notion aesthetic
import { useState, useEffect } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import { Zap, TrendingUp, Globe, Calendar, DollarSign, User } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

const SLIDES = [
  { photo: "photo-1486406146926-c627a92ad1ab", tag: "Vision",      quote: "Financial freedom is built in the hours others waste." },
  { photo: "photo-1512453979798-5ea266f8880c", tag: "Ambition",    quote: "Cities are built by those who refused to settle." },
  { photo: "photo-1470075801209-17f9ec0099cd", tag: "Discipline",  quote: "While the world sleeps, you build your empire." },
  { photo: "photo-1497366216548-37526070297c", tag: "Clarity",     quote: "Clarity is the most underrated form of wealth." },
  { photo: "photo-1449824913935-59a10b8d2000", tag: "Growth",      quote: "Every sunrise is a new balance sheet." },
  { photo: "photo-1568992687947-868a62a9f521", tag: "Excellence",  quote: "Precision is the language of the elite." },
  { photo: "photo-1600607687939-ce8a6c25118c", tag: "Abundance",   quote: "Scarcity is a mindset. Abundance is a decision." },
  { photo: "photo-1464082354059-27db6ce50048", tag: "Confidence",  quote: "The ocean doesn't apologize for its depth." },
];

const QUICK = [
  { key: "build-lab", label: "Build Lab",  icon: Zap,        color: "#f59e0b" },
  { key: "trading",   label: "Trading",    icon: TrendingUp, color: "#10b981" },
  { key: "crypto",    label: "Crypto",     icon: Globe,      color: "#6366f1" },
  { key: "roadmap",   label: "Roadmap",    icon: Calendar,   color: "#3b82f6" },
  { key: "keuangan",  label: "Keuangan",   icon: DollarSign, color: "#ec4899" },
  { key: "personal",  label: "Personal",   icon: User,       color: "#8b5cf6" },
];

function statusStyle(s: string) {
  if (s.includes("AKTIF"))    return { dot: "#22c55e", bg: "#f0fdf4", text: "#15803d" };
  if (s.includes("✅"))       return { dot: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" };
  if (s.includes("CRITICAL")) return { dot: "#ef4444", bg: "#fef2f2", text: "#dc2626" };
  return { dot: "#9ca3af", bg: "#f9fafb", text: "#6b7280" };
}

export function DashboardPage({ data, update, onNavigate }: Props) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const goTo = (idx: number) => {
    if (idx === cur || busy) return;
    setBusy(true);
    setPrev(cur);
    setCur(idx);
    setTimeout(() => { setPrev(null); setBusy(false); }, 800);
  };

  useEffect(() => {
    const id = setInterval(() => goTo((cur + 1) % SLIDES.length), 10000);
    return () => clearInterval(id);
  }, [cur]);

  const slide = SLIDES[cur];
  const statuses = data.buildLab.statusBoard;

  const isDark = typeof document !== "undefined" &&
    (document.documentElement.classList.contains("theme-night") ||
     document.documentElement.classList.contains("dark-mode"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── VISION SLIDESHOW ─────────────────────────────────── */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 300, background: "#080810" }}>

        {/* Prev slide fades out */}
        {prev !== null && (
          <div key={`prev-${prev}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: "crossFadeOut 0.8s ease forwards" }}>
            <img src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=1400&q=80`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.42) saturate(1.1)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
          </div>
        )}

        {/* Current slide fades in */}
        <div key={`cur-${cur}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: "crossFadeIn 0.8s ease forwards" }}>
          <img src={`https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=1400&q=80`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.42) saturate(1.1)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)" }} />
        </div>

        {/* UI layer */}
        <div style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px 24px 20px" }}>
          {/* Top */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 10px", borderRadius: 20, textTransform: "uppercase" }}>
              {slide.tag}
            </span>
          </div>

          {/* Bottom: quote + controls */}
          <div>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, fontWeight: 400, color: "rgba(255,255,255,0.92)", lineHeight: 1.35, letterSpacing: "-0.01em", maxWidth: 520, marginBottom: 18 }}>
              "{slide.quote}"
            </p>

            {/* Dots + progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{ width: i === cur ? 20 : 5, height: 5, borderRadius: 3, background: i === cur ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s ease", flexShrink: 0 }} />
              ))}
              <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden", marginLeft: 8 }}>
                <div key={cur} style={{ height: "100%", background: "rgba(255,255,255,0.4)", borderRadius: 1, animation: "slideProgress 10s linear forwards" }} />
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes crossFadeIn  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes crossFadeOut { from { opacity: 1; } to { opacity: 0; } }
          @keyframes slideProgress { from { width: 100%; } to { width: 0%; } }
        `}</style>
      </div>

      {/* ── QUICK LINKS ─────────────────────────────────────── */}
      <div>
        <span className="z-label">Quick Access</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {QUICK.map(q => (
            <button key={q.key} onClick={() => onNavigate(q.key)}
              className="z-card z-card-hover"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", border: "1px solid var(--color-border)", background: "var(--color-card)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = q.color + "40"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: q.color + "16", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <q.icon size={14} color={q.color} />
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STATUS BOARD ────────────────────────────────────── */}
      <div>
        <span className="z-label">Status Board</span>
        <div className="z-card" style={{ overflow: "hidden" }}>
          {statuses.map((s, i) => {
            const st = statusStyle(s.status);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "13px 18px", borderBottom: i < statuses.length - 1 ? "1px solid var(--color-border)" : "none", gap: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 400, color: "var(--color-text)", flex: 1 }}>{s.area}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, background: st.bg, color: st.text, padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{s.status}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", minWidth: 36, textAlign: "right" }}>{s.prioritas}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TODAY'S FOCUS ────────────────────────────────────── */}
      <div>
        <span className="z-label">Today's Focus</span>
        <div className="z-card" style={{ padding: "14px 18px" }}>
          <EditableText
            value={data.dashboard.todayFocus}
            onChange={val => update(d => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))}
          />
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.04em" }}>
        Updated {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
