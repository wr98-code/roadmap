// ─── ZERØ COMMAND — BuildLabPage.tsx ─────────────────────────────────────────
// Status board, Kanban, income target, focus tracker. Institutional "terminal"
// restructure — flat panels + hairline seams, mono tabular numerals, CSS-var
// colors (light + dark). Every tab, handler, kanban op & feature preserved.
import { useState } from "react";
import { AppData } from "@/lib/store";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import {
  Slab, SeamGrid, Panel, PanelHead, Divider, Stat, Badge, PageTitle,
  tLabelStyle, tNumStyle,
} from "@/components/terminal";
import { Zap, TrendingUp, Target, Plus, Trash2, CheckCircle, Circle, Loader } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── KANBAN ────────────────────────────────────────────────────────────────────
type KanbanStatus = "todo" | "doing" | "done";
interface KanbanCard {
  id: string;
  title: string;
  status: KanbanStatus;
  priority: "high" | "mid" | "low";
  tag: string;
}

const KANBAN_KEY = "zero-buildlab-kanban-v2";
function loadKanban(): KanbanCard[] {
  try { return JSON.parse(localStorage.getItem(KANBAN_KEY) || "[]"); } catch { return []; }
}
function saveKanban(cards: KanbanCard[]) {
  localStorage.setItem(KANBAN_KEY, JSON.stringify(cards));
}

const uid = () => Math.random().toString(36).slice(2, 9);

// Priority — mapped to semantic theme vars (works light + dark)
const PRIORITY_COLORS = {
  high: { color: "var(--loss)",         bg: "var(--loss-soft)",          label: "HIGH" },
  mid:  { color: "var(--warning)",      bg: "rgba(224,162,49,0.12)",     label: "MID" },
  low:  { color: "var(--color-muted)",  bg: "var(--color-surface)",      label: "LOW" },
};

const STATUS_CONFIG: Record<KanbanStatus, { label: string; icon: React.ReactNode; color: string }> = {
  todo:  { label: "TODO",  icon: <Circle size={13} />,       color: "var(--color-muted)" },
  doing: { label: "DOING", icon: <Loader size={13} />,       color: "var(--color-primary)" },
  done:  { label: "DONE",  icon: <CheckCircle size={13} />,  color: "var(--gain)" },
};

// ─── INCOME PROJECTION ─────────────────────────────────────────────────────────
const INCOME_TARGETS = [
  { period: "Minggu 1–2", target: "1–2 bounty kecil",         amount: "Rp500K–2jt",  tint: "var(--color-primary)" },
  { period: "Bulan 1",    target: "1 klien / 20 sub PRO",      amount: "Rp1–3jt",     tint: "var(--gold)" },
  { period: "Bulan 3",    target: "Gabungan income stabil",    amount: "Rp5–15jt",    tint: "var(--gain)" },
  { period: "Bulan 6",    target: "Scale ke multiple streams", amount: "Rp15–30jt",   tint: "var(--warning)" },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function BuildLabPage({ data, update }: Props) {
  const bl = data.buildLab;
  const [kanban, setKanban] = useState<KanbanCard[]>(loadKanban);
  const [activeTab, setActiveTab] = useState<"status" | "kanban" | "income">("status");
  const [addingCard, setAddingCard] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "mid" | "low">("mid");
  const [newTag, setNewTag] = useState("Web3");

  const updateKanban = (cards: KanbanCard[]) => {
    setKanban(cards);
    saveKanban(cards);
  };

  const addCard = () => {
    if (!newTitle.trim()) return;
    const card: KanbanCard = {
      id: uid(),
      title: newTitle.trim(),
      status: "todo",
      priority: newPriority,
      tag: newTag,
    };
    updateKanban([card, ...kanban]);
    setNewTitle("");
    setAddingCard(false);
  };

  const moveCard = (id: string, status: KanbanStatus) => {
    updateKanban(kanban.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const removeCard = (id: string) => {
    updateKanban(kanban.filter((c) => c.id !== id));
  };

  // Status board chip → semantic theme vars
  const statusColor = (s: string) => {
    if (s.includes("AKTIF"))    return { bg: "var(--rail-active-bg)", color: "var(--color-primary)" };
    if (s.includes("✅"))       return { bg: "var(--gain-soft)",       color: "var(--gain)" };
    if (s.includes("CRITICAL")) return { bg: "var(--loss-soft)",       color: "var(--loss)" };
    if (s.includes("pending"))  return { bg: "rgba(224,162,49,0.12)",  color: "var(--warning)" };
    return { bg: "var(--color-surface)", color: "var(--color-muted)" };
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
    fontFamily: "var(--font-mono)", letterSpacing: "0.02em", cursor: "pointer",
    background: activeTab === t ? "var(--rail-active-bg)" : "var(--color-surface)",
    color: activeTab === t ? "var(--color-primary)" : "var(--color-muted)",
    border: `1px solid ${activeTab === t ? "var(--rail-active-border)" : "var(--color-border)"}`,
    transition: "all 0.15s",
  });

  // Kanban columns
  const columns: KanbanStatus[] = ["todo", "doing", "done"];
  const getCards = (status: KanbanStatus) => kanban.filter((c) => c.status === status);

  // ── Derived readouts (truthful, no fabrication) ──
  const focusTotal = bl.focusMingguIni.length;
  const focusDone = bl.focusMingguIni.filter((f) => f.checked).length;
  const focusPct = focusTotal ? Math.round((focusDone / focusTotal) * 100) : 0;
  const kanbanDone = getCards("done").length;

  // Institutional table header cell
  const th = (opts?: { right?: boolean }): React.CSSProperties => ({
    textAlign: opts?.right ? "right" : "left",
    padding: "9px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-muted)",
    whiteSpace: "nowrap",
  });

  return (
    <div className="space-y-5">
      <PageTitle
        title="Build Lab"
        subtitle="EXECUTION · KANBAN · REVENUE"
        right={<Badge tone="accent">LAB</Badge>}
      />

      {/* ── KPI readout spine (persistent across tabs) ── */}
      <Slab>
        <SeamGrid cols="1fr 1fr 1fr">
          <Stat
            label="Status Areas"
            value={bl.statusBoard.length}
            sub="tracked"
            right={<Target size={13} style={{ color: "var(--color-muted)" }} />}
          />
          <Stat
            label="Kanban Tasks"
            value={kanban.length}
            sub={`${kanbanDone} done`}
            tint={kanban.length > 0 && kanbanDone === kanban.length ? "var(--gain)" : "var(--color-text)"}
          />
          <Stat
            label="Focus Minggu Ini"
            value={`${focusDone}/${focusTotal}`}
            sub={`${focusPct}% complete`}
            tint={focusTotal > 0 && focusDone === focusTotal ? "var(--gain)" : "var(--color-text)"}
          />
        </SeamGrid>
      </Slab>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={tabStyle("status")} onClick={() => setActiveTab("status")}>📊 Status Board</button>
        <button style={tabStyle("kanban")} onClick={() => setActiveTab("kanban")}>🗂️ Kanban</button>
        <button style={tabStyle("income")} onClick={() => setActiveTab("income")}>💰 Income Target</button>
      </div>

      {/* ── STATUS BOARD TAB ── */}
      {activeTab === "status" && (
        <>
          <Slab>
            <PanelHead
              title="Project Status Board"
              right={bl.statusBoard.length > 0 ? <Badge>{bl.statusBoard.length} AREAS</Badge> : undefined}
            />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th style={th()}>Area</th>
                    <th style={th()}>Status</th>
                    <th style={th({ right: true })}>Prioritas</th>
                  </tr>
                </thead>
                <tbody>
                  {bl.statusBoard.map((s, idx) => {
                    const sc = statusColor(s.status);
                    return (
                      <tr key={s.id} style={{ borderTop: idx === 0 ? "none" : "1px solid var(--color-border)" }}>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--color-text)", fontWeight: 500 }}>
                          {s.area}
                        </td>
                        <td style={{ padding: "9px 14px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 5,
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.04em",
                            background: sc.bg,
                            color: sc.color,
                          }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right" }}>
                          <span style={{
                            ...tNumStyle,
                            fontSize: 12,
                            fontWeight: 700,
                            color: idx === 0 ? "var(--loss)" : "var(--color-muted)",
                          }}>
                            {s.prioritas}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Slab>

          <Slab>
            <PanelHead
              title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Zap size={11} style={{ color: "var(--warning)" }} /> Focus Minggu Ini</span>}
              right={focusTotal > 0 ? <Badge tone={focusDone === focusTotal ? "gain" : "muted"}>{focusDone}/{focusTotal}</Badge> : undefined}
            />
            <div style={{ padding: "14px 16px" }}>
              <CheckList
                items={bl.focusMingguIni}
                onChange={(items) => update((d) => ({ ...d, buildLab: { ...d.buildLab, focusMingguIni: items } }))}
              />
            </div>
          </Slab>
        </>
      )}

      {/* ── KANBAN TAB ── */}
      {activeTab === "kanban" && (
        <Slab>
          <PanelHead
            title="Task Board"
            right={
              <button
                onClick={() => setAddingCard(!addingCard)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 7,
                  background: "var(--rail-active-bg)", color: "var(--color-primary)",
                  border: "1px solid var(--rail-active-border)",
                  fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em", cursor: "pointer",
                }}
              >
                <Plus size={11} /> ADD TASK
              </button>
            }
          />

          {/* Add Card form */}
          {addingCard && (
            <>
              <div style={{ padding: "14px 16px", background: "var(--color-surface)", display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  style={inputStyle}
                  onKeyDown={(e) => e.key === "Enter" && addCard()}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 6 }}>
                  {(["high", "mid", "low"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: `1px solid ${newPriority === p ? PRIORITY_COLORS[p].color : "var(--color-border)"}`,
                        background: newPriority === p ? PRIORITY_COLORS[p].bg : "transparent",
                        color: newPriority === p ? PRIORITY_COLORS[p].color : "var(--color-muted)",
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                      }}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Tag"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => setAddingCard(false)} style={cancelBtnStyle}>Cancel</button>
                  <button onClick={addCard} style={primaryBtnStyle}>Add Task</button>
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* Kanban columns — hairline seams between columns */}
          <SeamGrid cols="1fr 1fr 1fr">
            {columns.map((col) => {
              const cfg = STATUS_CONFIG[col];
              const cards = getCards(col);
              return (
                <Panel key={col} style={{ padding: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ color: cfg.color, display: "inline-flex" }}>{cfg.icon}</span>
                    <span style={{ ...tLabelStyle, color: cfg.color, letterSpacing: "0.1em" }}>{cfg.label}</span>
                    <span style={{ ...tNumStyle, fontSize: 10, color: "var(--color-muted)", marginLeft: "auto" }}>{cards.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60, padding: "10px 12px" }}>
                    {cards.map((card) => {
                      const pc = PRIORITY_COLORS[card.priority];
                      return (
                        <div
                          key={card.id}
                          style={{
                            padding: "10px",
                            borderRadius: 6,
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <p style={{ fontSize: 12, color: "var(--color-text)", margin: "0 0 6px", fontWeight: 500, lineHeight: 1.3 }}>
                            {card.title}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: pc.bg, color: pc.color, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                              {pc.label}
                            </span>
                            {card.tag && (
                              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--color-bg)", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
                                {card.tag}
                              </span>
                            )}
                          </div>
                          {/* Move buttons */}
                          <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
                            {columns.filter((c) => c !== col).map((target) => (
                              <button
                                key={target}
                                onClick={() => moveCard(card.id, target)}
                                style={{
                                  flex: 1,
                                  padding: "3px 0",
                                  borderRadius: 5,
                                  border: "1px solid var(--color-border)",
                                  background: "transparent",
                                  color: STATUS_CONFIG[target].color,
                                  fontSize: 9,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontFamily: "var(--font-mono)",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                → {STATUS_CONFIG[target].label}
                              </button>
                            ))}
                            <button
                              onClick={() => removeCard(card.id)}
                              style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                padding: "3px 6px",
                                borderRadius: 5,
                                border: "1px solid var(--color-border)",
                                background: "transparent",
                                color: "var(--color-muted)",
                                fontSize: 10,
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={9} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {cards.length === 0 && (
                      <div style={{ padding: "16px 0", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--color-muted)", border: "1px dashed var(--color-border)", borderRadius: 6 }}>
                        EMPTY
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })}
          </SeamGrid>
        </Slab>
      )}

      {/* ── INCOME TAB ── */}
      {activeTab === "income" && (
        <>
          <Slab>
            <PanelHead
              title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><TrendingUp size={11} style={{ color: "var(--gain)" }} /> Income Milestones</span>}
              right={<Badge>{INCOME_TARGETS.length} TIERS</Badge>}
            />
            {INCOME_TARGETS.map((t, i) => (
              <div
                key={t.period}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: t.tint, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...tLabelStyle, color: t.tint, margin: "0 0 3px" }}>
                      {t.period.toUpperCase()}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--color-text)", fontWeight: 500, margin: 0 }}>{t.target}</p>
                  </div>
                </div>
                <span style={{ ...tNumStyle, fontSize: 13, fontWeight: 700, color: t.tint, whiteSpace: "nowrap" }}>
                  {t.amount}
                </span>
              </div>
            ))}
          </Slab>

          <Slab>
            <PanelHead title="Income Target — Catatan" />
            <div style={{ padding: "14px 16px" }}>
              <EditableText
                value={bl.incomeTarget}
                onChange={(val) => update((d) => ({ ...d, buildLab: { ...d.buildLab, incomeTarget: val } }))}
              />
            </div>
          </Slab>

          {/* Revenue streams */}
          <Slab>
            <PanelHead title="Revenue Streams yang Lagi Dibangun" />
            {[
              { name: "Web3 Freelance",      desc: "Bounties Dework + direct outreach ke protocol", status: "AKTIF", tone: "accent" as const },
              { name: "ZERØ WATCH",          desc: "Trading dashboard — Gumroad $9 lifetime",       status: "SETUP", tone: "warning" as const },
              { name: "ZERØ MERIDIAN",       desc: "Analytics — Stripe paywall pending",            status: "LIVE",  tone: "gain" as const },
              { name: "Content / Consulting", desc: "X/Twitter trader audience, jangka menengah",   status: "PLAN",  tone: "muted" as const },
            ].map((s, i) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "2px 0 0" }}>{s.desc}</p>
                </div>
                <Badge tone={s.tone}>{s.status}</Badge>
              </div>
            ))}
          </Slab>
        </>
      )}

      {/* Notes */}
      <Slab>
        <PanelHead title="Notes" />
        <div style={{ padding: "14px 16px" }}>
          <NotesList
            notes={bl.notes}
            onChange={(notes) => update((d) => ({ ...d, buildLab: { ...d.buildLab, notes } }))}
          />
        </div>
      </Slab>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 6,
  border: "1px solid var(--color-border)",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 7,
  border: "1px solid var(--rail-active-border)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.04em",
  background: "var(--rail-active-bg)",
  color: "var(--color-primary)",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 7,
  border: "1px solid var(--color-border)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--font-sans)",
  background: "transparent",
  color: "var(--color-muted)",
};
