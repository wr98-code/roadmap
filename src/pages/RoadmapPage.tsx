import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { CheckList } from "@/components/CheckList";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function RoadmapPage({ data, update }: Props) {
  const r = data.roadmap;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg text-primary">Roadmap 90 Hari</h2>

      <SectionCard title="Minggu 1–2: Cari Klien Aktif">
        <CheckList
          items={r.minggu12}
          onChange={(items) =>
            update((d) => ({ ...d, roadmap: { ...d.roadmap, minggu12: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Minggu 3–4: Monetisasi">
        <CheckList
          items={r.minggu34}
          onChange={(items) =>
            update((d) => ({ ...d, roadmap: { ...d.roadmap, minggu34: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Bulan 2: Scale">
        <CheckList
          items={r.bulan2}
          onChange={(items) =>
            update((d) => ({ ...d, roadmap: { ...d.roadmap, bulan2: items } }))
          }
        />
      </SectionCard>

      <SectionCard title="Bulan 3: Stabilisasi">
        <CheckList
          items={r.bulan3}
          onChange={(items) =>
            update((d) => ({ ...d, roadmap: { ...d.roadmap, bulan3: items } }))
          }
        />
      </SectionCard>

      <h2 className="font-heading text-lg text-primary pt-4">Roadmap 5 Tahun</h2>

      <SectionCard title="Long-term Vision">
        <EditableText
          value={r.roadmap5tahun}
          onChange={(val) =>
            update((d) => ({ ...d, roadmap: { ...d.roadmap, roadmap5tahun: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Notes">
        <NotesList
          notes={r.notes}
          onChange={(notes) =>
            update((d) => ({ ...d, roadmap: { ...d.roadmap, notes } }))
          }
        />
      </SectionCard>
    </div>
  );
}
