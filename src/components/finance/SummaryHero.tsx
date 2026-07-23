// ─── ZERØ COMMAND — finance/SummaryHero.tsx ───────────────────────────────────
// Ringkasan bulanan: SATU angka net dominan (SURPLUS sage / BONCOS terracotta),
// tanda dikodekan rangkap (warna + tanda +/− + kata verdict — aman grayscale),
// pasangan bar masuk vs keluar untuk pembacaan spasial, savings rate, runway,
// plus satu kalimat insight naratif (tren "post-dashboard" 2026 — dihitung
// jujur dari data, disembunyikan bila data belum cukup).
// compact = mode mobile single-glance. Semua teks lewat register bahasa (useT).

import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Settings2, Scale } from "lucide-react";
import {
  FinanceData, monthTotals, monthLabel, shiftMonth, currentMonth,
  fmtMoney, runwayMonths, daysInMonth, todayStr,
} from "@/lib/finance";
import { useT } from "@/lib/lang";
import { MetricInfo } from "@/components/MetricInfo";
import { Card, Label, displayFace } from "./ui";

interface Props {
  fin: FinanceData;
  month: string;
  setMonth: (m: string) => void;
  onOpenManage: () => void;
  /** mobile: padding rapat, hero single-glance */
  compact?: boolean;
}

/**
 * Insight naratif jujur: laju pengeluaran harian bulan berjalan vs rata-rata
 * harian bulan-bulan penuh sebelumnya (maks 3 yang punya pengeluaran).
 * null bila data pembanding belum ada — tidak mengarang.
 */
function spendingPaceInsight(fin: FinanceData, month: string): { pct: number; below: boolean } | null {
  if (month !== currentMonth()) return null;
  const dayNow = Number(todayStr().slice(8, 10));
  if (dayNow < 3) return null; // terlalu dini untuk laju yang bermakna
  const { keluar } = monthTotals(fin, month);
  const dailyNow = keluar / dayNow;
  const prevDaily: number[] = [];
  for (let i = 1; i <= 6 && prevDaily.length < 3; i++) {
    const m = shiftMonth(month, -i);
    const t = monthTotals(fin, m);
    if (t.keluar > 0) prevDaily.push(t.keluar / daysInMonth(m));
  }
  if (!prevDaily.length) return null;
  const avg = prevDaily.reduce((a, b) => a + b, 0) / prevDaily.length;
  if (avg <= 0) return null;
  const pct = Math.round(Math.abs(dailyNow / avg - 1) * 100);
  if (pct < 5) return null; // beda tipis = tidak layak jadi "insight"
  return { pct, below: dailyNow < avg };
}

export function SummaryHero({ fin, month, setMonth, onOpenManage, compact }: Props) {
  const cur = fin.currency;
  const t = useT();
  const { masuk, keluar, net, txCount } = monthTotals(fin, month);
  const isCurrent = month === currentMonth();
  const hasData = txCount > 0;
  const runway = runwayMonths(fin);
  const insight = spendingPaceInsight(fin, month);

  const verdict = !hasData ? null : net > 0 ? t("verdict.surplus") : net < 0 ? t("verdict.boncos") : t("verdict.impas");
  const verdictColor = net > 0 ? "var(--gain)" : net < 0 ? "var(--loss)" : "var(--color-muted)";
  const verdictBg = net > 0 ? "var(--gain-soft)" : net < 0 ? "var(--loss-soft)" : "var(--color-surface)";

  const maxVal = Math.max(masuk, keluar, 1);
  const dayNow = Number(todayStr().slice(8, 10));
  const monthProgress = isCurrent ? dayNow / daysInMonth(month) : null;
  const savingsRate = masuk > 0 ? Math.round((net / masuk) * 100) : null;

  const navBtn = (dir: -1 | 1, disabled: boolean) => (
    <button
      onClick={() => setMonth(shiftMonth(month, dir))}
      disabled={disabled}
      aria-label={dir === -1 ? "Bulan sebelumnya" : "Bulan berikutnya"}
      style={{
        width: 32, height: 32, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, color: "var(--color-muted)",
        transition: "all var(--dur-fast) var(--ease-out)",
      }}
    >
      {dir === -1 ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
    </button>
  );

  return (
    <Card className="rise rise-1" style={compact ? { padding: "16px 16px" } : undefined}>
      {/* Header: label + navigasi bulan + kelola */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Label>Ringkasan bulanan</Label>
        {isCurrent && !compact && (
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
            padding: "3px 10px", borderRadius: 999,
            color: "var(--color-primary)", background: "var(--ember-soft)",
          }}>
            BERJALAN · HARI {dayNow}/{daysInMonth(month)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {navBtn(-1, false)}
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", minWidth: compact ? 78 : 96, textAlign: "center" }}>
            {monthLabel(month, !compact)}
          </span>
          {navBtn(1, month >= currentMonth())}
          <button
            onClick={onOpenManage}
            title="Kelola sumber, kategori & preferensi"
            aria-label="Kelola"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 11,
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              cursor: "pointer", color: "var(--color-muted)", fontSize: 12.5, fontWeight: 600,
              fontFamily: "var(--font-sans)",
            }}
          >
            <Settings2 size={13} /> {!compact && "Kelola"}
          </button>
        </div>
      </div>

      {!hasData ? (
        <div style={{ padding: "26px 0 8px" }}>
          <p style={{ ...displayFace, fontSize: 23, fontWeight: 500, color: "var(--color-text)", margin: 0 }}>
            {t("hero.empty.title")} {monthLabel(month, true)}.
          </p>
          <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 8, maxWidth: 480, lineHeight: 1.6 }}>
            {t("hero.empty.hint")}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: compact ? 16 : 30, flexWrap: "wrap", alignItems: "flex-end", marginTop: compact ? 12 : 18 }}>
          {/* Hero number — SATU angka dominan (Fraunces, boleh cantik) */}
          <div style={{ minWidth: 240, flex: "1.2 1 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em",
                color: verdictColor, background: verdictBg,
                padding: "4px 12px", borderRadius: 999,
              }}>
                {net === 0 ? <Scale size={11} /> : net > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {verdict}
              </span>
              <MetricInfo termId="surplus-defisit" />
              {savingsRate !== null && net > 0 && (
                <span style={{ fontSize: 12, color: "var(--color-muted)", display: "inline-flex", alignItems: "center" }}>
                  <span className="num">{savingsRate}%</span>&nbsp;{t("hero.tersimpan")}
                  <MetricInfo termId="savings-rate" />
                </span>
              )}
            </div>
            <div
              className="num"
              style={{
                ...displayFace,
                fontSize: compact ? "clamp(32px, 10vw, 42px)" : "clamp(34px, 5.4vw, 52px)",
                fontWeight: 600,
                color: verdictColor,
                marginTop: 10,
              }}
              title={`${t("masuk")} ${fmtMoney(masuk, cur)} − ${t("keluar")} ${fmtMoney(keluar, cur)}`}
            >
              {fmtMoney(net, cur, true)}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 6 }}>
              {t("hero.caption")} · {monthLabel(month, true)}{isCurrent && ` ${t("hero.berjalan")}`}
            </p>
            {/* insight naratif — hanya bila pembanding nyata ada */}
            {insight && (
              <p style={{ fontSize: 12.5, color: insight.below ? "var(--gain)" : "var(--warning)", marginTop: 7, fontWeight: 600, lineHeight: 1.5 }}>
                Laju {t("keluar").toLowerCase()} bulan ini <span className="num">{insight.pct}%</span> di {insight.below ? "bawah" : "atas"} rata-rata bulan sebelumnya.
              </p>
            )}
          </div>

          {/* Pasangan bar masuk vs keluar */}
          <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: compact ? 10 : 14, paddingBottom: 6 }}>
            {([
              { label: t("masuk"), val: masuk, color: "var(--gain)", Icon: ArrowUpRight },
              { label: t("keluar"), val: keluar, color: "var(--loss)", Icon: ArrowDownRight },
            ] as const).map(({ label, val, color, Icon }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--color-muted)" }}>
                    <Icon size={12} color={color} /> {label}
                  </span>
                  <span className="num" style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
                    {fmtMoney(val, cur)}
                  </span>
                </div>
                <div style={{ position: "relative", height: 9, borderRadius: 999, background: "var(--color-surface)" }}>
                  <div
                    style={{
                      position: "absolute", top: 0, bottom: 0, left: 0,
                      width: `${Math.max((val / maxVal) * 100, val > 0 ? 2 : 0)}%`,
                      borderRadius: 999, background: color,
                      transition: "width 420ms var(--ease-spring)",
                    }}
                  />
                  {monthProgress !== null && (
                    <div
                      title={`Hari ke-${dayNow} dari ${daysInMonth(month)}`}
                      style={{
                        position: "absolute", left: `${monthProgress * 100}%`, top: -3, bottom: -3,
                        width: 2, borderRadius: 1, background: "var(--color-dim)", opacity: 0.65,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
                <span className="num">{txCount}</span> transaksi
              </span>
              {monthProgress !== null && !compact && (
                <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>| = posisi hari ini</span>
              )}
              {runway !== null && (
                <span
                  style={{
                    display: "inline-flex", alignItems: "center",
                    fontSize: 11.5, fontWeight: 700,
                    color: runway < 2 ? "var(--loss)" : runway < 4 ? "var(--warning)" : "var(--gain)",
                  }}
                >
                  RUNWAY ≈ <span className="num">&nbsp;{runway >= 24 ? "24+" : runway.toFixed(1).replace(".", ",")}</span>&nbsp;BULAN
                  <MetricInfo termId="runway">{t("runway.caption")}</MetricInfo>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
