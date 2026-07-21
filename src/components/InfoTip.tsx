// ─── ZERØ COMMAND — InfoTip.tsx ───────────────────────────────────────────────
// Tooltip edukasi kecil ("?") untuk menjelaskan istilah finansial dunia
// (Net Worth, Runway, Savings Rate, CAGR, dst) — founder sedang belajar bahasa
// ekonomi sambil pakai app. Hover/tap untuk buka.

import { useState, useRef, useEffect } from "react";

export function InfoTip({ term, children }: { term?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        aria-label={term ? `Penjelasan ${term}` : "Penjelasan"}
        style={{
          width: 14, height: 14, borderRadius: "50%", marginLeft: 5, flexShrink: 0,
          border: "1px solid var(--color-border)", background: "var(--color-surface)",
          color: "var(--color-muted)", fontSize: 9, fontWeight: 700, lineHeight: 1,
          cursor: "help", display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-sans)", padding: 0,
        }}
      >
        ?
      </button>
      {open && (
        <span
          onMouseLeave={() => setOpen(false)}
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            width: 250, zIndex: 120, padding: "10px 12px", borderRadius: 10,
            background: "var(--tooltip-bg)", border: "1px solid var(--tooltip-border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
            fontFamily: "var(--font-sans)", fontSize: 11.5, lineHeight: 1.55,
            color: "var(--tooltip-text)", fontWeight: 400, letterSpacing: 0, textTransform: "none",
            whiteSpace: "normal", textAlign: "left", pointerEvents: "auto",
          }}
        >
          {term && <strong style={{ display: "block", marginBottom: 3, color: "var(--color-text)" }}>{term}</strong>}
          {children}
        </span>
      )}
    </span>
  );
}
