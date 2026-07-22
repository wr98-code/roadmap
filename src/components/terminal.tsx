// ─── ZERØ COMMAND — terminal.tsx ──────────────────────────────────────────────
// Shared institutional "terminal" primitives. Theme-aware (all colors are CSS
// vars, so they work in light AND dark automatically). Use these across pages
// for consistent Bloomberg/wealth-terminal precision:
//   - flat paneled SLABS with hairline SEAMS (no floating cards / radius / glow)
//   - dense rows, mono uppercase micro-labels, right-aligned tabular numerals
//
// Usage:
//   <Slab>
//     <PanelHead title="Section" right={<Badge>3 aktif</Badge>} />
//     <SeamGrid cols="1.6fr 1fr">
//       <Panel>…</Panel>
//       <Panel>…</Panel>
//     </SeamGrid>
//   </Slab>

import React from "react";

export const SEAM = "var(--color-border)";

// ── Style objects (spread into inline style) ──────────────────────────────────
export const tSlabStyle: React.CSSProperties = {
  border: `1px solid ${SEAM}`, borderRadius: 10, overflow: "hidden",
  background: "var(--glass-bg)", boxShadow: "var(--card-shadow)",
};
export const tPanelStyle: React.CSSProperties = {
  background: "var(--glass-bg)", padding: "14px 16px", minWidth: 0,
};
export const tLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-muted)",
};
export const tNumStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--color-text)",
};

// ── Slab: the outer paneled container ─────────────────────────────────────────
export function Slab({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...tSlabStyle, ...style }}>{children}</div>;
}

// ── PanelHead: hairline-underlined section header (mono label + right slot) ────
export function PanelHead({ title, right, style }: { title: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: `1px solid ${SEAM}`, gap: 12, ...style }}>
      <span style={tLabelStyle}>{title}</span>
      {right}
    </div>
  );
}

// ── Panel: a flat cell (fills its seam-grid cell) ─────────────────────────────
export function Panel({ children, style, onClick, className }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; className?: string }) {
  return <div className={className} onClick={onClick} style={{ ...tPanelStyle, ...style }}>{children}</div>;
}

// ── SeamGrid: columns separated by 1px hairline seams ─────────────────────────
export function SeamGrid({ cols, children, style }: { cols: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 1, background: SEAM, ...style }}>{children}</div>;
}

// ── Divider: full-width hairline ──────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: SEAM }} />;
}

// ── Field: label ……… value dense row ─────────────────────────────────────────
export function Field({ label, value, valueColor }: { label: React.ReactNode; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${SEAM}`, gap: 12 }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)", minWidth: 0 }}>{label}</span>
      <span style={{ ...tNumStyle, fontSize: 13, fontWeight: 600, color: valueColor || "var(--color-text)", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

// ── Badge: small status chip ──────────────────────────────────────────────────
export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "gain" | "loss" | "warning" | "accent" }) {
  const map: Record<string, { c: string; bg: string }> = {
    muted:   { c: "var(--color-muted)", bg: "var(--color-surface)" },
    gain:    { c: "var(--gain)", bg: "var(--gain-soft)" },
    loss:    { c: "var(--loss)", bg: "var(--loss-soft)" },
    warning: { c: "var(--warning)", bg: "rgba(224,162,49,0.12)" },
    accent:  { c: "var(--color-primary)", bg: "var(--rail-active-bg)" },
  };
  const s = map[tone] || map.muted;
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: s.c, background: s.bg, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ── Stat: KPI readout tile (label · big tabular value · optional sub) ─────────
export function Stat({ label, value, sub, tint, right }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; tint?: string; right?: React.ReactNode }) {
  return (
    <div style={{ ...tPanelStyle, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={tLabelStyle}>{label}</span>
        {right}
      </div>
      <span style={{ ...tNumStyle, fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", color: tint || "var(--color-text)" }}>{value}</span>
      {sub && <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-muted)" }}>{sub}</span>}
    </div>
  );
}

// ── PageTitle: consistent page heading ────────────────────────────────────────
export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 19, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.02em", margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", margin: "4px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
