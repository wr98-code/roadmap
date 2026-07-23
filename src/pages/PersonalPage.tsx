// ─── ZERØ COMMAND — PersonalPage.tsx v2.0 "Terminal Slab" ────────────────────
// Institutional restructure: floating cards → flat paneled slabs joined by
// hairline seams, dense rows, mono micro-labels, tabular numerals. All habit /
// mood localStorage logic, the keyed Fragment heatmap, getDateKey, and the mood
// scale are preserved verbatim — only structure + color-var hygiene change.
import { useState, useEffect, Fragment } from "react";
import { AppData } from "@/lib/store";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Slab, Panel, PanelHead, SeamGrid, Badge, Stat, SEAM, tLabelStyle } from "@/components/terminal";
import { Flame, Shield, Brain, Target, Calendar, CheckCircle2, Circle, TrendingUp, BarChart3, Code2, Wallet, Scale, Send, Search, Angry, Frown, Meh, Smile, type LucideIcon } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── HABIT STREAK TRACKER ─────────────────────────────────────────────────────
interface HabitLog {
  [dateKey: string]: string[]; // dateKey = "2025-05-27", value = array of habit IDs done
}

const HABITS_KEY = "zero-habits-v2";
const HABIT_DEFINITIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "market-study",    label: "Market study 2 jam",           icon: BarChart3 },
  { id: "coding",          label: "Coding / skill upgrade",        icon: Code2 },
  { id: "finance-track",   label: "Financial tracking update",     icon: Wallet },
  { id: "no-emotion",      label: "Zero emotional decisions",      icon: Scale },
  { id: "outreach",        label: "1+ outreach / apply job",       icon: Send },
  { id: "review",          label: "Daily review (10 menit)",       icon: Search },
];

function loadHabits(): HabitLog {
  try { return JSON.parse(localStorage.getItem(HABITS_KEY) || "{}"); } catch { return {}; }
}
function saveHabits(log: HabitLog) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(log));
}

function getDateKey(date: Date) {
  // Local date (bukan UTC) supaya check-in dini hari untuk owner UTC+7 tidak
  // tercatat ke hari sebelumnya. Konsisten dengan getLast7Days (Date lokal).
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

// ─── MOOD TRACKER ─────────────────────────────────────────────────────────────
// Lucide icon scale; colors mapped to theme vars so the scale reads in both
// light & dark (loss → warning → neutral → gain → gold prestige).
const MOODS: { value: number; label: string; icon: LucideIcon; color: string }[] = [
  { value: 1, label: "Hancur",   icon: Angry, color: "var(--loss)" },
  { value: 2, label: "Berat",    icon: Frown, color: "var(--warning)" },
  { value: 3, label: "Oke",      icon: Meh,   color: "var(--color-muted)" },
  { value: 4, label: "Bagus",    icon: Smile, color: "var(--gain)" },
  { value: 5, label: "Fired Up", icon: Flame, color: "var(--gold)" },
];

const MOOD_KEY = "zero-mood-log-v1";
function loadMoods(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY) || "{}"); } catch { return {}; }
}
function saveMoods(m: Record<string, number>) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(m));
}

// ─── IDENTITY STATEMENTS ──────────────────────────────────────────────────────
const IDENTITY = [
  { label: "Builder",   desc: "Lu builder. Bukan trader doang. Bukan freelancer doang. Lu bangun sistem." },
  { label: "Resilient", desc: "Lu udah survive situasi worse dari ini. Lu bakal survive ini juga." },
  { label: "Iterating", desc: "Failure bukan kekalahan. Failure adalah data. Lu iterating." },
  { label: "Patient",   desc: "Compound butuh waktu. Trust the process. Satu langkah per hari." },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function PersonalPage({ data, update }: Props) {
  const p = data.personal;
  const [habitLog, setHabitLog] = useState<HabitLog>(loadHabits);
  const [moodLog, setMoodLog] = useState<Record<string, number>>(loadMoods);
  const [activeTab, setActiveTab] = useState<"rules" | "habits" | "mindset">("habits");
  const today = getDateKey(new Date());
  const last7 = getLast7Days();

  const todayHabits = habitLog[today] || [];

  const toggleHabit = (habitId: string) => {
    const updated = { ...habitLog };
    const current = updated[today] || [];
    if (current.includes(habitId)) {
      updated[today] = current.filter((h) => h !== habitId);
    } else {
      updated[today] = [...current, habitId];
    }
    setHabitLog(updated);
    saveHabits(updated);
  };

  const setMood = (value: number) => {
    const updated = { ...moodLog, [today]: value };
    setMoodLog(updated);
    saveMoods(updated);
  };

  const getStreak = (habitId: string) => {
    let streak = 0;
    const d = new Date();
    // Start from yesterday (today might not be done yet)
    d.setDate(d.getDate() - 1);
    while (true) {
      const key = getDateKey(d);
      const done = habitLog[key] || [];
      if (!done.includes(habitId)) break;
      streak++;
      d.setDate(d.getDate() - 1);
      if (streak > 365) break;
    }
    // Add today if done
    if ((habitLog[today] || []).includes(habitId)) streak++;
    return streak;
  };

  const todayMood = moodLog[today];
  const todayMoodDef = MOODS.find((m) => m.value === todayMood);
  const todayDoneCount = todayHabits.length;
  const totalHabits = HABIT_DEFINITIONS.length;
  const completionPct = Math.round((todayDoneCount / totalHabits) * 100);

  const TABS: { key: "habits" | "rules" | "mindset"; label: string; icon: LucideIcon }[] = [
    { key: "habits",  label: "Daily Habits",       icon: Flame },
    { key: "rules",   label: "Rules & Discipline",  icon: Shield },
    { key: "mindset", label: "Mindset",            icon: Brain },
  ];

  const tabStyle = (t: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 14px",
    borderRadius: 7,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    cursor: "pointer",
    background: activeTab === t ? "var(--rail-active-bg)" : "var(--color-surface)",
    color: activeTab === t ? "var(--color-primary)" : "var(--color-muted)",
    border: activeTab === t ? "1px solid var(--rail-active-border)" : `1px solid ${SEAM}`,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Tab Navigation ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* ── HABITS TAB ── */}
      {activeTab === "habits" && (
        <>
          {/* Today Summary — KPI triad */}
          <Slab>
            <PanelHead
              title={`Today · ${today}`}
              right={<Badge tone={completionPct === 100 ? "gain" : "muted"}>{todayDoneCount}/{totalHabits} DONE</Badge>}
            />
            <SeamGrid cols="1fr 1fr 1fr">
              <Stat
                label="Completed"
                value={<span className="num">{todayDoneCount}/{totalHabits}</span>}
                tint="var(--color-primary)"
                sub="Habits today"
              />
              <Stat
                label="Completion"
                value={<span className="num">{completionPct}%</span>}
                tint={completionPct === 100 ? "var(--gain)" : "var(--color-text)"}
                sub={completionPct === 100 ? "Perfect day" : "Keep going"}
              />
              <Stat
                label="Mood"
                value={todayMoodDef
                  ? <todayMoodDef.icon size={24} color={todayMoodDef.color} />
                  : <span style={{ fontSize: 24 }}>—</span>}
                sub={todayMoodDef ? todayMoodDef.label : "Belum di-log"}
              />
            </SeamGrid>
          </Slab>

          {/* Mood Check-in */}
          <Slab>
            <PanelHead
              title="Mood Hari Ini"
              right={todayMoodDef
                ? <Badge tone="accent">{todayMoodDef.label}</Badge>
                : <span style={tLabelStyle}>Tap untuk log</span>}
            />
            <Panel>
              <div style={{ display: "flex", gap: 8 }}>
                {MOODS.map((m) => {
                  const sel = todayMood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                        padding: "10px 6px",
                        borderRadius: 7,
                        border: sel ? `1.5px solid ${m.color}` : `1px solid ${SEAM}`,
                        background: sel ? "var(--color-surface)" : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <m.icon size={22} color={m.color} />
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: sel ? m.color : "var(--color-muted)",
                      }}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </Slab>

          {/* Habit Tracker — dense hairline rows */}
          <Slab>
            <PanelHead
              title="Daily Habits — Tap Check/Uncheck"
              right={<Badge tone={completionPct === 100 ? "gain" : "muted"}>{todayDoneCount}/{totalHabits}</Badge>}
            />
            <Panel style={{ padding: 0 }}>
              {HABIT_DEFINITIONS.map((habit, i) => {
                const done = todayHabits.includes(habit.id);
                const streak = getStreak(habit.id);
                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "11px 16px",
                      borderBottom: i < HABIT_DEFINITIONS.length - 1 ? `1px solid ${SEAM}` : "none",
                      background: done ? "var(--color-surface)" : "transparent",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    <habit.icon size={16} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                    <span style={{
                      flex: 1,
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      color: done ? "var(--color-text)" : "var(--color-muted)",
                      fontWeight: done ? 600 : 400,
                    }}>
                      {habit.label}
                    </span>
                    {streak > 0 && (
                      <span className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--warning)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <Flame size={11} /> {streak}d
                      </span>
                    )}
                    <div style={{ flexShrink: 0, display: "flex", color: done ? "var(--color-primary)" : "var(--color-muted)" }}>
                      {done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                    </div>
                  </div>
                );
              })}
            </Panel>
          </Slab>

          {/* 7-Day View — consistency heatmap */}
          <Slab>
            <PanelHead title="7 Hari Terakhir" right={<span style={tLabelStyle}>{HABIT_DEFINITIONS.length} habits</span>} />
            <Panel>
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto repeat(7, 1fr)", gap: 4, minWidth: 380 }}>
                  {/* Header row */}
                  <div />
                  {last7.map((d) => (
                    <div key={d.toISOString()} style={{ textAlign: "center" }}>
                      <p className="num" style={{ ...tLabelStyle, fontSize: 9, margin: 0 }}>
                        {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                      </p>
                      <p className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: getDateKey(d) === today ? "var(--color-primary)" : "var(--color-muted)", margin: "2px 0 4px" }}>
                        {d.getDate()}
                      </p>
                    </div>
                  ))}

                  {/* Habit rows */}
                  {HABIT_DEFINITIONS.map((habit) => (
                    <Fragment key={habit.id}>
                      <div style={{ fontSize: 12, color: "var(--color-muted)", display: "flex", alignItems: "center", paddingRight: 8, whiteSpace: "nowrap" }}>
                        <habit.icon size={13} />
                      </div>
                      {last7.map((d) => {
                        const key = getDateKey(d);
                        const done = (habitLog[key] || []).includes(habit.id);
                        return (
                          <div
                            key={`${habit.id}-${key}`}
                            style={{
                              aspectRatio: "1",
                              borderRadius: 3,
                              background: done ? "var(--color-primary)" : "var(--color-surface)",
                              border: `1px solid ${done ? "var(--color-primary)" : SEAM}`,
                            }}
                          />
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </Panel>
          </Slab>
        </>
      )}

      {/* ── RULES TAB ── */}
      {activeTab === "rules" && (
        <>
          <Slab>
            <PanelHead title="Rules Survival Mode" />
            <Panel>
              <EditableText
                value={p.rulesSurvival}
                onChange={(val) => update((d) => ({ ...d, personal: { ...d.personal, rulesSurvival: val } }))}
              />
            </Panel>
          </Slab>

          <Slab>
            <PanelHead title="Daily Discipline Checklist" />
            <Panel>
              <CheckList
                items={p.dailyDiscipline}
                onChange={(items) => update((d) => ({ ...d, personal: { ...d.personal, dailyDiscipline: items } }))}
              />
            </Panel>
          </Slab>

          <Slab>
            <PanelHead title="Checklist Rebuild" />
            <Panel>
              <CheckList
                items={p.checklistRebuild}
                onChange={(items) => update((d) => ({ ...d, personal: { ...d.personal, checklistRebuild: items } }))}
              />
            </Panel>
          </Slab>
        </>
      )}

      {/* ── MINDSET TAB ── */}
      {activeTab === "mindset" && (
        <>
          {/* Affirmation — flat, no gradient */}
          <Slab>
            <Panel style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", padding: "24px 20px" }}>
              <Brain size={30} color="var(--color-primary)" />
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.5, margin: 0 }}>
                "Ini bukan kegagalan — ini rebuild."
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--color-muted)", lineHeight: 1.5, margin: 0, maxWidth: 440 }}>
                Skill masih ada. Pengalaman masih ada. Modal bisa dibangun lagi.
              </p>
            </Panel>
          </Slab>

          <Slab>
            <PanelHead title="Mindset Core" />
            <Panel>
              <EditableText
                value={p.mindset}
                onChange={(val) => update((d) => ({ ...d, personal: { ...d.personal, mindset: val } }))}
              />
            </Panel>
          </Slab>

          {/* Identity statements — dense hairline rows */}
          <Slab>
            <PanelHead title="Identity — Siapa Lu" />
            <Panel style={{ padding: 0 }}>
              {IDENTITY.map((id, i) => (
                <div
                  key={id.label}
                  style={{
                    padding: "12px 16px",
                    borderBottom: i < IDENTITY.length - 1 ? `1px solid ${SEAM}` : "none",
                  }}
                >
                  <p style={{ ...tLabelStyle, color: "var(--color-primary)", margin: "0 0 5px" }}>
                    // {id.label.toUpperCase()}
                  </p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text)", margin: 0, lineHeight: 1.5 }}>{id.desc}</p>
                </div>
              ))}
            </Panel>
          </Slab>
        </>
      )}

      {/* ── Notes (always visible) ── */}
      <Slab>
        <PanelHead title="Notes" />
        <Panel>
          <NotesList
            notes={p.notes}
            onChange={(notes) => update((d) => ({ ...d, personal: { ...d.personal, notes } }))}
          />
        </Panel>
      </Slab>
    </div>
  );
}
