import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function BuildLabPage({ data, update }: Props) {
  const bl = data.buildLab;

  const statusColor = (s: string) => {
    if (s.includes("AKTIF")) return "bg-primary/20 text-primary";
    if (s.includes("✅")) return "bg-emerald-900/30 text-emerald-400";
    if (s.includes("CRITICAL")) return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Status Board">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-heading text-xs text-muted-foreground">Area</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Status</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Prioritas</th>
              </tr>
            </thead>
            <tbody>
              {bl.statusBoard.map((s) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-2.5 text-foreground">{s.area}</td>
                  <td className="py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground font-heading text-xs">{s.prioritas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Focus Minggu Ini">
        <CheckList
          items={bl.focusMingguIni}
          onChange={(items) =>
            update((d) => ({ ...d, buildLab: { ...d.buildLab, focusMingguIni: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Income Target">
        <EditableText
          value={bl.incomeTarget}
          onChange={(val) =>
            update((d) => ({ ...d, buildLab: { ...d.buildLab, incomeTarget: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Notes">
        <NotesList
          notes={bl.notes}
          onChange={(notes) =>
            update((d) => ({ ...d, buildLab: { ...d.buildLab, notes } }))
          }
        />
      </SectionCard>
    </div>
  );
}
