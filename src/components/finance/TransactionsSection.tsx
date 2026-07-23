// ─── ZERØ COMMAND — finance/TransactionsSection.tsx ───────────────────────────
// Riwayat transaksi: dikelompok per tanggal, filter kantong/kategori/tipe/bulan,
// edit lewat modal, hapus = langsung + toast "Urungkan" (soft-delete UX,
// bukan dialog konfirmasi — dipakai berkali-kali sehari).

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Pencil, Trash2, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import {
  FinanceData, FinanceTransaction, TxType, parseAmountInput, fmtMoney,
  monthLabel, monthOf, todayStr, catColor,
} from "@/lib/finance";
import { Card, Label, Chip, Btn, Modal, Field, inputStyle, EmptyState } from "./ui";

interface Props {
  fin: FinanceData;
  setFin: (fn: (f: FinanceData) => FinanceData) => void;
  month: string;
  accountFilter: string | null;
  setAccountFilter: (id: string | null) => void;
  categoryFilter: string | null;
  setCategoryFilter: (id: string | null) => void;
}

const PAGE = 50;

function weekdayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
}

export function TransactionsSection({
  fin, setFin, month, accountFilter, setAccountFilter, categoryFilter, setCategoryFilter,
}: Props) {
  const cur = fin.currency;
  const [typeFilter, setTypeFilter] = useState<TxType | null>(null);
  const [allMonths, setAllMonths] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);

  const accOf = (id?: string) => fin.accounts.find((a) => a.id === id);
  const catOf = (id?: string) => fin.categories.find((c) => c.id === id);
  const srcOf = (id?: string) => fin.sources.find((s) => s.id === id);

  const filtered = useMemo(() => {
    return [...fin.transactions]
      .filter((t) => {
        if (!allMonths && monthOf(t.date) !== month) return false;
        if (typeFilter && t.type !== typeFilter) return false;
        if (accountFilter && t.accountId !== accountFilter && t.toAccountId !== accountFilter) return false;
        if (categoryFilter && t.categoryId !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  }, [fin.transactions, month, allMonths, typeFilter, accountFilter, categoryFilter]);

  const visible = filtered.slice(0, limit);

  const groups = useMemo(() => {
    const map = new Map<string, FinanceTransaction[]>();
    for (const t of visible) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return [...map.entries()];
  }, [visible]);

  const deleteTx = (tx: FinanceTransaction) => {
    setFin((f) => ({ ...f, transactions: f.transactions.filter((t) => t.id !== tx.id) }));
    toast("Transaksi dihapus", {
      description: `${fmtMoney(tx.amount, cur)} · ${tx.note || catOf(tx.categoryId)?.name || srcOf(tx.sourceId)?.name || tx.type}`,
      action: {
        label: "Urungkan",
        onClick: () => setFin((f) => ({ ...f, transactions: [...f.transactions, tx] })),
      },
    });
  };

  const activeFilters = Boolean(typeFilter || accountFilter || categoryFilter);

  const rowIcon = (t: FinanceTransaction) => {
    if (t.type === "transfer") return <ArrowLeftRight size={14} color="var(--color-primary)" />;
    if (t.type === "masuk") return <span style={{ fontSize: 15 }}>{srcOf(t.sourceId)?.emoji ?? "❔"}</span>;
    return <span style={{ fontSize: 15 }}>{catOf(t.categoryId)?.emoji ?? "🏷️"}</span>;
  };

  const rowTitle = (t: FinanceTransaction) => {
    if (t.note) return t.note;
    if (t.type === "masuk") return srcOf(t.sourceId)?.name ?? "Pemasukan";
    if (t.type === "keluar") return catOf(t.categoryId)?.name ?? "Tanpa kategori";
    return "Transfer antar kantong";
  };

  const rowSub = (t: FinanceTransaction) => {
    const from = accOf(t.accountId);
    if (t.type === "transfer") {
      const to = accOf(t.toAccountId);
      return `${from?.name ?? "?"} → ${to?.name ?? "?"}`;
    }
    const extra =
      t.type === "masuk"
        ? (t.note ? srcOf(t.sourceId)?.name : undefined)
        : (t.note ? catOf(t.categoryId)?.name : undefined);
    return [extra, from?.name ?? "?"].filter(Boolean).join(" · ");
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Label>Transaksi</Label>
        <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>
          {allMonths ? "semua bulan" : monthLabel(month, true)} · <span className="num">{filtered.length}</span> entri
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <Chip small active={!allMonths} onClick={() => setAllMonths(false)}>{monthLabel(month)}</Chip>
          <Chip small active={allMonths} onClick={() => setAllMonths(true)}>Semua bulan</Chip>
          <span style={{ width: 1, alignSelf: "stretch", background: "var(--color-border)", margin: "0 4px" }} />
          <Chip small active={typeFilter === "keluar"} color="var(--loss)" onClick={() => setTypeFilter(typeFilter === "keluar" ? null : "keluar")}>Keluar</Chip>
          <Chip small active={typeFilter === "masuk"} color="var(--gain)" onClick={() => setTypeFilter(typeFilter === "masuk" ? null : "masuk")}>Masuk</Chip>
          <Chip small active={typeFilter === "transfer"} color="var(--color-primary)" onClick={() => setTypeFilter(typeFilter === "transfer" ? null : "transfer")}>Transfer</Chip>
        </div>
      </div>

      {/* filter aktif dari seksi lain (klik kartu kantong / baris kategori) */}
      {activeFilters && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: "var(--color-dim)" }}>Filter:</span>
          {accountFilter && (
            <Chip small active color={catColor(accOf(accountFilter)?.color ?? "muted")} onClick={() => setAccountFilter(null)}>
              {accOf(accountFilter)?.name ?? "kantong"} <X size={10} />
            </Chip>
          )}
          {categoryFilter && (
            <Chip small active color={catColor(catOf(categoryFilter)?.color ?? "muted")} onClick={() => setCategoryFilter(null)}>
              {catOf(categoryFilter)?.emoji} {catOf(categoryFilter)?.name ?? "kategori"} <X size={10} />
            </Chip>
          )}
          {typeFilter && (
            <Chip small active onClick={() => setTypeFilter(null)}>
              {typeFilter} <X size={10} />
            </Chip>
          )}
          <button
            onClick={() => { setAccountFilter(null); setCategoryFilter(null); setTypeFilter(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "var(--color-muted)", textDecoration: "underline", padding: 0 }}
          >
            bersihkan semua
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={28} />}
          title={activeFilters ? "Tidak ada transaksi yang cocok dengan filter" : `Belum ada transaksi di ${allMonths ? "catatan" : monthLabel(month, true)}`}
          hint={activeFilters ? "Longgarkan atau bersihkan filter di atas." : "Semua yang kamu catat lewat form di atas muncul di sini."}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {groups.map(([date, txs]) => {
            const dayMasuk = txs.filter((t) => t.type === "masuk").reduce((s, t) => s + t.amount, 0);
            const dayKeluar = txs.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-muted)", textTransform: "uppercase" }}>
                    {weekdayLabel(date)}
                    {date === todayStr() && " · hari ini"}
                  </span>
                  <div style={{ flex: 1 }} />
                  {dayMasuk > 0 && <span className="num" style={{ fontSize: 11, fontWeight: 600, color: "var(--gain)" }}>+{fmtMoney(dayMasuk, cur)}</span>}
                  {dayKeluar > 0 && <span className="num" style={{ fontSize: 11, fontWeight: 600, color: "var(--loss)" }}>−{fmtMoney(dayKeluar, cur)}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {txs.map((t) => {
                    const amountColor = t.type === "masuk" ? "var(--gain)" : t.type === "keluar" ? "var(--loss)" : "var(--color-text)";
                    const sign = t.type === "masuk" ? "+" : t.type === "keluar" ? "−" : "";
                    return (
                      <div
                        key={t.id}
                        className="animate-fade-up"
                        style={{
                          display: "flex", alignItems: "center", gap: 11, padding: "10px 13px",
                          borderRadius: 14, background: "var(--color-surface)",
                        }}
                      >
                        <span style={{ width: 22, display: "flex", justifyContent: "center", flexShrink: 0 }}>{rowIcon(t)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, color: "var(--color-text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rowTitle(t)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rowSub(t)}
                          </div>
                        </div>
                        <span className="num" style={{ fontSize: 14, fontWeight: 700, color: amountColor, whiteSpace: "nowrap" }}>
                          {sign}{fmtMoney(t.amount, cur)}
                        </span>
                        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                          <button onClick={() => setEditing(t)} title="Edit" aria-label="Edit transaksi" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: "var(--color-dim)", display: "flex" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteTx(t)} title="Hapus (bisa diurungkan)" aria-label="Hapus transaksi" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: "var(--color-dim)", display: "flex" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length > limit && (
            <Btn variant="ghost" onClick={() => setLimit(limit + PAGE)} style={{ alignSelf: "center" }}>
              Tampilkan {Math.min(PAGE, filtered.length - limit)} lagi ({filtered.length - limit} tersisa)
            </Btn>
          )}
        </div>
      )}

      {editing && (
        <EditTxModal
          fin={fin}
          tx={editing}
          onClose={() => setEditing(null)}
          onSave={(patched) => {
            setFin((f) => ({ ...f, transactions: f.transactions.map((t) => (t.id === patched.id ? patched : t)) }));
            setEditing(null);
            toast.success("Transaksi diperbarui");
          }}
        />
      )}
    </Card>
  );
}

// ── Modal edit transaksi ──────────────────────────────────────────────────────
function EditTxModal({
  fin, tx, onClose, onSave,
}: {
  fin: FinanceData;
  tx: FinanceTransaction;
  onClose: () => void;
  onSave: (t: FinanceTransaction) => void;
}) {
  const cur = fin.currency;
  const [type, setType] = useState<TxType>(tx.type);
  const [amountStr, setAmountStr] = useState(String(tx.amount));
  const [accountId, setAccountId] = useState(tx.accountId);
  const [toAccountId, setToAccountId] = useState(tx.toAccountId ?? "");
  const [sourceId, setSourceId] = useState(tx.sourceId ?? fin.sources[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(tx.categoryId ?? fin.categories[0]?.id ?? "");
  const [date, setDate] = useState(tx.date);
  const [note, setNote] = useState(tx.note ?? "");

  const parsed = parseAmountInput(amountStr);
  const accounts = fin.accounts.filter((a) => !a.archived || a.id === tx.accountId || a.id === tx.toAccountId);

  const save = () => {
    if (!parsed) { toast.error("Jumlah belum valid"); return; }
    if (type === "masuk" && !sourceId) { toast.error("Pemasukan wajib punya sumber"); return; }
    if (type === "keluar" && !categoryId) { toast.error("Pilih kategori"); return; }
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) { toast.error("Kantong tujuan transfer tidak valid"); return; }
    onSave({
      ...tx,
      type,
      amount: parsed,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      sourceId: type === "masuk" ? sourceId : undefined,
      categoryId: type === "keluar" ? categoryId : undefined,
      date,
      note: note.trim() || undefined,
    });
  };

  const TYPES: { t: TxType; label: string; color: string; soft: string; Icon: typeof ArrowUpRight }[] = [
    { t: "keluar", label: "Keluar", color: "var(--loss)", soft: "var(--loss-soft)", Icon: ArrowDownRight },
    { t: "masuk", label: "Masuk", color: "var(--gain)", soft: "var(--gain-soft)", Icon: ArrowUpRight },
    { t: "transfer", label: "Transfer", color: "var(--color-primary)", soft: "var(--ember-soft)", Icon: ArrowLeftRight },
  ];

  return (
    <Modal title="Edit Transaksi" onClose={onClose} width={500}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {TYPES.map(({ t, label, color, soft, Icon }) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "8px 0", borderRadius: 12, fontSize: 12.5, fontWeight: type === t ? 700 : 500,
                border: `1.5px solid ${type === t ? color : "var(--color-border)"}`,
                background: type === t ? soft : "transparent",
                color: type === t ? color : "var(--color-muted)", cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <Field label="Jumlah">
          <input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            inputMode="decimal"
            className="num"
            style={{ ...inputStyle, fontSize: 17, fontWeight: 700 }}
          />
          {parsed !== null && parsed !== Number(amountStr) && (
            <span className="num" style={{ fontSize: 11, color: "var(--color-muted)" }}>= {fmtMoney(parsed, cur)}</span>
          )}
        </Field>

        <Field label={type === "masuk" ? "Masuk ke kantong" : "Dari kantong"}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {accounts.map((a) => (
              <Chip key={a.id} active={accountId === a.id} color={catColor(a.color)} onClick={() => setAccountId(a.id)} small>
                {a.name}
              </Chip>
            ))}
          </div>
        </Field>

        {type === "transfer" && (
          <Field label="Ke kantong">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {accounts.filter((a) => a.id !== accountId).map((a) => (
                <Chip key={a.id} active={toAccountId === a.id} color={catColor(a.color)} onClick={() => setToAccountId(a.id)} small>
                  {a.name}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        {type === "masuk" && (
          <Field label="Sumber pemasukan">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {fin.sources.map((s) => (
                <Chip key={s.id} active={sourceId === s.id} color={catColor(s.color)} onClick={() => setSourceId(s.id)} small>
                  {s.emoji} {s.name}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        {type === "keluar" && (
          <Field label="Kategori">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {fin.categories.map((c) => (
                <Chip key={c.id} active={categoryId === c.id} color={catColor(c.color)} onClick={() => setCategoryId(c.id)} small>
                  {c.emoji} {c.name}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Field label="Tanggal">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="num"
              style={{ ...inputStyle, width: 156 }}
            />
          </Field>
          <div style={{ flex: 1, minWidth: 170 }}>
            <Field label="Catatan (opsional)">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <Btn onClick={save} style={{ flex: 1 }}>Simpan Perubahan</Btn>
          <Btn variant="ghost" onClick={onClose}>Batal</Btn>
        </div>
      </div>
    </Modal>
  );
}
