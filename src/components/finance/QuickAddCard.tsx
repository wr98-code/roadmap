// ─── ZERØ COMMAND — finance/QuickAddCard.tsx ──────────────────────────────────
// Quick-add transaksi, friction minimal (riset: entry friction = alasan #1
// orang berhenti mencatat):
// - amount-first, keypad numerik (inputmode), sufiks 25rb / 1,5jt / 10rb+5rb
// - default cerdas: tanggal hari ini, kantong & kategori terakhir dipakai
// - kategori = deretan chip emoji terurut frekuensi, bukan dropdown
// - pemasukan WAJIB pilih sumber (Trading / Bisnis / Personal / …)
// - memori catatan→kategori, repeat pill transaksi terakhir
// - feedback langsung: toast + ringkasan ikut update, fokus balik ke amount

import { useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Plus, Repeat, Coins } from "lucide-react";
import { toast } from "sonner";
import {
  FinanceData, FinanceTransaction, TxType, parseAmountInput, fmtMoney, fmtCompact,
  todayStr, toDateStr, newId, categoriesByUsage, noteCategoryMemory,
  CAT_KEYS, catColor,
} from "@/lib/finance";
import { useT } from "@/lib/lang";
import { TYPE_ICONS } from "./AccountsSection";
import { Card, Label, Chip, Btn, inputStyle } from "./ui";

interface Props {
  fin: FinanceData;
  setFin: (fn: (f: FinanceData) => FinanceData) => void;
  /** tanpa Card wrapper — dipakai di dalam bottom sheet mobile */
  bare?: boolean;
}

const TYPE_CFG: Record<TxType, { label: string; color: string; soft: string; Icon: typeof ArrowUpRight }> = {
  keluar: { label: "Keluar", color: "var(--loss)", soft: "var(--loss-soft)", Icon: ArrowDownRight },
  masuk: { label: "Masuk", color: "var(--gain)", soft: "var(--gain-soft)", Icon: ArrowUpRight },
  transfer: { label: "Transfer", color: "var(--color-primary)", soft: "var(--ember-soft)", Icon: ArrowLeftRight },
};

export function QuickAddCard({ fin, setFin, bare }: Props) {
  const cur = fin.currency;
  const t = useT();
  const activeAccounts = fin.accounts.filter((a) => !a.archived);
  const amountRef = useRef<HTMLInputElement>(null);

  // default cerdas: kantong/sumber/kategori terakhir dipakai (derive dari log)
  const lastTx = fin.transactions.length ? fin.transactions[fin.transactions.length - 1] : null;
  const lastMasuk = [...fin.transactions].reverse().find((t) => t.type === "masuk");
  const lastKeluar = [...fin.transactions].reverse().find((t) => t.type === "keluar");

  const [type, setType] = useState<TxType>("keluar");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [accountId, setAccountId] = useState<string>(
    () => (lastTx && activeAccounts.some((a) => a.id === lastTx.accountId) ? lastTx.accountId : activeAccounts[0]?.id ?? "")
  );
  const [toAccountId, setToAccountId] = useState<string>("");
  const [sourceId, setSourceId] = useState<string>(() => lastMasuk?.sourceId ?? fin.sources[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    () => lastKeluar?.categoryId ?? fin.categories.find((c) => !c.kind)?.id ?? fin.categories[0]?.id ?? ""
  );
  const [manualCat, setManualCat] = useState(false); // user sudah pilih kategori sendiri?

  const parsed = parseAmountInput(amountStr);
  const catsByUsage = useMemo(() => categoriesByUsage(fin), [fin]);
  const noteMemory = useMemo(() => noteCategoryMemory(fin), [fin]);
  const recentNotes = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (let i = fin.transactions.length - 1; i >= 0 && out.length < 12; i--) {
      const n = fin.transactions[i].note?.trim();
      if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push(n); }
    }
    return out;
  }, [fin.transactions]);

  // repeat pill: 4 pengeluaran terakhir yang unik (note+kategori+jumlah)
  const repeatPills = useMemo(() => {
    const seen = new Set<string>();
    const out: FinanceTransaction[] = [];
    for (let i = fin.transactions.length - 1; i >= 0 && out.length < 4; i--) {
      const t = fin.transactions[i];
      if (t.type !== "keluar") continue;
      const key = `${(t.note ?? "").toLowerCase()}|${t.categoryId}|${t.amount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }, [fin.transactions]);

  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toDateStr(d); };

  const onNoteChange = (v: string) => {
    setNote(v);
    // memori catatan → kategori (hanya kalau user belum pilih manual)
    if (!manualCat && type === "keluar") {
      const remembered = noteMemory.get(v.trim().toLowerCase());
      if (remembered && fin.categories.some((c) => c.id === remembered)) setCategoryId(remembered);
    }
  };

  const applyRepeat = (t: FinanceTransaction) => {
    setType("keluar");
    setAmountStr(String(t.amount));
    setNote(t.note ?? "");
    if (t.categoryId) { setCategoryId(t.categoryId); setManualCat(true); }
    if (activeAccounts.some((a) => a.id === t.accountId)) setAccountId(t.accountId);
    setDate(todayStr());
    amountRef.current?.focus();
  };

  const submit = () => {
    if (!parsed) { toast.error("Jumlah belum valid — coba: 25rb, 1,5jt, atau 10rb+5rb"); amountRef.current?.focus(); return; }
    if (!accountId) { toast.error("Pilih kantong dulu"); return; }
    if (type === "masuk" && !sourceId) { toast.error("Pemasukan wajib pilih SUMBER (Trading / Bisnis / …)"); return; }
    if (type === "transfer") {
      if (!toAccountId) { toast.error("Pilih kantong tujuan transfer"); return; }
      if (toAccountId === accountId) { toast.error("Kantong asal dan tujuan tidak boleh sama"); return; }
    }
    if (type === "keluar" && !categoryId) { toast.error("Pilih kategori dulu"); return; }

    const tx: FinanceTransaction = {
      id: newId(),
      type,
      amount: parsed,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      sourceId: type === "masuk" ? sourceId : undefined,
      categoryId: type === "keluar" ? categoryId : undefined,
      note: note.trim() || undefined,
      date,
      createdAt: new Date().toISOString(),
    };
    setFin((f) => ({ ...f, transactions: [...f.transactions, tx] }));

    const accName = activeAccounts.find((a) => a.id === accountId)?.name ?? "";
    const desc =
      type === "masuk"
        ? `+${fmtMoney(parsed, cur)} → ${accName} (${fin.sources.find((s) => s.id === sourceId)?.name ?? ""})`
        : type === "keluar"
          ? `−${fmtMoney(parsed, cur)} dari ${accName}`
          : `${fmtMoney(parsed, cur)} ${accName} → ${activeAccounts.find((a) => a.id === toAccountId)?.name ?? ""}`;
    toast.success(`Tercatat ✓ ${desc}`);

    // clear minimal: jumlah + catatan saja, konteks lain dipertahankan
    setAmountStr("");
    setNote("");
    setManualCat(false);
    amountRef.current?.focus();
  };

  const cfg = TYPE_CFG[type];
  const inlineCreate = (kind: "kategori" | "sumber") => {
    const name = window.prompt(kind === "kategori" ? "Nama kategori baru:" : "Nama sumber pemasukan baru:")?.trim();
    if (!name) return;
    const id = newId();
    if (kind === "kategori") {
      const color = CAT_KEYS[fin.categories.length % CAT_KEYS.length];
      setFin((f) => ({ ...f, categories: [...f.categories, { id, name, emoji: "🏷️", color }] }));
      setCategoryId(id);
      setManualCat(true);
    } else {
      const color = CAT_KEYS[fin.sources.length % CAT_KEYS.length];
      setFin((f) => ({ ...f, sources: [...f.sources, { id, name, emoji: "💵", color }] }));
      setSourceId(id);
    }
    toast.success(`${kind === "kategori" ? "Kategori" : "Sumber"} "${name}" dibuat`);
  };

  const accountChip = (a: (typeof activeAccounts)[0], selected: boolean, onClick: () => void) => {
    const Icon = TYPE_ICONS[a.type] ?? Coins;
    return (
      <Chip key={a.id} active={selected} color={catColor(a.color)} onClick={onClick}>
        <Icon size={12} /> {a.name}
      </Chip>
    );
  };

  return (
    <Card
      className={bare ? "" : "rise rise-2"}
      style={bare ? { background: "transparent", border: "none", boxShadow: "none", padding: 0, borderRadius: 0 } : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
        {!bare && (
          <>
            <Label>{t("qa.title")}</Label>
            <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>{t("qa.sub")}</span>
          </>
        )}
        <div style={{ flex: 1 }} />
        {/* segmented type */}
        <div style={{ display: "flex", gap: 4, background: "var(--color-surface)", borderRadius: 999, padding: 4 }}>
          {(Object.keys(TYPE_CFG) as TxType[]).map((t) => {
            const c = TYPE_CFG[t];
            const on = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
                  fontSize: 12.5, fontWeight: on ? 700 : 500, fontFamily: "var(--font-sans)",
                  border: "none", cursor: "pointer", transition: "all var(--dur-fast) var(--ease-out)",
                  background: on ? c.soft : "transparent",
                  color: on ? c.color : "var(--color-muted)",
                }}
              >
                <c.Icon size={12} /> {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {/* Amount — kolom kiri, dominan */}
        <div style={{ flex: "1 1 230px", minWidth: 210 }}>
          <input
            ref={amountRef}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="decimal"
            placeholder="0"
            aria-label="Jumlah"
            className="num"
            style={{
              width: "100%",
              background: "var(--color-surface)",
              border: `1.5px solid ${parsed ? cfg.color : "var(--color-border)"}`,
              borderRadius: 16,
              padding: "13px 17px",
              fontFamily: "var(--font-sans)",
              fontSize: 27,
              fontWeight: 700,
              color: parsed ? cfg.color : "var(--color-text)",
              outline: "none",
              letterSpacing: "-0.02em",
              transition: "border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, minHeight: 16, gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--color-dim)" }}>cth: 25rb · 1,5jt · 10rb+5rb</span>
            {parsed !== null && (
              <span className="num" style={{ fontSize: 12, fontWeight: 700, color: cfg.color, whiteSpace: "nowrap" }}>
                = {fmtMoney(parsed, cur)}
              </span>
            )}
          </div>

          {/* catatan + memori kategori */}
          <input
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            list="zc-note-suggestions"
            placeholder={type === "keluar" ? t("qa.noteKeluar") : type === "masuk" ? "Catatan (opsional)" : "Catatan transfer (opsional)"}
            style={{ ...inputStyle, marginTop: 10 }}
          />
          <datalist id="zc-note-suggestions">
            {recentNotes.map((n) => <option key={n} value={n} />)}
          </datalist>

          {/* tanggal */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <Chip small active={date === todayStr()} onClick={() => setDate(todayStr())}>Hari ini</Chip>
            <Chip small active={date === yesterday()} onClick={() => setDate(yesterday())}>Kemarin</Chip>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="num"
              style={{ ...inputStyle, width: 148, padding: "5px 10px", fontSize: 12.5 }}
            />
          </div>
        </div>

        {/* Kolom kanan: kantong + kategori/sumber */}
        <div style={{ flex: "1.5 1 310px", minWidth: 270, display: "flex", flexDirection: "column", gap: 13 }}>
          {/* kantong asal/tujuan */}
          <div>
            <Label style={{ fontSize: 10 }}>
              {type === "masuk" ? t("qa.masukKeKantong") : t("qa.dariKantong")}
            </Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
              {activeAccounts.map((a) => accountChip(a, accountId === a.id, () => setAccountId(a.id)))}
            </div>
          </div>

          {type === "transfer" && (
            <div>
              <Label style={{ fontSize: 10 }}>{t("qa.keKantong")}</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                {activeAccounts.filter((a) => a.id !== accountId).map((a) => accountChip(a, toAccountId === a.id, () => setToAccountId(a.id)))}
                {activeAccounts.length < 2 && (
                  <span style={{ fontSize: 12, color: "var(--color-muted)" }}>Butuh ≥2 kantong untuk transfer.</span>
                )}
              </div>
            </div>
          )}

          {type === "keluar" && (
            <div>
              <Label style={{ fontSize: 10 }}>Kategori</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                {catsByUsage.map((c) => (
                  <Chip key={c.id} active={categoryId === c.id} color={catColor(c.color)} onClick={() => { setCategoryId(c.id); setManualCat(true); }}>
                    {c.emoji} {c.name}
                  </Chip>
                ))}
                <Chip onClick={() => inlineCreate("kategori")} title="Buat kategori baru">
                  <Plus size={11} /> Baru
                </Chip>
              </div>
            </div>
          )}

          {type === "masuk" && (
            <div>
              <Label style={{ fontSize: 10, color: "var(--gain)" }}>{t("qa.sumberLabel")}</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                {fin.sources.map((s) => (
                  <Chip key={s.id} active={sourceId === s.id} color={catColor(s.color)} onClick={() => setSourceId(s.id)}>
                    {s.emoji} {s.name}
                  </Chip>
                ))}
                <Chip onClick={() => inlineCreate("sumber")} title="Buat sumber baru">
                  <Plus size={11} /> Baru
                </Chip>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto", flexWrap: "wrap" }}>
            <Btn
              onClick={submit}
              style={{ background: cfg.soft, color: cfg.color, border: `1.5px solid ${cfg.color}`, padding: "10px 24px", fontSize: 14 }}
            >
              <cfg.Icon size={14} /> Simpan {cfg.label}
            </Btn>
            {/* repeat pills */}
            {repeatPills.length > 0 && type === "keluar" && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <Repeat size={12} color="var(--color-dim)" />
                {repeatPills.map((t) => {
                  const c = fin.categories.find((x) => x.id === t.categoryId);
                  return (
                    <Chip key={t.id} small onClick={() => applyRepeat(t)} title="Ulangi transaksi ini (isi otomatis)">
                      {c?.emoji ?? "🏷️"} {t.note || c?.name || "?"} · {fmtCompact(t.amount, cur)}
                    </Chip>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
