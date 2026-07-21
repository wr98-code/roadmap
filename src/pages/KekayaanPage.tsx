// ─── ZERØ COMMAND — KekayaanPage.tsx (Wealth) ─────────────────────────────────
// Financial command center ala family office: Net Worth (neraca), arus kas,
// runway, alokasi aset — SEMUA dari data asli user (AppData.wealth + keuangan)
// atau kurs API gratis. Tidak ada angka karangan: field yang datanya belum
// cukup menampilkan empty state jujur. Tooltip edukasi di tiap istilah.

import { useMemo, useState, useEffect, useRef } from "react";
import { AppData, AssetEntry, LiabilityEntry } from "@/lib/store";
import { InfoTip } from "@/components/InfoTip";
import { NotesList } from "@/components/NotesList";
import { useUsdIdr, parseAmount, toIDR, formatIDR } from "@/lib/fx";
import { Plus, Trash2, Eye, EyeOff, Wallet, TrendingDown, Droplet, Timer } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

const ASSET_CATS = ["Kas", "Kripto", "Saham", "Properti", "Bisnis", "Piutang", "Lainnya"];
const CAT_COLOR: Record<string, string> = {
  Kas: "#45c07f", Kripto: "#d99a4e", Saham: "#5b8def", Properti: "#9a86d4",
  Bisnis: "#c9a96a", Piutang: "#57b6c9", Lainnya: "#8b929c",
};
const uid = () => Math.random().toString(36).slice(2, 9);

const card: React.CSSProperties = {
  borderRadius: 12, padding: "18px 20px", background: "var(--glass-bg)",
  border: "1px solid var(--glass-border)", boxShadow: "var(--card-shadow), var(--card-inset)",
  backdropFilter: "var(--glass-blur)",
};
const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
  color: "var(--color-muted)", textTransform: "uppercase",
};
const num: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--color-text)",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 7,
  padding: "6px 9px", color: "var(--color-text)", fontSize: 12, fontFamily: "var(--font-sans)", outline: "none",
};

function money(n: number | null, hidden: boolean) {
  if (hidden) return "Rp ••••••";
  if (n == null) return "—";
  return formatIDR(n);
}

export function KekayaanPage({ data, update }: Props) {
  const usdIdr = useUsdIdr();
  const [hidden, setHidden] = useState(false);
  const w = data.wealth ?? { assets: [], liabilities: [], history: [], notes: [] };
  const history = w.history ?? [];

  // ── Compute (all in IDR via live rate; null if a USD entry can't be converted yet) ──
  const calc = useMemo(() => {
    let assetIDR = 0, liqIDR = 0, missing = false;
    const byCat: Record<string, number> = {};
    for (const a of w.assets) {
      const v = toIDR(parseAmount(a.jumlah), a.mataUang, usdIdr);
      if (v == null) { missing = true; continue; }
      assetIDR += v;
      if (a.likuid) liqIDR += v;
      byCat[a.kategori] = (byCat[a.kategori] || 0) + v;
    }
    let liabIDR = 0;
    for (const l of w.liabilities) {
      const v = toIDR(parseAmount(l.jumlah), l.mataUang, usdIdr);
      if (v == null) { missing = true; continue; }
      liabIDR += v;
    }
    // Cash flow from Keuangan (income log + monthly expenses)
    const incomeIDR = (data.keuangan?.incomeLog ?? []).reduce((s, e) => {
      const v = toIDR(parseAmount(e.jumlah), e.mataUang || "IDR", usdIdr);
      return s + (v ?? 0);
    }, 0);
    const expenseIDR = (data.keuangan?.pengeluaran ?? []).reduce((s, e) => s + parseAmount(e.jumlah), 0);
    const net = assetIDR - liabIDR;
    const runwayMonths = expenseIDR > 0 ? liqIDR / expenseIDR : null;
    const savingsRate = incomeIDR > 0 ? (incomeIDR - expenseIDR) / incomeIDR : null;
    return { assetIDR, liabIDR, liqIDR, net, byCat, missing, incomeIDR, expenseIDR, runwayMonths, savingsRate };
  }, [w, data.keuangan, usdIdr]);

  const hasAssets = w.assets.length > 0;
  const hasAny = w.assets.length > 0 || w.liabilities.length > 0;
  const needsRate = w.assets.some(a => a.mataUang === "USD") || w.liabilities.some(l => l.mataUang === "USD");

  // ── Mutations ──
  const setW = (fn: (prev: typeof w) => typeof w) =>
    update(d => ({ ...d, wealth: fn(d.wealth ?? { assets: [], liabilities: [], history: [], notes: [] }) }));

  // Auto-snapshot net worth sekali per hari (nilai asli, bukan karangan).
  // Menunggu sampai FX siap kalau ada entri USD, supaya nilai akurat.
  const snapped = useRef(false);
  useEffect(() => {
    if (snapped.current || !hasAny) return;
    if (calc.missing && needsRate) return; // tunggu kurs
    snapped.current = true;
    const today = new Date().toDateString();
    const val = Math.round(calc.net);
    setW(p => {
      const hist = p.history ?? [];
      const last = hist[hist.length - 1];
      if (last && last.date === today) {
        if (Math.round(last.netWorthIDR) === val) return p;
        return { ...p, history: [...hist.slice(0, -1), { date: today, netWorthIDR: val }] };
      }
      return { ...p, history: [...hist, { date: today, netWorthIDR: val }].slice(-365) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAny, calc.missing, calc.net, needsRate]);
  const addAsset = () => setW(p => ({ ...p, assets: [...p.assets, { id: uid(), label: "Aset baru", kategori: "Kas", jumlah: "", mataUang: "IDR", likuid: true }] }));
  const updAsset = (id: string, patch: Partial<AssetEntry>) => setW(p => ({ ...p, assets: p.assets.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const delAsset = (id: string) => setW(p => ({ ...p, assets: p.assets.filter(a => a.id !== id) }));
  const addLiab = () => setW(p => ({ ...p, liabilities: [...p.liabilities, { id: uid(), label: "Utang baru", jumlah: "", mataUang: "IDR" }] }));
  const updLiab = (id: string, patch: Partial<LiabilityEntry>) => setW(p => ({ ...p, liabilities: p.liabilities.map(l => l.id === id ? { ...l, ...patch } : l) }));
  const delLiab = (id: string) => setW(p => ({ ...p, liabilities: p.liabilities.filter(l => l.id !== id) }));

  const allocRows = Object.entries(calc.byCat).sort((a, b) => b[1] - a[1]);
  const allocMax = allocRows.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.02em", margin: 0 }}>Wealth</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)", margin: "3px 0 0" }}>Neraca pribadi · arus kas · runway</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...label, fontSize: 10, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
            USD/IDR {usdIdr ? <span style={{ ...num, fontSize: 11, color: "var(--color-text)" }}>{usdIdr.toLocaleString("id-ID")}</span> : <span style={{ color: "var(--color-muted)" }}>—</span>}
          </span>
          <button onClick={() => setHidden(h => !h)} title="Sembunyikan angka" style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "6px 11px" }}>
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            <span style={{ fontSize: 11 }}>{hidden ? "Tampilkan" : "Privasi"}</span>
          </button>
        </div>
      </div>

      {/* Net Worth hero */}
      <div style={{ ...card, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <span style={label}>Net Worth</span>
          <InfoTip term="Net Worth (Kekayaan Bersih)">
            Total semua aset dikurangi total utang. Ini angka "berapa kekayaanmu sebenarnya" —
            fondasi utama kesehatan finansial. Naik dari waktu ke waktu = arah yang benar.
          </InfoTip>
        </div>
        {hasAny ? (
          <>
            <p style={{ ...num, fontSize: 44, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "8px 0 4px", filter: hidden ? "blur(10px)" : "none", transition: "filter 0.2s", color: calc.net >= 0 ? "var(--color-text)" : "var(--loss)" }}>
              {calc.missing && needsRate && !usdIdr ? "Menghitung…" : money(calc.net, hidden)}
            </p>
            {/* Asset vs liability split bar */}
            <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "var(--loss-soft)", marginTop: 12 }}>
              <div style={{ width: `${calc.assetIDR + calc.liabIDR > 0 ? (calc.assetIDR / (calc.assetIDR + calc.liabIDR)) * 100 : 0}%`, background: "var(--gain)", transition: "width 0.6s var(--ease-out)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)" }}>
                Aset <span style={{ ...num, color: "var(--gain)" }}>{money(calc.assetIDR, hidden)}</span>
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)" }}>
                Utang <span style={{ ...num, color: "var(--loss)" }}>{money(calc.liabIDR, hidden)}</span>
              </span>
            </div>
          </>
        ) : (
          <div style={{ padding: "18px 0 4px" }}>
            <p style={{ ...num, fontSize: 34, fontWeight: 600, color: "var(--color-muted)", margin: "6px 0 6px" }}>Rp 0</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--color-muted)", lineHeight: 1.5, maxWidth: 440 }}>
              Belum ada data neraca. Tambahkan aset & utang di bawah untuk melihat kekayaan bersih
              aslimu — angka tidak akan pernah dikarang.
            </p>
          </div>
        )}
      </div>

      {/* KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatTile Icon={Wallet} tint="var(--gain)" title="Total Aset" value={money(calc.assetIDR, hidden)} tip={<InfoTip term="Aset">Semua yang kamu miliki dan bernilai: kas, kripto, saham, properti, piutang, nilai bisnis.</InfoTip>} />
        <StatTile Icon={TrendingDown} tint="var(--loss)" title="Total Utang" value={money(calc.liabIDR, hidden)} tip={<InfoTip term="Liabilitas / Utang">Semua kewajiban yang harus dibayar: pinjaman, cicilan, tagihan tertunggak.</InfoTip>} />
        <StatTile Icon={Droplet} tint="#57b6c9" title="Aset Likuid" value={money(calc.liqIDR, hidden)} tip={<InfoTip term="Likuiditas">Aset yang cepat dicairkan jadi kas tanpa kehilangan nilai (kas, stablecoin). Penopang saat darurat.</InfoTip>} />
        <StatTile
          Icon={Timer} tint="#c9a96a" title="Runway"
          value={calc.runwayMonths != null ? (hidden ? "•• bln" : `${calc.runwayMonths.toFixed(1)} bln`) : "—"}
          sub={calc.runwayMonths == null ? "isi pengeluaran di Keuangan" : "aset likuid ÷ biaya/bln"}
          tip={<InfoTip term="Runway">Berapa bulan kamu bisa bertahan tanpa income baru = aset likuid ÷ pengeluaran bulanan. Makin panjang makin aman.</InfoTip>}
        />
      </div>

      {/* Net worth trend (muncul setelah >=2 snapshot harian) */}
      {history.length >= 2 && (() => {
        const first = history[0].netWorthIDR, last = history[history.length - 1].netWorthIDR;
        const delta = last - first;
        const pct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
        const up = delta >= 0;
        return (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={label}>Tren Net Worth</span>
                <InfoTip term="Pertumbuhan Kekayaan">Arah net worth dari waktu ke waktu. Yang penting bukan angka satu hari, tapi garisnya naik konsisten. Snapshot direkam otomatis tiap hari kamu buka halaman ini.</InfoTip>
              </div>
              <span style={{ ...num, fontSize: 12, fontWeight: 700, color: up ? "var(--gain)" : "var(--loss)", background: up ? "var(--gain-soft)" : "var(--loss-soft)", padding: "3px 9px", borderRadius: 6 }}>
                {up ? "▲" : "▼"} {hidden ? "••" : `${up ? "+" : "−"}${formatIDR(Math.abs(delta)).replace("Rp ", "Rp ")}`} · {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
              </span>
            </div>
            <AreaChart values={history.map(h => h.netWorthIDR)} up={up} hidden={hidden} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--color-muted)" }}>{history.length} snapshot · sejak {history[0].date}</span>
              <span style={{ ...num, fontSize: 10.5, color: "var(--color-muted)" }}>terkini {money(last, hidden)}</span>
            </div>
          </div>
        );
      })()}

      {/* Balance sheet + right column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {/* Assets editor */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center" }}><span style={label}>Aset</span>
                <InfoTip term="Neraca (Balance Sheet)">Daftar aset & utang pada satu titik waktu. Dasar menghitung net worth.</InfoTip></div>
              <button onClick={addAsset} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "var(--color-primary)", borderColor: "var(--rail-active-border)" }}>
                <Plus size={12} /> <span style={{ fontSize: 11 }}>Tambah</span>
              </button>
            </div>
            {w.assets.length === 0 ? (
              <Empty text="Belum ada aset. Klik Tambah untuk mulai isi neraca." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {w.assets.map(a => (
                  <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLOR[a.kategori] || "#8b929c", flexShrink: 0 }} />
                      <input value={a.label} onChange={e => updAsset(a.id, { label: e.target.value })} style={{ ...inputStyle, flex: 1, border: "none", background: "transparent", padding: "2px 0", fontWeight: 500 }} />
                      <button onClick={() => delAsset(a.id)} title="Hapus" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <select value={a.kategori} onChange={e => updAsset(a.id, { kategori: e.target.value })} style={{ ...inputStyle, padding: "5px 7px", fontSize: 11 }}>
                        {ASSET_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={a.jumlah} onChange={e => updAsset(a.id, { jumlah: e.target.value })} placeholder="0" inputMode="decimal" style={{ ...inputStyle, flex: 1, minWidth: 90, fontFamily: "var(--font-mono)", textAlign: "right" }} />
                      <select value={a.mataUang} onChange={e => updAsset(a.id, { mataUang: e.target.value })} style={{ ...inputStyle, padding: "5px 7px", fontSize: 11 }}>
                        <option value="IDR">IDR</option><option value="USD">USD</option>
                      </select>
                      <button onClick={() => updAsset(a.id, { likuid: !a.likuid })} title="Likuid = cepat dicairkan" style={{ ...inputStyle, cursor: "pointer", fontSize: 10, padding: "5px 8px", color: a.likuid ? "#57b6c9" : "var(--color-muted)", borderColor: a.likuid ? "rgba(87,182,201,0.4)" : "var(--color-border)" }}>
                        {a.likuid ? "● likuid" : "○ non-likuid"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liabilities editor */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={label}>Utang</span>
              <button onClick={addLiab} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "var(--loss)", borderColor: "var(--loss-soft)" }}>
                <Plus size={12} /> <span style={{ fontSize: 11 }}>Tambah</span>
              </button>
            </div>
            {w.liabilities.length === 0 ? (
              <Empty text="Belum ada utang tercatat. Bagus kalau memang nol." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {w.liabilities.map(l => (
                  <div key={l.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "10px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                    <input value={l.label} onChange={e => updLiab(l.id, { label: e.target.value })} style={{ ...inputStyle, flex: 1, border: "none", background: "transparent", padding: "2px 0", fontWeight: 500 }} />
                    <input value={l.jumlah} onChange={e => updLiab(l.id, { jumlah: e.target.value })} placeholder="0" inputMode="decimal" style={{ ...inputStyle, width: 100, fontFamily: "var(--font-mono)", textAlign: "right" }} />
                    <select value={l.mataUang} onChange={e => updLiab(l.id, { mataUang: e.target.value })} style={{ ...inputStyle, padding: "5px 7px", fontSize: 11 }}>
                      <option value="IDR">IDR</option><option value="USD">USD</option>
                    </select>
                    <button onClick={() => delLiab(l.id)} title="Hapus" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 2 }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Allocation + Cash flow */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {/* Asset allocation */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <span style={label}>Alokasi Aset</span>
              <InfoTip term="Alokasi Aset (Diversifikasi)">Sebaran kekayaan antar jenis aset. Terlalu terkonsentrasi di satu jenis = risiko tinggi. Diversifikasi menstabilkan.</InfoTip>
            </div>
            {hasAssets && allocRows.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {allocRows.map(([cat, val]) => {
                  const pct = calc.assetIDR > 0 ? (val / calc.assetIDR) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: CAT_COLOR[cat] || "#8b929c" }} />{cat}
                        </span>
                        <span style={{ ...num, fontSize: 11, color: "var(--color-muted)" }}>{pct.toFixed(0)}% · {money(val, hidden)}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "var(--color-surface)", overflow: "hidden" }}>
                        <div style={{ width: `${(val / allocMax) * 100}%`, height: "100%", background: CAT_COLOR[cat] || "#8b929c", borderRadius: 3, transition: "width 0.6s var(--ease-out)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty text="Tambahkan aset untuk melihat sebaran alokasi." />}
          </div>

          {/* Cash flow */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <span style={label}>Arus Kas Bulanan</span>
              <InfoTip term="Arus Kas (Cash Flow)">Selisih uang masuk (income) dan keluar (pengeluaran) per bulan. Positif = menabung; negatif = "membakar" tabungan.</InfoTip>
            </div>
            {calc.incomeIDR > 0 || calc.expenseIDR > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <CashRow title="Income" value={money(calc.incomeIDR, hidden)} color="var(--gain)" />
                <CashRow title="Pengeluaran" value={money(calc.expenseIDR, hidden)} color="var(--loss)" />
                <div style={{ height: 1, background: "var(--color-border)" }} />
                <CashRow title="Net / bulan" value={money(calc.incomeIDR - calc.expenseIDR, hidden)} color={calc.incomeIDR - calc.expenseIDR >= 0 ? "var(--gain)" : "var(--loss)"} bold />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--color-muted)", display: "flex", alignItems: "center" }}>
                    Savings Rate<InfoTip term="Savings Rate">Persentase income yang berhasil ditabung: (income − pengeluaran) ÷ income. Target sehat umumnya ≥ 20%.</InfoTip>
                  </span>
                  <span style={{ ...num, fontSize: 13, fontWeight: 600, color: calc.savingsRate != null && calc.savingsRate >= 0.2 ? "var(--gain)" : calc.savingsRate != null && calc.savingsRate >= 0 ? "var(--warning)" : "var(--loss)" }}>
                    {calc.savingsRate != null ? (hidden ? "••%" : `${(calc.savingsRate * 100).toFixed(0)}%`) : "—"}
                  </span>
                </div>
              </div>
            ) : (
              <Empty text="Isi Income Log & Pengeluaran di halaman Keuangan — arus kas dihitung otomatis dari sana." />
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 12 }}>Catatan Kekayaan</div>
        <NotesList notes={w.notes} onChange={notes => setW(p => ({ ...p, notes }))} />
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.06em" }}>
        Kurs USD/IDR: {usdIdr ? "Frankfurter/ECB · live" : "menunggu koneksi"} · angka gabungan dikonversi ke IDR
      </p>
    </div>
  );
}

function StatTile({ Icon, tint, title, value, sub, tip }: { Icon: any; tint: string; title: string; value: string; sub?: string; tip?: React.ReactNode }) {
  return (
    <div style={{ ...card, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={label}>{title}</span>{tip}
        </div>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={tint} />
        </div>
      </div>
      <span style={{ ...num, fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>{value}</span>
      {sub && <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-muted)" }}>{sub}</span>}
    </div>
  );
}

function CashRow({ title, value, color, bold }: { title: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: bold ? 13 : 12, fontWeight: bold ? 600 : 400, color: bold ? "var(--color-text)" : "var(--color-muted)" }}>{title}</span>
      <span style={{ ...num, fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: "20px 12px", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: 10 }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)", margin: 0, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function AreaChart({ values, up, hidden }: { values: number[]; up: boolean; hidden: boolean }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, H = 34;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - ((v - min) / range) * (H - 4) - 2] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  const col = up ? "var(--gain)" : "var(--loss)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 72, display: "block", filter: hidden ? "blur(6px)" : "none" }}>
      <defs>
        <linearGradient id="nw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.18" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#nw-grad)" />
      <polyline points={line} fill="none" stroke={col} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
