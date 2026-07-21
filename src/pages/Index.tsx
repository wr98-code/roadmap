// ─── ZERØ COMMAND — Index.tsx v10.0 ───────────────────────────────────────────
// 3-Column: Icon Rail (72px) | Center | Right Intel Panel (272px)
// v10.0: Bloomberg-grade Intel Panel
//   - Auto-refresh 5 menit + countdown ring
//   - Batch AI translate headlines → Bahasa Indonesia (Groq llama-3.1-8b-instant)
//   - Sentiment badge BULLISH/BEARISH/NEUTRAL per artikel
//   - BREAKING badge untuk artikel < 30 menit
//   - Translate toggle EN ↔ ID
//   - Graceful fallback kalau no API key

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppData } from "@/lib/store";
import { useTheme, VIBES } from "@/lib/theme";
import {
  Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  Plus, Newspaper, BarChart2, BookOpen, CheckSquare,
  GraduationCap, FolderGit2, Lightbulb, Cloud, Loader2,
  LayoutDashboard, Rss, Search, Languages,
  TrendingDown, Minus, Radio, RefreshCw,
} from "lucide-react";
import { AffirmationToast } from "@/components/AffirmationToast";
import { PWAInstall } from "@/components/PWAInstall";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { DashboardPage }  from "./DashboardPage";
import { BuildLabPage }   from "./BuildLabPage";
import { TradingPage }    from "./TradingPage";
import { CryptoPage }     from "./CryptoPage";
import { RoadmapPage }    from "./RoadmapPage";
import { KeuanganPage }   from "./KeuanganPage";
import { PersonalPage }   from "./PersonalPage";
import { IntelPage }      from "./IntelPage";
import { MarketsPage }    from "./MarketsPage";
import { JournalPage }    from "./JournalPage";
import { MyDayPage }      from "./MyDayPage";
import { LearnPage }      from "./LearnPage";
import { ProjectsPage }   from "./ProjectsPage";
import { MasterBizPage }  from "./MasterBizPage";

// ── Nav config ───────────────────────────────────────────────────────────────
const RAIL_SECTIONS = [
  { key: "dashboard",  Icon: LayoutDashboard, title: "Home",       group: "OVERVIEW" },
  { key: "intel",      Icon: Newspaper,       title: "Intel Feed", group: "OVERVIEW" },
  { key: "markets",    Icon: BarChart2,        title: "Markets",    group: "OVERVIEW" },
  { key: "my-day",     Icon: CheckSquare,      title: "My Day",     group: "OVERVIEW" },
  { key: "journal",    Icon: BookOpen,         title: "Journal",    group: "FOCUS"    },
  { key: "learn",      Icon: GraduationCap,    title: "Learn Hub",  group: "FOCUS"    },
  { key: "master-biz", Icon: Lightbulb,        title: "Master Biz", group: "FOCUS"    },
  { key: "build-lab",  Icon: Zap,              title: "Build Lab",  group: "BUILD"    },
  { key: "keuangan",   Icon: DollarSign,       title: "Keuangan",   group: "BUILD"    },
  { key: "roadmap",    Icon: Calendar,         title: "Roadmap",    group: "BUILD"    },
  { key: "trading",    Icon: TrendingUp,       title: "Trading",    group: "ASSETS"   },
  { key: "crypto",     Icon: Globe,            title: "Crypto",     group: "ASSETS"   },
  { key: "personal",   Icon: User,             title: "Personal",   group: "ASSETS"   },
  { key: "projects",   Icon: FolderGit2,       title: "Projects",   group: "ASSETS"   },
];
const TITLES: Record<string, string> = Object.fromEntries(RAIL_SECTIONS.map(s => [s.key, s.title]));

// ── Hooks ────────────────────────────────────────────────────────────────────
function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

interface WeatherData { temp: number; code: number; windspeed: number; humidity: number; }
function useWeather(): WeatherData | null {
  const [w, setW] = useState<WeatherData | null>(null);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-7.2575&longitude=112.7521&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph")
      .then(r => r.json()).then(d => {
        const c = d?.current;
        if (c) setW({ temp: Math.round(c.temperature_2m), code: c.weathercode, windspeed: Math.round(c.windspeed_10m), humidity: c.relativehumidity_2m });
      }).catch(() => {});
  }, []);
  return w;
}
function weatherEmoji(code: number): string {
  if (code === 0) return "☀️"; if (code <= 2) return "🌤"; if (code <= 3) return "☁️";
  if (code <= 48) return "🌫"; if (code <= 55) return "🌦"; if (code <= 67) return "🌧";
  if (code <= 77) return "❄️"; if (code <= 82) return "🌦"; return "⛈";
}

// BTC + F&G
interface BtcInfo { price: string; change: string; up: boolean }
interface FgInfo   { value: number; label: string }
function useLiveBtcFg() {
  const [btc, setBtc] = useState<BtcInfo | null>(null);
  const [fg,  setFg]  = useState<FgInfo  | null>(null);
  useEffect(() => {
    const load = () => {
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
        .then(r => r.json()).then(d => {
          const p = d?.bitcoin?.usd; const c = d?.bitcoin?.usd_24h_change;
          if (p) setBtc({ price: p.toLocaleString("en-US", { maximumFractionDigits: 0 }), change: Math.abs(c).toFixed(2), up: c >= 0 });
        }).catch(() => {});
      fetch("https://api.alternative.me/fng/?limit=1")
        .then(r => r.json()).then(d => {
          setFg({ value: parseInt(d?.data?.[0]?.value || "50"), label: d?.data?.[0]?.value_classification || "Neutral" });
        }).catch(() => {});
    };
    load();
    const id = setInterval(load, 90000);
    return () => clearInterval(id);
  }, []);
  return { btc, fg };
}

// ── v10 Intel Brief Hook — auto-refresh + translate + sentiment ───────────────
interface IntelItem {
  id: string;
  title: string;
  titleID?: string;
  color: string;
  pubDate?: string;
  isBreaking?: boolean;
  sentiment?: "BULLISH" | "BEARISH" | "NEUTRAL";
}

const PANEL_REFRESH_MS = 5 * 60 * 1000; // 5 menit
const PANEL_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

function getGroqKey(): string {
  // localStorage-only (lihat catatan keamanan di src/lib/api.ts) — jangan baca env.
  try { return localStorage.getItem("zero-gemini-key") || ""; } catch { return ""; }
}

function useIntelBrief() {
  const [items,       setItems]       = useState<IntelItem[]>([]);
  const [nextRefresh, setNextRefresh] = useState(Date.now() + PANEL_REFRESH_MS);
  const [translating, setTranslating] = useState(false);
  const [showID,      setShowID]      = useState(true);

  const load = useCallback(async () => {
    try {
      const RSS = "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcointelegraph.com%2Frss&count=5";
      const res = await fetch(RSS);
      const data = await res.json();
      if (data.status !== "ok") return;

      const raw: IntelItem[] = (data?.items ?? []).slice(0, 5).map((item: any, i: number) => ({
        id: String(i),
        title: item.title?.trim() || "",
        color: PANEL_COLORS[i],
        pubDate: item.pubDate || "",
        isBreaking: item.pubDate
          ? (Date.now() - new Date(item.pubDate).getTime()) < 30 * 60 * 1000
          : false,
      }));

      if (!raw.length) return;
      setItems(raw);
      setNextRefresh(Date.now() + PANEL_REFRESH_MS);

      // Batch translate + sentiment via Groq (model cepat, bukan 70B)
      const key = getGroqKey();
      if (key) {
        setTranslating(true);
        try {
          const titles = raw.map((a, i) => `${i}|${a.title}`).join("\n");
          const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              max_tokens: 500,
              temperature: 0.2,
              messages: [{ role: "user", content:
                `Terjemahkan headline crypto news ini ke Bahasa Indonesia singkat. Juga beri sentiment BULLISH/BEARISH/NEUTRAL.\nRespond ONLY valid JSON array, no markdown:\n[{"i":0,"t":"terjemahan","s":"BULLISH"},...]\n\n${titles}` }],
            }),
          });
          const jd    = await resp.json();
          const raw2  = jd?.choices?.[0]?.message?.content || "[]";
          const clean = raw2.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(clean) as Array<{ i: number; t: string; s: string }>;
          setItems(prev => prev.map((item, idx) => {
            const m = parsed.find(p => p.i === idx);
            return m ? { ...item, titleID: m.t, sentiment: m.s as IntelItem["sentiment"] } : item;
          }));
        } catch { /* translate fail gracefully */ }
        setTranslating(false);
      }
    } catch {
      setItems([
        { id:"0", title:"BTC dominance holding above 58%.", titleID:"Dominasi BTC bertahan di atas 58%.", color:"#ef4444", sentiment:"NEUTRAL" },
        { id:"1", title:"DXY elevated; risk assets under pressure.", titleID:"DXY tinggi; aset berisiko tertekan.", color:"#3b82f6", sentiment:"BEARISH" },
        { id:"2", title:"Build Lab sprint — stay in execution mode.", titleID:"Sprint Build Lab — tetap mode eksekusi.", color:"#10b981", sentiment:"BULLISH" },
      ]);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, PANEL_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { items, nextRefresh, translating, showID, setShowID };
}

// ── Command Palette ───────────────────────────────────────────────────────────
function CommandPalette({ onNavigate, onClose }: { onNavigate: (k: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = RAIL_SECTIONS.filter(s => s.title.toLowerCase().includes(q.toLowerCase()) || s.key.includes(q.toLowerCase()));
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:80, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div style={{ width:480, borderRadius:18, background:"rgba(10,10,24,0.97)", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.12)", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <Search size={16} color="rgba(255,255,255,0.35)" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Navigate to…" style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"var(--font-sans)", fontSize:14, color:"#f1f5f9", caretColor:"#3b82f6" }} />
          <kbd style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, padding:"2px 6px" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight:320, overflowY:"auto", padding:"6px 0" }}>
          {filtered.map(s => (
            <button key={s.key} onClick={() => { onNavigate(s.key); onClose(); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 18px", background:"transparent", border:"none", cursor:"pointer", transition:"background 0.1s", textAlign:"left" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <s.Icon size={15} color="rgba(255,255,255,0.45)" />
              <span style={{ fontFamily:"var(--font-sans)", fontSize:13, color:"rgba(255,255,255,0.8)", flex:1 }}>{s.title}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.08em" }}>{s.group}</span>
            </button>
          ))}
        </div>
        <div style={{ padding:"8px 18px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:16 }}>
          {[["↑↓","navigate"],["↵","open"],["ESC","close"]].map(([k,v]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <kbd style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:4, padding:"1px 5px" }}>{k}</kbd>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:10, color:"rgba(255,255,255,0.2)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Countdown Ring ────────────────────────────────────────────────────────────
function CountdownRing({ nextRefresh, onRefresh, translating }: { nextRefresh: number; onRefresh: () => void; translating: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const update = () => setSecs(Math.max(0, Math.round((nextRefresh - Date.now()) / 1000)));
    update(); const id = setInterval(update, 1000); return () => clearInterval(id);
  }, [nextRefresh]);
  const total = PANEL_REFRESH_MS / 1000;
  const pct   = Math.min(100, ((total - secs) / total) * 100);
  const r = 8, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <div style={{ position:"relative", width:22, height:22, cursor:"pointer" }} onClick={onRefresh} title="Refresh now">
        <svg width="22" height="22" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <circle cx="11" cy="11" r={r} fill="none" stroke="#10b981" strokeWidth="1.5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition:"stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <RefreshCw size={8} color={translating ? "#f59e0b" : "#10b981"} style={{ animation: translating ? "zspin 1s linear infinite" : "none" }} />
        </div>
      </div>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"rgba(255,255,255,0.25)" }}>
        {translating ? "ID…" : `${Math.floor(secs/60)}:${String(secs%60).padStart(2,"0")}`}
      </span>
    </div>
  );
}

// ── Sentiment Badge ────────────────────────────────────────────────────────────
function SentimentBadge({ s }: { s?: "BULLISH"|"BEARISH"|"NEUTRAL" }) {
  if (!s) return null;
  const cfg = {
    BULLISH: { color:"#10b981", Icon: TrendingUp   },
    BEARISH: { color:"#ef4444", Icon: TrendingDown  },
    NEUTRAL: { color:"#64748b", Icon: Minus         },
  }[s];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:2, fontSize:8, fontFamily:"var(--font-mono)", fontWeight:700, color:cfg.color, background:cfg.color+"15", padding:"1px 5px", borderRadius:3 }}>
      <cfg.Icon size={7} /> {s}
    </span>
  );
}

// ── Right Intel Panel v10 ──────────────────────────────────────────────────────
function LiveIntelPanel({ active, onNavigate }: { active: string; onNavigate: (k: string) => void }) {
  const { btc, fg }                                    = useLiveBtcFg();
  const { items, nextRefresh, translating, showID, setShowID } = useIntelBrief();
  const weather                                        = useWeather();
  const [, forceRefresh]                               = useState(0); // trigger manual refresh
  const reloadRef = useRef<(() => void) | null>(null);

  const fgColor = !fg ? "#94a3b8"
    : fg.value <= 25 ? "#ef4444" : fg.value <= 45 ? "#f59e0b"
    : fg.value <= 55 ? "#94a3b8" : fg.value <= 75 ? "#10b981" : "#22d3ee";

  const hasBreaking = items.some(a => a.isBreaking);
  const hasTranslation = items.some(a => a.titleID);

  return (
    <aside style={{
      width:272, minWidth:272, height:"100vh", position:"fixed", right:0, top:0,
      background:"var(--panel-bg)", backdropFilter:"blur(28px)",
      borderLeft:"1px solid var(--panel-border)",
      display:"flex", flexDirection:"column", padding:"0 0 16px", zIndex:40, overflowY:"auto",
    }}>

      {/* Header */}
      <div style={{ padding:"18px 18px 12px", borderBottom:"1px solid var(--panel-divider)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b981", animation:"rpulse 2s infinite" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, letterSpacing:"0.14em", color:"#10b981" }}>LIVE INTEL</span>
          {hasBreaking && (
            <span style={{ fontSize:8, fontWeight:800, color:"#ef4444", background:"#ef444415", padding:"1px 5px", borderRadius:3, fontFamily:"var(--font-mono)", letterSpacing:0.5, animation:"rpulse 1.5s infinite" }}>
              🔴 BREAKING
            </span>
          )}
        </div>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)", letterSpacing:"0.08em" }}>Terminal Feed · Auto-refresh 5m</p>
      </div>

      {/* Quick nav */}
      <div style={{ padding:"10px 10px 0", display:"flex", flexDirection:"column", gap:2 }}>
        {[{ key:"markets", Icon:BarChart2, label:"Markets" },{ key:"intel", Icon:Newspaper, label:"News Intel" },{ key:"my-day", Icon:CheckSquare, label:"My Day" }]
          .map(({ key, Icon: Ic, label }) => (
          <button key={key} onClick={() => onNavigate(key)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, background:active===key?"rgba(59,130,246,0.12)":"transparent", border:active===key?"1px solid rgba(59,130,246,0.25)":"1px solid transparent", cursor:"pointer", transition:"all 0.15s" }}>
            <Ic size={14} color={active===key?"var(--rail-icon-active)":"var(--panel-icon)"} />
            <span style={{ fontFamily:"var(--font-sans)", fontSize:12, color:active===key?"var(--rail-icon-active)":"var(--panel-muted)", fontWeight:active===key?500:400 }}>{label}</span>
          </button>
        ))}
      </div>

      <div style={{ height:1, background:"var(--panel-divider)", margin:"12px 18px" }} />

      {/* BTC */}
      <div style={{ padding:"0 18px", marginBottom:14 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)", letterSpacing:"0.12em", marginBottom:4 }}>BTC/USD LIVE</p>
        {btc ? (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:19, fontWeight:600, color:"var(--panel-text)" }}>${btc.price}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:btc.up?"#10b981":"#ef4444", display:"flex", alignItems:"center", gap:2 }}>
              {btc.up?"↑":"↓"} {btc.change}%
            </span>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Loader2 size={12} color="var(--panel-icon)" style={{ animation:"zspin 1s linear infinite" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--panel-dim)" }}>Loading…</span>
          </div>
        )}
      </div>

      {/* F&G */}
      <div style={{ padding:"0 18px", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)", letterSpacing:"0.12em" }}>SENTIMENT</p>
          {fg && <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:fgColor }}>{fg.label.toUpperCase()}</span>}
        </div>
        <div style={{ height:5, background:"var(--panel-track)", borderRadius:3, overflow:"hidden", marginBottom:4 }}>
          {fg && <div style={{ height:"100%", width:`${fg.value}%`, background:`linear-gradient(90deg, #ef4444, #f59e0b, ${fgColor})`, borderRadius:3, transition:"width 1.2s ease" }} />}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)" }}>Fear 0</span>
          {fg && <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:fgColor }}>{fg.value}</span>}
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)" }}>100 Greed</span>
        </div>
      </div>

      <div style={{ height:1, background:"var(--panel-divider)", margin:"0 18px 12px" }} />

      {/* Intel Brief — v10 with translate + sentiment + breaking */}
      <div style={{ padding:"0 18px", flex:1 }}>
        {/* Section header */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
          <Radio size={10} color="var(--panel-icon)" style={{ animation:"rpulse 2s infinite" }} />
          <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)", letterSpacing:"0.12em", flex:1 }}>LATEST INTEL</p>
          {/* Translate toggle */}
          {hasTranslation && (
            <button onClick={() => setShowID(!showID)} style={{
              display:"flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:4,
              background: showID ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              border: showID ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: showID ? "var(--rail-icon-active)" : "var(--panel-dim)",
              fontSize:9, fontWeight:700, fontFamily:"var(--font-mono)", cursor:"pointer",
            }}>
              <Languages size={8} /> {showID ? "ID" : "EN"}
            </button>
          )}
          <CountdownRing nextRefresh={nextRefresh} onRefresh={() => { /* load() via internal hook */ }} translating={translating} />
        </div>

        {/* Articles */}
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {items.length ? items.map((b) => (
            <div key={b.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              {/* Color dot */}
              <div style={{ position:"relative", flexShrink:0, marginTop:5 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:b.color, boxShadow:`0 0 5px ${b.color}` }} />
                {b.isBreaking && (
                  <div style={{ position:"absolute", inset:-2, borderRadius:"50%", border:`1px solid ${b.color}`, animation:"rpulse 1s infinite" }} />
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {b.isBreaking && (
                  <span style={{ fontSize:8, fontWeight:800, color:"#ef4444", background:"#ef444415", padding:"1px 4px", borderRadius:2, fontFamily:"var(--font-mono)", letterSpacing:0.5, marginRight:5, display:"inline" }}>BREAKING</span>
                )}
                <span style={{ fontFamily:"var(--font-sans)", fontSize:11.5, color:"var(--panel-muted)", lineHeight:1.5 }}>
                  {showID && b.titleID ? b.titleID : b.title}
                </span>
                {b.sentiment && (
                  <div style={{ marginTop:4 }}>
                    <SentimentBadge s={b.sentiment} />
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Loader2 size={11} color="var(--panel-icon)" style={{ animation:"zspin 1s linear infinite" }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--panel-dim)" }}>Fetching news…</span>
            </div>
          )}
        </div>
      </div>

      {/* Weather */}
      <div style={{ margin:"16px 18px 0", padding:"12px 0 0", borderTop:"1px solid var(--panel-divider)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)", letterSpacing:"0.1em" }}>LOCAL WEATHER</p>
            <p style={{ fontFamily:"var(--font-sans)", fontSize:11, color:"var(--panel-muted)", marginTop:1 }}>Surabaya, ID</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {weather ? (
              <>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:14, fontWeight:600, color:"var(--panel-text)" }}>{weather.temp}°F</span>
                <span style={{ fontSize:17 }}>{weatherEmoji(weather.code)}</span>
              </>
            ) : <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--panel-muted)" }}>—°F</span>}
          </div>
        </div>
        {weather && (
          <div style={{ display:"flex", gap:12, marginTop:6 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)" }}>💧 {weather.humidity}%</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--panel-dim)" }}>💨 {weather.windspeed}mph</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes zspin{to{transform:rotate(360deg)}}
      `}</style>
    </aside>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const Index = () => {
  const { data, update, saved, syncing } = useAppData();
  const { vibe, cycleVibe }              = useTheme();
  const [active,      setActive]         = useState("dashboard");
  const [mobileOpen,  setMobileOpen]     = useState(false);
  const [railTooltip, setRailTooltip]    = useState<string | null>(null);
  const [cmdOpen,     setCmdOpen]        = useState(false);
  const now = useClock();

  const navigate = useCallback((key: string) => { setActive(key); setMobileOpen(false); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addNote = () => {
    const sk = active === "build-lab" ? "buildLab" : active;
    const sec = (data as any)[sk];
    if (sec && "notes" in sec) {
      const note = { id: Math.random().toString(36).slice(2,9), title:"New Note", body:"", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      update((d: any) => ({ ...d, [sk]:{ ...d[sk], notes:[note, ...d[sk].notes] } }));
    }
  };

  const renderPage = () => {
    switch (active) {
      case "dashboard":  return <DashboardPage data={data} update={update} onNavigate={navigate} />;
      case "intel":      return <IntelPage />;
      case "markets":    return <MarketsPage />;
      case "my-day":     return <MyDayPage />;
      case "journal":    return <JournalPage />;
      case "learn":      return <LearnPage />;
      case "master-biz": return <MasterBizPage />;
      case "build-lab":  return <BuildLabPage data={data} update={update} />;
      case "trading":    return <TradingPage />;
      case "crypto":     return <CryptoPage data={data} update={update} />;
      case "roadmap":    return <RoadmapPage data={data} update={update} />;
      case "keuangan":   return <KeuanganPage data={data} update={update} />;
      case "personal":   return <PersonalPage data={data} update={update} />;
      case "projects":   return <ProjectsPage />;
      default: return null;
    }
  };

  const hasNotes = ["build-lab","trading","crypto","roadmap","keuangan","personal"].includes(active);
  const vibeInfo = VIBES[vibe];
  const clockStr = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-base)", position:"relative" }}>
      <AffirmationToast />
      <PWAInstall />
      {cmdOpen && <CommandPalette onNavigate={navigate} onClose={() => setCmdOpen(false)} />}
      {mobileOpen && <div style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={() => setMobileOpen(false)} />}

      {/* ── ICON RAIL ── */}
      <nav style={{
        width:72, minWidth:72, height:"100vh", position:"fixed", left:0, top:0, zIndex:50,
        background:"var(--rail-bg)", backdropFilter:"blur(24px)",
        borderRight:"1px solid var(--rail-border)",
        display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0",
      }}>
        <div style={{ width:38, height:38, borderRadius:10, marginBottom:20, background:"var(--logo-bg)", border:"1px solid var(--logo-border)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--logo-glow)", cursor:"pointer", transition:"all 0.2s" }}
          onClick={() => navigate("dashboard")}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--logo-glow-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--logo-glow)"; }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:700, color:"var(--logo-text)", letterSpacing:"-0.02em" }}>Z∅</span>
        </div>

        <button onClick={() => setCmdOpen(true)} title="Search (Ctrl+K)" style={{
          width:36, height:36, borderRadius:9, background:"var(--rail-btn-bg)", border:"1px solid var(--rail-btn-border)",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:8, transition:"all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-bg)"; }}>
          <Search size={13} color="var(--rail-icon)" />
        </button>

        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:2, width:"100%", padding:"0 8px", overflowY:"auto", scrollbarWidth:"none" }}>
          {RAIL_SECTIONS.map(({ key, Icon, title }) => {
            const isActive = active === key;
            return (
              <div key={key} style={{ position:"relative" }} onMouseEnter={() => setRailTooltip(key)} onMouseLeave={() => setRailTooltip(null)}>
                <button onClick={() => navigate(key)} style={{
                  width:"100%", height:38, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                  background: isActive ? "var(--rail-active-bg)" : "transparent",
                  border: isActive ? "1px solid var(--rail-active-border)" : "1px solid transparent",
                  cursor:"pointer", transition:"all 0.15s",
                  boxShadow: isActive ? "0 0 10px var(--rail-active-bg)" : "none",
                }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-hover)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <Icon size={15} color={isActive ? "var(--rail-icon-active)" : "var(--rail-icon)"} />
                </button>
                {isActive && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2, height:18, background:"var(--rail-icon-active)", borderRadius:"0 2px 2px 0", boxShadow:"0 0 8px var(--rail-icon-active)" }} />}
                {railTooltip === key && (
                  <div style={{ position:"absolute", left:"calc(100% + 10px)", top:"50%", transform:"translateY(-50%)", background:"var(--tooltip-bg)", border:"1px solid var(--tooltip-border)", backdropFilter:"blur(16px)", borderRadius:7, padding:"5px 10px", whiteSpace:"nowrap", pointerEvents:"none", zIndex:99 }}>
                    <span style={{ fontFamily:"var(--font-sans)", fontSize:12, color:"var(--tooltip-text)", fontWeight:500 }}>{title}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"0 8px", width:"100%" }}>
          <ApiKeySettings />
          <button onClick={cycleVibe} title={`Theme: ${vibeInfo.label}`} style={{ width:36, height:36, borderRadius:9, background:"var(--rail-btn-bg)", border:"1px solid var(--rail-btn-border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, transition:"all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-hover)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-bg)"; }}>
            {vibeInfo.emoji}
          </button>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg, #3b82f6, #6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-mono)", fontSize:12, fontWeight:700, color:"#fff", border:"2px solid var(--rail-btn-border)", boxShadow:"0 0 10px rgba(59,130,246,0.28)" }}>W</div>
        </div>
      </nav>

      {/* ── CENTER ── */}
      <div style={{ marginLeft:72, marginRight:272, flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <header style={{
          position:"sticky", top:12, zIndex:30, margin:"12px 16px 0", height:52, borderRadius:13,
          background:"var(--glass-bg)", backdropFilter:"var(--glass-blur)",
          border:"1px solid var(--glass-border)", boxShadow:"var(--card-shadow), var(--card-inset)",
          display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-muted)", letterSpacing:"0.08em" }}>ZERØ</span>
            <span style={{ color:"var(--header-separator)", fontSize:12 }}>/</span>
            <span style={{ fontFamily:"var(--font-sans)", fontSize:13, fontWeight:600, color:"var(--color-text)", letterSpacing:"-0.01em" }}>{TITLES[active]}</span>
            <button onClick={() => setCmdOpen(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:6, background:"var(--header-btn-bg)", border:"1px solid var(--header-btn-border)", cursor:"pointer", marginLeft:6 }}>
              <Search size={11} color="var(--header-icon)" />
              <kbd style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--header-icon)" }}>⌘K</kbd>
            </button>
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:600, color:"var(--color-muted)", letterSpacing:"0.05em" }}>{clockStr}</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {syncing && <span style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-muted)" }}><Loader2 size={11} style={{ animation:"zspin 1s linear infinite" }} /> Syncing</span>}
            {saved && !syncing && <span style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--font-mono)", fontSize:10, color:"#10b981" }}><Cloud size={11} /> Synced</span>}
            {hasNotes && (
              <button onClick={addNote} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, background:"rgba(59,130,246,0.14)", border:"1px solid rgba(59,130,246,0.32)", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:12, fontWeight:500, color:"var(--rail-icon-active)", transition:"all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.24)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.14)"; }}>
                <Plus size={11} /> Note
              </button>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:12, color:"var(--color-muted)" }}>Windu</span>
              <div style={{ width:27, height:27, borderRadius:"50%", background:"linear-gradient(135deg, #3b82f6, #6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:"#fff", border:"1px solid var(--rail-btn-border)" }}>W</div>
            </div>
          </div>
        </header>
        <main style={{ flex:1, padding:"28px 24px 48px", maxWidth:960, width:"100%", margin:"0 auto" }}>
          {renderPage()}
        </main>
      </div>

      {/* ── RIGHT INTEL PANEL ── */}
      <LiveIntelPanel active={active} onNavigate={navigate} />

      <style>{`
        @keyframes zspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Index;
