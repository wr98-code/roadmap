import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function TradingPage({ data, update }: Props) {
  const t = data.trading;

  return (
    <div className="space-y-6">
      <SectionCard title="Road Map $100,000 — Game Plan Expert 12 Bulan">
        <CheckList
          items={t.gamePlan}
          onChange={(items) =>
            update((d) => ({ ...d, trading: { ...d.trading, gamePlan: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Checklist Harian">
        <CheckList
          items={t.checklistHarian}
          onChange={(items) =>
            update((d) => ({ ...d, trading: { ...d.trading, checklistHarian: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Compounding Protocol">
        <EditableText
          value={t.compounding}
          onChange={(val) =>
            update((d) => ({ ...d, trading: { ...d.trading, compounding: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Recovery Protocol">
        <EditableText
          value={t.recovery}
          onChange={(val) =>
            update((d) => ({ ...d, trading: { ...d.trading, recovery: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Notes">
        <NotesList
          notes={t.notes}
          onChange={(notes) =>
            update((d) => ({ ...d, trading: { ...d.trading, notes } }))
          }
        />
      </SectionCard>
    </div>
  );
}
