// ─── ZERØ COMMAND — finance/SummaryHero.tsx ───────────────────────────────────
// Ringkasan bulanan: satu angka net dominan (SURPLUS sage / BONCOS terracotta),
// tanda dikodekan rangkap (warna + tanda +/− + kata verdict — aman grayscale),
// pasangan bar masuk vs keluar untuk pembacaan spasial, savings rate, runway.
// Angka hero memakai Fraunces (display face) — bahasa Atelier.

import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Settings2, Scale } from "lucide-react";
import {
  FinanceData, monthTotals, monthLabel, shiftMonth, currentMonth,
  fmtMoney, runwayMonths, daysInMonth, todayStr,
} from "@/lib/finance";
import { MetricInfo } from "@/components/MetricInfo";
import { Card, Label, displayFace } from "./ui";

interface Props {
  fin: FinanceData;
  month: string;
  setMonth: (m: string) => void;
  onOpenManage: () => void;
}

export function SummaryHero({ fin, month, setMonth, onOpenManage }: Props) {
  const cur = fin.currency;
  const { masuk, keluar, net, txCount } = monthTotals(fin, month);
  const isCurrent = month === currentMonth();
  const hasData = txCount > 0;
  const runway = runwayMonths(fin);

  const verdict = !hasData ? null : net > 0 ? "SURPLUS" : net < 0 ? "BONCOS" : "IMPAS";
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
    <Card className="rise rise-1">
      {/* Header: label + navigasi bulan + kelola */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Label>Ringkasan bulanan</Label>
        {isCurrent && (
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", minWidth: 96, textAlign: "center" }}>
            {monthLabel(month, true)}
          </span>
          {navBtn(1, month >= currentMonth())}
          <button
            onClick={onOpenManage}
            title="Kelola sumber, kategori & preferensi"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 11,
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              cursor: "pointer", color: "var(--color-muted)", fontSize: 12.5, fontWeight: 600,
              fontFamily: "var(--font-sans)",
            }}
          >
            <Settings2 size={13} /> Kelola
          </button>
        </div>
      </div>

      {!hasData ? (
        <div style={{ padding: "26px 0 8px" }}>
          <p style={{ ...displayFace, fontSize: 23, fontWeight: 500, color: "var(--color-text)", margin: 0 }}>
            Belum ada transaksi di {monthLabel(month, true)}.
          </p>
          <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 8, maxWidth: 480, lineHeight: 1.6 }}>
            Catat pemasukan atau pengeluaran pertama lewat form di bawah — ringkasan
            surplus vs boncos tersusun otomatis dari catatanmu sendiri, tidak pernah dikarang.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "flex-end", marginTop: 18 }}>
          {/* Hero number — Fraunces, boleh cantik */}
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
                  <span className="num">{savingsRate}%</span>&nbsp;tersimpan
                  <MetricInfo termId="savings-rate" />
                </span>
              )}
            </div>
            <div
              className="num"
              style={{
                ...displayFace,
                fontSize: "clamp(34px, 5.4vw, 52px)",
                fontWeight: 600,
                color: verdictColor,
                marginTop: 10,
              }}
              title={`Masuk ${fmtMoney(masuk, cur)} − Keluar ${fmtMoney(keluar, cur)}`}
            >
              {fmtMoney(net, cur, true)}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 6 }}>
              Total Masuk − Total Keluar · {monthLabel(month, true)}{isCurrent && " (berjalan)"}
            </p>
          </div>

          {/* Pasangan bar masuk vs keluar */}
          <div style={{ flex: "1 1 300px", minWidth: 260, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 6 }}>
            {([
              { label: "Masuk", val: masuk, color: "var(--gain)", Icon: ArrowUpRight },
              { label: "Keluar", val: keluar, color: "var(--loss)", Icon: ArrowDownRight },
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
              {monthProgress !== null && (
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
                  <MetricInfo termId="runway">
                    Di sini: total saldo semua kantong ÷ rata-rata pengeluaran bulanan
                    (maks 3 bulan penuh terakhir yang tercatat).
                  </MetricInfo>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
