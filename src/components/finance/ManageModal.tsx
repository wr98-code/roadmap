// ─── ZERØ COMMAND — finance/ManageModal.tsx ───────────────────────────────────
// Kelola sumber pemasukan, kategori (+ limit budget bulanan opsional), dan
// preferensi mata uang. Edit inline per baris — rename aman karena semua
// transaksi menyimpan id, bukan nama.

import { useState } from "react";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  FinanceData, IncomeSource, FinanceCategory, newId, fmtMoney, parseAmountInput,
  CAT_KEYS, CatKey, catColor, Currency,
} from "@/lib/finance";
import { Register, useRegister, setRegister } from "@/lib/lang";
import { Modal, Btn, Label, inputStyle, ColorSwatches } from "./ui";

interface Props {
  fin: FinanceData;
  setFin: (fn: (f: FinanceData) => FinanceData) => void;
  onClose: () => void;
}

type Tab = "sumber" | "kategori" | "preferensi";

export function ManageModal({ fin, setFin, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("sumber");
  const [colorPickFor, setColorPickFor] = useState<string | null>(null);
  const register = useRegister();

  const usedBySource = (id: string) => fin.transactions.filter((t) => t.sourceId === id).length;
  const usedByCategory = (id: string) => fin.transactions.filter((t) => t.categoryId === id).length;

  const patchSource = (id: string, patch: Partial<IncomeSource>) =>
    setFin((f) => ({ ...f, sources: f.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const patchCategory = (id: string, patch: Partial<FinanceCategory>) =>
    setFin((f) => ({ ...f, categories: f.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const deleteSource = (s: IncomeSource) => {
    if (fin.sources.length <= 1) { toast.error("Minimal satu sumber pemasukan"); return; }
    const n = usedBySource(s.id);
    if (n > 0 && !window.confirm(`"${s.name}" dipakai ${n} transaksi — transaksi itu akan tampil sebagai "Tanpa sumber". Lanjut hapus?`)) return;
    setFin((f) => ({ ...f, sources: f.sources.filter((x) => x.id !== s.id) }));
    toast.success(`Sumber "${s.name}" dihapus`);
  };

  const deleteCategory = (c: FinanceCategory) => {
    if (fin.categories.length <= 1) { toast.error("Minimal satu kategori"); return; }
    const n = usedByCategory(c.id);
    if (n > 0 && !window.confirm(`"${c.name}" dipakai ${n} transaksi — transaksi itu akan tampil sebagai "Tanpa kategori". Lanjut hapus?`)) return;
    setFin((f) => ({ ...f, categories: f.categories.filter((x) => x.id !== c.id) }));
    toast.success(`Kategori "${c.name}" dihapus`);
  };

  const addSource = () =>
    setFin((f) => ({
      ...f,
      sources: [...f.sources, { id: newId(), name: "Sumber baru", color: CAT_KEYS[f.sources.length % CAT_KEYS.length] }],
    }));

  const addCategory = () =>
    setFin((f) => ({
      ...f,
      categories: [...f.categories, { id: newId(), name: "Kategori baru", color: CAT_KEYS[f.categories.length % CAT_KEYS.length] }],
    }));

  const rowStyle = {
    display: "flex", alignItems: "center", gap: 7, padding: "8px 10px",
    borderRadius: 13, background: "var(--color-surface)",
  } as const;

  const miniInput = {
    ...inputStyle,
    background: "var(--raised)",
    padding: "6px 9px",
    fontSize: 13,
    borderRadius: 9,
  } as const;

  return (
    <Modal title="Kelola Keuangan" onClose={onClose} width={540}>
      {/* tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {([["sumber", "Sumber Pemasukan"], ["kategori", "Kategori"], ["preferensi", "Preferensi"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "7px 15px", borderRadius: 999, fontSize: 12.5, fontFamily: "var(--font-sans)",
              fontWeight: tab === t ? 700 : 500, cursor: "pointer",
              border: `1.5px solid ${tab === t ? "var(--color-primary)" : "var(--color-border)"}`,
              background: tab === t ? "var(--ember-soft)" : "transparent",
              color: tab === t ? "var(--color-primary)" : "var(--color-muted)",
              transition: "all var(--dur-fast) var(--ease-out)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "sumber" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 4, lineHeight: 1.55 }}>
            DARI MANA uang datang — dipisah tegas, tidak pernah dilebur jadi satu angka.
            Rename aman: riwayat transaksi ikut nama baru.
          </p>
          {fin.sources.map((s) => (
            <div key={s.id}>
              <div style={rowStyle}>
                <input value={s.name} onChange={(e) => patchSource(s.id, { name: e.target.value })} aria-label="Nama sumber" style={{ ...miniInput, flex: 1, minWidth: 80 }} />
                <button
                  onClick={() => setColorPickFor(colorPickFor === s.id ? null : s.id)}
                  title="Ganti warna"
                  aria-label="Ganti warna sumber"
                  style={{ width: 24, height: 24, borderRadius: "50%", background: catColor(s.color), border: "2px solid var(--raised)", cursor: "pointer", flexShrink: 0 }}
                />
                {s.kind === "trading" && (
                  <span title="Sumber trading — dapat chart P&L harian" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, color: "var(--color-primary)", background: "var(--ember-soft)", padding: "3px 7px", borderRadius: 999 }}>
                    <TrendingDown size={9} /> TRADING
                  </span>
                )}
                <span className="num" style={{ fontSize: 10, color: "var(--color-dim)", width: 44, textAlign: "right" }}>
                  {usedBySource(s.id)} trx
                </span>
                <button onClick={() => deleteSource(s)} aria-label="Hapus sumber" style={{ background: "none", border: "none", cursor: "pointer", padding: 3, color: "var(--color-dim)", display: "flex" }}>
                  <Trash2 size={13} />
                </button>
              </div>
              {colorPickFor === s.id && (
                <div style={{ padding: "9px 10px" }}>
                  <ColorSwatches value={s.color} onChange={(c: CatKey) => { patchSource(s.id, { color: c }); setColorPickFor(null); }} />
                </div>
              )}
            </div>
          ))}
          <Btn variant="ghost" onClick={addSource}><Plus size={13} /> Tambah Sumber</Btn>
        </div>
      )}

      {tab === "kategori" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 430, overflowY: "auto", paddingRight: 4 }}>
          <p style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 4, lineHeight: 1.55 }}>
            Kategori pengeluaran. Limit = batas budget bulanan opsional (envelope) —
            kosongkan bila tanpa limit.
          </p>
          {fin.categories.map((c) => (
            <div key={c.id}>
              <div style={rowStyle}>
                <input value={c.name} onChange={(e) => patchCategory(c.id, { name: e.target.value })} aria-label="Nama kategori" style={{ ...miniInput, flex: 1, minWidth: 80 }} />
                <input
                  defaultValue={c.limit ? String(c.limit) : ""}
                  placeholder="limit/bln"
                  inputMode="decimal"
                  aria-label="Limit bulanan"
                  title="Limit budget bulanan (cth: 500rb) — kosongkan bila tanpa limit"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (!v) { patchCategory(c.id, { limit: undefined }); return; }
                    const parsed = parseAmountInput(v);
                    if (parsed) { patchCategory(c.id, { limit: parsed }); e.target.value = String(parsed); }
                    else { toast.error("Limit tidak valid"); e.target.value = c.limit ? String(c.limit) : ""; }
                  }}
                  className="num"
                  style={{ ...miniInput, width: 80, fontSize: 11.5 }}
                />
                <button
                  onClick={() => setColorPickFor(colorPickFor === c.id ? null : c.id)}
                  title="Ganti warna"
                  aria-label="Ganti warna kategori"
                  style={{ width: 24, height: 24, borderRadius: "50%", background: catColor(c.color), border: "2px solid var(--raised)", cursor: "pointer", flexShrink: 0 }}
                />
                <span className="num" style={{ fontSize: 10, color: "var(--color-dim)", width: 44, textAlign: "right" }}>
                  {usedByCategory(c.id)} trx
                </span>
                <button onClick={() => deleteCategory(c)} aria-label="Hapus kategori" style={{ background: "none", border: "none", cursor: "pointer", padding: 3, color: "var(--color-dim)", display: "flex" }}>
                  <Trash2 size={13} />
                </button>
              </div>
              {c.kind === "trading-loss" && (
                <p style={{ fontSize: 10.5, color: "var(--color-dim)", padding: "4px 10px 0" }}>
                  ↳ kategori khusus: dihitung sebagai RUGI di chart P&L harian trading
                </p>
              )}
              {colorPickFor === c.id && (
                <div style={{ padding: "9px 10px" }}>
                  <ColorSwatches value={c.color} onChange={(col: CatKey) => { patchCategory(c.id, { color: col }); setColorPickFor(null); }} />
                </div>
              )}
            </div>
          ))}
          <Btn variant="ghost" onClick={addCategory}><Plus size={13} /> Tambah Kategori</Btn>
        </div>
      )}

      {tab === "preferensi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <Label style={{ fontSize: 10 }}>Gaya bahasa</Label>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {([
                ["santai", "Santai", "“BONCOS, duit masuk” — bahasa sehari-hari"],
                ["pro", "Profesional", "“DEFISIT, pemasukan” — bahasa finansial formal"],
              ] as [Register, string, string][]).map(([r, label, desc]) => (
                <button
                  key={r}
                  onClick={() => setRegister(r)}
                  style={{
                    flex: "1 1 180px", textAlign: "left", padding: "10px 14px", borderRadius: 12,
                    border: `1.5px solid ${register === r ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: register === r ? "var(--ember-soft)" : "var(--color-surface)",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: register === r ? "var(--color-primary)" : "var(--color-text)" }}>
                    {label}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--color-muted)", marginTop: 2, lineHeight: 1.45 }}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: "var(--color-dim)", marginTop: 8, lineHeight: 1.5 }}>
              Berlaku seketika di halaman Keuangan & Kamus Istilah — bisa diganti kapan saja.
            </p>
          </div>
          <div>
            <Label style={{ fontSize: 10 }}>Mata uang tampilan</Label>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {(["IDR", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setFin((f) => ({ ...f, currency: c }))}
                  className="num"
                  style={{
                    padding: "8px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    fontFamily: "var(--font-sans)",
                    border: `1.5px solid ${fin.currency === c ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: fin.currency === c ? "var(--ember-soft)" : "var(--color-surface)",
                    color: fin.currency === c ? "var(--color-primary)" : "var(--color-muted)",
                    cursor: "pointer",
                  }}
                >
                  {c === "IDR" ? "Rp IDR" : "$ USD"}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: "var(--color-dim)", marginTop: 8, lineHeight: 1.5 }}>
              Hanya format tampilan — angka TIDAK dikonversi (tanpa API kurs).
              Contoh: {fmtMoney(1500000, fin.currency)}.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
