// ─── ZERØ COMMAND — MyDayPage.tsx v2.0 "Terminal Slab" ───────────────────────
// Institutional restructure: floating rounded cards → flat paneled slabs joined
// by hairline seams, dense hairline task rows, mono uppercase micro-labels and
// tabular numerals. All per-day todo logic (useCloudState, add/toggle/delete/
// clear/export, priority, progress, completed/pending/history) is preserved
// verbatim — only structure + color-var hygiene change so it reads in light AND
// dark as one cohesive terminal panel.
import { useRef } from 'react';
import { Plus, Trash2, Download, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useCloudState } from '@/lib/cloudStorage';
import { Slab, Panel, PanelHead, SeamGrid, Divider, Badge, Stat, PageTitle, SEAM, tLabelStyle } from '@/components/terminal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  text: string;
  done: boolean;
  time: string;
  priority: 'high' | 'normal' | 'low';
  dateKey: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
// Priority hues mapped to theme vars (loss / warning / gain) so the accent reads
// in both light & dark; the soft bg tints match the shared Badge palette.

const PRIORITY_CONFIG = {
  high:   { label: '🔴 High',   color: 'var(--loss)',    bg: 'var(--loss-soft)'        },
  normal: { label: '🟡 Normal', color: 'var(--warning)', bg: 'rgba(224,162,49,0.12)'   },
  low:    { label: '🟢 Low',    color: 'var(--gain)',    bg: 'var(--gain-soft)'        },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MyDayPage() {
  const [tasks, setTasks] = useCloudState<Task[]>('zero-my-day-tasks', []);
  const [input, setInput] = useCloudState<string>('zero-my-day-input-tmp', '');
  const [priority, setPriority] = useCloudState<'high' | 'normal' | 'low'>('zero-my-day-priority-tmp', 'normal');
  const inputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const todayKey = new Date().toDateString();

  const todayTasks = tasks.filter(t => t.dateKey === todayKey);
  const doneTasks = todayTasks.filter(t => t.done);
  const pct = todayTasks.length ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0;

  const [showHistory, setShowHistory] = useCloudState<boolean>('zero-my-day-show-history', false);
  const historyTasks = tasks.filter(t => t.dateKey !== todayKey);

  const addTask = () => {
    if (!input.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: input.trim(),
      done: false,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      priority,
      dateKey: todayKey,
    };
    setTasks([...tasks, task]);
    setInput('');
    inputRef.current?.focus();
  };

  const toggle = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearDone = () => {
    setTasks(tasks.filter(t => !(t.done && t.dateKey === todayKey)));
  };

  const downloadLog = () => {
    const dateHeader = `MY DAY — ${todayStr}\n${'═'.repeat(50)}\n`;
    const stats = `Progress: ${doneTasks.length}/${todayTasks.length} tasks (${pct}%)\n\n`;

    const taskLines = todayTasks.map(t => {
      const status = t.done ? '✓' : '○';
      const pri = PRIORITY_CONFIG[t.priority].label.split(' ')[0];
      return `${status} [${t.time}] ${pri} ${t.text}`;
    }).join('\n');

    const blob = new Blob([dateHeader + stats + taskLines], {
      type: 'text/plain; charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zero-myday-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingTasks = todayTasks.filter(t => !t.done);
  const completedTasks = todayTasks.filter(t => t.done);

  const progressColor = pct === 100 ? 'var(--gain)' : pct >= 50 ? 'var(--color-primary)' : 'var(--warning)';
  const progressTone: 'gain' | 'accent' | 'warning' = pct === 100 ? 'gain' : pct >= 50 ? 'accent' : 'warning';

  // ── Shared row-action button (icon-only, muted) ─────────────────────────────
  const iconBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-muted)', padding: 2, display: 'flex', alignItems: 'center',
  };
  // ── Header action button (mono terminal chip) ───────────────────────────────
  const actionBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 11px', borderRadius: 7,
    border: `1px solid ${SEAM}`, background: 'var(--color-surface)',
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <PageTitle
        title="My Day"
        subtitle={todayStr}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            {completedTasks.length > 0 && (
              <button onClick={clearDone} style={{ ...actionBtnStyle, color: 'var(--color-muted)' }}>
                Clear Done
              </button>
            )}
            {todayTasks.length > 0 && (
              <button onClick={downloadLog} style={{ ...actionBtnStyle, color: 'var(--color-text)' }}>
                <Download size={12} /> Download Log
              </button>
            )}
          </div>
        }
      />

      {/* ── Progress ── */}
      {todayTasks.length > 0 && (
        <Slab>
          <PanelHead
            title="Progress · Hari Ini"
            right={<Badge tone={progressTone}>{pct}%</Badge>}
          />
          <SeamGrid cols="1fr 1fr 1fr">
            <Stat
              label="Selesai"
              value={<span className="num">{doneTasks.length}/{todayTasks.length}</span>}
              tint={progressColor}
              sub="Tasks done"
            />
            <Stat
              label="Progress"
              value={<span className="num">{pct}%</span>}
              tint={progressColor}
              sub={pct === 100 ? 'Perfect day' : 'Keep going'}
            />
            <Stat
              label="Pending"
              value={<span className="num">{pendingTasks.length}</span>}
              sub="Belum selesai"
            />
          </SeamGrid>
          <Divider />
          <Panel>
            <div style={{ background: 'var(--color-border)', borderRadius: 999, height: 7, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: progressColor, borderRadius: 999, transition: 'width 0.4s ease',
              }} />
            </div>
            {pct === 100 && (
              <p style={{ fontSize: 11, color: 'var(--gain)', marginTop: 9, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                🎉 Semua task selesai! GG WP!
              </p>
            )}
          </Panel>
        </Slab>
      )}

      {/* ── Add task ── */}
      <Slab>
        <PanelHead title="New Task" right={<span style={tLabelStyle}>Enter to add</span>} />
        <Panel style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setPriority(key as any)}
                style={{
                  padding: '5px 11px', borderRadius: 6, border: '1.5px solid',
                  borderColor: priority === key ? cfg.color : SEAM,
                  background: priority === key ? cfg.bg : 'var(--color-surface)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: priority === key ? 700 : 600,
                  letterSpacing: '0.04em',
                  color: priority === key ? cfg.color : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Tambah task... (Enter to add)"
              style={{
                flex: 1, border: `1px solid ${SEAM}`, borderRadius: 7,
                padding: '8px 12px', fontSize: 14, color: 'var(--color-text)',
                outline: 'none', background: 'var(--color-surface)',
              }}
            />
            <button
              onClick={addTask}
              style={{
                background: 'var(--rail-active-bg)', color: 'var(--color-primary)',
                border: '1px solid var(--rail-active-border)',
                borderRadius: 7, padding: '8px 16px',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </Panel>
      </Slab>

      {/* ── Pending tasks ── */}
      {pendingTasks.length > 0 && (
        <Slab>
          <PanelHead title="Pending" right={<Badge tone="warning">{pendingTasks.length}</Badge>} />
          <Panel style={{ padding: 0 }}>
            {pendingTasks.map((task, i) => {
              const p = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '11px 16px 11px 14px',
                  borderLeft: `2px solid ${p.color}`,
                  borderBottom: i < pendingTasks.length - 1 ? `1px solid ${SEAM}` : 'none',
                }}>
                  <button onClick={() => toggle(task.id)} style={{ ...iconBtnStyle, padding: 0, flexShrink: 0 }}>
                    <Circle size={18} color="var(--color-muted)" />
                  </button>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text)', minWidth: 0 }}>{task.text}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-muted)', flexShrink: 0 }}>
                    <Clock size={11} />
                    <span className="num" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{task.time}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} style={{ ...iconBtnStyle, opacity: 0.55, flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </Panel>
        </Slab>
      )}

      {/* ── Completed tasks ── */}
      {completedTasks.length > 0 && (
        <Slab>
          <PanelHead title="Done" right={<Badge tone="gain">{completedTasks.length}</Badge>} />
          <Panel style={{ padding: 0 }}>
            {completedTasks.map((task, i) => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 16px',
                background: 'var(--color-surface)',
                borderBottom: i < completedTasks.length - 1 ? `1px solid ${SEAM}` : 'none',
              }}>
                <button onClick={() => toggle(task.id)} style={{ ...iconBtnStyle, padding: 0, flexShrink: 0 }}>
                  <CheckCircle2 size={18} color="var(--gain)" />
                </button>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--color-muted)', textDecoration: 'line-through', minWidth: 0 }}>{task.text}</span>
                <span className="num" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', opacity: 0.7, flexShrink: 0 }}>{task.time}</span>
                <button onClick={() => deleteTask(task.id)} style={{ ...iconBtnStyle, opacity: 0.45, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </Panel>
        </Slab>
      )}

      {/* ── History ── */}
      {historyTasks.length > 0 && (
        <Slab>
          <PanelHead
            title="History"
            right={
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)',
                }}
              >
                <span>{showHistory ? '▼' : '▶'}</span>
                <Badge>{historyTasks.length} tasks</Badge>
              </button>
            }
          />
          {showHistory && (
            <Panel style={{ padding: 0 }}>
              {historyTasks.map((task, i) => {
                const p = PRIORITY_CONFIG[task.priority];
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 16px 11px 14px',
                    borderLeft: `2px solid ${p.color}`,
                    borderBottom: i < historyTasks.length - 1 ? `1px solid ${SEAM}` : 'none',
                    opacity: 0.7,
                  }}>
                    {task.done
                      ? <CheckCircle2 size={16} color="var(--gain)" style={{ flexShrink: 0 }} />
                      : <Circle size={16} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text)', textDecoration: task.done ? 'line-through' : 'none', minWidth: 0 }}>{task.text}</span>
                    <span className="num" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', flexShrink: 0 }}>{task.dateKey}</span>
                    <button onClick={() => deleteTask(task.id)} style={{ ...iconBtnStyle, flexShrink: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </Panel>
          )}
        </Slab>
      )}

      {/* ── Empty state ── */}
      {todayTasks.length === 0 && (
        <Slab>
          <Panel style={{ textAlign: 'center', padding: '60px 20px' }}>
            <CheckCircle2 size={36} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Belum ada task hari ini</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4, opacity: 0.7 }}>Tambahkan di atas!</p>
          </Panel>
        </Slab>
      )}
    </div>
  );
}
