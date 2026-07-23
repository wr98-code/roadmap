// ─── ZERØ COMMAND — finance/QuickAddSheet.tsx ─────────────────────────────────
// Quick-add versi MOBILE: FAB ember di kanan-bawah (zona jempol — riset 2026:
// ~75% interaksi smartphone digerakkan jempol; aksi tersering wajib di
// sepertiga bawah layar) yang membuka bottom sheet berisi form transaksi.
// Kontrak sheet PWA (NN/g + Design for Native): grab handle + tombol X yang
// terlihat + tap backdrop menutup + tombol Back browser/Android MENUTUP SHEET
// (pushState/popstate) bukan keluar halaman. Tidak pernah menumpuk sheet.

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { FinanceData } from "@/lib/finance";
import { useT } from "@/lib/lang";
import { QuickAddCard } from "./QuickAddCard";

interface Props {
  fin: FinanceData;
  setFin: (fn: (f: FinanceData) => FinanceData) => void;
}

export function QuickAddSheet({ fin, setFin }: Props) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const pushedRef = useRef(false);

  // Back browser menutup sheet, bukan meninggalkan halaman (krusial di PWA)
  useEffect(() => {
    if (!open) return;
    history.pushState({ zcSheet: true }, "");
    pushedRef.current = true;
    const onPop = () => { pushedRef.current = false; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    // konsumsi entry history yang kita push supaya Back berikutnya normal
    if (pushedRef.current) { pushedRef.current = false; history.back(); }
    else setOpen(false);
  };

  return (
    <>
      {/* FAB — satu gestur ember yang percaya diri (aksen ≤5% piksel) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("qa.title")}
          title={t("qa.title")}
          style={{
            position: "fixed",
            right: 16,
            bottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
            zIndex: 88,
            width: 58,
            height: 58,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: "var(--ember)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 26px rgba(250,76,20,0.4), 0 2px 8px rgba(0,0,0,0.18)",
            animation: "auraIn var(--dur-delight) var(--ease-spring) both",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* Bottom sheet */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("qa.title")}
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(27,24,21,0.5)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "flex-end",
            animation: "fadeIn var(--dur-med) var(--ease-out) both",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxHeight: "88vh", overflowY: "auto",
              background: "var(--color-bg)",
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              borderTop: "1px solid var(--glass-border)",
              boxShadow: "0 -18px 48px rgba(0,0,0,0.28)",
              padding: "10px 16px calc(22px + env(safe-area-inset-bottom, 0px))",
              animation: "sheetUp var(--dur-slow) var(--ease-soft) both",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* grab handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 12px" }}>
              <span style={{ width: 40, height: 4, borderRadius: 999, background: "var(--color-border)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
                {t("qa.title")}
              </span>
              <button
                onClick={close}
                aria-label="Tutup"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* form transaksi — tetap terbuka setelah simpan (entri beruntun) */}
            <QuickAddCard fin={fin} setFin={setFin} bare />
          </div>
        </div>
      )}
    </>
  );
}
