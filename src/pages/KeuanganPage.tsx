// ─── ZERØ COMMAND — KeuanganPage.tsx ─────────────────────────────────────────
// Finance ledger: status markdown, income log CRUD, monthly expenses (edit-only),
// goals checklist, notes. Institutional "terminal" restructure — flat panels +
// hairline seams, mono tabular numerals, CSS-var colors (light + dark).
// Every update() call, field, handler & feature preserved.
import { AppData, IncomeEntry, ExpenseEntry } from "@/lib/store";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Slab, SeamGrid, PanelHead, Divider, Stat, Badge, PageTitle } from "@/components/terminal";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function KeuanganPage({ data, update }: Props) {
  const k = data.keuangan;

  const addIncome = () => {
    const entry: IncomeEntry = {
      id: Math.random().toString(36).slice(2, 9),
      tanggal: "",
      sumber: "",
      jumlah: "",
      mataUang: "USD",
    };
    update((d) => ({
      ...d,
      keuangan: { ...d.keuangan, incomeLog: [...d.keuangan.incomeLog, entry] },
    }));
  };

  const updateIncome = (id: string, patch: Partial<IncomeEntry>) => {
    update((d) => ({
      ...d,
      keuangan: {
        ...d.keuangan,
        incomeLog: d.keuangan.incomeLog.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      },
    }));
  };

  const deleteIncome = (id: string) => {
    update((d) => ({
      ...d,
      keuangan: {
        ...d.keuangan,
        incomeLog: d.keuangan.incomeLog.filter((e) => e.id !== id),
      },
    }));
  };

  const updateExpense = (id: string, patch: Partial<ExpenseEntry>) => {
    update((d) => ({
      ...d,
      keuangan: {
        ...d.keuangan,
        pengeluaran: d.keuangan.pengeluaran.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      },
    }));
  };

  // ── Derived readout counts (truthful, no fabrication) ──
  const goalsTotal = k.goals.length;
  const goalsDone = k.goals.filter((g) => g.checked).length;
  const goalsPct = goalsTotal ? Math.round((goalsDone / goalsTotal) * 100) : 0;

  // ── Institutional table header cell ──
  const th = (label: string, opts?: { right?: boolean; width?: number }): React.CSSProperties => ({
    textAlign: opts?.right ? "right" : "left",
    padding: "9px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-muted)",
    width: opts?.width,
    whiteSpace: "nowrap",
  });

  return (
    <div className="space-y-5">
      <PageTitle
        title="Keuangan"
        subtitle="CASH FLOW · LEDGER"
        right={<Badge tone="accent">LEDGER</Badge>}
      />

      {/* ── KPI readout spine ── */}
      <Slab>
        <SeamGrid cols="1fr 1fr 1fr">
          <Stat label="Income Log" value={k.incomeLog.length} sub="entries logged" />
          <Stat label="Expense Lines" value={k.pengeluaran.length} sub="monthly posts" />
          <Stat
            label="Goals"
            value={`${goalsDone}/${goalsTotal}`}
            sub={`${goalsPct}% complete`}
            tint={goalsTotal > 0 && goalsDone === goalsTotal ? "var(--gain)" : "var(--color-text)"}
          />
        </SeamGrid>
      </Slab>

      {/* ── Status Keuangan ── */}
      <Slab>
        <PanelHead title="Status Keuangan" />
        <div style={{ padding: "14px 16px" }}>
          <EditableText
            value={k.statusKeuangan}
            onChange={(val) =>
              update((d) => ({ ...d, keuangan: { ...d.keuangan, statusKeuangan: val } }))
            }
          />
        </div>
      </Slab>

      {/* ── Income Log (CRUD) ── */}
      <Slab>
        <PanelHead
          title="Income Log"
          right={k.incomeLog.length > 0 ? <Badge>{k.incomeLog.length} ENTRIES</Badge> : undefined}
        />
        {k.incomeLog.length === 0 ? (
          <div style={{ padding: "22px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)", letterSpacing: "0.04em" }}>
            Belum ada income entry. Tap Add Entry untuk mulai.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={th("Tanggal")}>Tanggal</th>
                  <th style={th("Sumber")}>Sumber</th>
                  <th style={th("Jumlah", { right: true })}>Jumlah</th>
                  <th style={th("Mata Uang")}>Mata Uang</th>
                  <th style={th("", { width: 44 })}></th>
                </tr>
              </thead>
              <tbody>
                {k.incomeLog.map((entry, i) => (
                  <tr key={entry.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                    <td style={{ padding: "3px 8px" }}>
                      <input
                        value={entry.tanggal}
                        onChange={(e) => updateIncome(entry.id, { tanggal: e.target.value })}
                        placeholder="DD/MM/YYYY"
                        className="kg-in num"
                      />
                    </td>
                    <td style={{ padding: "3px 8px" }}>
                      <input
                        value={entry.sumber}
                        onChange={(e) => updateIncome(entry.id, { sumber: e.target.value })}
                        placeholder="Source"
                        className="kg-in"
                      />
                    </td>
                    <td style={{ padding: "3px 8px" }}>
                      <input
                        value={entry.jumlah}
                        onChange={(e) => updateIncome(entry.id, { jumlah: e.target.value })}
                        placeholder="0"
                        className="kg-in num right"
                      />
                    </td>
                    <td style={{ padding: "3px 8px" }}>
                      <input
                        value={entry.mataUang}
                        onChange={(e) => updateIncome(entry.id, { mataUang: e.target.value })}
                        className="kg-in num"
                      />
                    </td>
                    <td style={{ padding: "3px 8px", textAlign: "right" }}>
                      <button
                        onClick={() => deleteIncome(entry.id)}
                        className="kg-del"
                        title="Hapus entry"
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Divider />
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={addIncome}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 7,
              background: "var(--rail-active-bg)", color: "var(--color-primary)",
              border: "1px solid var(--rail-active-border)",
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} /> ADD ENTRY
          </button>
        </div>
      </Slab>

      {/* ── Pengeluaran Bulanan (edit-only) ── */}
      <Slab>
        <PanelHead
          title="Pengeluaran Bulanan"
          right={k.pengeluaran.length > 0 ? <Badge>{k.pengeluaran.length} POS</Badge> : undefined}
        />
        {k.pengeluaran.length === 0 ? (
          <div style={{ padding: "22px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)", letterSpacing: "0.04em" }}>
            Belum ada pos pengeluaran.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={th("Kategori")}>Kategori</th>
                  <th style={th("Jumlah", { right: true })}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {k.pengeluaran.map((entry, i) => (
                  <tr key={entry.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--color-text)", fontWeight: 500 }}>{entry.kategori}</td>
                    <td style={{ padding: "3px 8px" }}>
                      <input
                        value={entry.jumlah}
                        onChange={(e) => updateExpense(entry.id, { jumlah: e.target.value })}
                        placeholder="0"
                        className="kg-in num right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Slab>

      {/* ── Goals Keuangan ── */}
      <Slab>
        <PanelHead
          title="Goals Keuangan"
          right={goalsTotal > 0 ? <Badge tone={goalsDone === goalsTotal ? "gain" : "muted"}>{goalsDone}/{goalsTotal}</Badge> : undefined}
        />
        <div style={{ padding: "14px 16px" }}>
          <CheckList
            items={k.goals}
            onChange={(items) =>
              update((d) => ({ ...d, keuangan: { ...d.keuangan, goals: items } }))
            }
          />
        </div>
      </Slab>

      {/* ── Notes ── */}
      <Slab>
        <PanelHead title="Notes" />
        <div style={{ padding: "14px 16px" }}>
          <NotesList
            notes={k.notes}
            onChange={(notes) =>
              update((d) => ({ ...d, keuangan: { ...d.keuangan, notes } }))
            }
          />
        </div>
      </Slab>

      {/* Dense ledger input styling — all theme vars, works light + dark */}
      <style>{`
        .kg-in {
          width: 100%; box-sizing: border-box;
          background: transparent; border: none; outline: none;
          color: var(--color-text); font-family: var(--font-sans);
          font-size: 12px; padding: 6px 8px; border-radius: 6px;
          transition: background 0.15s;
        }
        .kg-in::placeholder { color: var(--color-muted); }
        .kg-in:focus { background: var(--color-surface); }
        .kg-in.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
        .kg-in.right { text-align: right; }
        .kg-del {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 5px; border-radius: 6px; background: transparent; border: none;
          color: var(--color-muted); cursor: pointer; transition: all 0.15s;
        }
        .kg-del:hover { background: var(--loss-soft); color: var(--loss); }
      `}</style>
    </div>
  );
}
