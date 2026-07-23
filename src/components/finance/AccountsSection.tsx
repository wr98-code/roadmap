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
  CatKey, catColor, CAT_KEYS, accountBalance, accountBreakdown, totalBalance,
  accountTxCount, monthTotals, currentMonth, fmtMoney, newId,
  parseBalanceInput,
} from "@/lib/finance";
import { useT } from "@/lib/lang";
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
  /** mobile: rail horizontal snap (kartu peek) alih-alih grid per tipe */
  rail?: boolean;
}

interface Draft {
  id?: string;
  name: string;
  type: AccountType;
  color: CatKey;
  initialBalance: string;
}

export function AccountsSection({ fin, setFin, accountFilter, setAccountFilter, rail }: Props) {
  const cur = fin.currency;
  const t = useT();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const active = fin.accounts.filter((a) => !a.archived);
  const archived = fin.accounts.filter((a) => a.archived);
  const total = totalBalance(fin);
  const monthNet = monthTotals(fin, currentMonth()).net;
  const archivedTotal = archived.reduce((s, a) => s + accountBalance(fin, a.id), 0);

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
    // SATU parser dengan form transaksi — "5jt"/"500rb"/"5.000.000" semua sah.
    // Input tak terbaca DITOLAK dengan jelas, tidak pernah diam-diam jadi 0.
    const initial = parseBalanceInput(draft.initialBalance);
    if (initial === null) {
      toast.error(`Saldo awal "${draft.initialBalance}" tidak terbaca — contoh format: 5jt · 500rb · 5.000.000`);
      return;
    }
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
    // Arsip mengeluarkan saldo dari TOTAL — jangan diam-diam bila saldonya ≠ 0
    const bal = accountBalance(fin, id);
    if (archive && Math.round(bal) !== 0) {
      const name = fin.accounts.find((a) => a.id === id)?.name ?? "kantong ini";
      if (!window.confirm(
        `Saldo ${name} (${fmtMoney(bal, cur)}) akan BERHENTI dihitung di TOTAL SALDO selama diarsip. ` +
        `Riwayat & saldonya tetap utuh dan bisa diaktifkan lagi kapan saja. Lanjut arsipkan?`
      )) return;
    }
    setFin((f) => ({ ...f, accounts: f.accounts.map((a) => (a.id === id ? { ...a, archived: archive } : a)) }));
    if (accountFilter === id) setAccountFilter(null);
    setDraft(null);
    setConfirmDelete(false);
    toast.success(archive
      ? (Math.round(bal) !== 0 ? `Diarsipkan — ${fmtMoney(bal, cur)} tidak lagi dihitung di TOTAL SALDO` : "Kantong diarsipkan — riwayat tetap utuh")
      : "Kantong diaktifkan lagi — saldonya kembali dihitung di TOTAL SALDO");
  };

  const hardDelete = (id: string) => {
    const acc = fin.accounts.find((a) => a.id === id);
    if (!acc) return;
    if (!acc.archived && active.length <= 1) { toast.error("Minimal satu kantong aktif"); return; }
    setFin((f) => {
      // JAGA SALDO KANTONG LAIN: record transfer yang menyentuh kantong ini
      // ikut terhapus, jadi efek bersihnya ke tiap kantong lain dikompensasi
      // ke saldo awal mereka — saldo kantong yang TIDAK dihapus tidak berubah.
      const delta = new Map<string, number>();
      for (const t of f.transactions) {
        if (t.type !== "transfer") continue;
        if (t.accountId === id && t.toAccountId && t.toAccountId !== id) {
          // kantong lain pernah MENERIMA dari kantong ini — uang itu nyata di sana
          delta.set(t.toAccountId, (delta.get(t.toAccountId) ?? 0) + t.amount);
        } else if (t.toAccountId === id && t.accountId !== id) {
          // kantong lain pernah MENGIRIM ke kantong ini — pengurangan itu nyata
          delta.set(t.accountId, (delta.get(t.accountId) ?? 0) - t.amount);
        }
      }
      return {
        ...f,
        accounts: f.accounts
          .filter((a) => a.id !== id)
          .map((a) => (delta.has(a.id) ? { ...a, initialBalance: a.initialBalance + delta.get(a.id)! } : a)),
        transactions: f.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
      };
    });
    if (accountFilter === id) setAccountFilter(null);
    setDraft(null);
    setConfirmDelete(false);
    toast.success(`Kantong "${acc.name}" dihapus — saldo kantong lain tidak berubah`);
  };

  const editing = draft?.id ? fin.accounts.find((a) => a.id === draft.id) : undefined;
  const editingTxCount = editing ? accountTxCount(fin, editing.id) : 0;

  const AccountCard = ({ a }: { a: FinanceAccount }) => {
    const bd = accountBreakdown(fin, a.id);
    const bal = bd.balance;
    const selected = accountFilter === a.id;
    const Icon = TYPE_ICONS[a.type] ?? Coins;
    const color = catColor(a.color);
    // angka tidak pernah misterius: rinciannya selalu satu hover/klik jauhnya
    const rincian =
      `Saldo awal ${fmtMoney(bd.initial, cur)} + Masuk ${fmtMoney(bd.masuk, cur)} − Keluar ${fmtMoney(bd.keluar, cur)}` +
      (bd.transferIn || bd.transferOut ? ` + Transfer masuk ${fmtMoney(bd.transferIn, cur)} − Transfer keluar ${fmtMoney(bd.transferOut, cur)}` : "") +
      ` = ${fmtMoney(bal, cur)}`;
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
        <div style={{ marginTop: 9 }} title={rincian}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-dim)" }}>
            Saldo kini
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 700, marginTop: 2, color: bal < 0 ? "var(--loss)" : "var(--color-text)" }}>
            {fmtMoney(bal, cur)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="rise rise-3" style={rail ? { padding: "16px 16px" } : undefined}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Label>Kantong</Label>
        <span style={{ fontSize: 11.5, color: "var(--color-dim)" }}>{t("acc.sub")}</span>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--color-muted)" }}>
              {t("acc.total")}
            </span>
            <span className="num" style={{ fontSize: 21, fontWeight: 700, color: "var(--color-text)" }}>
              {fmtMoney(total, cur)}
            </span>
            <MetricInfo termId="net-worth">
              Jumlah saldo kini semua kantong aktif (saldo awal + seluruh mutasi).
              Angka ini otomatis muncul sebagai baris aset "Kas di kantong" di
              halaman Wealth.
            </MetricInfo>
          </div>
          {/* jembatan stok vs aliran: kenapa TOTAL ≠ surplus bulan ini */}
          <div className="num" style={{ fontSize: 10.5, color: "var(--color-dim)", marginTop: 2 }}>
            termasuk saldo awal · bulan ini {fmtMoney(monthNet, cur, true)}
            {archivedTotal !== 0 && <> · arsip {fmtMoney(archivedTotal, cur)}</>}
          </div>
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={<Wallet size={30} />}
          title="Belum ada kantong"
          hint="Buat kantong pertama — misal BCA (Bank), GoPay (E-Wallet), Phantom (Crypto), atau dompet tunai."
          cta={<Btn onClick={openNew}><Plus size={14} /> Buat Kantong</Btn>}
        />
      ) : rail ? (
        /* ── Mobile: rail horizontal snap — kartu berikutnya selalu "peek"
              (riset: konten carousel di luar layar diabaikan tanpa peek) ── */
        <div
          style={{
            display: "flex", gap: 10, overflowX: "auto",
            scrollSnapType: "x mandatory", scrollPaddingInline: 4,
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
            margin: "0 -16px", padding: "0 16px 4px",
          }}
        >
          {active.map((a) => (
            <div key={a.id} style={{ flex: "0 0 auto", width: "clamp(150px, 44vw, 200px)", scrollSnapAlign: "start" }}>
              <AccountCard a={a} />
            </div>
          ))}
          <button
            onClick={openNew}
            aria-label="Tambah kantong"
            style={{
              flex: "0 0 auto", width: 96, scrollSnapAlign: "start",
              borderRadius: 16, cursor: "pointer",
              border: "1.5px dashed var(--color-border)", background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              color: "var(--color-muted)", fontSize: 11.5, fontWeight: 600, fontFamily: "var(--font-sans)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Plus size={17} /> Tambah
          </button>
        </div>
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
            <Field label={draft.id ? "Saldo awal" : "Isinya sekarang berapa?"}>
              <input
                value={draft.initialBalance}
                onChange={(e) => setDraft({ ...draft, initialBalance: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && save()}
                inputMode="decimal"
                placeholder="cth: 5jt · 500rb · 5.000.000"
                className="num"
                style={inputStyle}
              />
              {/* preview parser — salah ketik langsung terlihat, tidak pernah 0 diam-diam */}
              {(() => {
                const p = parseBalanceInput(draft.initialBalance);
                if (draft.initialBalance.trim() === "") return null;
                if (p === null) {
                  return <span style={{ fontSize: 11, color: "var(--loss)", fontWeight: 600 }}>Tidak terbaca — pakai format 5jt, 500rb, atau 5.000.000</span>;
                }
                const delta = editing ? accountBreakdown(fin, editing.id).balance - editing.initialBalance : 0;
                return (
                  <span className="num" style={{ fontSize: 11.5, color: "var(--gain)", fontWeight: 600 }}>
                    = {fmtMoney(p, cur)}
                    {editing && <span style={{ color: "var(--color-muted)", fontWeight: 500 }}> · saldo kini akan menjadi {fmtMoney(p + delta, cur)}</span>}
                  </span>
                );
              })()}
              {draft.id && (
                <span style={{ fontSize: 11, color: "var(--color-dim)", lineHeight: 1.5 }}>
                  Ini saldo SEBELUM semua transaksi tercatat — bukan saldo sekarang.
                </span>
              )}
            </Field>

            {/* kasus paling umum: kartu tidak cocok dengan saldo bank asli */}
            {draft.id && editing && (
              <Btn
                variant="ghost"
                onClick={() => {
                  const raw = window.prompt(
                    `Saldo asli di ${editing.name} sekarang berapa? (cth: 5,5jt)\n` +
                    `Saldo awal akan dihitung mundur otomatis supaya kartu cocok.`
                  )?.trim();
                  if (!raw) return;
                  const target = parseBalanceInput(raw);
                  if (target === null) { toast.error(`"${raw}" tidak terbaca — pakai format 5jt / 500rb / 5.000.000`); return; }
                  const delta = accountBreakdown(fin, editing.id).balance - editing.initialBalance;
                  setDraft({ ...draft, initialBalance: String(target - delta) });
                  toast.success(`Saldo awal disetel ${fmtMoney(target - delta, cur)} — saldo kini akan pas ${fmtMoney(target, cur)}`);
                }}
                style={{ alignSelf: "flex-start" }}
              >
                Samakan dengan saldo bank sekarang…
              </Btn>
            )}

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
                      menyentuhnya? Saldo kantong LAIN tidak akan berubah (transfer
                      terkait dikompensasi otomatis ke saldo awalnya). Tidak bisa dibatalkan.
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
