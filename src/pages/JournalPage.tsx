// ─── ZERØ COMMAND — JournalPage.tsx ──────────────────────────────────────────
// Timestamped journal (useCloudState) — mood + tag, grouped by day, expandable,
// export-all, delete-with-confirm. Terminal restructure: flat hairline-seam
// panels (Slab), theme-aware CSS-var color hygiene (light + dark). All logic,
// useCloudState, add/delete/export preserved.
import { useState, useRef } from 'react';
import { Download, Trash2, Plus, BookOpen, Flame, Smile, Meh, Frown, Lightbulb, type LucideIcon } from 'lucide-react';
import { useCloudState } from '@/lib/cloudStorage';
import { Slab, Panel, SeamGrid, PanelHead, Divider, Badge, Stat, tLabelStyle, tNumStyle } from '@/components/terminal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  tag: string;
  date: string;
  time: string;
  dateKey: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

// `emoji` adalah KEY penyimpanan (kompatibel dengan entri lama di cloud state) —
// tidak pernah dirender ke UI; yang dirender adalah ikon lucide di `icon`.
const MOODS: { emoji: string; icon: LucideIcon; label: string }[] = [
  { emoji: '🔥', icon: Flame,    label: 'Produktif' },
  { emoji: '😊', icon: Smile,    label: 'Baik' },
  { emoji: '😐', icon: Meh,      label: 'Biasa' },
  { emoji: '😔', icon: Frown,    label: 'Berat' },
  { emoji: '💡', icon: Lightbulb, label: 'Insight' },
];

const TAGS = ['Catatan', 'Achievement', 'Ide', 'Masalah', 'Focus'];

// Entri lama menyimpan tag berformat "<emoji> Label" — tampilkan labelnya saja.
const tagLabel = (tag: string) => tag.replace(/[^\p{L}\p{N}\s]/gu, '').trim();

// ─── Entry Row (flat, hairline-separated) ─────────────────────────────────────

function EntryRow({
  entry, onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = entry.content.slice(0, 200);
  const hasMore = entry.content.length > 200;
  const moodDef = MOODS.find(m => m.emoji === entry.mood);

  return (
    <div style={{ background: 'var(--glass-bg)', padding: '12px 16px' }}>
      {/* Meta line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {moodDef && <moodDef.icon size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          background: 'var(--color-surface)', color: 'var(--color-muted)',
          padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-border)',
        }}>
          {tagLabel(entry.tag)}
        </span>
        <span className="num" style={{ ...tNumStyle, fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {entry.date} · {entry.time}
        </span>
        <button
          onClick={() => onDelete(entry.id)}
          title="Hapus catatan"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, opacity: 0.55, display: 'flex' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        fontSize: 14, color: 'var(--color-text)', lineHeight: 1.85,
        whiteSpace: 'pre-wrap',
      }}>
        {expanded ? entry.content : preview}
        {hasMore && !expanded && '...'}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 8, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 12, color: 'var(--color-primary)',
            fontWeight: 600, padding: 0,
          }}
        >
          {expanded ? 'Collapse' : 'Read more'}
        </button>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function JournalPage() {
  const [entries, setEntries] = useCloudState<JournalEntry[]>('zero-journal-entries', []);
  const [text, setText] = useState('');
  const [mood, setMood] = useState('😊'); // storage key — dirender sebagai ikon lucide
  const [tag, setTag] = useState('Catatan');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const now = new Date();
  const todayStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const addEntry = () => {
    if (!text.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      content: text.trim(),
      mood,
      tag,
      date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      dateKey: now.toDateString(),
    };

    setEntries([entry, ...entries]);
    setText('');
    textRef.current?.focus();
  };

  const deleteEntry = (id: string) => {
    if (!confirm('Hapus catatan ini?')) return;
    setEntries(entries.filter(e => e.id !== id));
  };

  const downloadAll = () => {
    const txt = entries.map(e =>
      `[${e.date} ${e.time}] ${e.mood} ${e.tag}\n${'─'.repeat(50)}\n${e.content}\n`
    ).join('\n\n');

    const blob = new Blob(
      [`ZERØ JOURNAL\n${'═'.repeat(50)}\nTotal: ${entries.length} entries\n\n${txt}`],
      { type: 'text/plain; charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zero-journal-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const grouped = entries.reduce<Record<string, JournalEntry[]>>((acc, e) => {
    if (!acc[e.dateKey]) acc[e.dateKey] = [];
    acc[e.dateKey].push(e);
    return acc;
  }, {});

  const todayEntries = entries.filter(e => e.dateKey === now.toDateString());

  return (
    <div className="space-y-6">
      {/* Header — paneled slab with live readouts */}
      <Slab>
        <SeamGrid cols="1.6fr 1fr 1fr">
          <Panel style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              background: 'var(--rail-active-bg)', border: '1px solid var(--rail-active-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={22} color="var(--color-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', margin: 0 }}>
                ZERØ JOURNAL
              </h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', margin: '4px 0 0', letterSpacing: '0.04em' }}>
                {todayStr}
              </p>
            </div>
          </Panel>
          <Stat label="Catatan Hari Ini" value={todayEntries.length} tint="var(--color-primary)" />
          <Stat label="Total Entri" value={entries.length} />
        </SeamGrid>
      </Slab>

      {/* Composer — one slab, hairline-seamed sections */}
      <Slab>
        <PanelHead
          title="Tulis Catatan"
          right={<Badge tone="muted"><span className="num">{text.length}</span> CHARS</Badge>}
        />

        {/* Mood + Tag selector */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          background: 'var(--glass-bg)',
        }}>
          <span style={tLabelStyle}>Mood</span>
          {MOODS.map(m => {
            const active = mood === m.emoji;
            return (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                title={m.label}
                style={{
                  background: active ? 'var(--rail-active-bg)' : 'var(--color-surface)',
                  border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  borderRadius: 6, padding: '4px 8px',
                  display: 'flex', alignItems: 'center',
                  color: active ? 'var(--color-primary)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all .1s', lineHeight: 1,
                }}
              >
                <m.icon size={16} />
              </button>
            );
          })}
          <span style={{ ...tLabelStyle, marginLeft: 8 }}>Tag</span>
          <select
            value={tag}
            onChange={e => setTag(e.target.value)}
            style={{
              border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px',
              fontSize: 12, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none',
            }}
          >
            {TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Textarea */}
        <div style={{ padding: '14px 16px', background: 'var(--glass-bg)' }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tulis apa yang terjadi hari ini, ide, insight, pencapaian, apapun..."
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) addEntry();
            }}
            style={{
              width: '100%', minHeight: 120, resize: 'vertical',
              fontSize: 14, color: 'var(--color-text)', lineHeight: 1.8,
              padding: '12px 14px', fontFamily: "'DM Sans', sans-serif",
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 7, outline: 'none',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--glass-bg)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
            CTRL+ENTER TO SAVE · <span className="num">{text.length}</span> CHARS
          </span>
          <button
            onClick={addEntry}
            disabled={!text.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: text.trim() ? 'var(--color-primary)' : 'var(--color-surface)',
              color: text.trim() ? 'hsl(var(--primary-foreground))' : 'var(--color-muted)',
              border: text.trim() ? 'none' : '1px solid var(--color-border)',
              borderRadius: 7, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
            }}
          >
            <Plus size={13} /> Simpan
          </button>
        </div>
      </Slab>

      {/* Journal log */}
      {entries.length === 0 ? (
        <Slab>
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--glass-bg)' }}>
            <BookOpen size={36} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Journal masih kosong</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4, opacity: 0.65 }}>Tulis sesuatu di atas!</p>
          </div>
        </Slab>
      ) : (
        <Slab>
          <PanelHead
            title="Journal Log"
            right={
              <button
                onClick={downloadAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  borderRadius: 6, padding: '5px 12px',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  color: 'var(--color-text)', cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                <Download size={12} /> Export All (<span className="num">{entries.length}</span>)
              </button>
            }
          />
          {Object.entries(grouped).map(([dateKey, dayEntries], gi) => {
            const firstEntry = dayEntries[0];
            return (
              <div key={dateKey}>
                {gi > 0 && <Divider />}
                {/* Day sub-header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '8px 16px', background: 'var(--color-surface)',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={tLabelStyle}>{firstEntry.date}</span>
                  <span className="num" style={{ ...tLabelStyle }}>{dayEntries.length} ENTRI</span>
                </div>
                {dayEntries.map((entry, i) => (
                  <div key={entry.id}>
                    <EntryRow entry={entry} onDelete={deleteEntry} />
                    {i < dayEntries.length - 1 && <Divider />}
                  </div>
                ))}
              </div>
            );
          })}
        </Slab>
      )}
    </div>
  );
}
