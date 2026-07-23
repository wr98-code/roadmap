// ─── ZERØ COMMAND — finance/TrendSection.tsx ──────────────────────────────────
// Tren bulanan surplus vs boncos: diverging bar pada baseline nol (sage di
// atas / terracotta di bawah — bar, bukan garis: tiap bulan periode diskrit &
// persilangan nol adalah intinya). Bulan berjalan ditandai (belum final),
// bulan tanpa data = gap jujur. <2 bulan data → state kosong jujur.

import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell,
} from "recharts";
import { CalendarRange } from "lucide-react";
import {
  FinanceData, monthlySeries, currentMonth, fmtMoney, fmtCompact,
} from "@/lib/finance";
import { Card, Label, EmptyState, TooltipBox, TooltipRow, useCssVars } from "./ui";

interface Props {
  fin: FinanceData;
}

export function TrendSection({ fin }: Props) {
  const cur = fin.currency;
  const series = useMemo(() => monthlySeries(fin, 12), [fin]);
  const withData = series.filter((p) => p.hasData);
  const colors = useCssVars(["--gain", "--loss"]);
  const GAIN = colors["--gain"] ?? "#55693f";
  const LOSS = colors["--loss"] ?? "#9e3f26";

  const TrendTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    if (!p) return null;
    return (
      <TooltipBox>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {p.label}
          {p.month === currentMonth() && <span style={{ opacity: 0.6, fontWeight: 400 }}> · berjalan</span>}
        </div>
        {p.hasData ? (
          <>
            <TooltipRow color={GAIN} label="Masuk" value={fmtMoney(p.masuk, cur)} />
            <TooltipRow color={LOSS} label="Keluar" value={fmtMoney(p.keluar, cur)} />
            <div style={{ borderTop: "1px solid var(--tooltip-border)", marginTop: 5, paddingTop: 4 }}>
              <TooltipRow
                color={p.net >= 0 ? GAIN : LOSS}
                label={p.net > 0 ? "Surplus" : p.net < 0 ? "Boncos" : "Impas"}
                value={fmtMoney(p.net, cur, true)}
                bold
              />
            </div>
          </>
        ) : (
          <TooltipRow label="Tidak ada data bulan ini" value="—" />
        )}
      </TooltipBox>
    );
  };

  const axisTick = { fill: "currentColor", fontSize: 10.5, fontFamily: "var(--font-sans)" } as const;

  return (
    <Card className="rise rise-6">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <Label>Tren bulanan</Label>
        <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>surplus vs boncos antar bulan</span>
      </div>

      {withData.length < 2 ? (
        <EmptyState
          compact
          icon={<CalendarRange size={26} />}
          title="Belum ada data bulan sebelumnya"
          hint={
            withData.length === 0
              ? "Tren muncul setelah transaksi tercatat minimal di 2 bulan berbeda."
              : "Baru 1 bulan tercatat — lanjutkan mencatat, perbandingan antar bulan muncul bulan depan."
          }
        />
      ) : (
        <div style={{ color: "var(--color-dim)" }}>
          <ResponsiveContainer width="100%" height={205}>
            <BarChart data={series} margin={{ top: 6, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
              <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "currentColor", strokeOpacity: 0.25 }} tickLine={false} />
              <YAxis tick={axisTick} tickFormatter={(v: number) => fmtCompact(v, cur)} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: "currentColor", opacity: 0.06 }} />
              <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.35} />
              <Bar dataKey="net" maxBarSize={30}>
                {series.map((p) => (
                  <Cell
                    key={p.month}
                    fill={(p.net ?? 0) >= 0 ? GAIN : LOSS}
                    // bulan berjalan belum final → lebih transparan (jujur)
                    opacity={p.month === currentMonth() ? 0.5 : 0.92}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginTop: 5, paddingLeft: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2.5, background: "var(--gain)" }} /> surplus
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2.5, background: "var(--loss)" }} /> boncos
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2.5, background: "var(--gain)", opacity: 0.5 }} /> bulan berjalan (belum final)
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
