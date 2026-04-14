// ─── ZERØ COMMAND — Index.tsx ─────────────────────────────────────────────────
import { useState } from "react";
import { useAppData } from "@/lib/store";
import { useTheme, VIBES } from "@/lib/theme";
import { Home, Zap, TrendingUp, Globe, Calendar, DollarSign, User, Menu, X, Plus, Check, Newspaper, BarChart2, BookOpen, CheckSquare, GraduationCap, FolderGit2, Lightbulb } from "lucide-react";
import { ThemePicker } from "@/components/ThemePicker";
import { AffirmationToast } from "@/components/AffirmationToast";
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

const sections = [
  { key: "dashboard",   label: "Home",         icon: Home,          emoji: "🏠", group: "main" },
  { key: "intel",       label: "Intel Feed",   icon: Newspaper,     emoji: "📡", group: "intel" },
  { key: "markets",     label: "Markets",      icon: BarChart2,     emoji: "💹", group: "intel" },
  { key: "my-day",      label: "My Day",       icon: CheckSquare,   emoji: "✅", group: "intel" },
  { key: "journal",     label: "Journal",      icon: BookOpen,      emoji: "📝", group: "intel" },
  { key: "learn",       label: "Learn Hub",    icon: GraduationCap, emoji: "🧠", group: "intel" },
  { key: "master-biz",  label: "Master Biz",   icon: Lightbulb,     emoji: "🌐", group: "zero" },
  { key: "build-lab",   label: "Build Lab",    icon: Zap,           emoji: "⚡", group: "zero" },
  { key: "keuangan",    label: "Keuangan",     icon: DollarSign,    emoji: "💰", group: "zero" },
  { key: "roadmap",     label: "Roadmap",      icon: Calendar,      emoji: "📅", group: "zero" },
  { key: "trading",     label: "Trading",      icon: TrendingUp,    emoji: "📈", group: "zero" },
  { key: "crypto",      label: "Crypto",       icon: Globe,         emoji: "🌐", group: "zero" },
  { key: "personal",    label: "Personal",     icon: User,          emoji: "🧘", group: "zero" },
  { key: "projects",    label: "Projects",     icon: FolderGit2,    emoji: "🗂️", group: "zero" },
];

const titles: Record<string, string> = {
  dashboard: "Home", intel: "Intel Feed", markets: "Markets",
  "my-day": "My Day", journal: "Journal", learn: "Learn Hub",
  "master-biz": "Master Biz Intel",
  "build-lab": "Build Lab", trading: "Trading", crypto: "Crypto",
  roadmap: "Roadmap", keuangan: "Keuangan", personal: "Personal",
  projects: "Projects",
};

const groups: Record<string, string> = {
  main: "", intel: "Intelligence", zero: "Zerø Build",
};

function greeting(vibe: string) {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const Index = () => {
  const { data, update, saved } = useAppData();
  const { vibe } = useTheme();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (key: string) => { setActive(key); setSidebarOpen(false); };

  const addNote = () => {
    const sk = active === "build-lab" ? "buildLab" : active;
    const sec = (data as any)[sk];
    if (sec && "notes" in sec) {
      const note = { id: Math.random().toString(36).slice(2,9), title: "New Note", body: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      update((d: any) => ({ ...d, [sk]: { ...d[sk], notes: [note, ...d[sk].notes] } }));
    }
  };

  const renderPage = () => {
    switch (active) {
      case "dashboard":   return <DashboardPage data={data} update={update} onNavigate={navigate} />;
      case "intel":       return <IntelPage />;
      case "markets":     return <MarketsPage />;
      case "my-day":      return <MyDayPage />;
      case "journal":     return <JournalPage />;
      case "learn":       return <LearnPage />;
      case "master-biz":  return <MasterBizPage />;
      case "build-lab":   return <BuildLabPage data={data} update={update} />;
      case "trading":     return <TradingPage />;
      case "crypto":      return <CryptoPage data={data} update={update} />;
      case "roadmap":     return <RoadmapPage data={data} update={update} />;
      case "keuangan":    return <KeuanganPage data={data} update={update} />;
      case "personal":    return <PersonalPage data={data} update={update} />;
      case "projects":    return <ProjectsPage />;
      default: return null;
    }
  };

  const grouped = sections.reduce<Record<string, typeof sections>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const hasNotes = ["build-lab","trading","crypto","roadmap","keuangan","personal"].includes(active);
  const vibeInfo = VIBES[vibe];

  return (
    <div className="flex min-h-screen bg-background">
      <AffirmationToast />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`zero-sidebar fixed lg:sticky top-0 left-0 z-50 h-screen w-56 flex flex-col transition-transform duration-250 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Logo */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid hsl(var(--sidebar-border))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div className="zero-logo-mark">Z∅</div>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "hsl(var(--sidebar-primary))", lineHeight: 1 }}>ZERØ</p>
              <p style={{ fontSize: 9, color: "hsl(var(--sidebar-foreground) / 0.38)", marginTop: 2, lineHeight: 1, letterSpacing: "0.05em" }}>COMMAND v3.0</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ background: "transparent", border: "none", color: "hsl(var(--sidebar-foreground) / 0.4)", cursor: "pointer", padding: 4 }}>
            <X size={15} />
          </button>
        </div>

        {/* Greeting */}
        <div style={{ padding: "11px 14px 9px", borderBottom: "1px solid hsl(var(--sidebar-border) / 0.5)" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 400, color: "hsl(var(--sidebar-foreground) / 0.5)", lineHeight: 1.3 }}>
            {vibeInfo.emoji} {greeting(vibe)}, Windu
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "hsl(var(--sidebar-foreground) / 0.25)", marginTop: 3, letterSpacing: "0.04em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "6px 6px", overflowY: "auto" }}>
          {Object.entries(grouped).map(([gk, items]) => (
            <div key={gk}>
              {groups[gk] && <p className="zero-group-label">{groups[gk]}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map(s => (
                  <button key={s.key} onClick={() => navigate(s.key)} className={`zero-nav-item ${active === s.key ? "active" : ""}`}>
                    <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid hsl(var(--sidebar-border))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ThemePicker />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="zero-header sticky top-0 z-30" style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 4, borderRadius: 6 }}>
              <Menu size={17} />
            </button>
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
              {titles[active]}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saved && (
              <span className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "hsl(var(--primary))", fontWeight: 500 }}>
                <Check size={11} /> Saved
              </span>
            )}
            {hasNotes && (
              <button onClick={addNote} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={12} /> New Note
              </button>
            )}
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, padding: "28px 24px", maxWidth: 860, width: "100%", margin: "0 auto" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Index;
