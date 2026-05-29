// ─── ZERØ COMMAND — CryptoPage.tsx ───────────────────────────────────────────
// On-chain metrics, live portfolio tracker (CoinGecko), NUPL reference, F&G
import { useState, useEffect } from "react";
import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import {
  TrendingUp, TrendingDown, RefreshCw, ExternalLink,
  Zap, AlertCircle,
} from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── COINGECKO SYMBOL MAP ─────────────────────────────────────────────────────
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin",
  SOL: "solana", XRP: "ripple", ADA: "cardano",
  DOGE: "dogecoin", DOT: "polkadot", AVAX: "avalanche-2",
  MATIC: "matic-network", LINK: "chainlink", UNI: "uniswap",
  ATOM: "cosmos", LTC: "litecoin", BCH: "bitcoin-cash",
  TON: "the-open-network", SHIB: "shiba-inu", TRX: "tron",
  NEAR: "near", APT: "aptos", OP: "optimism", ARB: "arbitrum",
  PEPE: "pepe", WIF: "dogwifcoin", BONK: "bonk",
};

const TOP_IDS = "bitcoin,ethereum,binancecoin,solana,ripple";

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function fetchTimeout(url: string, ms = 9000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

interface CGPrice { usd: number; usd_24h_change: number; }

async function fetchCGPrices(ids: string[]): Promise<Record<string, CGPrice>> {
  const res = await fetchTimeout(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error("CoinGecko error");
  return res.json();
}

interface FGData { value: string; label: string; }

async function fetchFearGreed(): Promise<FGData | null> {
  try {
    const res = await fetchTimeout("https://api.alternative.me/fng/?limit=1", 6000);
    if (!res.ok) return null;
    const d = await res.json();
    return { value: d.data[0].value, label: d.data[0].value_classification };
  } catch { return null; }
}

function fgColor(v: number): string {
  if (v >= 75) return "#ef4444";
  if (v >= 55) return "#f59e0b";
  if (v >= 45) return "#94a3b8";
  if (v >= 25) return "#3b82f6";
  return "#8b5cf6";
}

// ─── NUPL & FUNDING TABLES ────────────────────────────────────────────────────
const NUPL_ZONES = [
  { range: "> 0.75",     label: "Euphoria",        signal: "🔴 JUAL",        color: "#ef4444", bg: "#ef444418", desc: "Market overheated. Take profit agresif." },
  { range: "0.50–0.75",  label: "Belief / Denial", signal: "🟡 HATI-HATI",   color: "#f59e0b", bg: "#f59e0b15", desc: "Masih bullish tapi mulai reduce position." },
  { range: "0.25–0.50",  label: "Optimism",        signal: "🟢 HOLD",        color: "#22c55e", bg: "#22c55e15", desc: "Sweet spot akumulasi selama uptrend." },
  { range: "0.00–0.25",  label: "Hope / Fear",     signal: "🟢 BELI",        color: "#3b82f6", bg: "#3b82f615", desc: "Early accumulation zone. DCA masuk." },
  { range: "< 0.00",     label: "Capitulation",    signal: "🟢 BELI AGRESIF",color: "#8b5cf6", bg: "#8b5cf615", desc: "Extreme fear = maximum opportunity." },
];

const FUNDING_SIGNALS = [
  { rate: "> +0.10%",       bias: "Overheated LONG",  action: "Short bias / reduce long",  color: "#ef4444" },
  { rate: "+0.01–+0.10%",   bias: "Bullish normal",   action: "Hold long, trail SL",        color: "#22c55e" },
  { rate: "-0.01–+0.01%",   bias: "Neutral",          action: "Wait for direction",         color: "#94a3b8" },
  { rate: "-0.10–-0.01%",   bias: "Bearish normal",   action: "Hold short, trail SL",       color: "#f59e0b" },
  { rate: "< -0.10%",       bias: "Overheated SHORT", action: "Long bias / reduce short",   color: "#8b5cf6" },
];

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────
interface Holding {
  id: string; symbol: string; name: string;
  qty: string; avgBuy: string; currentPrice: string; color: string;
}

const COLORS = ["#f7931a","#627eea","#26a17b","#e84142","#0033ad","#2775ca","#16213e"];
const PORT_KEY = "zero-crypto-portfolio-v2";
const SYNC_KEY = "zero-crypto-sync-time";

function loadPort(): Holding[] { try { return JSON.parse(localStorage.getItem(PORT_KEY) || "[]"); } catch { return []; } }
function savePort(p: Holding[]) { localStorage.setItem(PORT_KEY, JSON.stringify(p)); }
function loadSyncTime(): string { return localStorage.getItem(SYNC_KEY) || ""; }
function saveSyncTime(t: string) { localStorage.setItem(SYNC_KEY, t); }

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function CryptoPage({ data, update }: Props) {
  const c = data.crypto;
  const [portfolio, setPortfolio] = useState<Holding[]>(loadPort);
  const [activeTab, setActiveTab] = useState<"onchain" | "portfolio" | "coinglass">("onchain");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Live prices state
  const [topPrices, setTopPrices] = useState<Record<string, CGPrice>>({});
  const [topLoading, setTopLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncTime, setSyncTime] = useState(loadSyncTime);

  // Fear & Greed
  const [fg, setFg] = useState<FGData | null>(null);
  const [fgLoading, setFgLoading] = useState(false);

  // Fetch top prices on mount for ticker
  useEffect(() => {
    setTopLoading(true);
    fetchCGPrices(TOP_IDS.split(","))
      .then(p => setTopPrices(p))
      .catch(() => {})
      .finally(() => setTopLoading(false));
  }, []);

  // Fetch Fear & Greed on mount
  useEffect(() => {
    setFgLoading(true);
    fetchFearGreed()
      .then(d => setFg(d))
      .catch(() => {})
      .finally(() => setFgLoading(false));
  }, []);

  const updatePortfolio = (p: Holding[]) => { setPortfolio(p); savePort(p); };
  const addHolding = () => {
    const h: Holding = { id: uid(), symbol: "BTC", name: "Bitcoin", qty: "0", avgBuy: "0", currentPrice: "0", color: COLORS[portfolio.length % COLORS.length] };
    updatePortfolio([h, ...portfolio]);
    setEditingId(h.id);
  };
  const updateHolding = (id: string, field: keyof Holding, value: string) =>
    updatePortfolio(portfolio.map(h => h.id === id ? { ...h, [field]: value } : h));
  const removeHolding = (id: string) => updatePortfolio(portfolio.filter(h => h.id !== id));

  // CoinGecko price sync
  const syncPrices = async () => {
    setSyncLoading(true);
    setSyncError("");
    try {
      const ids = [...new Set(
        portfolio.map(h => SYMBOL_TO_ID[h.symbol.toUpperCase()]).filter(Boolean) as string[]
      )];
      if (ids.length === 0) {
        setSyncError("Tidak ada coin yang dikenal. Gunakan symbol standar (BTC, ETH, SOL, dll).");
        setSyncLoading(false);
        return;
      }
      const prices = await fetchCGPrices(ids);
      const updated = portfolio.map(h => {
        const cgId = SYMBOL_TO_ID[h.symbol.toUpperCase()];
        if (cgId && prices[cgId]) return { ...h, currentPrice: prices[cgId].usd.toString() };
        return h;
      });
      updatePortfolio(updated);
      const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      setSyncTime(t);
      saveSyncTime(t);
    } catch { setSyncError("Gagal fetch harga dari CoinGecko. Coba lagi."); }
    setSyncLoading(false);
  };

  // Totals
  const totalValue = portfolio.reduce((s, h) => s + (parseFloat(h.qty) * parseFloat(h.currentPrice) || 0), 0);
  const totalCost = portfolio.reduce((s, h) => s + (parseFloat(h.qty) * parseFloat(h.avgBuy) || 0), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
    fontFamily: "var(--font-sans)", border: "none", cursor: "pointer",
    background: activeTab === t ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)",
    color: activeTab === t ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
    transition: "all 0.15s",
  });

  // Ticker bar prices: BTC and ETH
  const btcData = topPrices["bitcoin"];
  const ethData = topPrices["ethereum"];

  return (
    <div className="space-y-5">

      {/* ── Live Ticker Bar ── */}
      {(btcData || ethData || topLoading) && (
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap",
          padding: "10px 14px", borderRadius: 10,
          background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
          alignItems: "center",
        }}>
          {topLoading && !btcData ? (
            <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              <RefreshCw size={11} style={{ animation: "spin 1s linear infinite", display: "inline", marginRight: 5 }} />
              Loading live prices...
            </span>
          ) : (
            <>
              {[
                { id: "bitcoin", sym: "BTC", color: "#f7931a" },
                { id: "ethereum", sym: "ETH", color: "#627eea" },
              ].map(({ id, sym, color }) => {
                const p = topPrices[id];
                if (!p) return null;
                const up = p.usd_24h_change >= 0;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{sym}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", fontFamily: "var(--font-mono)" }}>
                      ${p.usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: up ? "#22c55e" : "#ef4444", display: "flex", alignItems: "center", gap: 2 }}>
                      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {up ? "+" : ""}{p.usd_24h_change.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
              <span style={{ marginLeft: "auto", fontSize: 10, color: "hsl(var(--muted-foreground))" }}>
                via CoinGecko
              </span>
            </>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={tabStyle("onchain")} onClick={() => setActiveTab("onchain")}>📊 On-Chain Signals</button>
        <button style={tabStyle("portfolio")} onClick={() => setActiveTab("portfolio")}>💼 Portfolio</button>
        <button style={tabStyle("coinglass")} onClick={() => setActiveTab("coinglass")}>🔭 Coinglass Guide</button>
      </div>

      {/* ── ON-CHAIN TAB ── */}
      {activeTab === "onchain" && (
        <>
          {/* Fear & Greed Live */}
          <SectionCard title="Fear & Greed Index — Live">
            {fgLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
                <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Fetching from Alternative.me...
              </div>
            ) : fg ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: fgColor(parseInt(fg.value)) + "25",
                  border: `3px solid ${fgColor(parseInt(fg.value))}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: fgColor(parseInt(fg.value)), fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                    {fg.value}
                  </span>
                  <span style={{ fontSize: 8, color: fgColor(parseInt(fg.value)), fontWeight: 600, letterSpacing: 0.5 }}>/ 100</span>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: fgColor(parseInt(fg.value)), margin: 0 }}>{fg.label}</p>
                  <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: 0, marginTop: 4 }}>
                    0 = Extreme Fear · 100 = Extreme Greed
                  </p>
                  <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0, marginTop: 2 }}>
                    Source: Alternative.me · Updates daily
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>Gagal load Fear & Greed index.</p>
            )}
          </SectionCard>

          {/* NUPL Reference */}
          <SectionCard title="NUPL — Net Unrealized Profit/Loss">
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 12, lineHeight: 1.4 }}>
              NUPL mengukur posisi unrealized profit/loss seluruh market. Leading indicator jangka panjang untuk Bitcoin.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {NUPL_ZONES.map((z) => (
                <div key={z.range} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: z.bg, border: `1px solid ${z.color}30`,
                }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: z.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: z.color, fontWeight: 700 }}>{z.range}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))" }}>{z.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{z.desc}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: z.color, flexShrink: 0 }}>{z.signal}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>Catatan pribadi:</p>
              <EditableText value={c.nuplOnChain} onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, nuplOnChain: val } }))} />
            </div>
          </SectionCard>

          {/* Funding Rate */}
          <SectionCard title="Funding Rate — Coinglass Signal">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["FUNDING RATE", "MARKET BIAS", "ACTION"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FUNDING_SIGNALS.map((f) => (
                    <tr key={f.rate} style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}>
                      <td style={{ padding: "8px 8px", fontFamily: "var(--font-mono)", fontSize: 11, color: f.color, fontWeight: 700 }}>{f.rate}</td>
                      <td style={{ padding: "8px 8px", color: "hsl(var(--foreground))", fontWeight: 500 }}>{f.bias}</td>
                      <td style={{ padding: "8px 8px", color: "hsl(var(--muted-foreground))" }}>{f.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* One Step */}
          <SectionCard title="One Step Framework — Leading Indicators">
            <EditableText value={c.oneStep} onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, oneStep: val } }))} />
          </SectionCard>

          {/* Tools */}
          <SectionCard title="Tools & Resources">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {[
                { name: "Coinglass",   url: "https://www.coinglass.com",                          icon: "📊", desc: "Funding rate, OI, liquidations" },
                { name: "CryptoQuant", url: "https://cryptoquant.com",                            icon: "⛓️", desc: "On-chain flows, NUPL" },
                { name: "TradingView", url: "https://www.tradingview.com",                        icon: "📈", desc: "Charting & technicals" },
                { name: "CoinGecko",   url: "https://www.coingecko.com",                          icon: "🦎", desc: "Prices & market data" },
                { name: "Glassnode",   url: "https://studio.glassnode.com",                       icon: "🔮", desc: "Advanced on-chain" },
                { name: "Fear & Greed",url: "https://alternative.me/crypto/fear-and-greed-index/",icon: "😱", desc: "Sentiment index" },
              ].map((tool) => (
                <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", flexDirection: "column", gap: 4,
                    padding: "10px 12px", borderRadius: 10,
                    background: "hsl(var(--muted) / 0.4)",
                    border: "1px solid hsl(var(--border) / 0.5)",
                    textDecoration: "none", transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "hsl(var(--border) / 0.5)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{tool.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))" }}>{tool.name}</span>
                    <ExternalLink size={10} style={{ color: "hsl(var(--muted-foreground))", marginLeft: "auto" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", lineHeight: 1.3 }}>{tool.desc}</span>
                </a>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* ── PORTFOLIO TAB ── */}
      {activeTab === "portfolio" && (
        <>
          {/* Summary */}
          {portfolio.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Total Value", value: fmtUSD(totalValue), color: "hsl(var(--foreground))" },
                { label: "Total Cost",  value: fmtUSD(totalCost),  color: "hsl(var(--muted-foreground))" },
                { label: "Total P&L",   value: `${totalPnl >= 0 ? "+" : ""}${fmtUSD(totalPnl)} (${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%)`, color: totalPnl >= 0 ? "#22c55e" : "#ef4444" },
              ].map(s => (
                <div key={s.label} style={{ padding: "12px 14px", borderRadius: 10, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", margin: 0, marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: s.color, margin: 0, fontFamily: "var(--font-mono)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sync Controls */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            padding: "10px 14px", borderRadius: 10,
            background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>
                🔄 Auto-Sync Harga via CoinGecko
              </p>
              <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0, marginTop: 2 }}>
                {syncTime ? `Terakhir sync: ${syncTime}` : "Belum pernah sync"}
              </p>
              {syncError && (
                <p style={{ fontSize: 11, color: "#ef4444", margin: 0, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertCircle size={10} /> {syncError}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={syncPrices} disabled={syncLoading || portfolio.length === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 8,
                  background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
                  border: "none", cursor: syncLoading ? "not-allowed" : "pointer",
                  fontSize: 12, fontWeight: 600, opacity: syncLoading ? 0.7 : 1,
                }}
              >
                <RefreshCw size={11} style={syncLoading ? { animation: "spin 1s linear infinite" } : {}} />
                {syncLoading ? "Syncing..." : "Sync Harga"}
              </button>
              <button onClick={addHolding}
                style={{
                  padding: "7px 14px", borderRadius: 8,
                  background: "hsl(var(--muted) / 0.5)", color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                }}
              >
                + Add Coin
              </button>
            </div>
          </div>

          {/* Holdings List */}
          <SectionCard title="Holdings">
            {portfolio.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "hsl(var(--muted-foreground))" }}>
                <p style={{ fontSize: 13 }}>Belum ada holdings. Tap + Add Coin untuk mulai.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {portfolio.map(h => {
                  const cv = parseFloat(h.qty) * parseFloat(h.currentPrice) || 0;
                  const cost = parseFloat(h.qty) * parseFloat(h.avgBuy) || 0;
                  const pnl = cv - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                  const isEditing = editingId === h.id;
                  const cgId = SYMBOL_TO_ID[h.symbol.toUpperCase()];
                  const liveP = cgId ? topPrices[cgId] : undefined;

                  return (
                    <div key={h.id} style={{
                      padding: "12px 14px", borderRadius: 10,
                      background: "hsl(var(--muted) / 0.3)",
                      border: `1px solid ${isEditing ? h.color + "60" : "hsl(var(--border) / 0.5)"}`,
                      transition: "border-color 0.15s",
                    }}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {([
                              { field: "symbol", label: "Symbol", placeholder: "BTC", upper: true },
                              { field: "name",   label: "Name",   placeholder: "Bitcoin" },
                              { field: "qty",    label: "Qty",    placeholder: "0.05", type: "number" },
                              { field: "avgBuy", label: "Avg Buy ($)", placeholder: "60000", type: "number" },
                              { field: "currentPrice", label: "Current Price ($)", placeholder: "65000", type: "number" },
                            ] as const).map(f => (
                              <label key={f.field} style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                                {f.label}
                                <input
                                  value={h[f.field]}
                                  type={(f as any).type || "text"}
                                  placeholder={f.placeholder}
                                  onChange={e => updateHolding(h.id, f.field, (f as any).upper ? e.target.value.toUpperCase() : e.target.value)}
                                  style={inputStyle}
                                />
                              </label>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => removeHolding(h.id)} style={{ ...btnStyle, background: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))" }}>Hapus</button>
                            <button onClick={() => setEditingId(null)} style={{ ...btnStyle, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Selesai</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setEditingId(h.id)}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: h.color + "25", border: `1px solid ${h.color}40`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, color: h.color, flexShrink: 0, fontFamily: "var(--font-mono)",
                          }}>
                            {h.symbol.slice(0, 4)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>{h.name}</p>
                            <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0 }}>
                              {h.qty} × ${parseFloat(h.currentPrice || "0").toLocaleString()}
                              {liveP && (
                                <span style={{ color: liveP.usd_24h_change >= 0 ? "#22c55e" : "#ef4444", marginLeft: 6 }}>
                                  Live: ${liveP.usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", margin: 0 }}>{fmtUSD(cv)}</p>
                            <p style={{ fontSize: 11, fontWeight: 600, color: pnl >= 0 ? "#22c55e" : "#ef4444", margin: 0 }}>
                              {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}

      {/* ── COINGLASS TAB ── */}
      {activeTab === "coinglass" && (
        <>
          <SectionCard title="Coinglass Guide — Key Metrics">
            <EditableText value={c.coinglassGuide} onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, coinglassGuide: val } }))} />
          </SectionCard>
          <SectionCard title="Reading Open Interest">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { condition: "OI naik + Harga naik",  signal: "Trend konfirmasi BULLISH ✅", color: "#22c55e" },
                { condition: "OI naik + Harga turun", signal: "Trend konfirmasi BEARISH ✅", color: "#ef4444" },
                { condition: "OI turun + Harga naik", signal: "Short squeeze / tidak sustain ⚠️", color: "#f59e0b" },
                { condition: "OI turun + Harga turun",signal: "Long liquidation / deleveraging ⚠️", color: "#f59e0b" },
              ].map(r => (
                <div key={r.condition} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: 10, background: "hsl(var(--muted) / 0.3)", gap: 10,
                }}>
                  <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{r.condition}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color, flexShrink: 0 }}>{r.signal}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* Notes */}
      <SectionCard title="Notes">
        <NotesList notes={c.notes} onChange={(notes) => update((d) => ({ ...d, crypto: { ...d.crypto, notes } }))} />
      </SectionCard>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", marginTop: 4, padding: "6px 10px",
  borderRadius: 8, border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))", color: "hsl(var(--foreground))",
  fontSize: 13, fontFamily: "var(--font-mono)", outline: "none", boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 8, border: "none",
  cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)",
};
