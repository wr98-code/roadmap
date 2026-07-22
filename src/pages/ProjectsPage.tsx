// ─── ZERØ COMMAND — ProjectsPage.tsx v2.0 "Terminal Registry" ────────────────
// Structural redesign: from floating left-border cards to an institutional
// terminal registry — flat panels joined by 1px hairline seams inside paneled
// slabs, dense project rows, mono uppercase micro-labels, tabular readouts.
// All PROJECTS data, links, handlers & content preserved. All colors are CSS
// vars so light AND dark themes work.

import { Github, Globe, DollarSign, Package } from "lucide-react";
import { Slab, Panel, SeamGrid, PanelHead, Badge, PageTitle, SEAM, tLabelStyle } from "@/components/terminal";

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

// ── Status chip (theme-aware tones) ──────────────────────────────────────────
function statusTone(status: Project["status"]): "gain" | "warning" | "accent" {
  if (status === "live") return "gain";
  if (status === "pending") return "warning";
  return "accent";
}

// ── Reusable link/meta chip (flat, hairline, mono) ───────────────────────────
const chipBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontSize: 11, fontFamily: "var(--font-mono)",
  padding: "3px 9px", borderRadius: 6, textDecoration: "none",
  whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
};

// ── ZONE 2: Dense project row (flat panel in a seam-grid list) ───────────────
function ProjectRow({ p }: { p: Project }) {
  return (
    <Panel style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {/* Header line: category dot · name · status */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, marginTop: 5, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)", letterSpacing: "0.04em" }}>
              {p.name}
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)", marginTop: 3, lineHeight: 1.4 }}>
              {p.tagline}
            </p>
          </div>
        </div>
        <Badge tone={statusTone(p.status)}>{p.statusLabel}</Badge>
      </div>

      {/* Meta line: live URL · repo · price */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingLeft: 15, minWidth: 0 }}>
        {/* Live URL */}
        {p.live ? (
          <a href={p.live} target="_blank" rel="noopener noreferrer" style={{
            ...chipBase,
            color: "var(--color-primary)",
            background: "var(--rail-active-bg)", border: "1px solid var(--rail-active-border)",
          }}>
            <Globe size={10} style={{ flexShrink: 0 }} />
            <span className="num" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.liveLabel}</span>
          </a>
        ) : (
          <span style={{
            ...chipBase,
            color: "var(--color-muted)",
            background: "var(--color-surface)", border: `1px solid ${SEAM}`,
          }}>
            <Globe size={10} style={{ flexShrink: 0 }} />
            <span className="num">{p.liveLabel || "—"}</span>
          </span>
        )}

        {/* GitHub */}
        {p.github ? (
          <a href={p.github} target="_blank" rel="noopener noreferrer" style={{
            ...chipBase,
            color: "var(--color-muted)",
            background: "var(--color-surface)", border: `1px solid ${SEAM}`,
          }}>
            <Github size={10} style={{ flexShrink: 0 }} />
            <span className="num" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.githubUser}/{p.name.toLowerCase().replace(/[øÃ\s]/g, (c) => c === " " ? "-" : "").replace("zerø", "zero").replace("ø", "o")}
            </span>
          </a>
        ) : (
          <span style={{
            ...chipBase,
            color: "var(--color-muted)", opacity: 0.5,
            background: "var(--color-surface)", border: `1px solid ${SEAM}`,
          }}>
            <Github size={10} style={{ flexShrink: 0 }} />
            repo —
          </span>
        )}

        {/* Price */}
        {p.price && p.price !== "—" && p.price !== "Internal" && (
          <span style={{
            ...chipBase,
            fontFamily: "var(--font-mono)", fontWeight: 600,
            color: "var(--gold)",
            background: "var(--color-surface)", border: `1px solid ${SEAM}`,
          }}>
            <DollarSign size={10} style={{ flexShrink: 0 }} />
            <span className="num">{p.price}</span>
          </span>
        )}
      </div>
    </Panel>
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

  const stats: { label: string; value: number; Icon: typeof Package; tint: string; valueColor: string }[] = [
    { label: "Total Projects", value: total, Icon: Package, tint: "var(--color-primary)", valueColor: "var(--color-text)" },
    { label: "Live",           value: live,  Icon: Globe,   tint: "var(--gain)",          valueColor: "var(--gain)" },
    { label: "GitHub Accounts", value: 2,    Icon: Github,  tint: "var(--color-muted)",   valueColor: "var(--color-text)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <PageTitle
        title="Project Registry"
        subtitle="All repos · domains · live URLs · one place"
        right={<Badge tone="accent">{total} PROJECTS · {live} LIVE</Badge>}
      />

      {/* Header stat triad — flat tiles joined by hairline seams */}
      <Slab>
        <SeamGrid cols="1fr 1fr 1fr">
          {stats.map(s => (
            <Panel key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: "var(--color-surface)", border: `1px solid ${SEAM}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <s.Icon size={15} color={s.tint} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: s.valueColor, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</p>
                <p style={{ ...tLabelStyle, marginTop: 5 }}>{s.label}</p>
              </div>
            </Panel>
          ))}
        </SeamGrid>
      </Slab>

      {/* Project groups — each a paneled slab, rows split by hairline seams */}
      {Object.entries(grouped).map(([gk, projects]) => {
        const liveCount = projects.filter(p => p.status === "live").length;
        return (
          <Slab key={gk}>
            <PanelHead
              title={GROUP_LABELS[gk] || gk}
              right={<span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--color-muted)" }}>{projects.length} · {liveCount} LIVE</span>}
            />
            <SeamGrid cols="1fr">
              {projects.map(p => <ProjectRow key={p.name} p={p} />)}
            </SeamGrid>
          </Slab>
        );
      })}

      {/* Footer status line */}
      <Slab>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", gap: 12, flexWrap: "wrap", background: "var(--glass-bg)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>ZERØ BUILD LAB · REGISTRY v1</span>
          <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.08em" }}>{new Date().toLocaleDateString("id-ID")}</span>
        </div>
      </Slab>

    </div>
  );
}
