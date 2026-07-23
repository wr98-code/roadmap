// ─── ZERØ COMMAND — MetricInfo.tsx ────────────────────────────────────────────
// Tooltip istilah finansial yang SELALU membaca dari kamus pusat
// (src/lib/glossary.ts) — satu sumber kebenaran, tidak ada definisi
// terpisah-pisah di tiap komponen. children opsional = catatan konteks
// tambahan spesifik halaman, ditampilkan setelah definisi kamus.

import { ReactNode } from "react";
import { InfoTip } from "@/components/InfoTip";
import { getTerm } from "@/lib/glossary";

export function MetricInfo({ termId, children }: { termId: string; children?: ReactNode }) {
  const t = getTerm(termId);
  if (!t) {
    // id salah ketik → jangan diam-diam: tooltip tetap muncul dengan penanda
    return <InfoTip term={termId}>Istilah "{termId}" belum ada di kamus (lib/glossary.ts).</InfoTip>;
  }
  return (
    <InfoTip term={t.full ? `${t.term} — ${t.full}` : t.term}>
      {t.def}
      {t.formula && (
        <span style={{
          display: "block", marginTop: 6, padding: "5px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.07)", fontSize: 10.5,
          fontVariantNumeric: "tabular-nums",
        }}>
          {t.formula}
        </span>
      )}
      {children && <span style={{ display: "block", marginTop: 6, opacity: 0.8 }}>{children}</span>}
    </InfoTip>
  );
}
