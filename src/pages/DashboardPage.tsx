// ─── ZERØ COMMAND — DashboardPage.tsx ────────────────────────────────────────
// Cinematic wallpaper · Glass cards · Linear-style premium · v4.0
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
  { photo: "photo-1486406146926-c627a92ad1ab", tag: "Vision",     quote: "Financial freedom is built in the hours others waste." },
  { photo: "photo-1512453979798-5ea266f8880c", tag: "Ambition",   quote: "Cities are built by those who refused to settle." },
  { photo: "photo-1470075801209-17f9ec0099cd", tag: "Discipline", quote: "While the world sleeps, you build your empire." },
  { photo: "photo-1497366216548-37526070297c", tag: "Clarity",    quote: "Clarity is the most underrated form of wealth." },
  { photo: "photo-1449824913935-59a10b8d2000", tag: "Growth",     quote: "Every sunrise is a new balance sheet." },
  { photo: "photo-1568992687947-868a62a9f521", tag: "Excellence", quote: "Precision is the language of the elite." },
  { photo: "photo-1600607687939-ce8a6c25118c", tag: "Abundance",  quote: "Scarcity is a mindset. Abundance is a decision." },
  { photo: "photo-1464082354059-27db6ce50048", tag: "Confidence", quote: "The ocean doesn't apologize for its depth." },
];

const QUICK = [
  { key: "build-lab", label: "Build Lab",  icon: Zap,        color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  { key: "trading",   label: "Trading",    icon: TrendingUp, color: "#10b981", glow: "rgba(16,185,129,0.15)" },
  { key: "crypto",    label: "Crypto",     icon: Globe,      color: "#6366f1", glow: "rgba(99,102,241,0.15)" },
  { key: "roadmap",   label: "Roadmap",    icon: Calendar,   color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  { key: "keuangan",  label: "Keuangan",   icon: DollarSign, color: "#ec4899", glow: "rgba(236,72,153,0.15)" },
  { key: "personal",  label: "Personal",   icon: User,       color: "#8b5cf6", glow: "rgba(139,92,246,0.15)" },
];

function statusStyle(s: string) {
  if (s.includes("AKTIF"))    return { dot: "#22c55e", bg: "rgba(34,197,94,0.1)",  text: "#15803d" };
  if (s.includes("✅"))       return { dot: "#3b82f6", bg: "rgba(59,130,246,0.1)", text: "#1d4ed8" };
  if (s.includes("CRITICAL")) return { dot: "#ef4444", bg: "rgba(239,68,68,0.1)",  text: "#dc2626" };
  return { dot: "#9ca3af", bg: "rgba(156,163,175,0.1)", text: "#6b7280" };
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
    setTimeout(() => { setPrev(null); setBusy(false); }, 900);
  };

  useEffect(() => {
    const id = setInterval(() => goTo((cur + 1) % SLIDES.length), 10000);
    return () => clearInterval(id);
  }, [cur]);

  const slide = SLIDES[cur];
  const statuses = data.buildLab.statusBoard;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── CINEMATIC HERO SLIDESHOW ──────────────────────────── */}
      <div style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        height: 340,
        background: "#04040a",
        // Subtle border highlight — luxury signature
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.18)",
      }}>

        {/* Prev slide fades out */}
        {prev !== null && (
          <div key={`prev-${prev}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: "heroCrossFadeOut 0.9s cubic-bezier(0.4,0,0.2,1) forwards" }}>
            <img
              src={`https://images.unsplash.com/${SLIDES[prev].photo}?auto=format&fit=crop&w=1600&q=85`}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.38) saturate(1.2)" }}
            />
          </div>
        )}

        {/* Current slide fades in with subtle zoom */}
        <div key={`cur-${cur}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: "heroCrossFadeIn 0.9s cubic-bezier(0.4,0,0.2,1) forwards" }}>
          <img
            src={`https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=1600&q=85`}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.38) saturate(1.2)", animation: "heroKenBurns 11s ease-out forwards" }}
          />
        </div>

        {/* Multi-layer cinematic overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          background: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.05) 100%)",
        }} />
        {/* Side vignette */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          background: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)",
        }} />

        {/* ── UI CONTENT LAYER ── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 26px 22px" }}>

          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
            }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            {/* Tag pill — glass */}
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              padding: "3px 12px", borderRadius: 20,
            }}>
              {slide.tag}
            </span>
          </div>

          {/* Bottom: quote + controls */}
          <div>
            {/* Quote */}
            <p style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 23,
              fontWeight: 400,
              color: "rgba(255,255,255,0.93)",
              lineHeight: 1.38,
              letterSpacing: "-0.015em",
              maxWidth: 540,
              marginBottom: 20,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}>
              "{slide.quote}"
            </p>

            {/* Dots + progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === cur ? 22 : 5,
                    height: 4,
                    borderRadius: 2,
                    background: i === cur ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                    flexShrink: 0,
                  }}
                />
              ))}
              <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 1, overflow: "hidden", marginLeft: 10 }}>
                <div
                  key={cur}
                  style={{ height: "100%", background: "rgba(255,255,255,0.35)", borderRadius: 1, animation: "slideProgress 10s linear forwards" }}
                />
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes heroCrossFadeIn  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes heroCrossFadeOut { from { opacity: 1; } to { opacity: 0; } }
          @keyframes slideProgress    { from { width: 100%; } to { width: 0%; } }
          @keyframes heroKenBurns     { from { transform: scale(1); } to { transform: scale(1.04); } }
        `}</style>
      </div>

      {/* ── QUICK ACCESS — glass cards ───────────────────────── */}
      <div>
        <span className="z-label">Quick Access</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {QUICK.map(q => (
            <button
              key={q.key}
              onClick={() => onNavigate(q.key)}
              className="z-card-hover"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px",
                cursor: "pointer",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = q.glow;
                el.style.borderColor = q.color + "50";
                el.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px ${q.glow}`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.65)";
                el.style.borderColor = "rgba(255,255,255,0.7)";
                el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.05)";
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: q.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <q.icon size={14} color={q.color} />
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
                {q.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STATUS BOARD — glass card ─────────────────────────── */}
      <div>
        <span className="z-label">Status Board</span>
        <div style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}>
          {statuses.map((s, i) => {
            const st = statusStyle(s.status);
            return (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "13px 18px",
                  borderBottom: i < statuses.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  gap: 14,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0, boxShadow: `0 0 6px ${st.dot}80` }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 400, color: "var(--color-text)", flex: 1 }}>
                  {s.area}
                </span>
                <span style={{
                  fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
                  background: st.bg, color: st.text,
                  padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap",
                  backdropFilter: "blur(4px)",
                }}>
                  {s.status}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", minWidth: 36, textAlign: "right" }}>
                  {s.prioritas}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TODAY'S FOCUS — glass card ────────────────────────── */}
      <div>
        <span className="z-label">Today's Focus</span>
        <div style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.05)",
          padding: "14px 18px",
        }}>
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
