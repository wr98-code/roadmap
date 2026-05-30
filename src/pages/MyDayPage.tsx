import { useRef } from 'react';
import { Plus, Trash2, Download, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useCloudState } from '@/lib/cloudStorage';

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

const PRIORITY_CONFIG = {
  high:   { label: '🔴 High',   color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
  normal: { label: '🟡 Normal', color: '#d97706', bg: 'rgba(217,119,6,0.1)'   },
  low:    { label: '🟢 Low',    color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 className="font-heading text-lg">My Day</h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{todayStr}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {completedTasks.length > 0 && (
            <button onClick={clearDone} style={{
              border: '1px solid var(--color-border)', background: 'var(--color-card)',
              borderRadius: 7, padding: '7px 12px', fontSize: 12,
              color: 'var(--color-muted)', cursor: 'pointer',
            }}>
              Clear done
            </button>
          )}
          {todayTasks.length > 0 && (
            <button onClick={downloadLog} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              border: '1px solid var(--color-border)', background: 'var(--color-card)',
              borderRadius: 7, padding: '7px 12px', fontSize: 12,
              color: 'var(--color-text)', cursor: 'pointer',
            }}>
              <Download size={12} /> Download Log
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <div style={{
          background: 'var(--color-card)', borderRadius: 10, border: '1px solid var(--color-border)', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              Hari ini: {doneTasks.length}/{todayTasks.length} selesai
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: pct === 100 ? '#059669' : pct >= 50 ? '#2563eb' : '#d97706',
            }}>
              {pct}%
            </span>
          </div>
          <div style={{ background: 'var(--color-border)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: pct === 100 ? '#059669' : pct >= 50 ? '#2563eb' : '#f59e0b',
              borderRadius: 999, transition: 'width 0.4s ease',
            }} />
          </div>
          {pct === 100 && (
            <p style={{ fontSize: 12, color: '#059669', marginTop: 8, fontWeight: 600 }}>
              🎉 Semua task selesai! GG WP!
            </p>
          )}
        </div>
      )}

      {/* Add task */}
      <div style={{
        background: 'var(--color-card)', borderRadius: 10, border: '1px solid var(--color-border)',
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setPriority(key as any)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '1.5px solid',
                borderColor: priority === key ? cfg.color : 'var(--color-border)',
                background: priority === key ? cfg.bg : 'transparent',
                fontSize: 11, color: priority === key ? cfg.color : 'var(--color-muted)',
                fontWeight: priority === key ? 600 : 400, cursor: 'pointer',
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
              flex: 1, border: '1px solid var(--color-border)', borderRadius: 7,
              padding: '8px 12px', fontSize: 14, color: 'var(--color-text)',
              outline: 'none', background: 'var(--color-surface)',
            }}
          />
          <button
            onClick={addTask}
            style={{
              background: '#2563eb', color: 'white', border: 'none',
              borderRadius: 7, padding: '8px 16px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
            PENDING — {pendingTasks.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingTasks.map(task => {
              const p = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task.id} style={{
                  background: 'var(--color-card)', borderRadius: 9, border: '1px solid var(--color-border)',
                  padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  borderLeft: `3px solid ${p.color}`,
                }}>
                  <button onClick={() => toggle(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                    <Circle size={18} color="var(--color-muted)" />
                  </button>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text)' }}>{task.text}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-muted)' }}>
                    <Clock size={11} />
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{task.time}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, opacity: 0.5 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
            DONE — {completedTasks.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completedTasks.map(task => (
              <div key={task.id} style={{
                background: 'var(--color-surface)', borderRadius: 9, border: '1px solid var(--color-border)',
                padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
                opacity: 0.65,
              }}>
                <button onClick={() => toggle(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                  <CheckCircle2 size={18} color="#059669" />
                </button>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--color-muted)', textDecoration: 'line-through' }}>{task.text}</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-muted)', opacity: 0.6 }}>{task.time}</span>
                <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, opacity: 0.4 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History toggle */}
      {historyTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              fontSize: 11, fontFamily: 'monospace', color: 'var(--color-muted)',
              fontWeight: 700, letterSpacing: 1, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, marginBottom: showHistory ? 8 : 0,
            }}
          >
            {showHistory ? '▼' : '▶'} HISTORY — {historyTasks.length} tasks
          </button>
          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {historyTasks.map(task => {
                const p = PRIORITY_CONFIG[task.priority];
                return (
                  <div key={task.id} style={{
                    background: 'var(--color-card)', borderRadius: 9, border: '1px solid var(--color-border)',
                    padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
                    opacity: 0.5, borderLeft: `3px solid ${p.color}`,
                  }}>
                    {task.done
                      ? <CheckCircle2 size={16} color="#059669" />
                      : <Circle size={16} color="var(--color-muted)" />
                    }
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)' }}>{task.dateKey}</span>
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {todayTasks.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)',
        }}>
          <CheckCircle2 size={36} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Belum ada task hari ini</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4, opacity: 0.6 }}>Tambahkan di atas!</p>
        </div>
      )}
    </div>
  );
}
