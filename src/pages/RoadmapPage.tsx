// ─── ZERØ COMMAND — RoadmapPage.tsx v9.0 "Terminal Slab" ─────────────────────
// Institutional restructure: from floating rounded cards → flat paneled slabs
// joined by 1px hairline seams (no radius/shadow/glow/tints/gaps). Dense rows,
// mono uppercase micro-labels, right-aligned tabular numerals. All colors are
// CSS variables so light AND dark themes work. Progress math, all 3 tabs,
// accordions, CheckList/EditableText/NotesList wiring & update() preserved.
import { useState, useMemo } from "react";
import { AppData } from "@/lib/store";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Slab, Panel, SeamGrid, PanelHead, Badge, tLabelStyle, SEAM } from "@/components/terminal";
import { Target, Calendar, TrendingUp, Flag, Clock } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── SPRINT PHASES ─────────────────────────────────────────────────────────────
// `color` = decorative category accent (semantically distinct per phase).
const PHASES = [
  { key: "minggu12", label: "Minggu 1–2", subtitle: "Cari Klien Aktif", icon: "🎯", color: "#5b8def",        duration: "2 minggu" },
  { key: "minggu34", label: "Minggu 3–4", subtitle: "Monetisasi",       icon: "💰", color: "var(--gain)",     duration: "2 minggu" },
  { key: "bulan2",   label: "Bulan 2",    subtitle: "Scale",            icon: "🚀", color: "#9a86d4",         duration: "1 bulan" },
  { key: "bulan3",   label: "Bulan 3",    subtitle: "Stabilisasi",      icon: "🛡️", color: "var(--warning)",  duration: "1 bulan" },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];

// ─── 5 YEAR MILESTONES ────────────────────────────────────────────────────────
const YEAR_MILESTONES = [
  { year: 1, label: "Stabilisasi Income",  target: "$2K/bulan",  icon: "🌱", color: "var(--gain)" },
  { year: 2, label: "Scale Zero Build Lab", target: "$5K/bulan", icon: "⚡", color: "#5b8def" },
  { year: 3, label: "Tim Kecil",            target: "$10K/bulan", icon: "👥", color: "#9a86d4" },
  { year: 4, label: "Product-Led Growth",   target: "SaaS",      icon: "📦", color: "var(--warning)" },
  { year: 5, label: "Financial Freedom",    target: "Bebas",     icon: "🏆", color: "var(--gold)" },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function RoadmapPage({ data, update }: Props) {
  const r = data.roadmap;
  const [activeTab, setActiveTab] = useState<"sprint" | "vision" | "milestones">("sprint");
  const [expandedPhase, setExpandedPhase] = useState<PhaseKey | null>("minggu12");

  // Compute overall 90-day progress
  const allItems = useMemo(() => {
    return [
      ...r.minggu12,
      ...r.minggu34,
      ...r.bulan2,
      ...r.bulan3,
    ];
  }, [r.minggu12, r.minggu34, r.bulan2, r.bulan3]);

  const doneCount = allItems.filter((i) => i.checked).length;
  const totalCount = allItems.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const getPhaseItems = (key: PhaseKey) => {
    switch (key) {
      case "minggu12": return r.minggu12;
      case "minggu34": return r.minggu34;
      case "bulan2":   return r.bulan2;
      case "bulan3":   return r.bulan3;
    }
  };

  const getPhaseProgress = (key: PhaseKey) => {
    const items = getPhaseItems(key);
    if (items.length === 0) return 0;
    return Math.round((items.filter((i) => i.checked).length / items.length) * 100);
  };

  const updatePhaseItems = (key: PhaseKey, items: any[]) => {
    update((d) => ({ ...d, roadmap: { ...d.roadmap, [key]: items } }));
  };

  // ── Terminal tab styling (active = primary on rail-active; inactive = muted on surface)
  const tabStyle = (t: string): React.CSSProperties => {
    const on = activeTab === t;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "7px 13px",
      borderRadius: 7,
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      border: `1px solid ${on ? "var(--rail-active-border)" : "var(--color-border)"}`,
      cursor: "pointer",
      background: on ? "var(--rail-active-bg)" : "var(--color-surface)",
      color: on ? "var(--color-primary)" : "var(--color-muted)",
      transition: "all 0.15s var(--ease-out)",
    };
  };

  const monoNum = (size: number, weight: number, color: string): React.CSSProperties => ({
    fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
    fontSize: size, fontWeight: weight, color,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Tab function bar ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={tabStyle("sprint")} onClick={() => setActiveTab("sprint")}>🎯 90 Hari Sprint</button>
        <button style={tabStyle("milestones")} onClick={() => setActiveTab("milestones")}>🗓️ Milestones</button>
        <button style={tabStyle("vision")} onClick={() => setActiveTab("vision")}>🌟 5 Tahun Vision</button>
      </div>

      {/* ── SPRINT TAB ── */}
      {activeTab === "sprint" && (
        <>
          {/* Overall Progress slab */}
          <Slab>
            <PanelHead
              title={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Target size={11} color="var(--color-muted)" /> 90-Day Sprint Progress</span>}
              right={<Badge tone="accent">{doneCount}/{totalCount} DONE</Badge>}
            />
            {/* Headline completion */}
            <Panel style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={tLabelStyle}>Overall Completion</span>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)", margin: "6px 0 0" }}>
                    {doneCount} dari {totalCount} tasks selesai
                  </p>
                </div>
                <span className="num" style={{ ...monoNum(34, 700, "var(--color-primary)"), lineHeight: 1, letterSpacing: "-0.02em", flexShrink: 0 }}>
                  {progressPct}%
                </span>
              </div>
              <div style={{ height: 8, background: "var(--color-surface)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--color-primary)", borderRadius: 4, transition: "width 0.5s var(--ease-out)" }} />
              </div>
            </Panel>

            {/* Phase mini readouts — hairline-seamed grid */}
            <SeamGrid cols="1fr 1fr 1fr 1fr" style={{ borderTop: `1px solid ${SEAM}` }}>
              {PHASES.map((phase) => {
                const pct = getPhaseProgress(phase.key);
                return (
                  <Panel key={phase.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                      <span style={tLabelStyle}>{phase.label}</span>
                      <span className="num" style={{ ...monoNum(12, 700, phase.color), flexShrink: 0 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: phase.color, borderRadius: 2, transition: "width 0.5s var(--ease-out)" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-muted)" }}>{phase.subtitle}</span>
                  </Panel>
                );
              })}
            </SeamGrid>
          </Slab>

          {/* Phase accordion — one slab, hairline-seamed rows */}
          <Slab>
            <PanelHead
              title={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Flag size={11} color="var(--color-muted)" /> Execution Phases</span>}
              right={<Badge tone="muted">{progressPct}% COMPLETE</Badge>}
            />
            {PHASES.map((phase, idx) => {
              const isOpen = expandedPhase === phase.key;
              const pct = getPhaseProgress(phase.key);
              const items = getPhaseItems(phase.key);
              const done = items.filter((i) => i.checked).length;

              return (
                <div key={phase.key}>
                  {/* Phase header row */}
                  <button
                    onClick={() => setExpandedPhase(isOpen ? null : phase.key)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 16px",
                      background: isOpen ? "var(--color-surface)" : "var(--glass-bg)",
                      border: "none",
                      borderTop: idx > 0 ? `1px solid ${SEAM}` : "none",
                      borderLeft: `2px solid ${isOpen ? phase.color : "transparent"}`,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s var(--ease-out)",
                    }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{phase.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--color-text)", margin: 0, letterSpacing: "-0.01em" }}>
                        {phase.label} — {phase.subtitle}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <div style={{ flex: 1, height: 3, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: phase.color, borderRadius: 2, transition: "width 0.4s var(--ease-out)" }} />
                        </div>
                        <span className="num" style={{ ...monoNum(10.5, 700, phase.color), flexShrink: 0 }}>
                          {done}/{items.length}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        <Clock size={10} color="var(--color-muted)" /> {phase.duration}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--color-muted)", transition: "transform 0.2s var(--ease-out)", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Phase content */}
                  {isOpen && (
                    <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${SEAM}`, borderLeft: `2px solid ${phase.color}`, background: "var(--color-surface)" }}>
                      <CheckList
                        items={items}
                        onChange={(updated) => updatePhaseItems(phase.key, updated)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </Slab>
        </>
      )}

      {/* ── MILESTONES TAB ── */}
      {activeTab === "milestones" && (
        <Slab>
          <PanelHead title={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Calendar size={11} color="var(--color-muted)" /> Key Milestones · Timeline</span>} />
          <Panel>
            <div style={{ position: "relative", paddingLeft: 24 }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute",
                left: 7,
                top: 8,
                bottom: 8,
                width: 2,
                background: "var(--color-border)",
                borderRadius: 1,
              }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { phase: "Minggu 1-2", label: "Apply 5-10 jobs/hari", icon: "📨", color: "#5b8def", done: r.minggu12.some(i => i.checked) },
                  { phase: "Minggu 1-2", label: "1-2 bounty pertama dari Dework", icon: "🏆", color: "#5b8def", done: r.minggu12.filter(i => i.checked).length >= 4 },
                  { phase: "Minggu 3-4", label: "Setup payment link (Gumroad/LemonSqueezy)", icon: "💳", color: "var(--gain)", done: r.minggu34.some(i => i.checked) },
                  { phase: "Minggu 3-4", label: "Soft launch ke komunitas trader", icon: "🚀", color: "var(--gain)", done: r.minggu34.filter(i => i.checked).length >= 2 },
                  { phase: "Bulan 2", label: "1 klien aktif ATAU 20 subscriber PRO", icon: "👤", color: "#9a86d4", done: r.bulan2.some(i => i.checked) },
                  { phase: "Bulan 2", label: "Stripe payment fiat live", icon: "💰", color: "#9a86d4", done: r.bulan2.filter(i => i.checked).length >= 2 },
                  { phase: "Bulan 3", label: "Emergency savings 1 bulan", icon: "🛡️", color: "var(--warning)", done: r.bulan3.some(i => i.checked) },
                  { phase: "Bulan 3", label: "Zero Build Lab sebagai brand serius", icon: "🌐", color: "var(--warning)", done: r.bulan3.filter(i => i.checked).length >= 2 },
                ].map((m, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
                    {/* Status dot: done = gain, pending = hollow */}
                    <div style={{
                      position: "absolute",
                      left: -24,
                      top: 2,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: m.done ? "var(--gain-soft)" : "var(--color-surface)",
                      border: `1.5px solid ${m.done ? "var(--gain)" : "var(--color-border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      flexShrink: 0,
                    }}>
                      {m.done && <span style={{ color: "var(--gain)", fontWeight: 700 }}>✓</span>}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: m.color, fontWeight: 700, margin: "0 0 3px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        {m.phase}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{m.icon}</span>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: m.done ? "var(--color-text)" : "var(--color-muted)", margin: 0, fontWeight: m.done ? 600 : 400 }}>
                          {m.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </Slab>
      )}

      {/* ── VISION TAB ── */}
      {activeTab === "vision" && (
        <>
          {/* 5-Year timeline slab */}
          <Slab>
            <PanelHead title={<span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><TrendingUp size={11} color="var(--color-muted)" /> Roadmap 5 Tahun · ZERØ Empire</span>} />
            <SeamGrid cols="1fr">
              {YEAR_MILESTONES.map((m) => (
                <Panel key={m.year} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "var(--color-surface)",
                    border: `1px solid ${SEAM}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 19 }}>{m.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: m.color, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      Tahun {m.year}
                    </span>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: "3px 0 0", letterSpacing: "-0.01em" }}>{m.label}</p>
                  </div>
                  <span className="num" style={{
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 12,
                    fontWeight: 700,
                    color: m.color,
                    background: "var(--color-surface)",
                    border: `1px solid ${SEAM}`,
                    padding: "5px 11px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}>{m.target}</span>
                </Panel>
              ))}
            </SeamGrid>
          </Slab>

          {/* Editable long-term vision */}
          <Slab>
            <PanelHead title="Vision Statement · Versi Lu" />
            <Panel>
              <EditableText
                value={r.roadmap5tahun}
                onChange={(val) => update((d) => ({ ...d, roadmap: { ...d.roadmap, roadmap5tahun: val } }))}
              />
            </Panel>
          </Slab>
        </>
      )}

      {/* Notes */}
      <Slab>
        <PanelHead title="Notes" />
        <Panel>
          <NotesList
            notes={r.notes}
            onChange={(notes) => update((d) => ({ ...d, roadmap: { ...d.roadmap, notes } }))}
          />
        </Panel>
      </Slab>
    </div>
  );
}
