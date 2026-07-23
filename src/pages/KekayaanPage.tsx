// ─── ZERØ COMMAND — KekayaanPage.tsx (Wealth) ─────────────────────────────────
// Financial command center ala family office: Net Worth (neraca), arus kas,
// runway, alokasi aset — SEMUA dari data asli user (AppData.wealth + keuangan)
// atau kurs API gratis. Tidak ada angka karangan: field yang datanya belum
// cukup menampilkan empty state jujur. Tooltip edukasi di tiap istilah.
//
// Institutional "terminal" restructure: floating cards → flat panels joined by
// 1px hairline seams inside outer slabs, mono uppercase micro-labels, right-
// aligned tabular numerals, all colors via CSS vars (light + dark). Every
// compute, InfoTip, snapshot effect, AreaChart & honest empty state preserved.

import { useMemo, useState, useEffect, useRef } from "react";
import { AppData, AssetEntry, LiabilityEntry } from "@/lib/store";
import { MetricInfo } from "@/components/MetricInfo";
import { NotesList } from "@/components/NotesList";
import { useUsdIdr, parseAmount, toIDR, formatIDR } from "@/lib/fx";
import { monthTotals, currentMonth, monthLabel, totalBalance, avgMonthlyExpense } from "@/lib/finance";
import { Slab, SeamGrid, PanelHead, Stat, Field, Badge, PageTitle, tLabelStyle, tNumStyle } from "@/components/terminal";
import { Plus, Trash2, Eye, EyeOff, Wallet, TrendingDown, Droplet, Timer } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

const ASSET_CATS = ["Kas", "Kripto", "Saham", "Properti", "Bisnis", "Piutang", "Lainnya"];
// Small decorative category hues (semantic data-viz colors for dots + alloc bars).
const CAT_COLOR: Record<string, string> = {
  Kas: "var(--cat-green)", Kripto: "var(--cat-amber)", Saham: "var(--cat-blue)", Properti: "var(--cat-violet)",
  Bisnis: "var(--cat-gold)", Piutang: "var(--cat-teal)", Lainnya: "var(--color-muted)",
};
const uid = () => Math.random().toString(36).slice(2, 9);

const label = tLabelStyle;
const num = tNumStyle;
const inputStyle: React.CSSProperties = {
  background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 7,
  padding: "6px 9px", color: "var(--color-text)", fontSize: 12, fontFamily: "var(--font-sans)", outline: "none",
};
const SEAM_LINE = "1px solid var(--color-border)";

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
    const fin = data.keuangan?.finance;
    const finHasTx = (fin?.transactions?.length ?? 0) > 0;
    // SATU SUMBER KEBENARAN KAS: total saldo kantong dari halaman Keuangan
    // otomatis ikut sebagai aset likuid — dua halaman tidak lagi menjawab
    // "uangku berapa" dengan angka yang tidak berhubungan.
    // (fin.currency = format tampilan saja — nilai dipakai apa adanya,
    //  konsisten dengan janji di Kelola > Preferensi.)
    const kantongIDR = fin ? totalBalance(fin) : 0;
    if (fin && (finHasTx || kantongIDR !== 0)) {
      assetIDR += kantongIDR;
      liqIDR += kantongIDR;
      byCat["Kas"] = (byCat["Kas"] || 0) + kantongIDR;
    }
    // Cash flow: sistem transaksi baru (bulan berjalan) bila ada, fallback
    // ledger manual lama. Nilai finance TIDAK dikonversi kurs (display-only).
    let incomeIDR: number;
    let expenseIDR: number;
    if (fin && finHasTx) {
      const t = monthTotals(fin, currentMonth());
      incomeIDR = t.masuk;
      expenseIDR = t.keluar;
    } else {
      incomeIDR = (data.keuangan?.incomeLog ?? []).reduce((s, e) => {
        const v = toIDR(parseAmount(e.jumlah), e.mataUang || "IDR", usdIdr);
        return s + (v ?? 0);
      }, 0);
      expenseIDR = (data.keuangan?.pengeluaran ?? []).reduce((s, e) => s + parseAmount(e.jumlah), 0);
    }
    const net = assetIDR - liabIDR;
    // Runway: SATU definisi dengan halaman Keuangan — rata-rata pengeluaran
    // bulan PENUH (bulan berjalan yang parsial menyesatkan: tanggal 2 dengan
    // jajan 25rb membuat runway "2000 bulan"). Fallback ke pengeluaran ledger
    // lama bila belum ada bulan penuh tercatat.
    const avgExpense = fin ? avgMonthlyExpense(fin) : null;
    const runwayDivisor = avgExpense ?? (expenseIDR > 0 ? expenseIDR : null);
    const runwayMonths = runwayDivisor ? liqIDR / runwayDivisor : null;
    const savingsRate = incomeIDR > 0 ? (incomeIDR - expenseIDR) / incomeIDR : null;
    return { assetIDR, liabIDR, liqIDR, net, byCat, missing, incomeIDR, expenseIDR, runwayMonths, savingsRate, finHasTx, kantongIDR };
  }, [w, data.keuangan, usdIdr]);

  // kas kantong otomatis dihitung sebagai aset — neraca "hidup" begitu
  // founder mencatat transaksi, tanpa harus input aset manual dulu
  const hasKantong = calc.kantongIDR !== 0 || calc.finHasTx;
  const hasAssets = w.assets.length > 0 || hasKantong;
  const hasAny = w.assets.length > 0 || w.liabilities.length > 0 || hasKantong;
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

  const addBtn = (tone: "accent" | "loss"): React.CSSProperties => ({
    ...inputStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px",
    fontSize: 11, fontWeight: 600,
    color: tone === "accent" ? "var(--color-primary)" : "var(--loss)",
    background: tone === "accent" ? "var(--rail-active-bg)" : "var(--loss-soft)",
    borderColor: tone === "accent" ? "var(--rail-active-border)" : "var(--loss-soft)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <PageTitle
        title="Wealth"
        subtitle="Neraca · Arus Kas · Runway"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...label, fontSize: 10, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
              USD/IDR {usdIdr ? <span className="num" style={{ ...num, fontSize: 11 }}>{usdIdr.toLocaleString("id-ID")}</span> : <span style={{ color: "var(--color-muted)" }}>—</span>}
            </span>
            <button onClick={() => setHidden(h => !h)} title="Sembunyikan angka" style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "6px 11px" }}>
              {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              <span style={{ fontSize: 11 }}>{hidden ? "Tampilkan" : "Privasi"}</span>
            </button>
          </div>
        }
      />

      {/* Net Worth hero */}
      <Slab style={{ overflow: "visible" }}>
        <PanelHead
          title={<span style={{ display: "inline-flex", alignItems: "center" }}>Net Worth<MetricInfo termId="net-worth" /></span>}
          right={<Badge tone={hasAny ? (calc.net >= 0 ? "gain" : "loss") : "muted"}>{hasAny ? (calc.net >= 0 ? "SURPLUS" : "DEFISIT") : "KOSONG"}</Badge>}
        />
        <div style={{ padding: "20px 18px" }}>
          {hasAny ? (
            <>
              <p className="num" style={{ ...num, fontSize: 44, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 4px", filter: hidden ? "blur(10px)" : "none", transition: "filter 0.2s", color: calc.net >= 0 ? "var(--color-text)" : "var(--loss)" }}>
                {calc.missing && needsRate && !usdIdr ? "Menghitung…" : money(calc.net, hidden)}
              </p>
              {/* Asset vs liability split bar */}
              <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "var(--loss-soft)", marginTop: 12 }}>
                <div style={{ width: `${calc.assetIDR + calc.liabIDR > 0 ? (calc.assetIDR / (calc.assetIDR + calc.liabIDR)) * 100 : 0}%`, background: "var(--gain)", transition: "width 0.6s var(--ease-out)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)" }}>
                  Aset <span className="num" style={{ ...num, color: "var(--gain)" }}>{money(calc.assetIDR, hidden)}</span>
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-muted)" }}>
                  Utang <span className="num" style={{ ...num, color: "var(--loss)" }}>{money(calc.liabIDR, hidden)}</span>
                </span>
              </div>
            </>
          ) : (
            <div style={{ padding: "4px 0" }}>
              <p className="num" style={{ ...num, fontSize: 34, fontWeight: 600, color: "var(--color-muted)", margin: "0 0 6px" }}>Rp 0</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--color-muted)", lineHeight: 1.5, maxWidth: 440 }}>
                Belum ada data neraca. Tambahkan aset & utang di bawah untuk melihat kekayaan bersih
                aslimu — angka tidak akan pernah dikarang.
              </p>
            </div>
          )}
        </div>
      </Slab>

      {/* KPI tiles */}
      <Slab style={{ overflow: "visible" }}>
        <SeamGrid cols="1fr 1fr 1fr 1fr">
          <Stat
            label={<span style={{ display: "inline-flex", alignItems: "center" }}>Total Aset<MetricInfo termId="aset" /></span>}
            value={money(calc.assetIDR, hidden)}
            right={<IconBox Icon={Wallet} tint="var(--gain)" />}
          />
          <Stat
            label={<span style={{ display: "inline-flex", alignItems: "center" }}>Total Utang<MetricInfo termId="liabilitas" /></span>}
            value={money(calc.liabIDR, hidden)}
            right={<IconBox Icon={TrendingDown} tint="var(--loss)" />}
          />
          <Stat
            label={<span style={{ display: "inline-flex", alignItems: "center" }}>Aset Likuid<MetricInfo termId="likuiditas" /></span>}
            value={money(calc.liqIDR, hidden)}
            right={<IconBox Icon={Droplet} tint="var(--color-primary)" />}
          />
          <Stat
            label={<span style={{ display: "inline-flex", alignItems: "center" }}>Runway<MetricInfo termId="runway">Di sini: aset likuid ÷ pengeluaran bulanan{calc.finHasTx ? ` (transaksi ${monthLabel(currentMonth(), true)})` : " (ledger Keuangan)"}.</MetricInfo></span>}
            value={calc.runwayMonths != null ? (hidden ? "•• bln" : `${calc.runwayMonths.toFixed(1)} bln`) : "—"}
            sub={calc.runwayMonths == null ? "catat pengeluaran di Keuangan" : "aset likuid ÷ rata-rata keluar/bln"}
            right={<IconBox Icon={Timer} tint="var(--gold)" />}
          />
        </SeamGrid>
      </Slab>

      {/* Net worth trend (muncul setelah >=2 snapshot harian) */}
      {history.length >= 2 && (() => {
        const first = history[0].netWorthIDR, last = history[history.length - 1].netWorthIDR;
        const delta = last - first;
        const pct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
        const up = delta >= 0;
        return (
          <Slab style={{ overflow: "visible" }}>
            <PanelHead
              title={<span style={{ display: "inline-flex", alignItems: "center" }}>Tren Net Worth<MetricInfo termId="net-worth">Yang penting bukan angka satu hari, tapi garisnya naik konsisten. Snapshot direkam otomatis tiap hari kamu buka halaman ini.</MetricInfo></span>}
              right={
                <span className="num" style={{ ...num, fontSize: 12, fontWeight: 700, color: up ? "var(--gain)" : "var(--loss)", background: up ? "var(--gain-soft)" : "var(--loss-soft)", padding: "3px 9px", borderRadius: 6 }}>
                  {up ? "▲" : "▼"} {hidden ? "••" : `${up ? "+" : "−"}${formatIDR(Math.abs(delta))}`} · {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                </span>
              }
            />
            <div style={{ padding: "14px 16px" }}>
              <AreaChart values={history.map(h => h.netWorthIDR)} up={up} hidden={hidden} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--color-muted)" }}>{history.length} snapshot · sejak {history[0].date}</span>
                <span className="num" style={{ ...num, fontSize: 10.5, color: "var(--color-muted)" }}>terkini {money(last, hidden)}</span>
              </div>
            </div>
          </Slab>
        );
      })()}

      {/* Balance sheet — Assets + Liabilities editors joined by a seam */}
      <Slab style={{ overflow: "visible" }}>
        <SeamGrid cols="1fr 1fr">
          {/* Assets editor */}
          <div style={{ background: "var(--glass-bg)", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: SEAM_LINE, gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <span style={label}>Aset</span>
                <MetricInfo termId="neraca" />
              </span>
              <button onClick={addAsset} style={addBtn("accent")}>
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div style={{ padding: "4px 14px 12px" }}>
              {/* baris otomatis: kas dari halaman Keuangan — readonly, satu
                  sumber kebenaran. JANGAN input ulang kas kantong manual. */}
              {hasKantong && (
                <div style={{
                  display: "flex", gap: 8, alignItems: "center", padding: "10px 11px",
                  margin: "8px 0 4px", borderRadius: 10,
                  background: "var(--color-surface)", border: "1px dashed var(--color-border)",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLOR["Kas"], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-text)" }}>Kas di kantong</div>
                    <div style={{ fontSize: 10, color: "var(--color-muted)" }}>
                      otomatis dari halaman Keuangan — jangan diinput ulang manual di sini
                    </div>
                  </div>
                  <span className="num" style={{ ...num, fontSize: 13, fontWeight: 600 }}>{money(calc.kantongIDR, hidden)}</span>
                </div>
              )}
              {w.assets.length === 0 ? (
                hasKantong
                  ? <Empty text="Aset lain (kripto, saham, properti, piutang) bisa ditambah manual di sini." />
                  : <Empty text="Belum ada aset. Klik Tambah untuk mulai isi neraca." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {w.assets.map((a, i) => (
                    <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0", borderBottom: i < w.assets.length - 1 ? SEAM_LINE : "none" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLOR[a.kategori] || "var(--color-muted)", flexShrink: 0 }} />
                        <input value={a.label} onChange={e => updAsset(a.id, { label: e.target.value })} style={{ ...inputStyle, flex: 1, border: "none", background: "transparent", padding: "2px 0", fontWeight: 500 }} />
                        <button onClick={() => delAsset(a.id)} title="Hapus" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 2 }}><Trash2 size={13} /></button>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <select value={a.kategori} onChange={e => updAsset(a.id, { kategori: e.target.value })} style={{ ...inputStyle, padding: "5px 7px", fontSize: 11 }}>
                          {ASSET_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input value={a.jumlah} onChange={e => updAsset(a.id, { jumlah: e.target.value })} placeholder="cth: 5jt" inputMode="decimal" className="num" title={a.jumlah ? `terbaca: ${formatIDR(parseAmount(a.jumlah))}${a.mataUang === "USD" ? " (sebelum kurs)" : ""}` : undefined} style={{ ...inputStyle, flex: 1, minWidth: 90, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", textAlign: "right" }} />
                        <select value={a.mataUang} onChange={e => updAsset(a.id, { mataUang: e.target.value })} style={{ ...inputStyle, padding: "5px 7px", fontSize: 11 }}>
                          <option value="IDR">IDR</option><option value="USD">USD</option>
                        </select>
                        <button onClick={() => updAsset(a.id, { likuid: !a.likuid })} title="Likuid = cepat dicairkan" style={{ ...inputStyle, cursor: "pointer", fontSize: 10, padding: "5px 8px", color: a.likuid ? "var(--color-primary)" : "var(--color-muted)", background: a.likuid ? "var(--rail-active-bg)" : "var(--color-surface)", borderColor: a.likuid ? "var(--rail-active-border)" : "var(--color-border)" }}>
                          {a.likuid ? "● likuid" : "○ non-likuid"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Liabilities editor */}
          <div style={{ background: "var(--glass-bg)", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: SEAM_LINE, gap: 8 }}>
              <span style={label}>Utang</span>
              <button onClick={addLiab} style={addBtn("loss")}>
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div style={{ padding: "4px 14px 12px" }}>
              {w.liabilities.length === 0 ? (
                <Empty text="Belum ada utang tercatat. Bagus kalau memang nol." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {w.liabilities.map((l, i) => (
                    <div key={l.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "10px 0", borderBottom: i < w.liabilities.length - 1 ? SEAM_LINE : "none" }}>
                      <input value={l.label} onChange={e => updLiab(l.id, { label: e.target.value })} style={{ ...inputStyle, flex: 1, border: "none", background: "transparent", padding: "2px 0", fontWeight: 500 }} />
                      <input value={l.jumlah} onChange={e => updLiab(l.id, { jumlah: e.target.value })} placeholder="cth: 5jt" inputMode="decimal" className="num" title={l.jumlah ? `terbaca: ${formatIDR(parseAmount(l.jumlah))}${l.mataUang === "USD" ? " (sebelum kurs)" : ""}` : undefined} style={{ ...inputStyle, width: 100, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", textAlign: "right" }} />
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
        </SeamGrid>
      </Slab>

      {/* Allocation + Cash flow */}
      <Slab style={{ overflow: "visible" }}>
        <SeamGrid cols="1fr 1fr">
          {/* Asset allocation */}
          <div style={{ background: "var(--glass-bg)", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "11px 14px", borderBottom: SEAM_LINE }}>
              <span style={label}>Alokasi Aset</span>
              <MetricInfo termId="alokasi-aset" />
            </div>
            <div style={{ padding: "14px" }}>
              {allocRows.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {allocRows.map(([cat, val]) => {
                    const pct = calc.assetIDR > 0 ? (val / calc.assetIDR) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 2, background: CAT_COLOR[cat] || "var(--color-muted)" }} />{cat}
                          </span>
                          <span className="num" style={{ ...num, fontSize: 11, color: "var(--color-muted)" }}>{pct.toFixed(0)}% · {money(val, hidden)}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "var(--color-surface)", overflow: "hidden" }}>
                          <div style={{ width: `${(val / allocMax) * 100}%`, height: "100%", background: CAT_COLOR[cat] || "var(--color-muted)", borderRadius: 3, transition: "width 0.6s var(--ease-out)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty text="Tambahkan aset untuk melihat sebaran alokasi." />}
            </div>
          </div>

          {/* Cash flow */}
          <div style={{ background: "var(--glass-bg)", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "11px 14px", borderBottom: SEAM_LINE }}>
              <span style={label}>Arus Kas Bulanan</span>
              <MetricInfo termId="arus-kas">
                {calc.finHasTx ? `Dari transaksi ${monthLabel(currentMonth(), true)} di halaman Keuangan.` : "Dari ledger manual halaman Keuangan."}
              </MetricInfo>
            </div>
            <div style={{ padding: "6px 14px 14px" }}>
              {calc.incomeIDR > 0 || calc.expenseIDR > 0 ? (
                <>
                  {/* jujur soal cakupan angka: bulan berjalan vs total ledger lama */}
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--color-muted)", margin: "8px 0 0" }}>
                    {calc.finHasTx
                      ? `dari transaksi ${monthLabel(currentMonth(), true)} di halaman Keuangan`
                      : "dari ledger manual lama — TOTAL keseluruhan, bukan bulanan"}
                  </p>
                  <Field label="Income" value={money(calc.incomeIDR, hidden)} valueColor="var(--gain)" />
                  <Field label="Pengeluaran" value={money(calc.expenseIDR, hidden)} valueColor="var(--loss)" />
                  <Field label={calc.finHasTx ? "Net / bulan" : "Net"} value={money(calc.incomeIDR - calc.expenseIDR, hidden)} valueColor={calc.incomeIDR - calc.expenseIDR >= 0 ? "var(--gain)" : "var(--loss)"} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--color-muted)", display: "flex", alignItems: "center" }}>
                      Savings Rate<MetricInfo termId="savings-rate" />
                    </span>
                    <span className="num" style={{ ...num, fontSize: 13, fontWeight: 600, color: calc.savingsRate != null && calc.savingsRate >= 0.2 ? "var(--gain)" : calc.savingsRate != null && calc.savingsRate >= 0 ? "var(--warning)" : "var(--loss)" }}>
                      {calc.savingsRate != null ? (hidden ? "••%" : `${(calc.savingsRate * 100).toFixed(0)}%`) : "—"}
                    </span>
                  </div>
                </>
              ) : (
                <Empty text="Catat transaksi di halaman Keuangan — arus kas dihitung otomatis dari sana." />
              )}
            </div>
          </div>
        </SeamGrid>
      </Slab>

      {/* Notes */}
      <Slab>
        <PanelHead title="Catatan Kekayaan" />
        <div style={{ padding: "14px 16px" }}>
          <NotesList notes={w.notes} onChange={notes => setW(p => ({ ...p, notes }))} />
        </div>
      </Slab>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", textAlign: "right", letterSpacing: "0.06em" }}>
        Kurs USD/IDR: {usdIdr ? "Frankfurter/ECB · live" : "menunggu koneksi"} · angka gabungan dikonversi ke IDR
      </p>
    </div>
  );
}

function IconBox({ Icon, tint }: { Icon: any; tint: string }) {
  return (
    <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={13} color={tint} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: "20px 8px", textAlign: "center" }}>
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
