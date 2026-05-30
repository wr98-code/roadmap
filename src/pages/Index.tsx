// ─── ZERØ COMMAND — Index.tsx v6.0 ────────────────────────────────────────────
// 3-Column Layout: Icon Rail (72px) | Main Content | Right Intel Panel (280px)
// Floating glass header, premium dark OS feel
import { useState, useEffect } from "react";
import { useAppData } from "@/lib/store";
import { useTheme, VIBES } from "@/lib/theme";
import {
  Home, Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  Menu, X, Plus, Newspaper, BarChart2, BookOpen, CheckSquare,
  GraduationCap, FolderGit2, Lightbulb, Cloud, Loader2,
  Settings, LayoutDashboard, Wallet, LineChart, History, Rss,
} from "lucide-react";
import { AffirmationToast } from "@/components/AffirmationToast";
import { PWAInstall } from "@/components/PWAInstall";
import { DashboardPage } from "./DashboardPage";
import { BuildLabPage } from "./BuildLabPage";
import { TradingPage } from "./TradingPage";
import { CryptoPage } from "./CryptoPage";
import { RoadmapPage } from "./RoadmapPage";
import { KeuanganPage } from "./KeuanganPage";
import { PersonalPage } from "./PersonalPage";
import { IntelPage } from "./IntelPage";
import { MarketsPage } from "./MarketsPage";
import { JournalPage } from "./JournalPage";
import { MyDayPage } from "./MyDayPage";
import { LearnPage } from "./LearnPage";
import { ProjectsPage } from "./ProjectsPage";
import { MasterBizPage } from "./MasterBizPage";

const RAIL_SECTIONS = [
  { key: "dashboard",  Icon: LayoutDashboard, title: "Home" },
  { key: "intel",      Icon: Newspaper,       title: "Intel Feed" },
  { key: "markets",    Icon: BarChart2,        title: "Markets" },
  { key: "my-day",     Icon: CheckSquare,      title: "My Day" },
  { key: "journal",    Icon: BookOpen,         title: "Journal" },
  { key: "learn",      Icon: GraduationCap,    title: "Learn Hub" },
  { key: "master-biz", Icon: Lightbulb,        title: "Master Biz" },
  { key: "build-lab",  Icon: Zap,              title: "Build Lab" },
  { key: "keuangan",   Icon: DollarSign,       title: "Keuangan" },
  { key: "roadmap",    Icon: Calendar,         title: "Roadmap" },
  { key: "trading",    Icon: TrendingUp,       title: "Trading" },
  { key: "crypto",     Icon: Globe,            title: "Crypto" },
  { key: "personal",   Icon: User,             title: "Personal" },
  { key: "projects",   Icon: FolderGit2,       title: "Projects" },
];

const TITLES: Record<string, string> = {
  dashboard: "Home", intel: "Intel Feed", markets: "Markets",
  "my-day": "My Day", journal: "Journal", learn: "Learn Hub",
  "master-biz": "Master Biz", "build-lab": "Build Lab",
  trading: "Trading", crypto: "Crypto", roadmap: "Roadmap",
  keuangan: "Keuangan", personal: "Personal", projects: "Projects",
};

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

// ── Right Intel Panel ───────────────────────────────────────────────────────
function LiveIntelPanel({ active, onNavigate }: { active: string; onNavigate: (k: string) => void }) {
  const [btc, setBtc] = useState<{ price: string; change: string; up: boolean } | null>(null);
  const [fg, setFg] = useState<{ value: number; label: string } | null>(null);
  const [brief, setBrief] = useState<string[]>([]);

  useEffect(() => {
    // BTC price
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
      .then(r => r.json())
      .then(d => {
        const p = d?.bitcoin?.usd;
        const c = d?.bitcoin?.usd_24h_change;
        if (p) setBtc({
          price: p.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          change: Math.abs(c).toFixed(2),
          up: c >= 0,
        });
      }).catch(() => {});

    // Fear & Greed
    fetch("https://api.alternative.me/fng/?limit=1")
      .then(r => r.json())
      .then(d => {
        const v = parseInt(d?.data?.[0]?.value || "50");
        const l = d?.data?.[0]?.value_classification || "Neutral";
        setFg({ value: v, label: l });
      }).catch(() => {});

    // Intel briefs — static for now, could hook into RSS
    setBrief([
      "BTC dominance holding above 58% — altseason not yet.",
      "DXY elevated; risk assets under pressure short-term.",
      "Focus: Build Lab sprint this week — execution window.",
    ]);
  }, []);

  const fgColor = fg
    ? fg.value <= 25 ? "#ef4444"
    : fg.value <= 45 ? "#f59e0b"
    : fg.value <= 55 ? "#94a3b8"
    : fg.value <= 75 ? "#10b981"
    : "#22d3ee"
    : "#94a3b8";

  return (
    <aside style={{
      width: 272, minWidth: 272, height: "100vh", position: "fixed", right: 0, top: 0,
      background: "rgba(7,7,20,0.92)", backdropFilter: "blur(28px)",
      borderLeft: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column",
      padding: "0 0 16px",
      zIndex: 40, overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", animation: "rPulse 2s infinite" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#10b981" }}>LIVE INTEL</span>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>Terminal Feed</p>
      </div>

      {/* Nav tabs */}
      <div style={{ padding: "10px 10px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {[
          { key: "markets", Icon: BarChart2, label: "Market BTC" },
          { key: "intel",   Icon: Newspaper, label: "News Intel" },
          { key: "my-day",  Icon: CheckSquare, label: "My Day" },
        ].map(({ key, Icon: Ic, label }) => (
          <button key={key} onClick={() => onNavigate(key)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
            background: active === key ? "rgba(59,130,246,0.12)" : "transparent",
            border: active === key ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            <Ic size={14} color={active === key ? "#3b82f6" : "rgba(255,255,255,0.35)"} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: active === key ? "#3b82f6" : "rgba(255,255,255,0.45)", fontWeight: active === key ? 500 : 400 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 18px" }} />

      {/* BTC live */}
      <div style={{ padding: "0 18px", marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 4 }}>BTC/USD LIVE</p>
        {btc ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>${btc.price}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: btc.up ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: 2 }}>
              {btc.up ? "↑" : "↓"} {btc.change}%
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Loader2 size={12} color="rgba(255,255,255,0.2)" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Loading…</span>
          </div>
        )}
      </div>

      {/* Fear & Greed */}
      <div style={{ padding: "0 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>MARKET SENTIMENT</p>
          {fg && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: fgColor, letterSpacing: "0.08em" }}>{fg.label.toUpperCase()}</span>}
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
          {fg && (
            <div style={{ height: "100%", width: `${fg.value}%`, background: `linear-gradient(90deg, #ef4444, #f59e0b, ${fgColor})`, borderRadius: 3, transition: "width 1s ease" }} />
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.18)" }}>Fear 0</span>
          {fg && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: fgColor }}>{fg.value}</span>}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.18)" }}>100 Greed</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 18px 12px" }} />

      {/* Intel Brief */}
      <div style={{ padding: "0 18px", flex: 1 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 10 }}>SECURE COMMS</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {brief.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                background: i === 0 ? "#ef4444" : i === 1 ? "#3b82f6" : "#10b981",
                boxShadow: `0 0 5px ${i === 0 ? "#ef4444" : i === 1 ? "#3b82f6" : "#10b981"}`,
              }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weather footer */}
      <div style={{ margin: "16px 18px 0", padding: "12px 0 0", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>LOCAL</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginTop: 1 }}>Surabaya</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>83°F</span>
          <span style={{ fontSize: 16 }}>⛅</span>
        </div>
      </div>

      <style>{`@keyframes rPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </aside>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
const Index = () => {
  const { data, update, saved, syncing } = useAppData();
  const { vibe, cycleVibe } = useTheme();
  const [active, setActive] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railTooltip, setRailTooltip] = useState<string | null>(null);
  const now = useClock();

  const navigate = (key: string) => { setActive(key); setMobileOpen(false); };

  const addNote = () => {
    const sk = active === "build-lab" ? "buildLab" : active;
    const sec = (data as any)[sk];
    if (sec && "notes" in sec) {
      const note = { id: Math.random().toString(36).slice(2, 9), title: "New Note", body: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      update((d: any) => ({ ...d, [sk]: { ...d[sk], notes: [note, ...d[sk].notes] } }));
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

  const hasNotes = ["build-lab", "trading", "crypto", "roadmap", "keuangan", "personal"].includes(active);
  const vibeInfo = VIBES[vibe];
  const clockStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", position: "relative" }}>
      <AffirmationToast />
      <PWAInstall />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── ICON RAIL (72px) ── */}
      <nav style={{
        width: 72, minWidth: 72, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50,
        background: "rgba(5,5,16,0.95)", backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "16px 0",
      }}>
        {/* Logo */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, marginBottom: 20,
          background: "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 100%)",
          border: "1px solid rgba(59,130,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px rgba(59,130,246,0.18)",
          cursor: "pointer",
        }} onClick={() => navigate("dashboard")}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "hsl(var(--primary))", letterSpacing: "-0.02em" }}>Z∅</span>
        </div>

        {/* Nav icons */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: "100%", padding: "0 8px", overflowY: "auto", scrollbarWidth: "none" }}>
          {RAIL_SECTIONS.map(({ key, Icon, title }) => {
            const isActive = active === key;
            return (
              <div key={key} style={{ position: "relative" }}
                onMouseEnter={() => setRailTooltip(key)}
                onMouseLeave={() => setRailTooltip(null)}>
                <button onClick={() => navigate(key)} style={{
                  width: "100%", height: 40, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? "rgba(59,130,246,0.16)" : "transparent",
                  border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: isActive ? "0 0 12px rgba(59,130,246,0.12)" : "none",
                }}>
                  <Icon size={15} color={isActive ? "#60a5fa" : "rgba(255,255,255,0.3)"} />
                </button>
                {/* Tooltip */}
                {railTooltip === key && (
                  <div style={{
                    position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
                    background: "rgba(10,10,24,0.96)", border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(16px)", borderRadius: 7, padding: "5px 10px",
                    whiteSpace: "nowrap", pointerEvents: "none", zIndex: 99,
                    fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500,
                  }}>
                    {title}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom: vibe + avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 8px", width: "100%" }}>
          <button onClick={cycleVibe} title={`Theme: ${vibeInfo.label}`} style={{
            width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          >{vibeInfo.emoji}</button>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#fff",
            border: "2px solid rgba(255,255,255,0.1)",
          }}>W</div>
        </div>
      </nav>

      {/* ── CENTER CONTENT ── */}
      <div style={{ marginLeft: 72, marginRight: 272, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Floating header */}
        <header style={{
          position: "sticky", top: 12, zIndex: 30,
          margin: "12px 16px 0",
          height: 56, borderRadius: 14,
          background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--card-shadow), var(--card-inset)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
        }}>
          {/* Left: breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setMobileOpen(true)} style={{ display: "none", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }} className="mobile-menu-btn">
              <Menu size={16} />
            </button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)", letterSpacing: "0.08em" }}>ZERØ</span>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>/</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em" }}>{TITLES[active]}</span>
          </div>

          {/* Center: live clock */}
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--color-muted)", letterSpacing: "0.05em" }}>
            {clockStr}
          </div>

          {/* Right: sync + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {syncing && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Syncing
              </span>
            )}
            {saved && !syncing && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981" }}>
                <Cloud size={11} /> Synced
              </span>
            )}
            {hasNotes && (
              <button onClick={addNote} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 14px",
                borderRadius: 8, background: "rgba(59,130,246,0.15)",
                border: "1px solid hsl(var(--primary) / 0.35)", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: "hsl(var(--primary))",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.15)"; }}
              >
                <Plus size={11} /> Note
              </button>
            )}
            {/* Windu avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)" }}>Windu</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>W</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 24px 48px", maxWidth: 960, width: "100%", margin: "0 auto" }}>
          {renderPage()}
        </main>
      </div>

      {/* ── RIGHT INTEL PANEL ── */}
      <LiveIntelPanel active={active} onNavigate={navigate} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Index;
