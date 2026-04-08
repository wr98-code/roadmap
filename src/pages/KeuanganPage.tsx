import { AppData, IncomeEntry, ExpenseEntry } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
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

  return (
    <div className="space-y-6">
      <SectionCard title="Status Keuangan">
        <EditableText
          value={k.statusKeuangan}
          onChange={(val) =>
            update((d) => ({ ...d, keuangan: { ...d.keuangan, statusKeuangan: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Income Log">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-heading text-xs text-muted-foreground">Tanggal</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Sumber</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Jumlah</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Mata Uang</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {k.incomeLog.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50">
                  <td className="py-1">
                    <input
                      value={entry.tanggal}
                      onChange={(e) => updateIncome(entry.id, { tanggal: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-transparent text-foreground text-sm px-1 py-1 focus:outline-none focus:bg-muted/30 rounded"
                    />
                  </td>
                  <td className="py-1">
                    <input
                      value={entry.sumber}
                      onChange={(e) => updateIncome(entry.id, { sumber: e.target.value })}
                      placeholder="Source"
                      className="w-full bg-transparent text-foreground text-sm px-1 py-1 focus:outline-none focus:bg-muted/30 rounded"
                    />
                  </td>
                  <td className="py-1">
                    <input
                      value={entry.jumlah}
                      onChange={(e) => updateIncome(entry.id, { jumlah: e.target.value })}
                      placeholder="0"
                      className="w-full bg-transparent text-foreground text-sm px-1 py-1 focus:outline-none focus:bg-muted/30 rounded"
                    />
                  </td>
                  <td className="py-1">
                    <input
                      value={entry.mataUang}
                      onChange={(e) => updateIncome(entry.id, { mataUang: e.target.value })}
                      className="w-full bg-transparent text-foreground text-sm px-1 py-1 focus:outline-none focus:bg-muted/30 rounded"
                    />
                  </td>
                  <td className="py-1">
                    <button
                      onClick={() => deleteIncome(entry.id)}
                      className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addIncome}
          className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Entry
        </button>
      </SectionCard>

      <SectionCard title="Pengeluaran Bulanan">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-heading text-xs text-muted-foreground">Kategori</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {k.pengeluaran.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{entry.kategori}</td>
                  <td className="py-1">
                    <input
                      value={entry.jumlah}
                      onChange={(e) => updateExpense(entry.id, { jumlah: e.target.value })}
                      placeholder="0"
                      className="w-full bg-transparent text-foreground text-sm px-1 py-1 focus:outline-none focus:bg-muted/30 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Goals Keuangan">
        <CheckList
          items={k.goals}
          onChange={(items) =>
            update((d) => ({ ...d, keuangan: { ...d.keuangan, goals: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Notes">
        <NotesList
          notes={k.notes}
          onChange={(notes) =>
            update((d) => ({ ...d, keuangan: { ...d.keuangan, notes } }))
          }
        />
      </SectionCard>
    </div>
  );
}
