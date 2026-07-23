// ─── ZERØ COMMAND — lang.ts ───────────────────────────────────────────────────
// Dua register bahasa untuk seluruh permukaan Keuangan & Kamus:
//   "santai" — bahasa sehari-hari (BONCOS, duit masuk, dst) — default
//   "pro"    — bahasa finansial profesional (DEFISIT, pemasukan, dst)
// Bisa di-switch kapan saja (Kelola → Preferensi, atau toggle di Kamus);
// pilihan tersimpan di localStorage dan berlaku app-wide seketika.
// Founder sedang belajar bahasa ekonomi — dua register berdampingan adalah
// alat belajarnya: baca versi santai untuk paham, versi pro untuk "nyambung".

import { useSyncExternalStore } from "react";

export type Register = "santai" | "pro";

const KEY = "zero-lang-register";
const EVENT = "zero-lang-change";

export function getRegister(): Register {
  try {
    return localStorage.getItem(KEY) === "pro" ? "pro" : "santai";
  } catch {
    return "santai";
  }
}

export function setRegister(r: Register) {
  try { localStorage.setItem(KEY, r); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Register aktif — reaktif terhadap perubahan (tanpa provider). */
export function useRegister(): Register {
  return useSyncExternalStore(subscribe, getRegister, () => "santai" as Register);
}

// ── Kamus string UI dua register ──────────────────────────────────────────────

interface Pair { santai: string; pro: string }

const STRINGS = {
  // verdict ringkasan
  "verdict.surplus": { santai: "SURPLUS", pro: "SURPLUS" },
  "verdict.boncos": { santai: "BONCOS", pro: "DEFISIT" },
  "verdict.impas": { santai: "IMPAS", pro: "IMPAS" },
  // arah uang
  "masuk": { santai: "Masuk", pro: "Pemasukan" },
  "keluar": { santai: "Keluar", pro: "Pengeluaran" },
  "hero.caption": { santai: "Total Masuk − Total Keluar", pro: "Total Pemasukan − Total Pengeluaran" },
  "hero.tersimpan": { santai: "tersimpan", pro: "savings rate" },
  "hero.empty.title": { santai: "Belum ada transaksi di", pro: "Belum ada transaksi tercatat pada" },
  "hero.empty.hint": {
    santai: "Catat pemasukan atau pengeluaran pertama lewat form di bawah — ringkasan surplus vs boncos tersusun otomatis dari catatanmu sendiri, tidak pernah dikarang.",
    pro: "Catat transaksi pertama melalui formulir di bawah — ikhtisar surplus/defisit dikalkulasi otomatis dari data aktual, tanpa estimasi.",
  },
  "hero.berjalan": { santai: "(berjalan)", pro: "(periode berjalan)" },
  // quick add
  "qa.title": { santai: "Catat transaksi", pro: "Input transaksi" },
  "qa.sub": { santai: "harian · cepat · Enter untuk simpan", pro: "entri harian · Enter untuk menyimpan" },
  "qa.simpan": { santai: "Simpan", pro: "Simpan" },
  "qa.sumberLabel": { santai: "Sumber — wajib, jangan tercampur", pro: "Sumber pemasukan — wajib diisi" },
  "qa.noteKeluar": { santai: "Catatan — beli apa? (opsional)", pro: "Deskripsi transaksi (opsional)" },
  "qa.dariKantong": { santai: "Dari kantong", pro: "Akun sumber" },
  "qa.keKantong": { santai: "Ke kantong", pro: "Akun tujuan" },
  "qa.masukKeKantong": { santai: "Masuk ke kantong", pro: "Akun penerima" },
  // kantong
  "acc.sub": { santai: "di mana uang disimpan", pro: "posisi dana per akun" },
  "acc.total": { santai: "TOTAL SALDO", pro: "TOTAL SALDO" },
  // sumber
  "src.sub": { santai: "dari mana uang datang", pro: "komposisi pemasukan per sumber" },
  "src.totalCaption": { santai: "total masuk bulan ini — breakdown per sumber:", pro: "total pemasukan periode ini — rincian per sumber:" },
  "src.belumAda": { santai: "belum ada", pro: "nihil" },
  "src.untung": { santai: "Untung", pro: "Laba" },
  "src.rugi": { santai: "Rugi", pro: "Rugi" },
  "src.hariUntung": { santai: "hari untung", pro: "hari laba" },
  "src.hariRugi": { santai: "hari rugi", pro: "hari rugi" },
  "src.kumulatif": { santai: "kumulatif bulan", pro: "kumulatif periode" },
  // kategori
  "cat.sub": { santai: "ke mana uang pergi", pro: "alokasi pengeluaran per kategori" },
  "cat.overLimit": { santai: "— di atas limit", pro: "— melampaui anggaran" },
  "cat.limit": { santai: "dari limit", pro: "dari anggaran" },
  // tren
  "trend.sub": { santai: "surplus vs boncos antar bulan", pro: "surplus vs defisit antar periode" },
  "trend.legendBoncos": { santai: "boncos", pro: "defisit" },
  "trend.legendSurplus": { santai: "surplus", pro: "surplus" },
  "trend.berjalan": { santai: "bulan berjalan (belum final)", pro: "periode berjalan (belum final)" },
  "trend.tooltipBoncos": { santai: "Boncos", pro: "Defisit" },
  // transaksi
  "tx.hapusUndo": { santai: "Transaksi dihapus", pro: "Transaksi dihapus" },
  "tx.urungkan": { santai: "Urungkan", pro: "Urungkan" },
  // runway
  "runway.caption": {
    santai: "Total saldo semua kantong ÷ rata-rata pengeluaran bulanan (maks 3 bulan penuh terakhir yang tercatat).",
    pro: "Total saldo akun aktif dibagi rata-rata pengeluaran bulanan (maksimal 3 periode penuh terakhir).",
  },
} as const satisfies Record<string, Pair>;

export type StringKey = keyof typeof STRINGS;

export function tr(register: Register, key: StringKey): string {
  return STRINGS[key][register];
}

/** Hook praktis: const t = useT(); t("verdict.boncos") */
export function useT(): (key: StringKey) => string {
  const register = useRegister();
  return (key: StringKey) => tr(register, key);
}
