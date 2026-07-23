// ─── ZERØ COMMAND — finance/AccountsSection.tsx ───────────────────────────────
// Kantong/akun tabungan: total saldo dulu (pertanyaan #1: "punya berapa, di
// mana"), lalu grid kartu per kantong DIKELOMPOKKAN PER TIPE — Bank / E-Wallet
// / Crypto / Cash / Lainnya, masing-masing dengan ikon lucide yang berbeda
// supaya mudah di-scan sekilas. Nama tetap bebas ("BCA", "GoPay", "Phantom").
// Arsip > hapus: riwayat transaksi tetap utuh.

import { useState } from "react";
import {
  Plus, Pencil, Archive, ArchiveRestore, Trash2, Wallet,
  Landmark, Bitcoin, Banknote, Coins, LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  FinanceData, FinanceAccount, AccountType, ACCOUNT_TYPES, ACCOUNT_TYPE_LABEL,
  CatKey, catColor, CAT_KEYS, accountBalance, totalBalance, accountTxCount,
  fmtMoney, newId,
} from "@/lib/finance";
import { MetricInfo } from "@/components/MetricInfo";
import { Card, Label, Btn, Modal, Field, inputStyle, ColorSwatches, EmptyState } from "./ui";

/** Ikon lucide per tipe kantong — pembeda visual utama. */
export const TYPE_ICONS: Record<AccountType, LucideIcon> = {
  bank: Landmark,     // gedung bank
  ewallet: Wallet,    // dompet digital
  crypto: Bitcoin,    // coin / wallet on-chain
  cash: Banknote,     // uang tunai
  other: Coins,       // lainnya
};

const TYPE_ORDER: AccountType[] = ["bank", "ewallet", "crypto", "cash", "other"];

interface Props {
  fin: FinanceData;
  setFin: (fn: (f: FinanceData) => FinanceData) => void;
  accountFilter: string | null;
  setAccountFilter: (id: string | null) => void;
}

interface Draft {
  id?: string;
  name: string;
  type: AccountType;
  color: CatKey;
  initialBalance: string;
}

export function AccountsSection({ fin, setFin, accountFilter, setAccountFilter }: Props) {
  const cur = fin.currency;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const active = fin.accounts.filter((a) => !a.archived);
  const archived = fin.accounts.filter((a) => a.archived);
  const total = totalBalance(fin);

  // kelompokkan per tipe, urutan tetap — mudah discan
  const groups = TYPE_ORDER
    .map((t) => ({ type: t, accounts: active.filter((a) => a.type === t) }))
    .filter((g) => g.accounts.length > 0);

  const openNew = () =>
    setDraft({ name: "", type: "bank", color: CAT_KEYS[active.length % CAT_KEYS.length], initialBalance: "" });

  const openEdit = (a: FinanceAccount) =>
    setDraft({ id: a.id, name: a.name, type: a.type, color: a.color, initialBalance: String(a.initialBalance) });

  const save = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { toast.error("Nama kantong belum diisi"); return; }
    const initial = Number(draft.initialBalance.replace(/\./g, "").replace(",", ".")) || 0;
    if (draft.id) {
      setFin((f) => ({
        ...f,
        accounts: f.accounts.map((a) =>
          a.id === draft.id ? { ...a, name, type: draft.type, color: draft.color, initialBalance: initial } : a
        ),
      }));
      toast.success(`Kantong "${name}" diperbarui`);
    } else {
      const acc: FinanceAccount = {
        id: newId(), name, type: draft.type, color: draft.color,
        initialBalance: initial, createdAt: new Date().toISOString(),
      };
      setFin((f) => ({ ...f, accounts: [...f.accounts, acc] }));
      toast.success(`Kantong "${name}" dibuat`);
    }
    setDraft(null);
    setConfirmDelete(false);
  };

  const toggleArchive = (id: string, archive: boolean) => {
    if (archive && active.length <= 1) { toast.error("Minimal satu kantong aktif"); return; }
    setFin((f) => ({ ...f, accounts: f.accounts.map((a) => (a.id === id ? { ...a, archived: archive } : a)) }));
    if (accountFilter === id) setAccountFilter(null);
    setDraft(null);
    setConfirmDelete(false);
    toast.success(archive ? "Kantong diarsipkan — riwayat tetap utuh" : "Kantong diaktifkan lagi");
  };

  const hardDelete = (id: string) => {
    const acc = fin.accounts.find((a) => a.id === id);
    if (!acc) return;
    if (!acc.archived && active.length <= 1) { toast.error("Minimal satu kantong aktif"); return; }
    setFin((f) => ({
      ...f,
      accounts: f.accounts.filter((a) => a.id !== id),
      // transaksi yang menyentuh kantong ini ikut terhapus (sudah dikonfirmasi)
      transactions: f.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
    }));
    if (accountFilter === id) setAccountFilter(null);
    setDraft(null);
    setConfirmDelete(false);
    toast.success(`Kantong "${acc.name}" dan transaksinya dihapus`);
  };

  const editing = draft?.id ? fin.accounts.find((a) => a.id === draft.id) : undefined;
  const editingTxCount = editing ? accountTxCount(fin, editing.id) : 0;

  const AccountCard = ({ a }: { a: FinanceAccount }) => {
    const bal = accountBalance(fin, a.id);
    const selected = accountFilter === a.id;
    const Icon = TYPE_ICONS[a.type] ?? Coins;
    const color = catColor(a.color);
    return (
      <div
        onClick={() => setAccountFilter(selected ? null : a.id)}
        title={selected ? "Klik untuk lepas filter" : "Klik untuk filter transaksi kantong ini"}
        style={{
          borderRadius: 16,
          padding: "13px 14px",
          cursor: "pointer",
          background: selected ? "var(--raised)" : "var(--color-surface)",
          border: `1.5px solid ${selected ? color : "transparent"}`,
          transition: "all var(--dur-fast) var(--ease-out)",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--raised)", border: "1px solid var(--color-border)",
          }}>
            <Icon size={15} color={color} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.name}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-dim)" }}>
              {ACCOUNT_TYPE_LABEL[a.type]}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(a); }}
            title="Edit kantong"
            aria-label={`Edit ${a.name}`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-dim)", display: "flex", flexShrink: 0 }}
          >
            <Pencil size={12.5} />
          </button>
        </div>
        <div className="num" style={{ fontSize: 17, fontWeight: 700, marginTop: 10, color: bal < 0 ? "var(--loss)" : "var(--color-text)" }}>
          {fmtMoney(bal, cur)}
        </div>
      </div>
    );
  };

  return (
    <Card className="rise rise-3">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Label>Kantong</Label>
        <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>di mana uang disimpan</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--color-muted)" }}>
            TOTAL SALDO
          </span>
          <span className="num" style={{ fontSize: 21, fontWeight: 700, color: "var(--color-text)" }}>
            {fmtMoney(total, cur)}
          </span>
          <MetricInfo termId="net-worth">
            Total saldo kantong aktif = sisi kas dari net worth-mu. Neraca lengkap
            (aset lain + utang) ada di halaman Wealth.
          </MetricInfo>
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={<Wallet size={30} />}
          title="Belum ada kantong"
          hint="Buat kantong pertama — misal BCA (Bank), GoPay (E-Wallet), Phantom (Crypto), atau dompet tunai."
          cta={<Btn onClick={openNew}><Plus size={14} /> Buat Kantong</Btn>}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {groups.map(({ type, accounts }) => {
            const Icon = TYPE_ICONS[type];
            return (
              <div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Icon size={11} color="var(--color-dim)" />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-dim)" }}>
                    {ACCOUNT_TYPE_LABEL[type]} · {accounts.length}
                  </span>
                </div>
                <div className="keep-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))", gap: 10 }}>
                  {accounts.map((a) => <AccountCard key={a.id} a={a} />)}
                </div>
              </div>
            );
          })}
          <button
            onClick={openNew}
            style={{
              borderRadius: 16, minHeight: 52, cursor: "pointer",
              border: "1.5px dashed var(--color-border)", background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              color: "var(--color-muted)", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)",
              transition: "all var(--dur-fast) var(--ease-out)",
            }}
          >
            <Plus size={15} /> Tambah Kantong
          </button>
        </div>
      )}

      {/* arsip */}
      {archived.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-dim)" }}
          >
            {showArchived ? "▼" : "▶"} ARSIP — {archived.length} KANTONG
          </button>
          {showArchived && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {archived.map((a) => {
                const Icon = TYPE_ICONS[a.type] ?? Coins;
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", borderRadius: 13, background: "var(--color-surface)", opacity: 0.7 }}>
                    <Icon size={14} color={catColor(a.color)} />
                    <span style={{ fontSize: 13, color: "var(--color-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                    <span className="num" style={{ fontSize: 13, color: "var(--color-muted)" }}>
                      {fmtMoney(accountBalance(fin, a.id), cur)}
                    </span>
                    <button onClick={() => toggleArchive(a.id, false)} title="Aktifkan lagi" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", display: "flex", padding: 3 }}>
                      <ArchiveRestore size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* modal tambah/edit */}
      {draft && (
        <Modal title={draft.id ? "Edit Kantong" : "Kantong Baru"} onClose={() => { setDraft(null); setConfirmDelete(false); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <Field label="Tipe — menentukan ikon & pengelompokan, bukan batasan">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ACCOUNT_TYPES.map(({ type, label }) => {
                  const Icon = TYPE_ICONS[type];
                  const on = draft.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDraft({ ...draft, type })}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 13px", borderRadius: 12, cursor: "pointer",
                        fontSize: 12.5, fontWeight: on ? 700 : 500, fontFamily: "var(--font-sans)",
                        border: `1.5px solid ${on ? "var(--color-primary)" : "var(--color-border)"}`,
                        background: on ? "var(--ember-soft)" : "var(--color-surface)",
                        color: on ? "var(--color-primary)" : "var(--color-muted)",
                        transition: "all var(--dur-fast) var(--ease-out)",
                      }}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Nama kantong (bebas)">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder={draft.type === "bank" ? "cth: BCA, Mandiri, Jago…" : draft.type === "ewallet" ? "cth: GoPay, OVO, DANA…" : draft.type === "crypto" ? "cth: Phantom, Binance, MetaMask…" : "cth: Dompet harian, Brankas…"}
                autoFocus
                style={inputStyle}
              />
            </Field>
            <Field label="Warna identitas">
              <ColorSwatches value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
            </Field>
            <Field label={draft.id ? "Saldo awal (penyesuaian)" : "Isinya sekarang berapa?"}>
              <input
                value={draft.initialBalance}
                onChange={(e) => setDraft({ ...draft, initialBalance: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && save()}
                inputMode="decimal"
                placeholder="0"
                className="num"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Btn onClick={save} style={{ flex: 1 }}>{draft.id ? "Simpan" : "Buat Kantong"}</Btn>
              <Btn variant="ghost" onClick={() => { setDraft(null); setConfirmDelete(false); }}>Batal</Btn>
            </div>

            {draft.id && editing && (
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 13, display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn variant="ghost" onClick={() => toggleArchive(draft.id!, !editing.archived)}>
                  {editing.archived ? <><ArchiveRestore size={13} /> Aktifkan lagi</> : <><Archive size={13} /> Arsipkan (riwayat tetap utuh)</>}
                </Btn>
                {!confirmDelete ? (
                  <Btn variant="ghost" onClick={() => setConfirmDelete(true)} style={{ color: "var(--loss)" }}>
                    <Trash2 size={13} /> Hapus permanen…
                  </Btn>
                ) : (
                  <div style={{ background: "var(--loss-soft)", borderRadius: 13, padding: 13 }}>
                    <p style={{ fontSize: 13, color: "var(--color-text)", marginBottom: 10, lineHeight: 1.5 }}>
                      Hapus <b>{editing.name}</b> beserta <b>{editingTxCount} transaksi</b> yang
                      menyentuhnya? Tidak bisa dibatalkan.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="danger" onClick={() => hardDelete(draft.id!)}>Ya, hapus semua</Btn>
                      <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>Batal</Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </Card>
  );
}
