// ─── ZERØ COMMAND — shared surface primitives · "ATELIER" ─────────────────────
// These were the institutional terminal primitives (hairline seams, mono
// micro-labels, flat panels). They now speak the Atelier language instead:
// soft geometry, warm elevation, generous padding, display type — see
// DESIGN_DIRECTION.md.
//
// The export names and prop signatures are deliberately UNCHANGED, so every
// page that imports them shifts to the new language at once, with no edits.
//
//   <Slab>                        soft card (the outer surface)
//     <PanelHead title=… right=…> section header, display-adjacent eyebrow
//     <SeamGrid cols="1fr 1fr">   gapped grid (no more 1px seams)
//       <Panel>…</Panel>          soft inner tile
//
// Theme-aware: every colour is a CSS variable, so light and dark both work.

import React from "react";

/** Kept for pages that draw their own separators — now a warm, quiet line. */
export const SEAM = "var(--color-border)";

// ── Style objects ─────────────────────────────────────────────────────────────
export const tSlabStyle: React.CSSProperties = {
  background: "var(--glass-bg)",
  border: "1px solid var(--glass-border)",
  borderRadius: 22,
  boxShadow: "var(--card-shadow), var(--card-inset)",
  overflow: "hidden",
};
export const tPanelStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: 16,
  padding: "16px 18px",
  minWidth: 0,
};
export const tLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "var(--color-muted)",
};
export const tNumStyle: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  color: "var(--color-text)",
};
/** Display face for figures and headlines. */
export const tDisplayStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontOpticalSizing: "auto",
  fontVariationSettings: "'SOFT' 32, 'WONK' 1",
  letterSpacing: "-0.025em",
  lineHeight: 1.05,
};

// ── Slab: the outer soft card ─────────────────────────────────────────────────
export function Slab({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...tSlabStyle, ...style }}>{children}</div>;
}

// ── PanelHead: section header. Space separates — no hairline rule. ────────────
export function PanelHead({ title, right, style }: { title: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 20px 12px", ...style }}>
      <span style={tLabelStyle}>{title}</span>
      {right}
    </div>
  );
}

// ── Panel: a soft inner tile ──────────────────────────────────────────────────
export function Panel({ children, style, onClick, className }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; className?: string }) {
  return <div className={className} onClick={onClick} style={{ ...tPanelStyle, ...style }}>{children}</div>;
}

// ── SeamGrid: gapped grid of soft tiles (was: 1px seam grid) ─────────────────
export function SeamGrid({ cols, children, style }: { cols: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "0 16px 16px", ...style }}>
      {children}
    </div>
  );
}

// ── Divider: a quiet warm line, used sparingly ───────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: "var(--color-border)", margin: "2px 20px" }} />;
}

// ── Field: label ……… value ───────────────────────────────────────────────────
export function Field({ label, value, valueColor }: { label: React.ReactNode; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 14, color: "var(--color-muted)", minWidth: 0 }}>{label}</span>
      <span className="num" style={{ ...tNumStyle, fontSize: 15, fontWeight: 600, color: valueColor || "var(--color-text)", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

// ── Badge: soft pill ─────────────────────────────────────────────────────────
export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "gain" | "loss" | "warning" | "accent" }) {
  const map: Record<string, { c: string; bg: string }> = {
    muted:   { c: "var(--color-muted)", bg: "var(--color-surface)" },
    gain:    { c: "var(--gain)", bg: "var(--gain-soft)" },
    loss:    { c: "var(--loss)", bg: "var(--loss-soft)" },
    warning: { c: "var(--warning)", bg: "var(--color-surface)" },
    accent:  { c: "var(--color-primary)", bg: "var(--rail-active-bg)" },
  };
  const s = map[tone] || map.muted;
  return (
    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", color: s.c, background: s.bg, padding: "4px 11px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ── Stat: a readout tile — the figure gets the display face ──────────────────
export function Stat({ label, value, sub, tint, right }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; tint?: string; right?: React.ReactNode }) {
  return (
    <div style={{ ...tPanelStyle, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={tLabelStyle}>{label}</span>
        {right}
      </div>
      <span className="num" style={{ ...tDisplayStyle, fontSize: 26, fontWeight: 600, color: tint || "var(--color-text)" }}>{value}</span>
      {sub && <span style={{ fontSize: 12.5, color: "var(--color-muted)" }}>{sub}</span>}
    </div>
  );
}

// ── PageTitle: every page opens in the display face ──────────────────────────
export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
      <div>
        <h1 style={{ ...tDisplayStyle, fontSize: "clamp(26px, 3.2vw, 36px)", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ ...tLabelStyle, margin: "8px 0 0" }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
