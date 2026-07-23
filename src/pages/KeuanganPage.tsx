// ─── ZERØ COMMAND — KeuanganPage.tsx v2 "ATELIER" ─────────────────────────────
// Sistem pencatatan keuangan penuh:
//   Ringkasan bulanan (SURPLUS / BONCOS) → Quick-add → Kantong (per tipe:
//   Bank / E-Wallet / Crypto / Cash) → Pemasukan per Sumber (Trading / Bisnis /
//   Personal + chart gabungan + P&L harian trading) → Kategori → Tren bulanan →
//   Riwayat transaksi (filter / edit / hapus+undo).
// Seksi lama dipertahankan: Status, Goals, Notes tetap tampil; ledger manual
// lama (income log + pengeluaran bulanan) pindah ke "Arsip Catatan Lama" —
// datanya tidak dihapus dan tetap bisa diedit.

import { useCallback, useState } from "react";
import { AppData, IncomeEntry, ExpenseEntry } from "@/lib/store";
import { FinanceData, currentMonth } from "@/lib/finance";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Slab, PanelHead, Divider, Badge, PageTitle } from "@/components/terminal";
import { Plus, Trash2 } from "lucide-react";
import { SummaryHero } from "@/components/finance/SummaryHero";
import { QuickAddCard } from "@/components/finance/QuickAddCard";
import { AccountsSection } from "@/components/finance/AccountsSection";
import { SourcesSection } from "@/components/finance/SourcesSection";
import { CategorySection } from "@/components/finance/CategorySection";
import { TrendSection } from "@/components/finance/TrendSection";
import { TransactionsSection } from "@/components/finance/TransactionsSection";
import { ManageModal } from "@/components/finance/ManageModal";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function KeuanganPage({ data, update }: Props) {
  const k = data.keuangan;
  const fin = k.finance;

  const [month, setMonth] = useState(currentMonth());
  const [manageOpen, setManageOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);

  const setFin = useCallback(
    (fn: (f: FinanceData) => FinanceData) =>
      update((d) => ({ ...d, keuangan: { ...d.keuangan, finance: fn(d.keuangan.finance) } })),
    [update]
  );

  const goalsDone = k.goals.filter((g) => g.checked).length;
  const goalsTotal = k.goals.length;

  // ── Legacy ledger (pra-sistem transaksi) — dipertahankan, tidak dihapus ──
  const legacyCount = k.incomeLog.length + k.pengeluaran.filter((e) => e.jumlah).length;

  const addIncome = () => {
    const entry: IncomeEntry = {
      id: Math.random().toString(36).slice(2, 9),
      tanggal: "", sumber: "", jumlah: "", mataUang: "USD",
    };
    update((d) => ({ ...d, keuangan: { ...d.keuangan, incomeLog: [...d.keuangan.incomeLog, entry] } }));
  };
  const updateIncome = (id: string, patch: Partial<IncomeEntry>) =>
    update((d) => ({
      ...d,
      keuangan: { ...d.keuangan, incomeLog: d.keuangan.incomeLog.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
    }));
  const deleteIncome = (id: string) =>
    update((d) => ({ ...d, keuangan: { ...d.keuangan, incomeLog: d.keuangan.incomeLog.filter((e) => e.id !== id) } }));
  const updateExpense = (id: string, patch: Partial<ExpenseEntry>) =>
    update((d) => ({
      ...d,
      keuangan: { ...d.keuangan, pengeluaran: d.keuangan.pengeluaran.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
    }));

  return (
    <div className="space-y-5">
      <PageTitle
        title="Keuangan"
        subtitle="KANTONG · TRANSAKSI · SURPLUS VS BONCOS"
        right={<Badge tone="accent">TRACKER</Badge>}
      />

      <SummaryHero fin={fin} month={month} setMonth={setMonth} onOpenManage={() => setManageOpen(true)} />
      <QuickAddCard fin={fin} setFin={setFin} />
      <AccountsSection fin={fin} setFin={setFin} accountFilter={accountFilter} setAccountFilter={setAccountFilter} />
      <SourcesSection fin={fin} month={month} />
      <CategorySection fin={fin} month={month} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} />
      <TrendSection fin={fin} />
      <TransactionsSection
        fin={fin}
        setFin={setFin}
        month={month}
        accountFilter={accountFilter}
        setAccountFilter={setAccountFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      {manageOpen && <ManageModal fin={fin} setFin={setFin} onClose={() => setManageOpen(false)} />}

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

      {/* ── Arsip ledger manual lama (pra-sistem transaksi) ── */}
      {legacyCount > 0 && (
        <Slab>
          <PanelHead
            title="Arsip Catatan Lama"
            right={
              <button
                onClick={() => setShowLegacy(!showLegacy)}
                style={{
                  background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: 999, padding: "5px 13px", fontSize: 11.5, fontWeight: 600,
                  color: "var(--color-muted)", cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                {showLegacy ? "Sembunyikan" : `Buka (${legacyCount})`}
              </button>
            }
          />
          {showLegacy && (
            <>
              <div style={{ padding: "0 16px 8px" }}>
                <p style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.55, margin: 0 }}>
                  Ledger manual sebelum sistem transaksi — tetap tersimpan & bisa diedit.
                  Catatan baru sebaiknya lewat form transaksi di atas.
                </p>
              </div>
              {k.incomeLog.length > 0 && (
                <div style={{ overflowX: "auto", padding: "0 8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        {["Tanggal", "Sumber", "Jumlah", "Mata Uang", ""].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {k.incomeLog.map((entry) => (
                        <tr key={entry.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "3px 6px" }}>
                            <input value={entry.tanggal} onChange={(e) => updateIncome(entry.id, { tanggal: e.target.value })} placeholder="DD/MM/YYYY" className="kg-in num" />
                          </td>
                          <td style={{ padding: "3px 6px" }}>
                            <input value={entry.sumber} onChange={(e) => updateIncome(entry.id, { sumber: e.target.value })} placeholder="Source" className="kg-in" />
                          </td>
                          <td style={{ padding: "3px 6px" }}>
                            <input value={entry.jumlah} onChange={(e) => updateIncome(entry.id, { jumlah: e.target.value })} placeholder="0" className="kg-in num right" />
                          </td>
                          <td style={{ padding: "3px 6px" }}>
                            <input value={entry.mataUang} onChange={(e) => updateIncome(entry.id, { mataUang: e.target.value })} className="kg-in num" />
                          </td>
                          <td style={{ padding: "3px 6px", textAlign: "right" }}>
                            <button onClick={() => deleteIncome(entry.id)} className="kg-del" title="Hapus entry">
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ padding: "10px 16px" }}>
                <button
                  onClick={addIncome}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 13px", borderRadius: 999,
                    background: "var(--color-surface)", color: "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  <Plus style={{ width: 13, height: 13 }} /> Add entry lama
                </button>
              </div>
              {k.pengeluaran.length > 0 && (
                <>
                  <Divider />
                  <div style={{ overflowX: "auto", padding: "8px 8px 12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          {["Kategori (pos bulanan lama)", "Jumlah"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {k.pengeluaran.map((entry) => (
                          <tr key={entry.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                            <td style={{ padding: "9px 10px", color: "var(--color-text)", fontWeight: 500 }}>{entry.kategori}</td>
                            <td style={{ padding: "3px 6px" }}>
                              <input value={entry.jumlah} onChange={(e) => updateExpense(entry.id, { jumlah: e.target.value })} placeholder="0" className="kg-in num right" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </Slab>
      )}

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
        .kg-in.num { font-variant-numeric: tabular-nums; }
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
