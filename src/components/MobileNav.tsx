// ─── ZERØ COMMAND — MobileNav.tsx ─────────────────────────────────────────────
// Mobile is its own philosophy, not a shrunken desktop (DESIGN_DIRECTION.md).
// A floating pill bar sits in the thumb zone with the four places you actually
// open every day; "Semua" lifts a bottom sheet holding every section, so no
// navigation is lost — it just moves somewhere your thumb can reach.
//
// Safe-area aware, 44px+ tap targets, sheet physics on the Atelier motion scale.

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface NavSection {
  key: string;
  Icon: React.ComponentType<{ size?: number | string; color?: string }>;
  title: string;
  group: string;
}

/** The four daily destinations + the sheet trigger. */
const PRIMARY = ["dashboard", "my-day", "wealth", "intel"];

export function MobileNav({
  sections, active, onNavigate,
}: { sections: NavSection[]; active: string; onNavigate: (k: string) => void }) {
  const [sheet, setSheet] = useState(false);

  // Close on Escape, and lock body scroll while the sheet is up
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [sheet]);

  const primary = PRIMARY
    .map(k => sections.find(s => s.key === k))
    .filter((s): s is NavSection => !!s);

  const go = (k: string) => { onNavigate(k); setSheet(false); };
  const moreActive = !PRIMARY.includes(active);

  const item = (isOn: boolean): React.CSSProperties => ({
    flex: 1, minWidth: 0, height: 52,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
    background: "transparent", border: "none", cursor: "pointer", padding: 0,
    color: isOn ? "var(--color-primary)" : "var(--color-muted)",
    transition: "color var(--dur-fast) var(--ease-out)",
    WebkitTapHighlightColor: "transparent",
  });
  const label = (isOn: boolean): React.CSSProperties => ({
    fontSize: 10.5, fontWeight: isOn ? 700 : 500, letterSpacing: "0.01em",
    maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  });

  return (
    <>
      {/* ── Floating pill bar ─────────────────────────────────────────────── */}
      <nav
        aria-label="Navigasi utama"
        style={{
          position: "fixed", left: 12, right: 12, zIndex: 90,
          bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          display: "flex", alignItems: "center",
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: 999,
          boxShadow: "var(--card-shadow-hover)",
          backdropFilter: "blur(18px) saturate(130%)",
          WebkitBackdropFilter: "blur(18px) saturate(130%)",
          padding: "4px 6px",
        }}
      >
        {primary.map(s => {
          const on = active === s.key;
          return (
            <button key={s.key} onClick={() => go(s.key)} style={item(on)} aria-current={on ? "page" : undefined}>
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 26, borderRadius: 999,
                background: on ? "var(--rail-active-bg)" : "transparent",
                transition: "background var(--dur-fast) var(--ease-out)",
              }}>
                <s.Icon size={17} color={on ? "var(--color-primary)" : "var(--color-muted)"} />
              </span>
              <span style={label(on)}>{s.title}</span>
            </button>
          );
        })}

        <button onClick={() => setSheet(true)} style={item(moreActive)} aria-haspopup="dialog" aria-expanded={sheet}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 26, borderRadius: 999,
            background: moreActive ? "var(--rail-active-bg)" : "transparent",
          }}>
            {/* grid glyph */}
            <span style={{ display: "grid", gridTemplateColumns: "repeat(2, 4px)", gap: 3 }}>
              {[0, 1, 2, 3].map(i => (
                <span key={i} style={{ width: 4, height: 4, borderRadius: 1.5, background: moreActive ? "var(--color-primary)" : "var(--color-muted)" }} />
              ))}
            </span>
          </span>
          <span style={label(moreActive)}>Semua</span>
        </button>
      </nav>

      {/* ── Bottom sheet: every section ───────────────────────────────────── */}
      {sheet && (
        <div
          role="dialog" aria-modal="true" aria-label="Semua halaman"
          onClick={() => setSheet(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(27,24,21,0.5)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "flex-end",
            animation: "fadeIn var(--dur-med) var(--ease-out) both",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxHeight: "82vh", overflowY: "auto",
              background: "var(--color-bg)",
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              borderTop: "1px solid var(--glass-border)",
              boxShadow: "0 -18px 48px rgba(0,0,0,0.28)",
              padding: "10px 16px calc(22px + env(safe-area-inset-bottom, 0px))",
              animation: "sheetUp var(--dur-slow) var(--ease-soft) both",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* grab handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 12px" }}>
              <span style={{ width: 40, height: 4, borderRadius: 999, background: "var(--color-border)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
                Semua halaman
              </span>
              <button onClick={() => setSheet(false)} aria-label="Tutup"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="keep-grid">
              {sections.map(s => {
                const on = active === s.key;
                return (
                  <button key={s.key} onClick={() => go(s.key)}
                    style={{
                      minHeight: 86, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "12px 6px", borderRadius: 18, cursor: "pointer",
                      background: on ? "var(--rail-active-bg)" : "var(--glass-bg)",
                      border: `1px solid ${on ? "var(--rail-active-border)" : "var(--glass-border)"}`,
                      color: on ? "var(--color-primary)" : "var(--color-text)",
                      WebkitTapHighlightColor: "transparent",
                    }}>
                    <s.Icon size={20} color={on ? "var(--color-primary)" : "var(--color-muted)"} />
                    <span style={{ fontSize: 12, fontWeight: on ? 700 : 500, textAlign: "center", lineHeight: 1.25 }}>{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
