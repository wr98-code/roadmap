// ─── ZERØ COMMAND — finance/SourcesSection.tsx ────────────────────────────────
// Pemasukan per sumber (Trading / Bisnis / Personal / …):
// - total besar + baris per sumber SELALU terlihat (tanpa toggle/accordion) —
//   baris ini sekaligus legend chart (warna identitas konsisten di semua chart)
// - chart gabungan: stacked bar per bulan (komposisi + total dalam satu batang,
//   sumber stabil di bawah — volatile di atas) ⇄ multi-line (bentuk tren)
// - trading: chart P&L HARIAN (bar sage untung / terracotta rugi + kumulatif)
// - bulan tanpa data = gap (bukan nol palsu); sumber kosong ditulis jujur.
// Warna chart di-resolve dari token CSS supaya ikut mode terang/gelap.

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, Line, LineChart, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { TrendingUp, BarChart3, LineChart as LineIcon } from "lucide-react";
import {
  FinanceData, sourceBreakdown, monthlySeries, sourceDailySeries,
  fmtMoney, fmtCompact, monthLabel, catVarName, catColor,
} from "@/lib/finance";
import { MetricInfo } from "@/components/MetricInfo";
import { Card, Label, EmptyState, TooltipBox, TooltipRow, useCssVars, displayFace } from "./ui";

interface Props {
  fin: FinanceData;
  month: string;
}

export function SourcesSection({ fin, month }: Props) {
  const cur = fin.currency;
  const [view, setView] = useState<"stack" | "line">("stack");

  const slices = sourceBreakdown(fin, month);
  const totalMasuk = slices.reduce((s, x) => s + x.total, 0);
  const series = useMemo(() => monthlySeries(fin, 12), [fin]);
  const monthsWithData = series.filter((p) => p.hasData);

  // deret untuk chart gabungan: bulan tanpa transaksi → null (gap jujur);
  // bulan tercatat tapi sumber X nihil → 0 (nol asli)
  const hasNone = series.some((p) => p.bySource["_none"]);
  const chartSources = useMemo(() => {
    const base = fin.sources.map((s) => ({ id: s.id, name: s.name, colorKey: s.color, emoji: s.emoji }));
    if (hasNone) base.push({ id: "_none", name: "Tanpa sumber", colorKey: "muted" as const, emoji: "❔" });
    return base;
  }, [fin.sources, hasNone]);

  // resolve token → literal untuk atribut SVG
  const varNames = useMemo(
    () => [...new Set([...chartSources.map((s) => catVarName(s.colorKey)), "--gain", "--loss", "--glass-bg", "--color-muted"])],
    [chartSources]
  );
  const colors = useCssVars(varNames);
  const colorOf = (id: string) => colors[catVarName(chartSources.find((s) => s.id === id)?.colorKey ?? "muted")] ?? "#888";
  const surface = colors["--glass-bg"] ?? "#fff";
  const GAIN = colors["--gain"] ?? "#55693f";
  const LOSS = colors["--loss"] ?? "#9e3f26";

  const chartData = useMemo(
    () =>
      series.map((p) => {
        const row: Record<string, number | string | null> = { label: p.label, month: p.month };
        for (const s of chartSources) row[s.id] = p.hasData ? p.bySource[s.id] ?? 0 : null;
        return row;
      }),
    [series, chartSources]
  );

  // stack: sumber paling stabil (urutan terakhir di daftar) di bawah,
  // volatile (Trading, urutan pertama) mengambang di atas
  const stackOrder = useMemo(() => [...chartSources].reverse(), [chartSources]);

  const tradingSource = fin.sources.find((s) => s.kind === "trading");
  const daily = useMemo(
    () => (tradingSource ? sourceDailySeries(fin, month, tradingSource.id) : []),
    [fin, month, tradingSource]
  );
  const tradingDays = daily.filter((d) => d.net !== null);
  const tradingTotal = tradingDays.reduce((s, d) => s + (d.net ?? 0), 0);
  const winDays = tradingDays.filter((d) => (d.net ?? 0) > 0).length;
  const lossDays = tradingDays.filter((d) => (d.net ?? 0) < 0).length;
  const tradingColor = tradingSource ? colorOf(tradingSource.id) : "#888";

  const nameOf = (id: string) => chartSources.find((s) => s.id === id)?.name ?? id;

  const CombinedTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const rows = payload.filter((p: any) => p.value !== null && p.value !== undefined);
    if (!rows.length) return null;
    const total = rows.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
    return (
      <TooltipBox>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {[...rows].reverse().map((p: any) => (
          <TooltipRow key={p.dataKey} color={colorOf(p.dataKey)} label={nameOf(p.dataKey)} value={fmtMoney(p.value, cur)} />
        ))}
        <div style={{ borderTop: "1px solid var(--tooltip-border)", marginTop: 5, paddingTop: 4 }}>
          <TooltipRow label="Total Masuk" value={fmtMoney(total, cur)} bold />
        </div>
      </TooltipBox>
    );
  };

  const DailyTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <TooltipBox>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.day} {monthLabel(month)}</div>
        {d.net !== null ? (
          <TooltipRow color={d.net >= 0 ? GAIN : LOSS} label={d.net >= 0 ? "Untung" : "Rugi"} value={fmtMoney(d.net, cur, true)} />
        ) : (
          <TooltipRow label="Tidak ada transaksi" value="—" />
        )}
        <TooltipRow color={tradingColor} label="Kumulatif bulan" value={fmtMoney(d.cum, cur, true)} />
      </TooltipBox>
    );
  };

  const axisTick = { fill: "currentColor", fontSize: 10.5, fontFamily: "var(--font-sans)" } as const;

  return (
    <Card className="rise rise-4">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <Label>Pemasukan per sumber</Label>
        <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>dari mana uang datang · {monthLabel(month, true)}</span>
      </div>

      <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 14 }}>
        {/* Ringkasan: total + baris per sumber (selalu terlihat) */}
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <div className="num" style={{ ...displayFace, fontSize: 27, fontWeight: 600, color: totalMasuk > 0 ? "var(--gain)" : "var(--color-muted)" }}>
            {fmtMoney(totalMasuk, cur)}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--color-muted)", margin: "3px 0 14px" }}>
            total masuk bulan ini — breakdown per sumber:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {slices.map((s) => {
              const pct = totalMasuk > 0 ? Math.round((s.total / totalMasuk) * 100) : 0;
              return (
                <div key={s.sourceId} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: catColor(s.color), flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, color: "var(--color-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.emoji} {s.name}
                  </span>
                  {s.total > 0 ? (
                    <>
                      <span className="num" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
                        {fmtMoney(s.total, cur)}
                      </span>
                      <span className="num" style={{ fontSize: 11, color: "var(--color-muted)", width: 36, textAlign: "right" }}>
                        {pct}%
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11.5, color: "var(--color-dim)", fontStyle: "italic" }}>belum ada</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart gabungan semua sumber */}
        <div style={{ flex: "2 1 340px", minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <Label style={{ fontSize: 10 }}>Semua sumber · per bulan</Label>
            <div style={{ flex: 1 }} />
            {monthsWithData.length > 0 && (
              <div style={{ display: "flex", gap: 3, background: "var(--color-surface)", borderRadius: 999, padding: 3 }}>
                {([["stack", BarChart3, "Tumpuk"], ["line", LineIcon, "Garis"]] as const).map(([v, Icon, t]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    title={t}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, border: "none",
                      cursor: "pointer", fontSize: 11, fontFamily: "var(--font-sans)", fontWeight: view === v ? 700 : 500,
                      background: view === v ? "var(--raised)" : "transparent",
                      color: view === v ? "var(--color-primary)" : "var(--color-muted)",
                      boxShadow: view === v ? "var(--card-shadow)" : "none",
                      transition: "all var(--dur-fast) var(--ease-out)",
                    }}
                  >
                    <Icon size={11} /> {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {monthsWithData.length === 0 ? (
            <EmptyState
              compact
              icon={<TrendingUp size={26} />}
              title="Belum ada pemasukan tercatat"
              hint="Chart komposisi Trading vs Bisnis vs Personal muncul setelah pemasukan pertama dicatat."
            />
          ) : (
            <div style={{ color: "var(--color-dim)" }}>
              <ResponsiveContainer width="100%" height={220}>
                {view === "stack" ? (
                  <BarChart data={chartData} stackOffset="sign" margin={{ top: 6, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "currentColor", strokeOpacity: 0.25 }} tickLine={false} />
                    <YAxis tick={axisTick} tickFormatter={(v: number) => fmtCompact(v, cur)} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CombinedTooltip />} cursor={{ fill: "currentColor", opacity: 0.06 }} />
                    <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.3} />
                    {stackOrder.map((s) => (
                      <Bar
                        key={s.id}
                        dataKey={s.id}
                        stackId="income"
                        fill={colorOf(s.id)}
                        stroke={surface}
                        strokeWidth={1.5}
                        maxBarSize={26}
                      />
                    ))}
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "currentColor", strokeOpacity: 0.25 }} tickLine={false} />
                    <YAxis tick={axisTick} tickFormatter={(v: number) => fmtCompact(v, cur)} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CombinedTooltip />} cursor={{ stroke: "currentColor", strokeOpacity: 0.25 }} />
                    {chartSources.map((s) => (
                      <Line
                        key={s.id}
                        dataKey={s.id}
                        stroke={colorOf(s.id)}
                        strokeWidth={2}
                        dot={{ r: 3, fill: colorOf(s.id), stroke: surface, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
              {/* legend — urutan konsisten dengan daftar sumber di kiri */}
              <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginTop: 7, paddingLeft: 4 }}>
                {chartSources.map((s) => (
                  <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2.5, background: catColor(s.colorKey) }} /> {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trading harian */}
      {tradingSource && (
        <div style={{ marginTop: 22, borderTop: "1px solid var(--color-border)", paddingTop: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <Label style={{ fontSize: 10, display: "inline-flex", alignItems: "center" }}>
              {tradingSource.emoji} {tradingSource.name} · P&L harian · {monthLabel(month, true)}
              <MetricInfo termId="pnl">
                Untung dicatat sebagai Masuk (sumber {tradingSource.name}); rugi sebagai
                Keluar berkategori Trading Loss — chart ini selisih hariannya.
              </MetricInfo>
            </Label>
            {tradingDays.length > 0 && (
              <>
                <span className="num" style={{ fontSize: 14.5, fontWeight: 700, color: tradingTotal >= 0 ? "var(--gain)" : "var(--loss)" }}>
                  {fmtMoney(tradingTotal, cur, true)}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  <span className="num">{winDays}</span> hari untung · <span className="num">{lossDays}</span> hari rugi
                </span>
              </>
            )}
          </div>
          {tradingDays.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--color-muted)", padding: "4px 0 2px", lineHeight: 1.6 }}>
              Belum ada aktivitas trading bulan ini. Untung dicatat sebagai <b>Masuk · sumber {tradingSource.name}</b>,
              rugi sebagai <b>Keluar · kategori Trading Loss</b> — chart harian tersusun otomatis dari situ.
            </p>
          ) : (
            <div style={{ color: "var(--color-dim)" }}>
              <ResponsiveContainer width="100%" height={175}>
                <ComposedChart data={daily} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
                  <XAxis dataKey="day" tick={axisTick} interval={4} axisLine={{ stroke: "currentColor", strokeOpacity: 0.25 }} tickLine={false} />
                  <YAxis tick={axisTick} tickFormatter={(v: number) => fmtCompact(v, cur)} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<DailyTooltip />} cursor={{ fill: "currentColor", opacity: 0.06 }} />
                  <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.3} />
                  <Bar dataKey="net" maxBarSize={14} radius={[3, 3, 0, 0]}>
                    {daily.map((d) => (
                      <Cell key={d.date} fill={(d.net ?? 0) >= 0 ? GAIN : LOSS} />
                    ))}
                  </Bar>
                  <Line dataKey="cum" stroke={tradingColor} strokeWidth={2} dot={false} strokeOpacity={0.8} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginTop: 5, paddingLeft: 4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2.5, background: "var(--gain)" }} /> hari untung
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2.5, background: "var(--loss)" }} /> hari rugi
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
                  <span style={{ width: 13, height: 2, background: catColor(tradingSource.color), borderRadius: 1 }} /> kumulatif bulan
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
