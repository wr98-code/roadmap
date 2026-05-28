// ─── ZERØ COMMAND — RoadmapPage.tsx ──────────────────────────────────────────
// 90-day sprint roadmap + 5-year vision with visual progress tracker
import { useState, useMemo } from "react";
import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Target, Calendar, TrendingUp, Flag, Clock } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── SPRINT PHASES ─────────────────────────────────────────────────────────────
const PHASES = [
  { key: "minggu12", label: "Minggu 1–2", subtitle: "Cari Klien Aktif", icon: "🎯", color: "#3b82f6", colorBg: "#3b82f615", duration: "2 minggu" },
  { key: "minggu34", label: "Minggu 3–4", subtitle: "Monetisasi", icon: "💰", color: "#22c55e", colorBg: "#22c55e15", duration: "2 minggu" },
  { key: "bulan2",   label: "Bulan 2",    subtitle: "Scale",      icon: "🚀", color: "#8b5cf6", colorBg: "#8b5cf615", duration: "1 bulan" },
  { key: "bulan3",   label: "Bulan 3",    subtitle: "Stabilisasi",icon: "🛡️", color: "#f59e0b", colorBg: "#f59e0b15", duration: "1 bulan" },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];

// ─── 5 YEAR MILESTONES ────────────────────────────────────────────────────────
const YEAR_MILESTONES = [
  { year: 1, label: "Stabilisasi Income",  target: "$2K/bulan",  icon: "🌱", color: "#22c55e" },
  { year: 2, label: "Scale Zero Build Lab", target: "$5K/bulan", icon: "⚡", color: "#3b82f6" },
  { year: 3, label: "Tim Kecil",            target: "$10K/bulan", icon: "👥", color: "#8b5cf6" },
  { year: 4, label: "Product-Led Growth",   target: "SaaS",      icon: "📦", color: "#f59e0b" },
  { year: 5, label: "Financial Freedom",    target: "Bebas",     icon: "🏆", color: "#ef4444" },
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

  const tabStyle = (t: string) => ({
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    border: "none",
    cursor: "pointer",
    background: activeTab === t ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)",
    color: activeTab === t ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
    transition: "all 0.15s",
  } as React.CSSProperties);

  return (
    <div className="space-y-5">

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={tabStyle("sprint")} onClick={() => setActiveTab("sprint")}>🎯 90 Hari Sprint</button>
        <button style={tabStyle("milestones")} onClick={() => setActiveTab("milestones")}>🗓️ Milestones</button>
        <button style={tabStyle("vision")} onClick={() => setActiveTab("vision")}>🌟 5 Tahun Vision</button>
      </div>

      {/* ── SPRINT TAB ── */}
      {activeTab === "sprint" && (
        <>
          {/* Overall Progress */}
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 14,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>90 Hari Sprint Progress</p>
                <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "3px 0 0" }}>
                  {doneCount} dari {totalCount} tasks selesai
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-mono)", color: "hsl(var(--primary))", margin: 0, lineHeight: 1 }}>
                  {progressPct}%
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 8, background: "hsl(var(--muted) / 0.5)", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            {/* Phase mini bars */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 12 }}>
              {PHASES.map((phase) => {
                const pct = getPhaseProgress(phase.key);
                return (
                  <div key={phase.key} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", margin: "0 0 3px" }}>
                      {phase.label.toUpperCase()}
                    </p>
                    <div style={{ height: 4, background: "hsl(var(--muted) / 0.5)", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: phase.color,
                          borderRadius: 2,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 10, color: phase.color, fontWeight: 700, margin: "3px 0 0" }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase Cards — Accordion */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PHASES.map((phase) => {
              const isOpen = expandedPhase === phase.key;
              const pct = getPhaseProgress(phase.key);
              const items = getPhaseItems(phase.key);
              const done = items.filter((i) => i.checked).length;

              return (
                <div
                  key={phase.key}
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${isOpen ? phase.color + "50" : "hsl(var(--border) / 0.5)"}`,
                    background: isOpen ? phase.colorBg : "hsl(var(--card))",
                    overflow: "hidden",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Phase Header */}
                  <button
                    onClick={() => setExpandedPhase(isOpen ? null : phase.key)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 16px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{phase.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", margin: 0 }}>
                        {phase.label} — {phase.subtitle}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 3, background: "hsl(var(--muted) / 0.4)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: phase.color, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: phase.color, fontWeight: 700, flexShrink: 0 }}>
                          {done}/{items.length}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>
                        {phase.duration}
                      </span>
                      <span style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Phase Content */}
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <CheckList
                        items={items}
                        onChange={(updated) => updatePhaseItems(phase.key, updated)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── MILESTONES TAB ── */}
      {activeTab === "milestones" && (
        <SectionCard title="Key Milestones — Timeline">
          <div style={{ position: "relative", paddingLeft: 24 }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: 7,
              top: 8,
              bottom: 8,
              width: 2,
              background: "hsl(var(--border))",
              borderRadius: 1,
            }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { phase: "Minggu 1-2", label: "Apply 5-10 jobs/hari", icon: "📨", color: "#3b82f6", done: r.minggu12.some(i => i.checked) },
                { phase: "Minggu 1-2", label: "1-2 bounty pertama dari Dework", icon: "🏆", color: "#3b82f6", done: r.minggu12.filter(i => i.checked).length >= 4 },
                { phase: "Minggu 3-4", label: "Setup payment link (Gumroad/LemonSqueezy)", icon: "💳", color: "#22c55e", done: r.minggu34.some(i => i.checked) },
                { phase: "Minggu 3-4", label: "Soft launch ke komunitas trader", icon: "🚀", color: "#22c55e", done: r.minggu34.filter(i => i.checked).length >= 2 },
                { phase: "Bulan 2", label: "1 klien aktif ATAU 20 subscriber PRO", icon: "👤", color: "#8b5cf6", done: r.bulan2.some(i => i.checked) },
                { phase: "Bulan 2", label: "Stripe payment fiat live", icon: "💰", color: "#8b5cf6", done: r.bulan2.filter(i => i.checked).length >= 2 },
                { phase: "Bulan 3", label: "Emergency savings 1 bulan", icon: "🛡️", color: "#f59e0b", done: r.bulan3.some(i => i.checked) },
                { phase: "Bulan 3", label: "Zero Build Lab sebagai brand serius", icon: "🌐", color: "#f59e0b", done: r.bulan3.filter(i => i.checked).length >= 2 },
              ].map((m, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
                  {/* Dot */}
                  <div style={{
                    position: "absolute",
                    left: -24,
                    top: 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: m.done ? m.color : "hsl(var(--background))",
                    border: `2px solid ${m.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 7,
                    flexShrink: 0,
                  }}>
                    {m.done && <span style={{ color: "#fff" }}>✓</span>}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: m.color, fontFamily: "var(--font-mono)", fontWeight: 600, margin: "0 0 2px", letterSpacing: "0.04em" }}>
                      {m.phase.toUpperCase()}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{m.icon}</span>
                      <p style={{ fontSize: 13, color: m.done ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", margin: 0, fontWeight: m.done ? 600 : 400 }}>
                        {m.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── VISION TAB ── */}
      {activeTab === "vision" && (
        <>
          {/* 5-Year Timeline */}
          <SectionCard title="Roadmap 5 Tahun — ZERØ Empire">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {YEAR_MILESTONES.map((m, idx) => (
                <div
                  key={m.year}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: `${m.color}10`,
                    border: `1px solid ${m.color}30`,
                  }}
                >
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: `${m.color}20`,
                    border: `1px solid ${m.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: m.color, fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 2px", letterSpacing: "0.05em" }}>
                      TAHUN {m.year}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>{m.label}</p>
                  </div>
                  <div style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    background: `${m.color}15`,
                    border: `1px solid ${m.color}30`,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: m.color, margin: 0, fontFamily: "var(--font-mono)" }}>{m.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Editable long-term vision */}
          <SectionCard title="Vision Statement — Versi Lu">
            <EditableText
              value={r.roadmap5tahun}
              onChange={(val) => update((d) => ({ ...d, roadmap: { ...d.roadmap, roadmap5tahun: val } }))}
            />
          </SectionCard>
        </>
      )}

      {/* Notes */}
      <SectionCard title="Notes">
        <NotesList
          notes={r.notes}
          onChange={(notes) => update((d) => ({ ...d, roadmap: { ...d.roadmap, notes } }))}
        />
      </SectionCard>
    </div>
  );
}
