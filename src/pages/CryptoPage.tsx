// ─── ZERØ COMMAND — CryptoPage.tsx ───────────────────────────────────────────
// On-chain metrics, live portfolio tracker (CoinGecko), NUPL reference, F&G
// Institutional "terminal" restructure: flat panels + hairline seams, mono
// tabular numerals, CSS-var colors (light + dark). Logic/features unchanged.
import { useState, useEffect, useRef } from "react";
import { AppData } from "@/lib/store";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import { Slab, SeamGrid, PanelHead, Divider, Stat, Badge, tLabelStyle } from "@/components/terminal";
import {
  TrendingUp, TrendingDown, RefreshCw, ExternalLink, AlertCircle,
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

// Semantic F&G scale routed through theme vars (contrarian: greed = danger).
function fgColor(v: number): string {
  if (v >= 75) return "var(--loss)";
  if (v >= 55) return "var(--warning)";
  if (v >= 45) return "var(--color-muted)";
  if (v >= 25) return "var(--gain)";
  return "var(--gold)";
}

// ─── NUPL & FUNDING TABLES ────────────────────────────────────────────────────
const NUPL_ZONES = [
  { range: "> 0.75",     label: "Euphoria",        signal: "🔴 JUAL",         color: "var(--loss)",          desc: "Market overheated. Take profit agresif." },
  { range: "0.50–0.75",  label: "Belief / Denial", signal: "🟡 HATI-HATI",    color: "var(--warning)",       desc: "Masih bullish tapi mulai reduce position." },
  { range: "0.25–0.50",  label: "Optimism",        signal: "🟢 HOLD",         color: "var(--gain)",          desc: "Sweet spot akumulasi selama uptrend." },
  { range: "0.00–0.25",  label: "Hope / Fear",     signal: "🟢 BELI",         color: "var(--color-primary)", desc: "Early accumulation zone. DCA masuk." },
  { range: "< 0.00",     label: "Capitulation",    signal: "🟢 BELI AGRESIF", color: "var(--gold)",          desc: "Extreme fear = maximum opportunity." },
];

const FUNDING_SIGNALS = [
  { rate: "> +0.10%",       bias: "Overheated LONG",  action: "Short bias / reduce long",  color: "var(--loss)" },
  { rate: "+0.01–+0.10%",   bias: "Bullish normal",   action: "Hold long, trail SL",        color: "var(--gain)" },
  { rate: "-0.01–+0.01%",   bias: "Neutral",          action: "Wait for direction",         color: "var(--color-muted)" },
  { rate: "-0.10–-0.01%",   bias: "Bearish normal",   action: "Hold short, trail SL",       color: "var(--warning)" },
  { rate: "< -0.10%",       bias: "Overheated SHORT", action: "Long bias / reduce short",   color: "var(--gold)" },
];

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────
interface Holding {
  id: string; symbol: string; name: string;
  qty: string; avgBuy: string; currentPrice: string; color: string;
}

// Coin brand hues — decorative avatar identity only (kept per token rules).
const COLORS = ["var(--cat-amber)","var(--cat-blue)","var(--cat-green)","var(--loss)","var(--cat-violet)","var(--cat-teal)","var(--color-muted)"];
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

  // ── Auto-refresh refs (stale-closure safe)
  const topRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fgRefreshRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const TOP_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes
  const FG_INTERVAL_MS  = 5 * 60 * 1000;  // 5 minutes

  // Fetch top prices — on mount + every 5 min
  useEffect(() => {
    const doFetch = () => {
      setTopLoading(true);
      fetchCGPrices(TOP_IDS.split(","))
        .then(p => setTopPrices(p))
        .catch(() => {})
        .finally(() => setTopLoading(false));
    };
    doFetch();
    topRefreshRef.current = setInterval(doFetch, TOP_INTERVAL_MS);
    return () => { if (topRefreshRef.current) clearInterval(topRefreshRef.current); };
  }, []);

  // Fetch Fear & Greed — on mount + every 5 min
  useEffect(() => {
    const doFetch = () => {
      setFgLoading(true);
      fetchFearGreed()
        .then(d => setFg(d))
        .catch(() => {})
        .finally(() => setFgLoading(false));
    };
    doFetch();
    fgRefreshRef.current = setInterval(doFetch, FG_INTERVAL_MS);
    return () => { if (fgRefreshRef.current) clearInterval(fgRefreshRef.current); };
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
    padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
    fontFamily: "var(--font-mono)", letterSpacing: "0.02em", cursor: "pointer",
    background: activeTab === t ? "var(--rail-active-bg)" : "var(--color-surface)",
    color: activeTab === t ? "var(--color-primary)" : "var(--color-muted)",
    border: `1px solid ${activeTab === t ? "var(--rail-active-border)" : "var(--color-border)"}`,
    transition: "all 0.15s",
  });

  // Ticker bar prices: BTC and ETH
  const btcData = topPrices["bitcoin"];
  const ethData = topPrices["ethereum"];

  return (
    <div className="space-y-5">

      {/* ── Live Ticker Bar ── */}
      {(btcData || ethData || topLoading) && (
        <Slab>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", background: "var(--glass-bg)", minHeight: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 40, borderRight: "1px solid var(--color-border)", flexShrink: 0 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gain)", boxShadow: "0 0 6px var(--gain)" }} />
              <span style={{ ...tLabelStyle, fontSize: 9 }}>LIVE</span>
            </div>
            {topLoading && !btcData ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)" }}>
                <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />
                Loading live prices...
              </span>
            ) : (
              <>
                {[
                  { id: "bitcoin", sym: "BTC", color: "var(--cat-amber)" },
                  { id: "ethereum", sym: "ETH", color: "var(--cat-blue)" },
                ].map(({ id, sym, color }) => {
                  const p = topPrices[id];
                  if (!p) return null;
                  const up = p.usd_24h_change >= 0;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: 40, borderRight: "1px solid var(--color-border)", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{sym}</span>
                      <span className="num" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
                        ${p.usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="num" style={{ fontSize: 11, fontWeight: 600, color: up ? "var(--gain)" : "var(--loss)", display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-mono)" }}>
                        {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {up ? "+" : ""}{p.usd_24h_change.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", padding: "0 14px", letterSpacing: "0.08em" }}>
                  VIA COINGECKO
                </span>
              </>
            )}
          </div>
        </Slab>
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
          <Slab>
            <PanelHead title="Fear & Greed Index — Live" right={<Badge tone="accent">LIVE</Badge>} />
            <div style={{ padding: "16px" }}>
              {fgLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-muted)" }}>
                  <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Fetching from Alternative.me...
                </div>
              ) : fg ? (
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "var(--color-surface)",
                    border: `3px solid ${fgColor(parseInt(fg.value))}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span className="num" style={{ fontSize: 22, fontWeight: 800, color: fgColor(parseInt(fg.value)), fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                      {fg.value}
                    </span>
                    <span style={{ fontSize: 8, color: fgColor(parseInt(fg.value)), fontWeight: 600, letterSpacing: 0.5 }}>/ 100</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: fgColor(parseInt(fg.value)), margin: 0 }}>{fg.label}</p>
                    {/* gauge track */}
                    <div style={{ height: 4, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden", margin: "8px 0 6px" }}>
                      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, parseInt(fg.value)))}%`, background: `linear-gradient(90deg, var(--gold) 0%, var(--gain) 30%, var(--warning) 65%, var(--loss) 100%)`, borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--color-muted)", margin: 0 }}>
                      0 = Extreme Fear · 100 = Extreme Greed
                    </p>
                    <p style={{ fontSize: 10, color: "var(--color-muted)", margin: 0, marginTop: 2, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      SOURCE: ALTERNATIVE.ME · UPDATES DAILY
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-muted)" }}>Gagal load Fear & Greed index.</p>
              )}
            </div>
          </Slab>

          {/* NUPL Reference */}
          <Slab>
            <PanelHead title="NUPL — Net Unrealized Profit/Loss" />
            <p style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5, padding: "12px 16px 4px", margin: 0 }}>
              NUPL mengukur posisi unrealized profit/loss seluruh market. Leading indicator jangka panjang untuk Bitcoin.
            </p>
            <div>
              {NUPL_ZONES.map((z) => (
                <div key={z.range} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px",
                  borderTop: "1px solid var(--color-border)",
                }}>
                  <div style={{ width: 3, height: 34, borderRadius: 2, background: z.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span className="num" style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: z.color, fontWeight: 700 }}>{z.range}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>{z.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{z.desc}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: z.color, flexShrink: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{z.signal}</span>
                </div>
              ))}
            </div>
            <Divider />
            <div style={{ padding: "12px 16px" }}>
              <p style={{ ...tLabelStyle, marginBottom: 8 }}>Catatan pribadi</p>
              <EditableText value={c.nuplOnChain} onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, nuplOnChain: val } }))} />
            </div>
          </Slab>

          {/* Funding Rate */}
          <Slab>
            <PanelHead title="Funding Rate — Coinglass Signal" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["FUNDING RATE", "MARKET BIAS", "ACTION"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-muted)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FUNDING_SIGNALS.map((f, i) => (
                    <tr key={f.rate} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                      <td className="num" style={{ padding: "9px 16px", fontFamily: "var(--font-mono)", fontSize: 11, color: f.color, fontWeight: 700, whiteSpace: "nowrap" }}>{f.rate}</td>
                      <td style={{ padding: "9px 16px", color: "var(--color-text)", fontWeight: 500 }}>{f.bias}</td>
                      <td style={{ padding: "9px 16px", color: "var(--color-muted)" }}>{f.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Slab>

          {/* One Step */}
          <Slab>
            <PanelHead title="One Step Framework — Leading Indicators" />
            <div style={{ padding: "14px 16px" }}>
              <EditableText value={c.oneStep} onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, oneStep: val } }))} />
            </div>
          </Slab>

          {/* Tools */}
          <Slab>
            <PanelHead title="Tools & Resources" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1, background: "var(--color-border)" }}>
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
                    padding: "12px 14px",
                    background: "var(--glass-bg)",
                    textDecoration: "none", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--glass-bg)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{tool.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>{tool.name}</span>
                    <ExternalLink size={10} style={{ color: "var(--color-muted)", marginLeft: "auto" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--color-muted)", lineHeight: 1.3 }}>{tool.desc}</span>
                </a>
              ))}
            </div>
          </Slab>
        </>
      )}

      {/* ── PORTFOLIO TAB ── */}
      {activeTab === "portfolio" && (
        <>
          {/* Summary */}
          {portfolio.length > 0 && (
            <Slab>
              <SeamGrid cols="1fr 1fr 1fr">
                <Stat label="Total Value" value={fmtUSD(totalValue)} />
                <Stat label="Total Cost" value={fmtUSD(totalCost)} tint="var(--color-muted)" />
                <Stat
                  label="Total P&L"
                  value={`${totalPnl >= 0 ? "+" : ""}${fmtUSD(totalPnl)}`}
                  sub={`${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`}
                  tint={totalPnl >= 0 ? "var(--gain)" : "var(--loss)"}
                />
              </SeamGrid>
            </Slab>
          )}

          {/* Sync Controls */}
          <Slab>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              padding: "12px 16px", background: "var(--glass-bg)",
            }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                  🔄 Auto-Sync Harga via CoinGecko
                </p>
                <p className="num" style={{ fontSize: 11, color: "var(--color-muted)", margin: 0, marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {syncTime ? `Terakhir sync: ${syncTime}` : "Belum pernah sync"}
                </p>
                {syncError && (
                  <p style={{ fontSize: 11, color: "var(--loss)", margin: 0, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={10} /> {syncError}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={syncPrices} disabled={syncLoading || portfolio.length === 0}
                  style={{
                    ...primaryBtnStyle,
                    display: "flex", alignItems: "center", gap: 5,
                    cursor: syncLoading ? "not-allowed" : "pointer",
                    opacity: syncLoading ? 0.7 : 1,
                  }}
                >
                  <RefreshCw size={11} style={syncLoading ? { animation: "spin 1s linear infinite" } : {}} />
                  {syncLoading ? "Syncing..." : "Sync Harga"}
                </button>
                <button onClick={addHolding} style={ghostBtnStyle}>
                  + Add Coin
                </button>
              </div>
            </div>
          </Slab>

          {/* Holdings List */}
          <Slab>
            <PanelHead title="Holdings" right={portfolio.length > 0 ? <Badge>{portfolio.length} POS</Badge> : undefined} />
            {portfolio.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted)" }}>
                <p style={{ fontSize: 13 }}>Belum ada holdings. Tap + Add Coin untuk mulai.</p>
              </div>
            ) : (
              <div>
                {portfolio.map((h, idx) => {
                  const cv = parseFloat(h.qty) * parseFloat(h.currentPrice) || 0;
                  const cost = parseFloat(h.qty) * parseFloat(h.avgBuy) || 0;
                  const pnl = cv - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                  const isEditing = editingId === h.id;
                  const cgId = SYMBOL_TO_ID[h.symbol.toUpperCase()];
                  const liveP = cgId ? topPrices[cgId] : undefined;

                  return (
                    <div key={h.id} style={{
                      padding: "12px 16px",
                      background: isEditing ? "var(--color-surface)" : "var(--glass-bg)",
                      borderTop: idx === 0 ? "none" : "1px solid var(--color-border)",
                      borderLeft: `2px solid ${isEditing ? h.color : "transparent"}`,
                      transition: "background 0.15s",
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
                              <label key={f.field} style={{ fontSize: 10, color: "var(--color-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
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
                            <button onClick={() => removeHolding(h.id)} style={{ ...btnStyle, background: "var(--loss-soft)", color: "var(--loss)" }}>Hapus</button>
                            <button onClick={() => setEditingId(null)} style={primaryBtnStyle}>Selesai</button>
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
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{h.name}</p>
                            <p className="num" style={{ fontSize: 11, color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-mono)" }}>
                              {h.qty} × ${parseFloat(h.currentPrice || "0").toLocaleString()}
                              {liveP && (
                                <span style={{ color: liveP.usd_24h_change >= 0 ? "var(--gain)" : "var(--loss)", marginLeft: 6 }}>
                                  Live: ${liveP.usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p className="num" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-mono)" }}>{fmtUSD(cv)}</p>
                            <p className="num" style={{ fontSize: 11, fontWeight: 600, color: pnl >= 0 ? "var(--gain)" : "var(--loss)", margin: 0, fontFamily: "var(--font-mono)" }}>
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
          </Slab>
        </>
      )}

      {/* ── COINGLASS TAB ── */}
      {activeTab === "coinglass" && (
        <>
          <Slab>
            <PanelHead title="Coinglass Guide — Key Metrics" />
            <div style={{ padding: "14px 16px" }}>
              <EditableText value={c.coinglassGuide} onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, coinglassGuide: val } }))} />
            </div>
          </Slab>
          <Slab>
            <PanelHead title="Reading Open Interest" />
            <div>
              {[
                { condition: "OI naik + Harga naik",  signal: "Trend konfirmasi BULLISH ✅", color: "var(--gain)" },
                { condition: "OI naik + Harga turun", signal: "Trend konfirmasi BEARISH ✅", color: "var(--loss)" },
                { condition: "OI turun + Harga naik", signal: "Short squeeze / tidak sustain ⚠️", color: "var(--warning)" },
                { condition: "OI turun + Harga turun",signal: "Long liquidation / deleveraging ⚠️", color: "var(--warning)" },
              ].map((r, i) => (
                <div key={r.condition} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 16px", background: "var(--glass-bg)", gap: 10,
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                }}>
                  <span style={{ fontSize: 12, color: "var(--color-text)" }}>{r.condition}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color, flexShrink: 0, textAlign: "right" }}>{r.signal}</span>
                </div>
              ))}
            </div>
          </Slab>
        </>
      )}

      {/* Notes */}
      <Slab>
        <PanelHead title="Notes" />
        <div style={{ padding: "14px 16px" }}>
          <NotesList notes={c.notes} onChange={(notes) => update((d) => ({ ...d, crypto: { ...d.crypto, notes } }))} />
        </div>
      </Slab>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", marginTop: 4, padding: "6px 10px",
  borderRadius: 6, border: "1px solid var(--color-border)",
  background: "var(--color-surface)", color: "var(--color-text)",
  fontSize: 13, fontFamily: "var(--font-mono)", outline: "none", boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 7, border: "1px solid transparent",
  cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)",
};
const primaryBtnStyle: React.CSSProperties = {
  ...btnStyle, background: "var(--rail-active-bg)", color: "var(--color-primary)",
  border: "1px solid var(--rail-active-border)",
};
const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle, background: "var(--color-surface)", color: "var(--color-text)",
  border: "1px solid var(--color-border)",
};
