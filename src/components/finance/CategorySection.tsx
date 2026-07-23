// ─── ZERØ COMMAND — finance/CategorySection.tsx ───────────────────────────────
// Breakdown pengeluaran per kategori: ranked horizontal bar (posisi pada
// baseline sama > donut untuk perbandingan; label panjang aman), label nama +
// nilai selalu tampak (warna tidak pernah jadi satu-satunya kanal).
// Kategori ber-limit → progress vs limit (envelope), framing netral.

import { ShoppingBag } from "lucide-react";
import {
  FinanceData, categoryBreakdown, fmtMoney, monthLabel, catColor,
} from "@/lib/finance";
import { useT } from "@/lib/lang";
import { MetricInfo } from "@/components/MetricInfo";
import { Card, Label, EmptyState } from "./ui";

interface Props {
  fin: FinanceData;
  month: string;
  categoryFilter: string | null;
  setCategoryFilter: (id: string | null) => void;
}

const MAX_ROWS = 7;

export function CategorySection({ fin, month, categoryFilter, setCategoryFilter }: Props) {
  const cur = fin.currency;
  const t = useT();
  const slices = categoryBreakdown(fin, month);
  const total = slices.reduce((s, x) => s + x.total, 0);

  const top = slices.slice(0, MAX_ROWS);
  const rest = slices.slice(MAX_ROWS);
  const restTotal = rest.reduce((s, x) => s + x.total, 0);
  const maxVal = Math.max(...top.map((s) => s.total), restTotal, 1);

  return (
    <Card className="rise rise-5">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <Label style={{ display: "inline-flex", alignItems: "center" }}>
          Pengeluaran per kategori
          <MetricInfo termId="envelope-budgeting">
            Klik sebuah kategori untuk memfilter daftar transaksi. Limit per kategori
            diatur lewat tombol Kelola.
          </MetricInfo>
        </Label>
        <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>{monthLabel(month, true)}</span>
        <div style={{ flex: 1 }} />
        {total > 0 && (
          <span className="num" style={{ fontSize: 16, fontWeight: 700, color: "var(--loss)" }}>
            {fmtMoney(total, cur)}
          </span>
        )}
      </div>

      {total === 0 ? (
        <EmptyState
          compact
          icon={<ShoppingBag size={26} />}
          title={`Belum ada pengeluaran di ${monthLabel(month, true)}`}
          hint="Catat pengeluaran harian lewat form di atas — breakdown per kategori tersusun otomatis."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {top.map((s) => {
            const pct = Math.round((s.total / total) * 100);
            const selected = categoryFilter === s.categoryId;
            const overLimit = s.limit ? s.total > s.limit : false;
            const color = catColor(s.color);
            return (
              <div
                key={s.categoryId}
                onClick={() => setCategoryFilter(selected ? null : s.categoryId)}
                title={selected ? "Klik untuk lepas filter" : "Klik untuk filter transaksi kategori ini"}
                style={{
                  cursor: "pointer", borderRadius: 13, padding: "8px 10px", margin: "-8px -10px",
                  background: selected ? "var(--color-surface)" : "transparent",
                  outline: selected ? `1.5px solid ${color}` : "none",
                  transition: "background var(--dur-fast) var(--ease-out)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, color: "var(--color-text)", fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.emoji} {s.name}
                  </span>
                  <span className="num" style={{ fontSize: 10.5, color: "var(--color-dim)" }}>{pct}%</span>
                  <div style={{ flex: 1 }} />
                  <span className="num" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
                    {fmtMoney(s.total, cur)}
                  </span>
                </div>
                <div style={{ position: "relative", height: 8, borderRadius: 999, background: "var(--color-surface)" }}>
                  <div
                    style={{
                      position: "absolute", top: 0, bottom: 0, left: 0,
                      width: `${Math.max((s.total / maxVal) * 100, 1.5)}%`,
                      borderRadius: 999, background: color,
                      transition: "width 420ms var(--ease-spring)",
                    }}
                  />
                  {/* penanda limit budget (envelope) bila di-set */}
                  {s.limit && s.limit <= maxVal && (
                    <div
                      title={`Limit: ${fmtMoney(s.limit, cur)}`}
                      style={{
                        position: "absolute", top: -3, bottom: -3,
                        left: `${Math.min((s.limit / maxVal) * 100, 100)}%`,
                        width: 2, borderRadius: 1, background: "var(--color-text)", opacity: 0.45,
                      }}
                    />
                  )}
                </div>
                {s.limit && (
                  <p className="num" style={{ fontSize: 10.5, marginTop: 4, color: overLimit ? "var(--loss)" : "var(--color-muted)" }}>
                    {Math.round((s.total / s.limit) * 100)}% {t("cat.limit")} {fmtMoney(s.limit, cur)}
                    {overLimit && ` ${t("cat.overLimit")}`}
                  </p>
                )}
              </div>
            );
          })}

          {rest.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
                  +{rest.length} kategori lain
                </span>
                <div style={{ flex: 1 }} />
                <span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-muted)" }}>
                  {fmtMoney(restTotal, cur)}
                </span>
              </div>
              <div style={{ position: "relative", height: 8, borderRadius: 999, background: "var(--color-surface)" }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${Math.max((restTotal / maxVal) * 100, 1.5)}%`, borderRadius: 999, background: "var(--color-dim)", opacity: 0.55 }} />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
