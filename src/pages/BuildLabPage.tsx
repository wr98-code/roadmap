// ─── ZERØ COMMAND — BuildLabPage.tsx ─────────────────────────────────────────
// Status board, Kanban, income target, focus tracker
import { useState } from "react";
import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Zap, TrendingUp, Target, Clock, Plus, Trash2, CheckCircle, Circle, Loader } from "lucide-react";

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

const PRIORITY_COLORS = {
  high: { color: "#ef4444", bg: "#ef444418", label: "HIGH" },
  mid:  { color: "#f59e0b", bg: "#f59e0b15", label: "MID" },
  low:  { color: "#94a3b8", bg: "#94a3b815", label: "LOW" },
};

const STATUS_CONFIG: Record<KanbanStatus, { label: string; icon: React.ReactNode; color: string }> = {
  todo:  { label: "TODO",  icon: <Circle size={13} />,       color: "#94a3b8" },
  doing: { label: "DOING", icon: <Loader size={13} />,       color: "#3b82f6" },
  done:  { label: "DONE",  icon: <CheckCircle size={13} />,  color: "#22c55e" },
};

// ─── INCOME PROJECTION ─────────────────────────────────────────────────────────
const INCOME_TARGETS = [
  { period: "Minggu 1–2", target: "1–2 bounty kecil",       amount: "Rp500K–2jt",   color: "#3b82f6" },
  { period: "Bulan 1",    target: "1 klien / 20 sub PRO",    amount: "Rp1–3jt",     color: "#8b5cf6" },
  { period: "Bulan 3",    target: "Gabungan income stabil",  amount: "Rp5–15jt",    color: "#22c55e" },
  { period: "Bulan 6",    target: "Scale ke multiple streams", amount: "Rp15–30jt", color: "#f59e0b" },
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

  const statusColor = (s: string) => {
    if (s.includes("AKTIF"))    return { bg: "hsl(var(--primary) / 0.15)",   color: "hsl(var(--primary))" };
    if (s.includes("✅"))       return { bg: "rgba(34,197,94,0.12)",           color: "#22c55e" };
    if (s.includes("CRITICAL")) return { bg: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))" };
    if (s.includes("pending"))  return { bg: "rgba(245,158,11,0.12)",          color: "#f59e0b" };
    return { bg: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))" };
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

  // Kanban columns
  const columns: KanbanStatus[] = ["todo", "doing", "done"];
  const getCards = (status: KanbanStatus) => kanban.filter((c) => c.status === status);

  return (
    <div className="space-y-5">

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={tabStyle("status")} onClick={() => setActiveTab("status")}>📊 Status Board</button>
        <button style={tabStyle("kanban")} onClick={() => setActiveTab("kanban")}>🗂️ Kanban</button>
        <button style={tabStyle("income")} onClick={() => setActiveTab("income")}>💰 Income Target</button>
      </div>

      {/* ── STATUS BOARD TAB ── */}
      {activeTab === "status" && (
        <>
          <SectionCard title="Project Status Board">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Area", "Status", "Prioritas"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600, letterSpacing: "0.05em" }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bl.statusBoard.map((s, idx) => {
                    const sc = statusColor(s.status);
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}>
                        <td style={{ padding: "10px 10px", fontSize: 13, color: "hsl(var(--foreground))", fontWeight: 500 }}>
                          {s.area}
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: "var(--font-mono)",
                            background: sc.bg,
                            color: sc.color,
                          }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: idx === 0 ? "#ef4444" : "hsl(var(--muted-foreground))",
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
          </SectionCard>

          <SectionCard title="⚡ Focus Minggu Ini">
            <CheckList
              items={bl.focusMingguIni}
              onChange={(items) => update((d) => ({ ...d, buildLab: { ...d.buildLab, focusMingguIni: items } }))}
            />
          </SectionCard>
        </>
      )}

      {/* ── KANBAN TAB ── */}
      {activeTab === "kanban" && (
        <>
          {/* Add Card */}
          <SectionCard
            title="Task Board"
            actions={
              <button
                onClick={() => setAddingCard(!addingCard)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 7,
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={11} /> Add Task
              </button>
            }
          >
            {addingCard && (
              <div style={{ marginBottom: 14, padding: "12px", borderRadius: 10, background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column", gap: 8 }}>
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
                        border: `1px solid ${newPriority === p ? PRIORITY_COLORS[p].color : "hsl(var(--border))"}`,
                        background: newPriority === p ? PRIORITY_COLORS[p].bg : "transparent",
                        color: newPriority === p ? PRIORITY_COLORS[p].color : "hsl(var(--muted-foreground))",
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
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
                    style={{ ...inputStyle, flex: 1, margin: 0 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => setAddingCard(false)} style={cancelBtnStyle}>Cancel</button>
                  <button onClick={addCard} style={primaryBtnStyle}>Add Task</button>
                </div>
              </div>
            )}

            {/* Kanban columns */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {columns.map((col) => {
                const cfg = STATUS_CONFIG[col];
                const cards = getCards(col);
                return (
                  <div key={col}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: "var(--font-mono)" }}>{cfg.label}</span>
                      <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginLeft: "auto" }}>{cards.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
                      {cards.map((card) => {
                        const pc = PRIORITY_COLORS[card.priority];
                        return (
                          <div
                            key={card.id}
                            style={{
                              padding: "10px 10px",
                              borderRadius: 9,
                              background: "hsl(var(--muted) / 0.3)",
                              border: "1px solid hsl(var(--border) / 0.6)",
                            }}
                          >
                            <p style={{ fontSize: 12, color: "hsl(var(--foreground))", margin: "0 0 6px", fontWeight: 500, lineHeight: 1.3 }}>
                              {card.title}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: pc.bg, color: pc.color, fontFamily: "var(--font-mono)" }}>
                                {pc.label}
                              </span>
                              {card.tag && (
                                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
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
                                    border: "1px solid hsl(var(--border) / 0.5)",
                                    background: "transparent",
                                    color: STATUS_CONFIG[target].color,
                                    fontSize: 9,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  → {STATUS_CONFIG[target].label}
                                </button>
                              ))}
                              <button
                                onClick={() => removeCard(card.id)}
                                style={{
                                  padding: "3px 5px",
                                  borderRadius: 5,
                                  border: "1px solid hsl(var(--border) / 0.5)",
                                  background: "transparent",
                                  color: "hsl(var(--muted-foreground))",
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
                        <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "hsl(var(--muted-foreground) / 0.5)", border: "1px dashed hsl(var(--border) / 0.4)", borderRadius: 8 }}>
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </>
      )}

      {/* ── INCOME TAB ── */}
      {activeTab === "income" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {INCOME_TARGETS.map((t) => (
              <div
                key={t.period}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: `${t.color}10`,
                  border: `1px solid ${t.color}30`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <p style={{ fontSize: 11, color: t.color, fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 3px", letterSpacing: "0.04em" }}>
                    {t.period.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 13, color: "hsl(var(--foreground))", fontWeight: 500, margin: 0 }}>{t.target}</p>
                </div>
                <div style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: `${t.color}20`,
                  border: `1px solid ${t.color}35`,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: t.color, margin: 0, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {t.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <SectionCard title="Income Target — Catatan">
            <EditableText
              value={bl.incomeTarget}
              onChange={(val) => update((d) => ({ ...d, buildLab: { ...d.buildLab, incomeTarget: val } }))}
            />
          </SectionCard>

          {/* Revenue streams */}
          <SectionCard title="Revenue Streams yang Lagi Dibangun">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "Web3 Freelance",       desc: "Bounties Dework + direct outreach ke protocol",   status: "AKTIF", statusColor: "#3b82f6" },
                { name: "ZERØ WATCH",            desc: "Trading dashboard — Gumroad $9 lifetime",        status: "SETUP",  statusColor: "#f59e0b" },
                { name: "ZERØ MERIDIAN",         desc: "Analytics — Stripe paywall pending",             status: "LIVE",   statusColor: "#22c55e" },
                { name: "Content / Consulting",  desc: "X/Twitter trader audience, jangka menengah",    status: "PLAN",   statusColor: "#8b5cf6" },
              ].map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1px solid hsl(var(--border) / 0.5)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "2px 0 0" }}>{s.desc}</p>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 6,
                    background: s.statusColor + "20",
                    color: s.statusColor,
                    fontFamily: "var(--font-mono)",
                    flexShrink: 0,
                  }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* Notes */}
      <SectionCard title="Notes">
        <NotesList
          notes={bl.notes}
          onChange={(notes) => update((d) => ({ ...d, buildLab: { ...d.buildLab, notes } }))}
        />
      </SectionCard>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--font-sans)",
  background: "hsl(var(--primary))",
  color: "hsl(var(--primary-foreground))",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--font-sans)",
  background: "transparent",
  color: "hsl(var(--muted-foreground))",
};
