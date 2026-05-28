// ─── ZERØ COMMAND — CryptoPage.tsx ───────────────────────────────────────────
// On-chain metrics, portfolio tracker, Coinglass guide, NUPL reference
import { useState, useEffect, useCallback } from "react";
import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { EditableText } from "@/components/EditableText";
import { NotesList } from "@/components/NotesList";
import {
  TrendingUp, TrendingDown, RefreshCw, AlertCircle, Activity,
  Target, Shield, Zap, ExternalLink, BookOpen,
} from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
}

// ─── NUPL ZONES ───────────────────────────────────────────────────────────────
const NUPL_ZONES = [
  { range: "> 0.75",     label: "Euphoria",        signal: "🔴 JUAL",   color: "#ef4444", bg: "#ef444418", desc: "Market overheated. Take profit agresif." },
  { range: "0.50–0.75",  label: "Belief / Denial", signal: "🟡 HATI-HATI", color: "#f59e0b", bg: "#f59e0b15", desc: "Masih bullish tapi mulai reduce position." },
  { range: "0.25–0.50",  label: "Optimism",        signal: "🟢 HOLD",   color: "#22c55e", bg: "#22c55e15", desc: "Sweet spot akumulasi selama uptrend." },
  { range: "0.00–0.25",  label: "Hope / Fear",     signal: "🟢 BELI",   color: "#3b82f6", bg: "#3b82f615", desc: "Early accumulation zone. DCA masuk." },
  { range: "< 0.00",     label: "Capitulation",    signal: "🟢 BELI AGRESIF", color: "#8b5cf6", bg: "#8b5cf615", desc: "Extreme fear = maximum opportunity." },
];

// ─── FUNDING RATE TABLE ───────────────────────────────────────────────────────
const FUNDING_SIGNALS = [
  { rate: "> +0.10%",      bias: "Overheated LONG",  action: "Short bias / reduce long",  color: "#ef4444" },
  { rate: "+0.01 – +0.10%", bias: "Bullish normal",  action: "Hold long, trail SL",       color: "#22c55e" },
  { rate: "-0.01 – +0.01%", bias: "Neutral",         action: "Wait for direction",        color: "#94a3b8" },
  { rate: "-0.10 – -0.01%", bias: "Bearish normal",  action: "Hold short, trail SL",      color: "#f59e0b" },
  { rate: "< -0.10%",      bias: "Overheated SHORT", action: "Long bias / reduce short",  color: "#8b5cf6" },
];

// ─── PORTFOLIO TRACKER ────────────────────────────────────────────────────────
interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  qty: string;
  avgBuy: string;
  currentPrice: string;
  color: string;
}

const CRYPTO_COLORS = ["#f7931a", "#627eea", "#26a17b", "#e84142", "#0033ad", "#2775ca", "#16213e"];
const STORAGE_KEY = "zero-crypto-portfolio-v2";

function loadPortfolio(): CryptoHolding[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function savePortfolio(p: CryptoHolding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function CryptoPage({ data, update }: Props) {
  const c = data.crypto;
  const [portfolio, setPortfolio] = useState<CryptoHolding[]>(loadPortfolio);
  const [activeTab, setActiveTab] = useState<"onchain" | "portfolio" | "coinglass">("onchain");
  const [editingId, setEditingId] = useState<string | null>(null);

  const updatePortfolio = (p: CryptoHolding[]) => {
    setPortfolio(p);
    savePortfolio(p);
  };

  const addHolding = () => {
    const colorIdx = portfolio.length % CRYPTO_COLORS.length;
    const newHolding: CryptoHolding = {
      id: uid(),
      symbol: "BTC",
      name: "Bitcoin",
      qty: "0",
      avgBuy: "0",
      currentPrice: "0",
      color: CRYPTO_COLORS[colorIdx],
    };
    const next = [newHolding, ...portfolio];
    updatePortfolio(next);
    setEditingId(newHolding.id);
  };

  const updateHolding = (id: string, field: keyof CryptoHolding, value: string) => {
    updatePortfolio(portfolio.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const removeHolding = (id: string) => {
    updatePortfolio(portfolio.filter((h) => h.id !== id));
  };

  // Compute totals
  const totalValue = portfolio.reduce((sum, h) => {
    const val = parseFloat(h.qty || "0") * parseFloat(h.currentPrice || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalCost = portfolio.reduce((sum, h) => {
    const val = parseFloat(h.qty || "0") * parseFloat(h.avgBuy || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const formatUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  const tabStyle = (t: string) => ({
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    border: "none",
    cursor: "pointer",
    background: activeTab === t ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)",
    color: activeTab === t ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
    transition: "all 0.15s",
  } as React.CSSProperties);

  return (
    <div className="space-y-5">

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={tabStyle("onchain")} onClick={() => setActiveTab("onchain")}>
          📊 On-Chain Signals
        </button>
        <button style={tabStyle("portfolio")} onClick={() => setActiveTab("portfolio")}>
          💼 Portfolio
        </button>
        <button style={tabStyle("coinglass")} onClick={() => setActiveTab("coinglass")}>
          🔭 Coinglass Guide
        </button>
      </div>

      {/* ── ON-CHAIN SIGNALS TAB ── */}
      {activeTab === "onchain" && (
        <>
          {/* NUPL Reference */}
          <SectionCard title="NUPL — Net Unrealized Profit/Loss">
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 12, lineHeight: 1.4 }}>
              NUPL mengukur posisi unrealized profit/loss seluruh market. Leading indicator jangka panjang untuk Bitcoin.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {NUPL_ZONES.map((z) => (
                <div
                  key={z.range}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: z.bg,
                    border: `1px solid ${z.color}30`,
                  }}
                >
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
              <EditableText
                value={c.nuplOnChain}
                onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, nuplOnChain: val } }))}
              />
            </div>
          </SectionCard>

          {/* Funding Rate Guide */}
          <SectionCard title="Funding Rate — Coinglass Signal">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>FUNDING RATE</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>MARKET BIAS</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>ACTION</th>
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

          {/* One Step Framework */}
          <SectionCard title="One Step Framework — Leading Indicators">
            <EditableText
              value={c.oneStep}
              onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, oneStep: val } }))}
            />
          </SectionCard>

          {/* Quick Links */}
          <SectionCard title="Tools & Resources">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {[
                { name: "Coinglass", url: "https://www.coinglass.com", icon: "📊", desc: "Funding rate, OI, liquidations" },
                { name: "CryptoQuant", url: "https://cryptoquant.com", icon: "⛓️", desc: "On-chain flows, NUPL" },
                { name: "TradingView", url: "https://www.tradingview.com", icon: "📈", desc: "Charting & technicals" },
                { name: "CoinGecko", url: "https://www.coingecko.com", icon: "🦎", desc: "Prices & market data" },
                { name: "Glassnode", url: "https://studio.glassnode.com", icon: "🔮", desc: "Advanced on-chain" },
                { name: "Fear & Greed", url: "https://alternative.me/crypto/fear-and-greed-index/", icon: "😱", desc: "Sentiment index" },
              ].map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "hsl(var(--muted) / 0.4)",
                    border: "1px solid hsl(var(--border) / 0.5)",
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border) / 0.5)")}
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
                { label: "Total Value", value: formatUSD(totalValue), color: "hsl(var(--foreground))" },
                { label: "Total Cost", value: formatUSD(totalCost), color: "hsl(var(--muted-foreground))" },
                {
                  label: "Total P&L",
                  value: `${totalPnl >= 0 ? "+" : ""}${formatUSD(totalPnl)} (${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%)`,
                  color: totalPnl >= 0 ? "#22c55e" : "#ef4444",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", margin: 0, marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0, fontFamily: "var(--font-mono)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <SectionCard
            title="Portfolio Holdings"
            actions={
              <button
                onClick={addHolding}
                style={{
                  padding: "5px 10px",
                  borderRadius: 7,
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                }}
              >
                + Add
              </button>
            }
          >
            {portfolio.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "hsl(var(--muted-foreground))" }}>
                <p style={{ fontSize: 13 }}>Belum ada holdings. Tap + Add untuk mulai tracking.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {portfolio.map((h) => {
                  const currentVal = parseFloat(h.qty || "0") * parseFloat(h.currentPrice || "0");
                  const cost = parseFloat(h.qty || "0") * parseFloat(h.avgBuy || "0");
                  const pnl = currentVal - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                  const isEditing = editingId === h.id;

                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "hsl(var(--muted) / 0.3)",
                        border: `1px solid ${isEditing ? h.color + "60" : "hsl(var(--border) / 0.5)"}`,
                        transition: "border-color 0.15s",
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                              Symbol
                              <input
                                value={h.symbol}
                                onChange={(e) => updateHolding(h.id, "symbol", e.target.value.toUpperCase())}
                                style={inputStyle}
                                placeholder="BTC"
                              />
                            </label>
                            <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                              Name
                              <input
                                value={h.name}
                                onChange={(e) => updateHolding(h.id, "name", e.target.value)}
                                style={inputStyle}
                                placeholder="Bitcoin"
                              />
                            </label>
                            <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                              Qty
                              <input
                                value={h.qty}
                                onChange={(e) => updateHolding(h.id, "qty", e.target.value)}
                                style={inputStyle}
                                type="number"
                                placeholder="0.05"
                              />
                            </label>
                            <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                              Avg Buy ($)
                              <input
                                value={h.avgBuy}
                                onChange={(e) => updateHolding(h.id, "avgBuy", e.target.value)}
                                style={inputStyle}
                                type="number"
                                placeholder="60000"
                              />
                            </label>
                            <label style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                              Current Price ($)
                              <input
                                value={h.currentPrice}
                                onChange={(e) => updateHolding(h.id, "currentPrice", e.target.value)}
                                style={inputStyle}
                                type="number"
                                placeholder="65000"
                              />
                            </label>
                          </div>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => removeHolding(h.id)}
                              style={{ ...btnStyle, background: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))" }}
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ ...btnStyle, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                            >
                              Selesai
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                          onClick={() => setEditingId(h.id)}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: h.color + "25",
                              border: `1px solid ${h.color}40`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: h.color,
                              flexShrink: 0,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {h.symbol.slice(0, 3)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>{h.name}</p>
                            <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0 }}>
                              {h.qty} × ${parseFloat(h.currentPrice || "0").toLocaleString()}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", margin: 0 }}>
                              {isNaN(currentVal) ? "$0" : formatUSD(currentVal)}
                            </p>
                            <p style={{ fontSize: 11, fontWeight: 600, color: pnl >= 0 ? "#22c55e" : "#ef4444", margin: 0 }}>
                              {pnl >= 0 ? "+" : ""}{isNaN(pnl) ? "0.00" : pnlPct.toFixed(2)}%
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

      {/* ── COINGLASS GUIDE TAB ── */}
      {activeTab === "coinglass" && (
        <>
          <SectionCard title="Coinglass Guide — Key Metrics">
            <EditableText
              value={c.coinglassGuide}
              onChange={(val) => update((d) => ({ ...d, crypto: { ...d.crypto, coinglassGuide: val } }))}
            />
          </SectionCard>

          {/* Quick Reference */}
          <SectionCard title="Reading Open Interest">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { condition: "OI naik + Harga naik", signal: "Trend konfirmasi BULLISH ✅", color: "#22c55e" },
                { condition: "OI naik + Harga turun", signal: "Trend konfirmasi BEARISH ✅", color: "#ef4444" },
                { condition: "OI turun + Harga naik", signal: "Short squeeze / tidak sustain ⚠️", color: "#f59e0b" },
                { condition: "OI turun + Harga turun", signal: "Long liquidation / deleveraging ⚠️", color: "#f59e0b" },
              ].map((r) => (
                <div
                  key={r.condition}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "hsl(var(--muted) / 0.3)",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{r.condition}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color, flexShrink: 0 }}>{r.signal}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* Notes — always visible */}
      <SectionCard title="Notes">
        <NotesList
          notes={c.notes}
          onChange={(notes) => update((d) => ({ ...d, crypto: { ...d.crypto, notes } }))}
        />
      </SectionCard>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--font-sans)",
};
 
 
