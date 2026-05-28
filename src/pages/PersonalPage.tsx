// ─── ZERØ COMMAND — PersonalPage.tsx ─────────────────────────────────────────
// Survival rules, daily discipline, mindset, habit streak tracker, rebuild plan
import { useState, useEffect } from "react";
import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Flame, Shield, Brain, Target, Calendar, CheckCircle2, Circle, TrendingUp } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── HABIT STREAK TRACKER ─────────────────────────────────────────────────────
interface HabitLog {
  [dateKey: string]: string[]; // dateKey = "2025-05-27", value = array of habit IDs done
}

const HABITS_KEY = "zero-habits-v2";
const HABIT_DEFINITIONS = [
  { id: "market-study",    label: "Market study 2 jam",           icon: "📊" },
  { id: "coding",          label: "Coding / skill upgrade",        icon: "💻" },
  { id: "finance-track",   label: "Financial tracking update",     icon: "💰" },
  { id: "no-emotion",      label: "Zero emotional decisions",      icon: "🧘" },
  { id: "outreach",        label: "1+ outreach / apply job",       icon: "📨" },
  { id: "review",          label: "Daily review (10 menit)",       icon: "🔍" },
];

function loadHabits(): HabitLog {
  try { return JSON.parse(localStorage.getItem(HABITS_KEY) || "{}"); } catch { return {}; }
}
function saveHabits(log: HabitLog) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(log));
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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
const MOODS = [
  { value: 1, label: "Hancur",   emoji: "😵", color: "#ef4444" },
  { value: 2, label: "Berat",    emoji: "😔", color: "#f97316" },
  { value: 3, label: "Oke",      emoji: "😐", color: "#eab308" },
  { value: 4, label: "Bagus",    emoji: "😊", color: "#22c55e" },
  { value: 5, label: "Fired Up", emoji: "🔥", color: "#8b5cf6" },
];

const MOOD_KEY = "zero-mood-log-v1";
function loadMoods(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY) || "{}"); } catch { return {}; }
}
function saveMoods(m: Record<string, number>) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(m));
}

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
  const todayDoneCount = todayHabits.length;
  const totalHabits = HABIT_DEFINITIONS.length;
  const completionPct = Math.round((todayDoneCount / totalHabits) * 100);

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
        <button style={tabStyle("habits")} onClick={() => setActiveTab("habits")}>🔥 Daily Habits</button>
        <button style={tabStyle("rules")} onClick={() => setActiveTab("rules")}>🛡️ Rules & Discipline</button>
        <button style={tabStyle("mindset")} onClick={() => setActiveTab("mindset")}>🧠 Mindset</button>
      </div>

      {/* ── HABITS TAB ── */}
      {activeTab === "habits" && (
        <>
          {/* Today Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ padding: "14px", borderRadius: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: "hsl(var(--primary))", margin: 0 }}>
                {todayDoneCount}/{totalHabits}
              </p>
              <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>Hari ini</p>
            </div>
            <div style={{ padding: "14px", borderRadius: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: completionPct === 100 ? "#22c55e" : "hsl(var(--foreground))", margin: 0 }}>
                {completionPct}%
              </p>
              <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>Completion</p>
            </div>
            <div style={{ padding: "14px", borderRadius: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", textAlign: "center" }}>
              {todayMood ? (
                <>
                  <p style={{ fontSize: 28, margin: 0 }}>{MOODS.find((m) => m.value === todayMood)?.emoji}</p>
                  <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>
                    {MOODS.find((m) => m.value === todayMood)?.label}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 20, margin: 0 }}>—</p>
                  <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>Mood belum</p>
                </>
              )}
            </div>
          </div>

          {/* Mood Check-in */}
          <SectionCard title="Mood Hari Ini">
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "10px 6px",
                    borderRadius: 10,
                    border: `2px solid ${todayMood === m.value ? m.color : "hsl(var(--border) / 0.5)"}`,
                    background: todayMood === m.value ? m.color + "20" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{m.emoji}</span>
                  <span style={{ fontSize: 9, color: todayMood === m.value ? m.color : "hsl(var(--muted-foreground))", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Habit Tracker */}
          <SectionCard title="Daily Habits — Tap untuk Check/Uncheck">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {HABIT_DEFINITIONS.map((habit) => {
                const done = todayHabits.includes(habit.id);
                const streak = getStreak(habit.id);
                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: done ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.3)",
                      border: `1px solid ${done ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.5)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      userSelect: "none",
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{habit.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, color: done ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.7)", fontWeight: done ? 600 : 400, textDecoration: done ? "none" : "none" }}>
                      {habit.label}
                    </span>
                    {streak > 0 && (
                      <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        🔥 {streak}d
                      </span>
                    )}
                    <div style={{ flexShrink: 0, color: done ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)" }}>
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* 7-Day View */}
          <SectionCard title="7 Hari Terakhir">
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto repeat(7, 1fr)", gap: 4, minWidth: 380 }}>
                {/* Header row */}
                <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }} />
                {last7.map((d) => (
                  <div key={d.toISOString()} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", margin: 0 }}>
                      {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: getDateKey(d) === today ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", margin: "2px 0 4px" }}>
                      {d.getDate()}
                    </p>
                  </div>
                ))}

                {/* Habit rows */}
                {HABIT_DEFINITIONS.map((habit) => (
                  <>
                    <div key={`label-${habit.id}`} style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", paddingRight: 8, whiteSpace: "nowrap" }}>
                      {habit.icon}
                    </div>
                    {last7.map((d) => {
                      const key = getDateKey(d);
                      const done = (habitLog[key] || []).includes(habit.id);
                      return (
                        <div
                          key={`${habit.id}-${key}`}
                          style={{
                            aspectRatio: "1",
                            borderRadius: 4,
                            background: done ? "hsl(var(--primary) / 0.7)" : "hsl(var(--muted) / 0.3)",
                            border: `1px solid ${done ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.3)"}`,
                          }}
                        />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </SectionCard>
        </>
      )}

      {/* ── RULES TAB ── */}
      {activeTab === "rules" && (
        <>
          <SectionCard title="🛡️ Rules Survival Mode">
            <EditableText
              value={p.rulesSurvival}
              onChange={(val) => update((d) => ({ ...d, personal: { ...d.personal, rulesSurvival: val } }))}
            />
          </SectionCard>

          <SectionCard title="✅ Daily Discipline Checklist">
            <CheckList
              items={p.dailyDiscipline}
              onChange={(items) => update((d) => ({ ...d, personal: { ...d.personal, dailyDiscipline: items } }))}
            />
          </SectionCard>

          <SectionCard title="🔄 Checklist Rebuild">
            <CheckList
              items={p.checklistRebuild}
              onChange={(items) => update((d) => ({ ...d, personal: { ...d.personal, checklistRebuild: items } }))}
            />
          </SectionCard>
        </>
      )}

      {/* ── MINDSET TAB ── */}
      {activeTab === "mindset" && (
        <>
          {/* Affirmation card */}
          <div
            style={{
              padding: "20px 20px",
              borderRadius: 14,
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))",
              border: "1px solid hsl(var(--primary) / 0.2)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🧠</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--foreground))", lineHeight: 1.5, fontFamily: "var(--font-sans)", margin: 0 }}>
              "Ini bukan kegagalan — ini rebuild."
            </p>
            <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginTop: 8, lineHeight: 1.5 }}>
              Skill masih ada. Pengalaman masih ada. Modal bisa dibangun lagi.
            </p>
          </div>

          <SectionCard title="Mindset Core">
            <EditableText
              value={p.mindset}
              onChange={(val) => update((d) => ({ ...d, personal: { ...d.personal, mindset: val } }))}
            />
          </SectionCard>

          {/* Identity statements */}
          <SectionCard title="Identity — Siapa Lu">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Builder", desc: "Lu builder. Bukan trader doang. Bukan freelancer doang. Lu bangun sistem." },
                { label: "Resilient", desc: "Lu udah survive situasi worse dari ini. Lu bakal survive ini juga." },
                { label: "Iterating", desc: "Failure bukan kekalahan. Failure adalah data. Lu iterating." },
                { label: "Patient", desc: "Compound butuh waktu. Trust the process. Satu langkah per hari." },
              ].map((id) => (
                <div
                  key={id.label}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1px solid hsl(var(--border) / 0.5)",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--primary))", margin: "0 0 4px", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                    // {id.label.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 13, color: "hsl(var(--foreground))", margin: 0, lineHeight: 1.5 }}>{id.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* Notes */}
      <SectionCard title="Notes">
        <NotesList
          notes={p.notes}
          onChange={(notes) => update((d) => ({ ...d, personal: { ...d.personal, notes } }))}
        />
      </SectionCard>
    </div>
  );
}
