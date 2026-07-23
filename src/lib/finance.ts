// ─── ZERØ COMMAND — finance.ts ────────────────────────────────────────────────
// Data model + kalkulasi murni untuk sistem pencatatan keuangan:
// kantong (accounts) · sumber pemasukan (sources) · kategori · transaksi.
//
// Prinsip (riset YNAB / Monarch / Spendee / Ivy Wallet / Actual):
// - Saldo SELALU dihitung dari log transaksi, tidak pernah disimpan
//   (saldo tersimpan pasti drift setelah edit/hapus/backdate).
// - Transfer antar kantong = SATU record, dikecualikan dari SEMUA
//   agregat pemasukan/pengeluaran (hanya memindah saldo).
// - Sumber pemasukan (DARI MANA uang datang: Trading/Bisnis/Personal)
//   adalah dimensi terpisah dari kantong (DI MANA uang disimpan).
// - Identitas = nama + tipe/emoji + warna token Atelier (--cat-*, sudah
//   WCAG-AA di kedua mode); referensi via id — rename selalu aman.
// - Semua kalkulasi lokal, tanpa API.

// ── Types ─────────────────────────────────────────────────────────────────────

/** Tipe kantong — menentukan ikon lucide & pengelompokan visual, BUKAN batasan. */
export type AccountType = "bank" | "ewallet" | "crypto" | "cash" | "other";

/** Kunci warna identitas → token Atelier var(--cat-<key>) (AA light+dark). */
export type CatKey = "blue" | "amber" | "violet" | "teal" | "rose" | "gold" | "green" | "muted";

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  color: CatKey;
  /** "berapa isinya sekarang" saat kantong dibuat — bukan jurnal pembuka */
  initialBalance: number;
  createdAt: string;
  /** diarsip: hilang dari picker & total, riwayat tetap utuh */
  archived?: boolean;
}

export interface IncomeSource {
  id: string;
  name: string;
  emoji: string;
  color: CatKey;
  /** "trading" → dapat chart P&L harian (masuk − keluar kategori trading-loss) */
  kind?: "trading";
}

export interface FinanceCategory {
  id: string;
  name: string;
  emoji: string;
  color: CatKey;
  /** batas budget bulanan opsional (envelope limit); 0/undefined = tanpa limit */
  limit?: number;
  /** "trading-loss" → dihitung sebagai sisi rugi pada chart P&L harian trading */
  kind?: "trading-loss";
}

export type TxType = "masuk" | "keluar" | "transfer";

export interface FinanceTransaction {
  id: string;
  type: TxType;
  /** selalu positif */
  amount: number;
  /** masuk: kantong tujuan · keluar: kantong asal · transfer: kantong asal */
  accountId: string;
  /** transfer: kantong tujuan */
  toAccountId?: string;
  /** wajib untuk tipe "masuk" — dari mana uang ini datang */
  sourceId?: string;
  /** untuk tipe "keluar" */
  categoryId?: string;
  note?: string;
  /** YYYY-MM-DD */
  date: string;
  createdAt: string;
}

export type Currency = "IDR" | "USD";

export interface FinanceData {
  schemaVersion: number;
  accounts: FinanceAccount[];
  sources: IncomeSource[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  currency: Currency;
}

// ── Warna & tipe ──────────────────────────────────────────────────────────────

/** Urutan pemberian warna untuk entitas baru (identitas, bukan makna). */
export const CAT_KEYS: CatKey[] = ["blue", "amber", "violet", "teal", "rose", "gold", "green"];

/** CSS var untuk sebuah kunci warna (Atelier, AA di kedua mode). */
export const catColor = (key: CatKey): string =>
  key === "muted" ? "var(--color-muted)" : `var(--cat-${key})`;

/** Nama CSS var (untuk resolusi literal di chart SVG). */
export const catVarName = (key: CatKey): string =>
  key === "muted" ? "--color-muted" : `--cat-${key}`;

export const ACCOUNT_TYPES: { type: AccountType; label: string }[] = [
  { type: "bank", label: "Bank" },
  { type: "ewallet", label: "E-Wallet" },
  { type: "crypto", label: "Crypto / DEX" },
  { type: "cash", label: "Cash / Tunai" },
  { type: "other", label: "Lainnya" },
];

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> =
  Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.type, t.label])) as Record<AccountType, string>;

// ── Defaults ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

export function defaultFinance(): FinanceData {
  return {
    schemaVersion: 1,
    accounts: [
      { id: uid(), name: "Cash / Tunai", type: "cash", color: "gold", initialBalance: 0, createdAt: new Date().toISOString() },
    ],
    sources: [
      { id: uid(), name: "Trading", emoji: "📈", color: "blue", kind: "trading" },
      { id: uid(), name: "Bisnis — Zero Build Lab", emoji: "🚀", color: "amber" },
      { id: uid(), name: "Personal / Gaji", emoji: "💼", color: "violet" },
    ],
    categories: [
      { id: uid(), name: "Makan", emoji: "🍜", color: "rose" },
      { id: uid(), name: "Jajan / Kopi", emoji: "☕", color: "amber" },
      { id: uid(), name: "Transport", emoji: "🛵", color: "teal" },
      { id: uid(), name: "Tagihan", emoji: "🧾", color: "blue" },
      { id: uid(), name: "Belanja", emoji: "🛍️", color: "violet" },
      { id: uid(), name: "Kesehatan", emoji: "💊", color: "green" },
      { id: uid(), name: "Hiburan", emoji: "🎮", color: "gold" },
      { id: uid(), name: "Tools / Subs", emoji: "🧰", color: "blue" },
      { id: uid(), name: "Trading Loss", emoji: "📉", color: "muted", kind: "trading-loss" },
      { id: uid(), name: "Lainnya", emoji: "📦", color: "muted" },
    ],
    transactions: [],
    currency: "IDR",
  };
}

const VALID_KEYS = new Set<string>([...CAT_KEYS, "muted"]);
const VALID_TYPES = new Set<string>(ACCOUNT_TYPES.map((t) => t.type));

/** Isi field finance yang hilang dari data tersimpan lama (migrasi aman). */
export function migrateFinance(raw: Partial<FinanceData> | undefined | null): FinanceData {
  const def = defaultFinance();
  if (!raw || typeof raw !== "object") return def;
  const fin: FinanceData = {
    schemaVersion: 1,
    accounts: Array.isArray(raw.accounts) && raw.accounts.length ? raw.accounts : def.accounts,
    sources: Array.isArray(raw.sources) && raw.sources.length ? raw.sources : def.sources,
    categories: Array.isArray(raw.categories) && raw.categories.length ? raw.categories : def.categories,
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    currency: raw.currency === "USD" ? "USD" : "IDR",
  };
  // entitas versi lama / warna & tipe tak dikenal → normalisasi aman
  fin.accounts = fin.accounts.map((a, i) => ({
    ...a,
    type: VALID_TYPES.has((a as FinanceAccount).type) ? a.type : "other",
    color: VALID_KEYS.has(a.color) ? a.color : CAT_KEYS[i % CAT_KEYS.length],
  }));
  fin.sources = fin.sources.map((s, i) => ({
    emoji: "💵",
    ...s,
    color: VALID_KEYS.has(s.color) ? s.color : CAT_KEYS[i % CAT_KEYS.length],
  }));
  fin.categories = fin.categories.map((c, i) => ({
    emoji: "🏷️",
    ...c,
    color: VALID_KEYS.has(c.color) ? c.color : CAT_KEYS[i % CAT_KEYS.length],
  }));
  return fin;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" (timezone lokal) */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const todayStr = () => toDateStr(new Date());

/** "YYYY-MM" dari "YYYY-MM-DD" */
export const monthOf = (date: string) => date.slice(0, 7);

/** "YYYY-MM" bulan berjalan */
export const currentMonth = () => todayStr().slice(0, 7);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTH_NAMES_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function monthLabel(monthKey: string, full = false): string {
  const [y, m] = monthKey.split("-").map(Number);
  const names = full ? MONTH_NAMES_FULL : MONTH_NAMES;
  return `${names[(m || 1) - 1]} ${y}`;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtMoney(n: number, currency: Currency = "IDR", withSign = false): string {
  const sign = n < 0 ? "−" : withSign && n > 0 ? "+" : "";
  const abs = Math.abs(n);
  const s =
    currency === "IDR"
      ? "Rp " + Math.round(abs).toLocaleString("id-ID")
      : "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return sign + s;
}

/** Format ringkas untuk axis/kartu: 1,2 jt · 350 rb · 2,1 M (IDR) / 1.2K (USD) */
export function fmtCompact(n: number, currency: Currency = "IDR"): string {
  const abs = Math.abs(n);
  const neg = n < 0 ? "−" : "";
  const f = (v: number) => {
    const r = Math.round(v * 10) / 10;
    return currency === "IDR" ? String(r).replace(".", ",") : String(r);
  };
  if (currency === "IDR") {
    if (abs >= 1e9) return `${neg}${f(abs / 1e9)} M`;
    if (abs >= 1e6) return `${neg}${f(abs / 1e6)} jt`;
    if (abs >= 1e3) return `${neg}${f(abs / 1e3)} rb`;
    return `${neg}${Math.round(abs)}`;
  }
  if (abs >= 1e6) return `${neg}${f(abs / 1e6)}M`;
  if (abs >= 1e3) return `${neg}${f(abs / 1e3)}K`;
  return `${neg}${Math.round(abs)}`;
}

/**
 * Parser jumlah friction-minimal:
 * - sufiks IDR: "25rb"/"25k" → 25.000 · "1,5jt"/"1.5jt"/"2m" → juta
 * - penjumlahan/pengurangan inline: "15rb+10rb-5rb"
 * - koma ATAU titik sebagai desimal ("1,5" = "1.5"), "1.250.000" = ribuan
 * Return null bila tidak bisa diparse / hasil ≤ 0.
 */
export function parseAmountInput(input: string): number | null {
  if (!input) return null;
  const cleaned = input.toLowerCase().replace(/\s+/g, "").replace(/rp/g, "");
  if (!/^[-+]?[\d.,a-z]+([-+][\d.,a-z]+)*$/.test(cleaned)) return null;
  const terms = cleaned.match(/[-+]?[^-+]+/g);
  if (!terms) return null;
  let total = 0;
  for (const raw of terms) {
    let term = raw;
    let sign = 1;
    if (term.startsWith("+")) term = term.slice(1);
    else if (term.startsWith("-")) { sign = -1; term = term.slice(1); }
    let mult = 1;
    const suffix = term.match(/(rb|k|jt|m|juta|ribu)$/);
    if (suffix) {
      mult = suffix[1] === "jt" || suffix[1] === "m" || suffix[1] === "juta" ? 1e6 : 1e3;
      term = term.slice(0, -suffix[1].length);
    }
    let num: number;
    if (/^\d{1,3}(\.\d{3})+$/.test(term)) num = Number(term.replace(/\./g, ""));
    else num = Number(term.replace(",", "."));
    if (!isFinite(num) || term === "") return null;
    total += sign * num * mult;
  }
  if (!isFinite(total) || total <= 0) return null;
  return Math.round(total * 100) / 100;
}

// ── Kalkulasi ─────────────────────────────────────────────────────────────────

/** Saldo kantong = saldo awal + masuk − keluar − transfer keluar + transfer masuk */
export function accountBalance(fin: FinanceData, accountId: string): number {
  let bal = fin.accounts.find((a) => a.id === accountId)?.initialBalance ?? 0;
  for (const t of fin.transactions) {
    if (t.type === "masuk" && t.accountId === accountId) bal += t.amount;
    else if (t.type === "keluar" && t.accountId === accountId) bal -= t.amount;
    else if (t.type === "transfer") {
      if (t.accountId === accountId) bal -= t.amount;
      if (t.toAccountId === accountId) bal += t.amount;
    }
  }
  return bal;
}

/** Total saldo semua kantong aktif (arsip tidak dihitung). */
export function totalBalance(fin: FinanceData): number {
  return fin.accounts
    .filter((a) => !a.archived)
    .reduce((s, a) => s + accountBalance(fin, a.id), 0);
}

export interface MonthTotals {
  masuk: number;
  keluar: number;
  net: number;
  txCount: number;
}

/** Total masuk/keluar bulan tertentu — transfer TIDAK dihitung. */
export function monthTotals(fin: FinanceData, monthKey: string): MonthTotals {
  let masuk = 0, keluar = 0, txCount = 0;
  for (const t of fin.transactions) {
    if (monthOf(t.date) !== monthKey) continue;
    txCount++;
    if (t.type === "masuk") masuk += t.amount;
    else if (t.type === "keluar") keluar += t.amount;
  }
  return { masuk, keluar, net: masuk - keluar, txCount };
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  emoji: string;
  color: CatKey;
  total: number;
  limit?: number;
}

/** Pengeluaran per kategori pada bulan tertentu, urut terbesar. */
export function categoryBreakdown(fin: FinanceData, monthKey: string): CategorySlice[] {
  const map = new Map<string, number>();
  for (const t of fin.transactions) {
    if (t.type !== "keluar" || monthOf(t.date) !== monthKey) continue;
    const key = t.categoryId ?? "_none";
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  const slices: CategorySlice[] = [];
  for (const [catId, total] of map) {
    const cat = fin.categories.find((c) => c.id === catId);
    slices.push({
      categoryId: catId,
      name: cat?.name ?? "Tanpa kategori",
      emoji: cat?.emoji ?? "🏷️",
      color: cat?.color ?? "muted",
      total,
      limit: cat?.limit || undefined,
    });
  }
  return slices.sort((a, b) => b.total - a.total);
}

export interface SourceSlice {
  sourceId: string;
  name: string;
  emoji: string;
  color: CatKey;
  total: number;
  txCount: number;
}

/** Pemasukan per sumber pada bulan tertentu — SELALU dipisah, tidak dilebur. */
export function sourceBreakdown(fin: FinanceData, monthKey: string): SourceSlice[] {
  const totals = new Map<string, { total: number; n: number }>();
  for (const t of fin.transactions) {
    if (t.type !== "masuk" || monthOf(t.date) !== monthKey) continue;
    const key = t.sourceId ?? "_none";
    const cur = totals.get(key) ?? { total: 0, n: 0 };
    totals.set(key, { total: cur.total + t.amount, n: cur.n + 1 });
  }
  // Semua sumber terdaftar ditampilkan (walau 0 — jujur bahwa sumber itu
  // belum ada pemasukan), plus "tanpa sumber" bila ada transaksi lama.
  const slices: SourceSlice[] = fin.sources.map((s) => ({
    sourceId: s.id,
    name: s.name,
    emoji: s.emoji,
    color: s.color,
    total: totals.get(s.id)?.total ?? 0,
    txCount: totals.get(s.id)?.n ?? 0,
  }));
  if (totals.has("_none")) {
    const x = totals.get("_none")!;
    slices.push({ sourceId: "_none", name: "Tanpa sumber", emoji: "❔", color: "muted", total: x.total, txCount: x.n });
  }
  return slices.sort((a, b) => b.total - a.total);
}

export interface MonthPoint {
  month: string; // "YYYY-MM"
  label: string;
  masuk: number;
  keluar: number;
  /** null = bulan tanpa transaksi sama sekali (JANGAN digambar sebagai 0) */
  net: number | null;
  hasData: boolean;
  /** total masuk per sourceId */
  bySource: Record<string, number>;
}

/**
 * Deret bulanan dari bulan pertama yang punya transaksi s/d bulan berjalan
 * (maks `maxMonths` terakhir). [] bila belum ada transaksi sama sekali.
 * Bulan kosong di tengah rentang → hasData=false, net=null (gap jujur).
 */
export function monthlySeries(fin: FinanceData, maxMonths = 12): MonthPoint[] {
  if (!fin.transactions.length) return [];
  let first = currentMonth();
  for (const t of fin.transactions) {
    const m = monthOf(t.date);
    if (m < first) first = m;
  }
  const end = currentMonth();
  const months: string[] = [];
  let cur = first;
  while (cur <= end && months.length < 120) {
    months.push(cur);
    cur = shiftMonth(cur, 1);
  }
  return months.slice(-maxMonths).map((m) => {
    const { masuk, keluar, net, txCount } = monthTotals(fin, m);
    const bySource: Record<string, number> = {};
    for (const t of fin.transactions) {
      if (t.type !== "masuk" || monthOf(t.date) !== m) continue;
      const key = t.sourceId ?? "_none";
      bySource[key] = (bySource[key] ?? 0) + t.amount;
    }
    const hasData = txCount > 0;
    return { month: m, label: monthLabel(m), masuk, keluar, net: hasData ? net : null, hasData, bySource };
  });
}

export interface DayPoint {
  day: number; // 1..31
  date: string;
  /** null = tidak ada transaksi hari itu (gap, bukan nol palsu) */
  net: number | null;
  /** kumulatif bulan berjalan s/d hari ini (carry-forward di hari kosong) */
  cum: number;
}

/**
 * P&L harian satu sumber dalam satu bulan (semua hari 1..N, hari tanpa data
 * net=null). Untuk sumber kind="trading", rugi = pengeluaran berkategori
 * kind="trading-loss" pada hari yang sama.
 */
export function sourceDailySeries(fin: FinanceData, monthKey: string, sourceId: string): DayPoint[] {
  const src = fin.sources.find((s) => s.id === sourceId);
  const lossCatIds = new Set(fin.categories.filter((c) => c.kind === "trading-loss").map((c) => c.id));
  const byDate = new Map<string, number>();
  for (const t of fin.transactions) {
    if (monthOf(t.date) !== monthKey) continue;
    if (t.type === "masuk" && t.sourceId === sourceId) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + t.amount);
    } else if (
      t.type === "keluar" &&
      src?.kind === "trading" &&
      t.categoryId &&
      lossCatIds.has(t.categoryId)
    ) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) - t.amount);
    }
  }
  const n = daysInMonth(monthKey);
  const points: DayPoint[] = [];
  let cum = 0;
  for (let d = 1; d <= n; d++) {
    const date = `${monthKey}-${String(d).padStart(2, "0")}`;
    const has = byDate.has(date);
    if (has) cum += byDate.get(date)!;
    points.push({ day: d, date, net: has ? byDate.get(date)! : null, cum });
  }
  return points;
}

/**
 * Runway = total saldo ÷ rata-rata pengeluaran bulanan (maks 3 bulan penuh
 * terakhir yang punya pengeluaran). null bila belum ada data cukup — jujur,
 * tidak mengarang.
 */
export function runwayMonths(fin: FinanceData): number | null {
  const cur = currentMonth();
  const spends: number[] = [];
  for (let i = 1; i <= 6 && spends.length < 3; i++) {
    const m = shiftMonth(cur, -i);
    const { keluar } = monthTotals(fin, m);
    if (keluar > 0) spends.push(keluar);
  }
  if (!spends.length) return null;
  const avg = spends.reduce((a, b) => a + b, 0) / spends.length;
  if (avg <= 0) return null;
  const bal = totalBalance(fin);
  if (bal <= 0) return 0;
  return bal / avg;
}

/** Jumlah transaksi yang menyentuh sebuah kantong (untuk konfirmasi hapus). */
export function accountTxCount(fin: FinanceData, accountId: string): number {
  return fin.transactions.filter(
    (t) => t.accountId === accountId || t.toAccountId === accountId
  ).length;
}

/** Memori catatan → kategori: note yang sama otomatis pilih kategori terakhirnya. */
export function noteCategoryMemory(fin: FinanceData): Map<string, string> {
  const mem = new Map<string, string>();
  const sorted = [...fin.transactions]
    .filter((t) => t.type === "keluar" && t.note && t.categoryId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const t of sorted) mem.set(t.note!.trim().toLowerCase(), t.categoryId!);
  return mem;
}

/** Kategori terurut frekuensi pemakaian (paling sering dulu), sisanya urutan asli. */
export function categoriesByUsage(fin: FinanceData): FinanceCategory[] {
  const freq = new Map<string, number>();
  for (const t of fin.transactions) {
    if (t.type === "keluar" && t.categoryId) freq.set(t.categoryId, (freq.get(t.categoryId) ?? 0) + 1);
  }
  return [...fin.categories].sort((a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0));
}

export const newId = uid;
