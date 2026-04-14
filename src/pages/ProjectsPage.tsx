// ─── ZERØ COMMAND — ProjectsPage.tsx ─────────────────────────────────────────
// Project Registry · All repos, domains, and live URLs in one place

import { ExternalLink, Github, Globe, DollarSign, Package } from "lucide-react";

interface Project {
  name: string;
  tagline: string;
  live?: string;
  liveLabel?: string;
  github?: string;
  githubUser?: string;
  price?: string;
  status: "live" | "pending" | "wip";
  statusLabel: string;
  color: string;
  group: string;
}

const PROJECTS: Project[] = [
  // ── Crypto Tools
  {
    name: "ZERØ WATCH",
    tagline: "Multi-chain wallet monitor · whale alerts · push notif",
    live: "https://zero-watch-monitor.pages.dev",
    liveLabel: "zero-watch-monitor.pages.dev",
    github: "https://github.com/winduadiprabowo-pixel/zero-watch-monitor",
    githubUser: "winduadiprabowo-pixel",
    price: "$9 lifetime",
    status: "live",
    statusLabel: "Live ✅",
    color: "#6366f1",
    group: "crypto",
  },
  {
    name: "ZERØ SNIPER",
    tagline: "Solana new token scanner · rug risk scoring · DEX actions",
    live: "https://zerosniper.pages.dev",
    liveLabel: "zerosniper.pages.dev",
    github: "https://github.com/winduadiprabowo-pixel/zerosniper",
    githubUser: "winduadiprabowo-pixel",
    price: "$19 lifetime",
    status: "live",
    statusLabel: "Live ✅",
    color: "#10b981",
    group: "crypto",
  },
  {
    name: "ZERØ ORDER BOOK",
    tagline: "Multi-exchange order book · depth chart · liquidations",
    live: "https://zero-orderbook.pages.dev",
    liveLabel: "zero-orderbook.pages.dev",
    github: "https://github.com/winduadiprabowo-pixel/zero-orderbook",
    githubUser: "winduadiprabowo-pixel",
    price: "$9 lifetime",
    status: "live",
    statusLabel: "Live ✅",
    color: "#f59e0b",
    group: "crypto",
  },
  {
    name: "ZERØ MERIDIAN",
    tagline: "Trading intel platform · paywall pending",
    live: undefined,
    liveLabel: "—",
    github: undefined,
    price: "TBD",
    status: "pending",
    statusLabel: "Live ✅ · Paywall ⏳",
    color: "#ec4899",
    group: "crypto",
  },
  {
    name: "ZERØ COMMAND CENTER",
    tagline: "Personal war room · roadmap · keuangan · intel",
    live: undefined,
    liveLabel: "localhost / deploy pending",
    github: undefined,
    price: "Internal",
    status: "wip",
    statusLabel: "Internal 🛠",
    color: "#8b5cf6",
    group: "crypto",
  },
  // ── SPPG / MBG
  {
    name: "SPPG TOOLS",
    tagline: "Excel tools · Word templates · blog SEO · 24 artikel live",
    live: "https://sppgtools.my.id",
    liveLabel: "sppgtools.my.id",
    github: "https://github.com/wr98-code/zero-sppg",
    githubUser: "wr98-code",
    price: "Rp 99k/tool",
    status: "live",
    statusLabel: "Live ✅",
    color: "#3b82f6",
    group: "sppg",
  },
  {
    name: "DAPUR OS",
    tagline: "Manajemen SPPG · laporan · RAB · compliance BGN · Fase 1-8",
    live: "https://dapur.sppgtools.my.id",
    liveLabel: "dapur.sppgtools.my.id",
    github: "https://github.com/wr98-code/dapur-os",
    githubUser: "wr98-code",
    price: "SaaS / Trial 14 hari",
    status: "live",
    statusLabel: "Fase 1-8 ✅",
    color: "#22c55e",
    group: "sppg",
  },
  // ── Meta
  {
    name: "ZERØ Portfolio",
    tagline: "Full-stack dev portfolio · crypto tools showcase",
    live: "https://zeroid.pages.dev",
    liveLabel: "zeroid.pages.dev",
    github: undefined,
    price: "—",
    status: "live",
    statusLabel: "Live ✅",
    color: "#64748b",
    group: "meta",
  },
];

const GROUP_LABELS: Record<string, string> = {
  crypto: "⚡ Crypto Tools · github: winduadiprabowo-pixel",
  sppg:   "🍱 SPPG / MBG · github: wr98-code",
  meta:   "🌐 Meta / Brand",
};

function StatusBadge({ status, label }: { status: Project["status"]; label: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    live:    { bg: "#f0fdf4", color: "#15803d" },
    pending: { bg: "#fff7ed", color: "#c2410c" },
    wip:     { bg: "#f5f3ff", color: "#6d28d9" },
  };
  const s = styles[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)",
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <div className="z-card" style={{
      padding: "16px 20px",
      borderLeft: `3px solid ${p.color}`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
            color: "var(--color-text)", letterSpacing: "0.04em",
          }}>
            {p.name}
          </p>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: "var(--color-muted)", marginTop: 3,
          }}>
            {p.tagline}
          </p>
        </div>
        <StatusBadge status={p.status} label={p.statusLabel} />
      </div>

      {/* Links row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {/* Live URL */}
        {p.live ? (
          <a href={p.live} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "var(--font-mono)",
            color: p.color, textDecoration: "none",
            background: p.color + "12", border: `1px solid ${p.color}30`,
            padding: "3px 10px", borderRadius: 6,
          }}>
            <Globe size={10} />
            {p.liveLabel}
          </a>
        ) : (
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "var(--font-mono)",
            color: "var(--color-muted)",
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            padding: "3px 10px", borderRadius: 6,
          }}>
            <Globe size={10} />
            {p.liveLabel || "—"}
          </span>
        )}

        {/* GitHub */}
        {p.github ? (
          <a href={p.github} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "var(--font-mono)",
            color: "var(--color-muted)", textDecoration: "none",
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            padding: "3px 10px", borderRadius: 6,
          }}>
            <Github size={10} />
            {p.githubUser}/{p.name.toLowerCase().replace(/[øÃ\s]/g, (c) => c === " " ? "-" : "").replace("zerø", "zero").replace("ø", "o")}
          </a>
        ) : (
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "var(--font-mono)",
            color: "var(--color-muted)",
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            padding: "3px 10px", borderRadius: 6, opacity: 0.5,
          }}>
            <Github size={10} />
            repo —
          </span>
        )}

        {/* Price */}
        {p.price && p.price !== "—" && p.price !== "Internal" && (
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "var(--font-sans)", fontWeight: 600,
            color: "#d97706",
            background: "#fffbeb", border: "1px solid #fde68a",
            padding: "3px 10px", borderRadius: 6,
          }}>
            <DollarSign size={10} />
            {p.price}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const grouped = PROJECTS.reduce<Record<string, Project[]>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  const total = PROJECTS.length;
  const live = PROJECTS.filter(p => p.status === "live").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Total Projects", value: total, icon: Package, color: "#6366f1" },
          { label: "Live", value: live, icon: Globe, color: "#22c55e" },
          { label: "GitHub Accounts", value: 2, icon: Github, color: "#64748b" },
        ].map(s => (
          <div key={s.label} className="z-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: s.color + "18",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <s.icon size={15} color={s.color} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "var(--color-text)", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project groups */}
      {Object.entries(grouped).map(([gk, projects]) => (
        <div key={gk}>
          <span className="z-label" style={{ display: "block", marginBottom: 10 }}>
            {GROUP_LABELS[gk] || gk}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map(p => <ProjectCard key={p.name} p={p} />)}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: 10,
        color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.04em",
      }}>
        ZERØ BUILD LAB · registry v1 · {new Date().toLocaleDateString("id-ID")}
      </p>
    </div>
  );
}
