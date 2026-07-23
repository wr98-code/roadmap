import { useState, useEffect, useCallback, useRef } from "react";
import { hasSyncToken, syncHeaders } from "@/lib/cloudStorage";
import { FinanceData, defaultFinance, migrateFinance } from "@/lib/finance";

export interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeEntry {
  id: string;
  tanggal: string;
  sumber: string;
  jumlah: string;
  mataUang: string;
}

export interface ExpenseEntry {
  id: string;
  kategori: string;
  jumlah: string;
}

export interface StatusItem {
  id: string;
  area: string;
  status: string;
  prioritas: string;
}

// Balance-sheet entries (Wealth page). Amounts are strings (user input);
// mataUang is "IDR" | "USD". likuid = cepat dicairkan (kas/stablecoin) untuk runway.
export interface AssetEntry {
  id: string;
  label: string;
  kategori: string;   // Kas, Kripto, Saham, Properti, Bisnis, Piutang, Lainnya
  jumlah: string;
  mataUang: string;
  likuid: boolean;
}

export interface LiabilityEntry {
  id: string;
  label: string;
  jumlah: string;
  mataUang: string;
}

// Snapshot net worth harian (dalam IDR) — untuk chart tren. Direkam otomatis
// dari nilai asli, bukan dikarang.
export interface NetWorthSnapshot {
  date: string;        // Date.toDateString()
  netWorthIDR: number;
}

export interface AppData {
  dashboard: {
    todayFocus: string;
    lastUpdated: string;
  };
  buildLab: {
    statusBoard: StatusItem[];
    focusMingguIni: CheckItem[];
    incomeTarget: string;
    notes: Note[];
  };
  trading: {
    gamePlan: CheckItem[];
    checklistHarian: CheckItem[];
    compounding: string;
    recovery: string;
    notes: Note[];
  };
  crypto: {
    coinglassGuide: string;
    nuplOnChain: string;
    oneStep: string;
    notes: Note[];
  };
  roadmap: {
    minggu12: CheckItem[];
    minggu34: CheckItem[];
    bulan2: CheckItem[];
    bulan3: CheckItem[];
    roadmap5tahun: string;
    notes: Note[];
  };
  keuangan: {
    statusKeuangan: string;
    incomeLog: IncomeEntry[];
    pengeluaran: ExpenseEntry[];
    goals: CheckItem[];
    notes: Note[];
    /** sistem pencatatan keuangan v2: kantong / sumber / kategori / transaksi */
    finance: FinanceData;
  };
  personal: {
    rulesSurvival: string;
    dailyDiscipline: CheckItem[];
    mindset: string;
    checklistRebuild: CheckItem[];
    notes: Note[];
  };
  wealth: {
    assets: AssetEntry[];
    liabilities: LiabilityEntry[];
    history: NetWorthSnapshot[];
    notes: Note[];
  };
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const defaultData: AppData = {
  dashboard: {
    todayFocus: "Fokus hari ini: Apply jobs, setup payment link, outreach ke protocol.",
    lastUpdated: new Date().toISOString(),
  },
  buildLab: {
    statusBoard: [
      { id: uid(), area: "Cari Klien Web3", status: "AKTIF", prioritas: "#1" },
      { id: uid(), area: "ZERØ WATCH", status: "Deploy ✅ / Payment pending", prioritas: "#2" },
      { id: uid(), area: "ZERØ MERIDIAN", status: "Live ✅ / Paywall belum", prioritas: "#3" },
      { id: uid(), area: "Survival Mode", status: "1 bulan runway", prioritas: "CRITICAL" },
    ],
    focusMingguIni: [
      { id: uid(), text: "Daftar web3.career + Dework.xyz + Braintrust", checked: false },
      { id: uid(), text: "Apply 5–10 jobs per hari (filter: frontend, react, dashboard)", checked: false },
      { id: uid(), text: "Setup PAYMENT_LINK di UpgradeModal.tsx (Gumroad/LemonSqueezy)", checked: false },
      { id: uid(), text: "Direct outreach ke 3 protocol di Telegram/Discord", checked: false },
    ],
    incomeTarget: "Minggu 1–2 → 1–2 bounty kecil (track record)\nBulan 1 → 1 klien aktif ATAU 20 subscriber PRO\nBulan 3 → $500–$2,000/bulan gabungan",
    notes: [],
  },
  trading: {
    gamePlan: [
      { id: uid(), text: "Kuasai 1 strategi core (supply/demand atau ICT)", checked: false },
      { id: uid(), text: "Backtest minimum 100 trade", checked: false },
      { id: uid(), text: "Live trade dengan risk 1% per trade", checked: false },
      { id: uid(), text: "Konsisten profit 3 bulan berturut-turut", checked: false },
      { id: uid(), text: "Scale up position size secara bertahap", checked: false },
    ],
    checklistHarian: [
      { id: uid(), text: "Cek market structure pagi", checked: false },
      { id: uid(), text: "Identifikasi key levels", checked: false },
      { id: uid(), text: "Set alert di level penting", checked: false },
      { id: uid(), text: "Review trade kemarin", checked: false },
      { id: uid(), text: "Update trading journal", checked: false },
    ],
    compounding: "Modal awal: $100\nRisk per trade: 1%\nTarget R:R minimum: 1:2\nMax drawdown: 10%\nReview bulanan",
    recovery: "Jika drawdown > 10% → stop trading 1 minggu\nReview semua losing trades\nKembali ke paper trading\nResume hanya jika mindset reset",
    notes: [],
  },
  crypto: {
    coinglassGuide: "**Key metrics to monitor:**\n\n- **Funding Rate:** >0.1% = overheated long, <-0.05% = overheated short\n- **Open Interest:** rising OI + rising price = trend confirmation\n- **Liquidation heatmap:** identify major liquidation clusters\n- **Long/Short ratio:** extreme readings = potential reversal",
    nuplOnChain: "- **NUPL > 0.75** = Euphoria (sell zone)\n- **NUPL 0.5–0.75** = Belief/Denial\n- **NUPL 0.25–0.5** = Optimism\n- **NUPL 0–0.25** = Hope/Fear\n- **NUPL < 0** = Capitulation (buy zone)",
    oneStep: "Fokus pada: **Bitcoin dominance cycle**, **macro liquidity (M2)**, dan **DXY inversi** sebagai leading indicator utama.",
    notes: [],
  },
  roadmap: {
    minggu12: [
      { id: uid(), text: "Daftar web3.career", checked: false },
      { id: uid(), text: "Daftar Dework.xyz", checked: false },
      { id: uid(), text: "Daftar Braintrust", checked: false },
      { id: uid(), text: "Daftar Gitcoin", checked: false },
      { id: uid(), text: "Apply 5–10 jobs per hari", checked: false },
      { id: uid(), text: "Direct outreach ke protocol di Telegram/Discord", checked: false },
      { id: uid(), text: "Buat portfolio 1 halaman atas nama ZERØ", checked: false },
      { id: uid(), text: "Ambil 1–2 bounty kecil di Dework", checked: false },
    ],
    minggu34: [
      { id: uid(), text: "Tambah ProtectedRoute + halaman Upgrade di ZeroMeridian", checked: false },
      { id: uid(), text: "Setup Gumroad/LemonSqueezy untuk ZERØ WATCH ($9 lifetime)", checked: false },
      { id: uid(), text: "Soft launch ke komunitas trader", checked: false },
    ],
    bulan2: [
      { id: uid(), text: "Bangun proyek Web3 baru dari portfolio klien", checked: false },
      { id: uid(), text: "Tambah Stripe untuk payment fiat di ZeroMeridian", checked: false },
      { id: uid(), text: "Post analisis market di X/Twitter atas nama ZERØ", checked: false },
    ],
    bulan3: [
      { id: uid(), text: "Rebuild emergency savings", checked: false },
      { id: uid(), text: "Mulai trading kembali — modal kecil, disiplin ketat", checked: false },
      { id: uid(), text: "Formalisasi Zero Build Lab sebagai brand serius", checked: false },
    ],
    roadmap5tahun: "**Tahun 1:** Stabilisasi income, $2k/bulan\n**Tahun 2:** Scale ZERØ BUILD LAB, $5k/bulan\n**Tahun 3:** Tim kecil, $10k/bulan\n**Tahun 4:** Product-led growth\n**Tahun 5:** Financial freedom",
    notes: [],
  },
  keuangan: {
    statusKeuangan: "**Runway:** ~1 bulan living expenses\n**Modal trading:** depleted\n**Prioritas:** cashflow masuk SEKARANG",
    incomeLog: [],
    pengeluaran: [
      { id: uid(), kategori: "Kebutuhan pokok", jumlah: "" },
      { id: uid(), kategori: "Tools/subscriptions", jumlah: "" },
      { id: uid(), kategori: "Lainnya", jumlah: "" },
    ],
    goals: [
      { id: uid(), text: "Emergency savings 1 bulan", checked: false },
      { id: uid(), text: "Emergency savings 3 bulan", checked: false },
      { id: uid(), text: "Mulai trading kembali (setelah stabil)", checked: false },
      { id: uid(), text: "Formalisasi Zero Build Lab", checked: false },
    ],
    notes: [],
    finance: defaultFinance(),
  },
  personal: {
    rulesSurvival: "❌ JANGAN trade di bawah tekanan emosional\n❌ Jangan pakai living funds untuk trading\n❌ Jangan ambil debt untuk spekulasi\n✅ Fokus income generation dulu\n✅ Kurangi lifestyle expenses sementara\n✅ Shift dari growth ke cashflow",
    dailyDiscipline: [
      { id: uid(), text: "Market study: 2 jam/hari", checked: false },
      { id: uid(), text: "Weekly skill upgrade (coding / data analysis)", checked: false },
      { id: uid(), text: "Strict financial tracking", checked: false },
      { id: uid(), text: "Hindari emotional decision-making", checked: false },
    ],
    mindset: "Ini bukan kegagalan — ini rebuild. Skill kamu masih ada. Pengalaman masih ada. Modal bisa dibangun lagi. **Fokus satu langkah per hari.**",
    checklistRebuild: [
      { id: uid(), text: "Stabilkan income bulanan (cashflow > kebutuhan)", checked: false },
      { id: uid(), text: "Emergency savings 1 bulan", checked: false },
      { id: uid(), text: "Emergency savings 3 bulan", checked: false },
      { id: uid(), text: "Mulai trading kembali — konservatif", checked: false },
      { id: uid(), text: "Zero Build Lab jalan sebagai brand serius", checked: false },
    ],
    notes: [],
  },
  // Wealth: kosong secara default — angka net worth HARUS dari input user asli,
  // bukan karangan. Empty state ditampilkan sampai user isi neraca.
  wealth: {
    assets: [],
    liabilities: [],
    history: [],
    notes: [],
  },
};

// ─── STORAGE KEY ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "zero-command-center-data";
const CLOUD_API   = "/api/data";
const SYNC_DEBOUNCE_MS = 1500;

// ─── LOCAL FALLBACK ────────────────────────────────────────────────────────────
function loadLocal(): AppData | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function saveLocal(data: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── SAFE MERGE ────────────────────────────────────────────────────────────────
// Blob dari cloud/localStorage bisa rusak / versi lama (section hilang). Isi
// section yang hilang dari defaultData supaya akses data.<section>.<x> tidak
// pernah melempar (anti white-screen). Data user yang ada tetap dipertahankan.
function mergeWithDefaults(partial: unknown): AppData {
  const base = structuredClone(defaultData) as unknown as Record<string, Record<string, unknown>>;
  if (!partial || typeof partial !== "object") return base as unknown as AppData;
  const src = partial as Record<string, unknown>;
  for (const section of Object.keys(base)) {
    const val = src[section];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      base[section] = { ...base[section], ...(val as Record<string, unknown>) };
    }
  }
  // finance perlu migrasi dalam (field baru diisi, warna/tipe dinormalisasi)
  (base.keuangan as Record<string, unknown>).finance =
    migrateFinance((src.keuangan as Record<string, unknown> | undefined)?.finance as never);
  return base as unknown as AppData;
}

// ─── CLOUD READ / WRITE ────────────────────────────────────────────────────────
// Endpoint diproteksi X-Sync-Token (lihat functions/api/data.ts). Tanpa token,
// skip network — app jalan lokal penuh, tidak ada spam 401.
async function loadCloud(): Promise<AppData | null> {
  if (!hasSyncToken()) return null;
  try {
    const res = await fetch(CLOUD_API, { cache: "no-store", headers: syncHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json as AppData;
  } catch { return null; }
}

async function saveCloud(data: AppData): Promise<boolean> {
  if (!hasSyncToken()) return false;
  try {
    const res = await fetch(CLOUD_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...syncHeaders() },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch { return false; }
}

// ─── HOOK ──────────────────────────────────────────────────────────────────────
export function useAppData() {
  const [data, setData]       = useState<AppData>(() => {
    const local = loadLocal();
    return local ? mergeWithDefaults(local) : structuredClone(defaultData);
  });
  const [saved, setSaved]     = useState(false);
  const [syncing, setSyncing] = useState(false);
  const timerRef              = useRef<ReturnType<typeof setTimeout>>();
  const initialized           = useRef(false);

  // On mount: try to pull latest from cloud, merge if newer
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setSyncing(true);
    loadCloud().then((cloud) => {
      if (cloud) {
        const local = loadLocal();
        // Isi section yang hilang dari default dulu — jaga akses tidak melempar.
        const merged = mergeWithDefaults(cloud);
        const cloudTs = new Date(merged.dashboard.lastUpdated).getTime() || 0;
        const localTs = local?.dashboard?.lastUpdated
          ? (new Date(local.dashboard.lastUpdated).getTime() || 0)
          : 0;
        // Cloud wins if it's newer (atau local kosong)
        if (cloudTs >= localTs) {
          setData(merged);
          saveLocal(merged);
        }
      }
      setSyncing(false);
    });
  }, []);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      next.dashboard.lastUpdated = new Date().toISOString();

      // Always write to localStorage immediately (instant, never loses data)
      saveLocal(next);

      // Debounce cloud write
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setSyncing(true);
        const ok = await saveCloud(next);
        setSyncing(false);
        if (ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }
      }, SYNC_DEBOUNCE_MS);

      return next;
    });
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { data, update, saved, syncing };
}
