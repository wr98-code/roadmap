import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

export function CryptoPage({ data, update }: Props) {
  const c = data.crypto;

  return (
    <div className="space-y-6">
      <SectionCard title="COINGLASS GUIDE">
        <EditableText
          value={c.coinglassGuide}
          onChange={(val) =>
            update((d) => ({ ...d, crypto: { ...d.crypto, coinglassGuide: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="NUPL ON CHAIN">
        <EditableText
          value={c.nuplOnChain}
          onChange={(val) =>
            update((d) => ({ ...d, crypto: { ...d.crypto, nuplOnChain: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="ONE STEP">
        <EditableText
          value={c.oneStep}
          onChange={(val) =>
            update((d) => ({ ...d, crypto: { ...d.crypto, oneStep: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Notes">
        <NotesList
          notes={c.notes}
          onChange={(notes) =>
            update((d) => ({ ...d, crypto: { ...d.crypto, notes } }))
          }
        />
      </SectionCard>
    </div>
  );
}
