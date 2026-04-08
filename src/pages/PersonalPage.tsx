import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function PersonalPage({ data, update }: Props) {
  const p = data.personal;

  return (
    <div className="space-y-6">
      <SectionCard title="Rules Survival Mode">
        <EditableText
          value={p.rulesSurvival}
          onChange={(val) =>
            update((d) => ({ ...d, personal: { ...d.personal, rulesSurvival: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Daily Discipline">
        <CheckList
          items={p.dailyDiscipline}
          onChange={(items) =>
            update((d) => ({ ...d, personal: { ...d.personal, dailyDiscipline: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Mindset">
        <EditableText
          value={p.mindset}
          onChange={(val) =>
            update((d) => ({ ...d, personal: { ...d.personal, mindset: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Checklist Rebuild">
        <CheckList
          items={p.checklistRebuild}
          onChange={(items) =>
            update((d) => ({ ...d, personal: { ...d.personal, checklistRebuild: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Notes">
        <NotesList
          notes={p.notes}
          onChange={(notes) =>
            update((d) => ({ ...d, personal: { ...d.personal, notes } }))
          }
        />
      </SectionCard>
    </div>
  );
}
