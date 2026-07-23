// ─── ZERØ COMMAND — glossary.ts ───────────────────────────────────────────────
// KAMUS ISTILAH BISNIS / EKONOMI / AKUNTANSI — satu sumber kebenaran.
// Semua tooltip <MetricInfo> di app (Keuangan, Wealth, dst) dan section
// "Kamus Istilah" di Learn Hub membaca dari file ini — definisi tidak pernah
// terpecah di komponen.
//
// Bahasa: Indonesia santai untuk orang yang baru belajar — bukan terjemahan
// textbook. Rumus diverifikasi dari sumber (Stockbit Snips, Mekari Jurnal,
// Accurate, Binus Accounting, Indodax Academy, dll — riset Juli 2026).
// `priority` = 10-an istilah yang paling sering muncul di konten finance
// Indonesia (YouTube finance, Stockbit, CNBC/Kontan).

export type GlossaryCategory = "metrik" | "rasio" | "jabatan" | "pasar";

export const GLOSSARY_CATEGORIES: { key: GlossaryCategory; label: string; emoji: string }[] = [
  { key: "metrik", label: "Metrik Finansial", emoji: "📊" },
  { key: "rasio", label: "Rasio & Akuntansi", emoji: "🧮" },
  { key: "jabatan", label: "Jabatan Korporat", emoji: "🏢" },
  { key: "pasar", label: "Pasar & Investasi", emoji: "📈" },
];

export interface GlossaryTerm {
  id: string;
  term: string;
  /** kepanjangan / nama lengkap */
  full?: string;
  category: GlossaryCategory;
  /** definisi santai bahasa Indonesia */
  def: string;
  /** contoh pemakaian dalam kalimat/konteks nyata */
  example?: string;
  /** rumus, bila relevan (metrik/rasio) */
  formula?: string;
  /** paling sering muncul di konten finance Indonesia */
  priority?: boolean;
}

export const GLOSSARY: GlossaryTerm[] = [
  // ═══ METRIK FINANSIAL ══════════════════════════════════════════════════════
  {
    id: "cagr", term: "CAGR", full: "Compound Annual Growth Rate", category: "metrik", priority: true,
    def: "Rata-rata pertumbuhan per tahun seandainya naiknya mulus tiap tahun. Cara jujur mengukur \"tumbuh berapa persen setahun\" untuk periode panjang — jauh lebih akurat daripada rata-rata biasa karena memperhitungkan efek bunga-berbunga.",
    example: "\"Portofolio gue tumbuh dari 10 juta ke 20 juta dalam 5 tahun\" = CAGR ±14,9% per tahun, bukan 20%.",
    formula: "CAGR = (nilai akhir ÷ nilai awal)^(1/jumlah tahun) − 1",
  },
  {
    id: "roi", term: "ROI", full: "Return on Investment", category: "metrik",
    def: "Modal segini, baliknya berapa persen. Metrik untung paling universal — bisa dipakai buat saham, bisnis, iklan, bahkan beli alat kerja.",
    example: "Modal jualan Rp1 juta, untung bersih Rp300 ribu → ROI 30%.",
    formula: "ROI = (laba ÷ modal) × 100%",
  },
  {
    id: "roe", term: "ROE", full: "Return on Equity", category: "metrik", priority: true,
    def: "Seberapa jago perusahaan mencetak laba dari duit pemegang sahamnya sendiri. Favorit analis saham buat menilai kualitas manajemen — makin tinggi (dan konsisten), makin \"jago masak\" perusahaannya.",
    example: "ROE 20% artinya tiap Rp100 modal pemegang saham menghasilkan Rp20 laba setahun.",
    formula: "ROE = (laba bersih ÷ ekuitas) × 100%",
  },
  {
    id: "roa", term: "ROA", full: "Return on Assets", category: "metrik",
    def: "Seberapa efisien SEMUA aset perusahaan (termasuk yang dibeli pakai utang) menghasilkan laba. Pasangannya ROE — kalau ROE tinggi tapi ROA rendah, untungnya banyak ditopang utang.",
    formula: "ROA = (laba bersih ÷ total aset) × 100%",
  },
  {
    id: "ebitda", term: "EBITDA", full: "Earnings Before Interest, Taxes, Depreciation & Amortization", category: "metrik", priority: true,
    def: "Laba \"mentah\" dari operasi bisnis sebelum dipotong bunga, pajak, dan penyusutan. Dipakai buat lihat mesin bisnisnya sehat atau tidak, tanpa gangguan struktur utang & pajak — makanya sering muncul di berita akuisisi startup.",
    example: "\"Startup itu sudah EBITDA positif\" = operasionalnya sudah untung, walau setelah bunga & pajak mungkin masih rugi.",
    formula: "EBITDA = laba bersih + pajak + bunga + depresiasi + amortisasi",
  },
  {
    id: "fcf", term: "FCF", full: "Free Cash Flow (Arus Kas Bebas)", category: "metrik", priority: true,
    def: "Uang tunai yang BENAR-BENAR tersisa setelah bayar operasional dan belanja modal. Ini \"duit bebas\" perusahaan buat bagi dividen, bayar utang, atau ekspansi — laba di atas kertas bisa bohong, kas susah bohong.",
    example: "Perusahaan bisa laporkan laba besar tapi FCF negatif — artinya untungnya belum jadi uang beneran.",
    formula: "FCF = arus kas operasi − CapEx",
  },
  {
    id: "eps", term: "EPS", full: "Earnings Per Share (Laba per Saham)", category: "metrik",
    def: "Laba bersih dibagi rata ke tiap lembar saham — jatah untung kamu per lembar. Bahan baku menghitung PER.",
    formula: "EPS = laba bersih ÷ jumlah saham beredar",
  },
  {
    id: "margin", term: "Profit Margin", full: "Gross / Operating / Net Profit Margin", category: "metrik", priority: true,
    def: "Dari tiap Rp100 penjualan, berapa yang nyangkut jadi untung. Gross margin = setelah biaya produksi; net margin = setelah SEMUA biaya. Margin tipis artinya bisnisnya berat, margin tebal artinya punya \"kekuatan harga\".",
    example: "Jualan kopi Rp25 ribu, biaya total Rp20 ribu → net margin 20%.",
    formula: "Net Profit Margin = (laba bersih ÷ pendapatan) × 100%",
  },
  {
    id: "revenue", term: "Revenue vs Net Profit", full: "Pendapatan (top line) vs Laba Bersih (bottom line)", category: "metrik",
    def: "Revenue = omzet kotor yang masuk; net profit = sisa bersihnya setelah semua biaya. Disebut top line & bottom line karena posisinya di baris atas & bawah laporan laba rugi. Omzet besar ≠ untung besar.",
    example: "\"Omzet miliaran\" bisa saja net profit-nya minus — yang bikin kaya itu bottom line.",
  },
  {
    id: "burn-rate", term: "Burn Rate", category: "metrik", priority: true,
    def: "Kecepatan \"bakar uang\" per bulan sebelum bisnis untung — istilah wajib di dunia startup. Buat keuangan pribadi: total pengeluaran bulananmu adalah burn rate-mu.",
    example: "Kas Rp50 juta, burn rate Rp10 juta/bulan → umur bisnis tinggal 5 bulan kalau tidak ada pemasukan.",
    formula: "Burn rate = kas keluar bersih per bulan",
  },
  {
    id: "runway", term: "Runway", category: "metrik", priority: true,
    def: "Berapa bulan lagi kamu bisa bertahan dengan kas yang ada, tanpa pemasukan baru. Istilah startup yang juga metrik survival pribadi paling penting — landasan pacu sebelum \"pesawat\" harus terbang.",
    example: "Saldo semua kantong Rp15 juta, pengeluaran rata-rata Rp5 juta/bulan → runway 3 bulan.",
    formula: "Runway = kas di tangan ÷ burn rate bulanan",
  },
  {
    id: "capex", term: "CapEx", full: "Capital Expenditure (Belanja Modal)", category: "metrik",
    def: "Uang yang dipakai beli/upgrade aset jangka panjang — mesin, gedung, laptop kerja. Keluar sekali, manfaatnya bertahun-tahun.",
  },
  {
    id: "opex", term: "OpEx", full: "Operating Expenditure (Biaya Operasional)", category: "metrik",
    def: "Biaya rutin buat menjalankan bisnis sehari-hari — gaji, sewa, listrik, langganan tools. Lawannya CapEx.",
  },
  {
    id: "valuasi", term: "Valuasi", full: "Valuation", category: "metrik", priority: true,
    def: "Taksiran harga sebuah perusahaan secara keseluruhan. Angka inilah yang menentukan berapa persen saham yang ditukar saat investor masuk — \"startup unicorn\" = valuasi di atas $1 miliar.",
    example: "Investor setor Rp1 miliar untuk 10% saham → valuasinya Rp10 miliar.",
  },
  {
    id: "yoy", term: "YoY / QoQ", full: "Year-on-Year / Quarter-on-Quarter", category: "metrik",
    def: "Cara membandingkan kinerja dengan periode yang sama tahun/kuartal sebelumnya — supaya adil (musiman lebaran vs lebaran, bukan lebaran vs bulan biasa). Format standar berita keuangan.",
    example: "\"Laba tumbuh 20% YoY\" = dibanding kuartal yang sama tahun lalu, bukan kuartal kemarin.",
  },
  {
    id: "net-worth", term: "Net Worth", full: "Kekayaan Bersih", category: "metrik", priority: true,
    def: "Total semua aset dikurangi total utang — angka \"berapa kekayaanmu sebenarnya\". Fondasi utama kesehatan finansial: naik konsisten dari waktu ke waktu = arah yang benar.",
    formula: "Net worth = total aset − total liabilitas",
  },
  {
    id: "arus-kas", term: "Arus Kas", full: "Cash Flow", category: "metrik",
    def: "Selisih uang masuk dan uang keluar dalam satu periode. Positif = menabung; negatif = \"membakar\" tabungan. Bisnis (dan orang) bangkrut bukan karena rugi di kertas, tapi karena kehabisan kas.",
  },
  {
    id: "savings-rate", term: "Savings Rate", full: "Tingkat Tabungan", category: "metrik",
    def: "Persentase pemasukan yang berhasil disimpan, bukan dihabiskan. Metrik personal finance paling menentukan kecepatan menuju bebas finansial — target sehat umumnya ≥ 20%.",
    example: "Pemasukan Rp10 juta, pengeluaran Rp7 juta → savings rate 30%.",
    formula: "Savings rate = (pemasukan − pengeluaran) ÷ pemasukan × 100%",
  },
  {
    id: "surplus-defisit", term: "Surplus / Defisit", category: "metrik",
    def: "Surplus = pemasukan bulan itu lebih besar dari pengeluaran (nabung). Defisit alias \"boncos\" = pengeluaran lebih besar (makan tabungan). Satu angka ini merangkum sehat-tidaknya keuangan bulananmu.",
    formula: "Net = total masuk − total keluar",
  },
  {
    id: "emergency-fund", term: "Dana Darurat", full: "Emergency Fund", category: "metrik",
    def: "Tabungan khusus untuk kejadian tak terduga (sakit, kehilangan income) — disimpan di tempat likuid, bukan diinvestasikan. Standar umum: 3–6 bulan pengeluaran; 12 bulan untuk pekerja lepas/trader.",
  },
  {
    id: "envelope-budgeting", term: "Envelope Budgeting", full: "Metode Amplop / Kantong", category: "metrik",
    def: "Metode budgeting klasik: uang dibagi ke \"amplop\" terpisah per tujuan (makan, transport, tabungan) dan tiap amplop punya jatahnya sendiri. Versi digital-nya = fitur kantong + limit kategori di app ini. Dipopulerkan ulang oleh YNAB.",
  },

  // ═══ RASIO & AKUNTANSI ═════════════════════════════════════════════════════
  {
    id: "current-ratio", term: "Current Ratio", full: "Rasio Lancar", category: "rasio",
    def: "Cek apakah aset yang cepat cair cukup buat bayar utang jangka pendek. Di atas 1 = napas pendeknya aman; di bawah 1 = bisa gagap bayar tagihan.",
    formula: "Current ratio = aset lancar ÷ liabilitas jangka pendek",
  },
  {
    id: "quick-ratio", term: "Quick Ratio", full: "Rasio Cepat (Acid-Test)", category: "rasio",
    def: "Versi lebih kejam dari current ratio: persediaan/stok TIDAK dihitung karena belum tentu cepat jadi uang. Ukuran likuiditas paling konservatif.",
    formula: "Quick ratio = (aset lancar − persediaan) ÷ liabilitas jangka pendek",
  },
  {
    id: "der", term: "DER", full: "Debt to Equity Ratio", category: "rasio", priority: true,
    def: "Bandingkan total utang vs modal sendiri — makin tinggi makin \"hidup dari utang\". Umumnya 0,5–1,5 dianggap sehat, tergantung industri (bank & properti wajar lebih tinggi).",
    example: "DER 2,0 = utangnya dua kali lipat modal sendiri — agresif.",
    formula: "DER = total liabilitas ÷ total ekuitas",
  },
  {
    id: "debt-to-asset", term: "Debt-to-Asset Ratio", full: "Rasio Utang terhadap Aset", category: "rasio",
    def: "Berapa persen aset yang sebenarnya dibiayai utang. 0,4 artinya 40% dari semua yang \"kamu miliki\" sebetulnya dibeli pakai uang orang lain.",
    formula: "DAR = total liabilitas ÷ total aset",
  },
  {
    id: "per", term: "PER (P/E)", full: "Price to Earnings Ratio", category: "rasio", priority: true,
    def: "\"Harga saham ini mahal atau murah dibanding labanya?\" — rasio screening paling sering disebut di Stockbit. PER 15 artinya kamu \"membayar\" 15 tahun laba perusahaan di harga sekarang. Bandingkan dengan sesama industrinya, bukan angka absolut.",
    formula: "PER = harga saham ÷ EPS",
  },
  {
    id: "pbv", term: "PBV", full: "Price to Book Value", category: "rasio",
    def: "Harga saham dibanding nilai buku (kekayaan bersih) per lembar. Di bawah 1 sering dibaca \"diskon\" — tapi cek dulu kenapa murahnya.",
    formula: "PBV = harga saham ÷ nilai buku per saham",
  },
  {
    id: "dividend-yield", term: "Dividend Yield", full: "Imbal Hasil Dividen", category: "rasio",
    def: "Berapa persen \"bunga\" dividen yang kamu terima setahun dibanding harga beli sahamnya. Pembanding langsung dengan bunga deposito.",
    formula: "Yield = (dividen per saham ÷ harga saham) × 100%",
  },
  {
    id: "dpr", term: "DPR", full: "Dividend Payout Ratio", category: "rasio",
    def: "Dari total laba, berapa persen yang dibagikan ke pemegang saham — sisanya ditahan buat ekspansi. DPR 100%+ artinya bagi dividen lebih besar dari labanya (tidak sehat jangka panjang).",
    formula: "DPR = total dividen ÷ laba bersih",
  },
  {
    id: "likuiditas", term: "Likuiditas", full: "Liquidity", category: "rasio",
    def: "Seberapa cepat sebuah aset bisa dicairkan jadi uang tunai tanpa kehilangan nilai. Kas & stablecoin = sangat likuid; properti = tidak likuid. Dana darurat wajib di aset likuid.",
  },
  {
    id: "neraca", term: "Neraca", full: "Balance Sheet", category: "rasio",
    def: "Foto keuangan pada satu titik waktu: daftar semua aset di sisi satu, utang + modal di sisi lain. Dasar menghitung net worth. \"Balance\" karena dua sisinya harus selalu seimbang.",
    formula: "Aset = liabilitas + ekuitas",
  },
  {
    id: "aset", term: "Aset", full: "Assets", category: "rasio",
    def: "Semua yang kamu miliki dan bernilai: kas, kripto, saham, properti, piutang, nilai bisnis. Aset produktif menghasilkan uang; aset konsumtif menggerogoti uang.",
  },
  {
    id: "liabilitas", term: "Liabilitas", full: "Liabilities / Utang", category: "rasio",
    def: "Semua kewajiban yang harus dibayar: pinjaman, cicilan, paylater, tagihan tertunggak. Pengurang langsung net worth.",
  },
  {
    id: "ekuitas", term: "Ekuitas", full: "Equity / Modal Sendiri", category: "rasio",
    def: "Bagian yang benar-benar milikmu setelah semua utang dilunasi. Di perusahaan = modal pemegang saham; di pribadi = net worth.",
    formula: "Ekuitas = total aset − total liabilitas",
  },

  // ═══ JABATAN KORPORAT ══════════════════════════════════════════════════════
  {
    id: "ceo", term: "CEO", full: "Chief Executive Officer", category: "jabatan", priority: true,
    def: "Bos tertinggi eksekutif — penentu arah, pengambil keputusan akhir, dan wajah perusahaan ke publik. Di PT Indonesia padanannya Direktur Utama (Dirut).",
  },
  {
    id: "coo", term: "COO", full: "Chief Operating Officer", category: "jabatan",
    def: "Tangan kanan CEO yang memastikan operasional harian jalan mulus — orang yang \"mengeksekusi\" strategi CEO menjadi kenyataan sehari-hari.",
  },
  {
    id: "cfo", term: "CFO", full: "Chief Financial Officer", category: "jabatan",
    def: "Panglima keuangan — pegang kas, laporan keuangan, penggalangan dana, dan strategi finansial. Orang kedua yang paling didengar investor setelah CEO.",
  },
  {
    id: "cto", term: "CTO", full: "Chief Technology Officer", category: "jabatan",
    def: "Otak teknologi — menentukan arsitektur produk dan infrastruktur tech. Di startup tech, sering co-founder yang megang kode sejak hari pertama.",
  },
  {
    id: "cmo", term: "CMO", full: "Chief Marketing Officer", category: "jabatan",
    def: "Panglima pemasaran — branding, iklan, dan akuisisi pelanggan. KPI-nya: orang kenal dan beli.",
  },
  {
    id: "cio", term: "CIO", full: "Chief Information / Investment Officer", category: "jabatan",
    def: "Punya dua makna tergantung konteks: kepala sistem informasi internal perusahaan, ATAU di perusahaan investasi = kepala pengelola dana (yang menentukan taruh uang di mana).",
  },
  {
    id: "vp", term: "VP", full: "Vice President", category: "jabatan",
    def: "Level manajemen senior di bawah C-level yang memimpin satu fungsi besar (VP Engineering, VP Sales). Di perbankan, VP adalah jenjang karier — bukan berarti wakil direktur.",
  },
  {
    id: "gm", term: "GM", full: "General Manager", category: "jabatan",
    def: "Kepala satu unit bisnis/cabang yang mengurus operasional wilayahnya dari A sampai Z — CEO-kecil untuk satu unit.",
  },
  {
    id: "direksi", term: "Direksi / Dirut", full: "Board of Directors / Direktur Utama", category: "jabatan",
    def: "Tim eksekutif yang menjalankan perusahaan sehari-hari di sistem PT Indonesia. Dirut = padanan CEO. Diangkat dan diberhentikan lewat RUPS (Rapat Umum Pemegang Saham).",
  },
  {
    id: "komisaris", term: "Komisaris", full: "Board of Commissioners", category: "jabatan",
    def: "Khas sistem dua-dewan Indonesia: PENGAWAS direksi yang mewakili pemegang saham — bukan pelaksana harian. Komisaris independen = pengawas yang tidak terafiliasi pemilik.",
  },

  // ═══ PASAR & INVESTASI ═════════════════════════════════════════════════════
  {
    id: "bull-bear", term: "Bullish / Bearish", category: "pasar", priority: true,
    def: "Dua \"mood\" pasar: bull(ish) = optimis, harga cenderung naik (banteng menyeruduk ke atas); bear(ish) = pesimis, harga cenderung turun (beruang mencakar ke bawah). Bull market / bear market = periode panjangnya.",
    example: "\"Masih bearish, jangan all-in dulu\" = pasar masih tren turun.",
  },
  {
    id: "market-cap", term: "Market Cap", full: "Kapitalisasi Pasar", category: "pasar", priority: true,
    def: "Harga total seluruh perusahaan (atau coin) di mata pasar. Patokan dasar semua diskusi valuasi — \"BTC market cap $2T\" jauh lebih bermakna daripada harga per koinnya.",
    formula: "Market cap = harga per lembar/koin × jumlah beredar",
  },
  {
    id: "dividen", term: "Dividen", category: "pasar", priority: true,
    def: "Bagi-bagi laba perusahaan ke pemegang saham — \"gaji pasif\" para investor. Tidak semua emiten bagi dividen; perusahaan growth biasanya menahan laba untuk ekspansi.",
  },
  {
    id: "capital-gain", term: "Capital Gain / Loss", category: "pasar",
    def: "Untung (atau rugi) dari selisih harga jual dan harga beli. Sumber cuan investasi selain dividen.",
    example: "Beli di Rp1.000, jual di Rp1.300 → capital gain 30%.",
  },
  {
    id: "ipo", term: "IPO", full: "Initial Public Offering", category: "pasar", priority: true,
    def: "Momen perusahaan pertama kali \"buka lapak\" menjual sahamnya ke publik di bursa. Sesudah IPO, siapa pun bisa jadi pemilik lewat beli saham.",
  },
  {
    id: "ihsg", term: "IHSG", full: "Indeks Harga Saham Gabungan", category: "pasar",
    def: "Termometer seluruh saham di Bursa Efek Indonesia — satu angka yang merangkum \"pasar hari ini hijau atau merah\". Padanan luarnya: S&P 500 (AS).",
  },
  {
    id: "lot", term: "Lot", category: "pasar",
    def: "Satuan beli saham di Indonesia: 1 lot = 100 lembar. Harga saham Rp1.000 artinya butuh Rp100 ribu per lot.",
  },
  {
    id: "emiten", term: "Emiten", category: "pasar",
    def: "Perusahaan yang menerbitkan dan mencatatkan sahamnya di bursa. \"Emiten perbankan\" = saham-saham bank yang listing di BEI.",
  },
  {
    id: "ara-arb", term: "ARA / ARB", full: "Auto Rejection Atas / Bawah", category: "pasar", priority: true,
    def: "Rem otomatis khas Bursa Efek Indonesia: batas maksimal sebuah saham boleh naik (ARA) atau turun (ARB) dalam sehari — order di luar batas itu ditolak sistem. \"Kena ARA\" = naik sampai mentok.",
  },
  {
    id: "blue-chip", term: "Blue Chip", category: "pasar", priority: true,
    def: "Saham perusahaan besar, fundamental kuat, pemimpin pasar — \"pemain bintang lima\" bursa (BBCA, TLKM, dst). Lawannya: second/third liner yang lebih kecil dan lebih liar.",
  },
  {
    id: "gorengan", term: "Saham Gorengan & Bandar", category: "pasar",
    def: "Saham receh tanpa fundamental yang harganya \"digoreng\" naik-turun liar oleh bandar (pemodal besar penggerak harga). Naiknya menggoda, turunnya mematikan — habitat ritel boncos.",
  },
  {
    id: "cut-loss", term: "Cut Loss", category: "pasar", priority: true,
    def: "Rela jual rugi sekarang biar tidak rugi lebih dalam nanti — seni \"mengakui kalah\" yang membedakan trader hidup dan trader habis. Disiplin cut loss = separuh dari risk management.",
    example: "Beli di Rp1.000, sudah janji cut loss di Rp900 → turun ke Rp900, jual, titik.",
  },
  {
    id: "average-down", term: "Average Down / Up", category: "pasar",
    def: "Average down = beli lagi saat harga turun untuk menurunkan harga rata-rata modal; average up = nambah bertahap saat tren naik. Down berbahaya kalau dilakukan tanpa analisis — \"menangkap pisau jatuh\".",
  },
  {
    id: "dca", term: "DCA", full: "Dollar Cost Averaging", category: "pasar", priority: true,
    def: "Nyicil beli rutin (misal tiap bulan/minggu) dengan nominal sama, berapa pun harganya. Strategi anti-pusing yang paling sering disarankan ke pemula: menghapus drama \"timing pasar\".",
    example: "Auto-beli BTC Rp500 ribu tiap tanggal 1, hujan atau badai.",
  },
  {
    id: "diversifikasi", term: "Diversifikasi", category: "pasar", priority: true,
    def: "Jangan taruh semua telur di satu keranjang: sebar dana ke beberapa jenis aset supaya satu jatuh tidak menghabisi semuanya. Mantra manajemen risiko nomor satu.",
  },
  {
    id: "alokasi-aset", term: "Alokasi Aset", full: "Asset Allocation", category: "pasar",
    def: "Peta sebaran kekayaan antar jenis aset (kas berapa persen, kripto berapa, saham berapa). Keputusan alokasi menentukan hasil investasi lebih besar daripada pilihan aset individunya.",
  },
  {
    id: "volatilitas", term: "Volatilitas", full: "Volatility", category: "pasar",
    def: "Seberapa liar harga naik-turun. Makin volatil, makin besar peluang & risiko — kripto jauh lebih volatil daripada saham blue chip.",
  },
  {
    id: "drawdown", term: "Drawdown", category: "pasar",
    def: "Penurunan nilai portofolio dari puncak tertinggi ke titik terendah — ukuran \"seberapa dalam pernah nyungsep\". Max drawdown adalah metrik risiko yang lebih jujur daripada rata-rata return.",
    example: "Porto dari Rp100 juta sempat turun ke Rp70 juta → drawdown 30%.",
  },
  {
    id: "leverage", term: "Leverage", category: "pasar",
    def: "Pakai uang pinjaman untuk memperbesar posisi — untung berlipat, rugi juga berlipat. Leverage 10x artinya pergerakan 10% melawanmu = modal habis.",
  },
  {
    id: "margin-call", term: "Margin Call", category: "pasar",
    def: "\"Telepon horor\" dari broker/exchange saat posisi leverage-mu rugi terlalu dalam: setor dana tambahan sekarang, atau posisi dijual paksa (dilikuidasi).",
  },
  {
    id: "stock-split", term: "Stock Split", category: "pasar",
    def: "Memecah 1 saham jadi beberapa lembar dengan harga lebih murah supaya terjangkau ritel — total nilainya tidak berubah, cuma pecahannya.",
    example: "Split 1:5 → harga per lembar jadi 1/5, jumlah lembarmu jadi 5x.",
  },
  {
    id: "pnl", term: "P&L", full: "Profit & Loss", category: "pasar",
    def: "Catatan untung-rugi. \"Daily P&L\" trader = hasil bersih hari itu; \"laporan P&L\" perusahaan = laporan laba rugi. Realized = sudah dijual & terkunci; unrealized = masih di atas kertas.",
  },
  {
    id: "compounding", term: "Compounding", full: "Bunga-Berbunga", category: "pasar",
    def: "Untung yang diputar lagi menghasilkan untung berikutnya — bola salju kekayaan. Kecil tapi konsisten dalam waktu lama mengalahkan besar tapi sesekali. Einstein (konon) menyebutnya keajaiban dunia ke-8.",
    example: "Rp10 juta tumbuh 20%/tahun = Rp61 juta dalam 10 tahun, bukan Rp30 juta.",
  },
];

// ── Lookup & util ─────────────────────────────────────────────────────────────

const byId = new Map(GLOSSARY.map((t) => [t.id, t]));

export function getTerm(id: string): GlossaryTerm | undefined {
  return byId.get(id);
}

export function searchGlossary(q: string, category?: GlossaryCategory | "all"): GlossaryTerm[] {
  const query = q.trim().toLowerCase();
  return GLOSSARY.filter((t) => {
    if (category && category !== "all" && t.category !== category) return false;
    if (!query) return true;
    return (
      t.term.toLowerCase().includes(query) ||
      (t.full ?? "").toLowerCase().includes(query) ||
      t.def.toLowerCase().includes(query)
    );
  });
}

/** Istilah Hari Ini — deterministik per tanggal (bukan acak tiap render). */
export function termOfDay(date = new Date()): GlossaryTerm {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return GLOSSARY[hash % GLOSSARY.length];
}
