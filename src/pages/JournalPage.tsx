import { useState, useRef } from 'react';
import { Download, Trash2, Plus, BookOpen } from 'lucide-react';
import { useCloudState } from '@/lib/cloudStorage';

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

const MOODS = [
  { emoji: '🔥', label: 'Produktif' },
  { emoji: '😊', label: 'Baik' },
  { emoji: '😐', label: 'Biasa' },
  { emoji: '😔', label: 'Berat' },
  { emoji: '💡', label: 'Insight' },
];

const TAGS = ['📝 Catatan', '✅ Achievement', '💡 Ide', '⚠️ Masalah', '🎯 Focus'];

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry, onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = entry.content.slice(0, 200);
  const hasMore = entry.content.length > 200;

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 10, border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{entry.mood}</span>
        <span style={{
          fontSize: 11, background: 'var(--color-surface)', color: 'var(--color-muted)',
          padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-border)',
        }}>
          {entry.tag}
        </span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {entry.date} · {entry.time}
        </span>
        <button
          onClick={() => onDelete(entry.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, opacity: 0.5 }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div style={{ padding: '14px 16px' }}>
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
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function JournalPage() {
  const [entries, setEntries] = useCloudState<JournalEntry[]>('zero-journal-entries', []);
  const [text, setText] = useState('');
  const [mood, setMood] = useState('😊');
  const [tag, setTag] = useState('📝 Catatan');
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="font-heading text-lg">Journal</h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {todayStr} · {todayEntries.length} catatan hari ini
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={downloadAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid var(--color-border)', background: 'var(--color-card)',
              borderRadius: 7, padding: '7px 14px', fontSize: 12,
              color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            <Download size={12} /> Download All ({entries.length})
          </button>
        )}
      </div>

      {/* Write box */}
      <div style={{
        background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        {/* Mood + Tag selector */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>MOOD:</span>
          {MOODS.map(m => (
            <button
              key={m.emoji}
              onClick={() => setMood(m.emoji)}
              title={m.label}
              style={{
                background: mood === m.emoji ? 'rgba(134,239,172,0.15)' : 'transparent',
                border: mood === m.emoji ? '1.5px solid #86efac' : '1.5px solid var(--color-border)',
                borderRadius: 6, padding: '3px 8px', fontSize: 16,
                cursor: 'pointer', transition: 'all .1s',
              }}
            >
              {m.emoji}
            </button>
          ))}
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginLeft: 8 }}>TAG:</span>
          <select
            value={tag}
            onChange={e => setTag(e.target.value)}
            style={{
              border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px',
              fontSize: 12, color: 'var(--color-text)', background: 'var(--color-card)', outline: 'none',
            }}
          >
            {TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Textarea */}
        <textarea
          ref={textRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Tulis apa yang terjadi hari ini, ide, insight, pencapaian, apapun..."
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) addEntry();
          }}
          style={{
            width: '100%', minHeight: 120, border: 'none', outline: 'none',
            resize: 'vertical', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.8,
            padding: '14px 16px', fontFamily: "'DM Sans', sans-serif",
            background: 'transparent',
          }}
        />

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            Ctrl+Enter to save · {text.length} chars
          </span>
          <button
            onClick={addEntry}
            disabled={!text.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: text.trim() ? '#2563eb' : 'var(--color-surface)',
              color: text.trim() ? 'white' : 'var(--color-muted)',
              border: 'none', borderRadius: 7, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
            }}
          >
            <Plus size={13} /> Simpan
          </button>
        </div>
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)',
        }}>
          <BookOpen size={36} color="var(--color-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Journal masih kosong</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4, opacity: 0.6 }}>Tulis sesuatu di atas!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateKey, dayEntries]) => {
          const firstEntry = dayEntries[0];
          return (
            <div key={dateKey}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', fontFamily: 'monospace',
                letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                {firstEntry.date}
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
