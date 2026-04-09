// ─── ZERO COMMAND — Index.tsx ─────────────────────────────────────────────────
// Luxury sidebar redesign | Clay × Luxury Lloyd aesthetic | ZERØ AURA toasts
import { useState } from "react";
import { AffirmationToast } from "@/components/AffirmationToast";
import { useAppData } from "@/lib/store";
import { useTheme, VIBES } from "@/lib/theme";
import {
  Home, Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  Menu, X, Plus, Check, Newspaper, BarChart2, BookOpen,
  CheckSquare, GraduationCap,
} from "lucide-react";
import { ThemePicker } from "@/components/ThemePicker";
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

const sections = [
  { key: "dashboard",  label: "Home",          icon: Home,         emoji: "🏠", group: "main" },
  { key: "intel",      label: "Intel Feed",    icon: Newspaper,    emoji: "📡", group: "intel" },
  { key: "markets",    label: "Markets",       icon: BarChart2,    emoji: "💹", group: "intel" },
  { key: "my-day",     label: "My Day",        icon: CheckSquare,  emoji: "✅", group: "intel" },
  { key: "journal",    label: "Journal",       icon: BookOpen,     emoji: "📝", group: "intel" },
  { key: "learn",      label: "Learn Hub",     icon: GraduationCap,emoji: "🧠", group: "intel" },
  { key: "build-lab",  label: "BUILD LAB",     icon: Zap,          emoji: "⚡", group: "zero" },
  { key: "keuangan",   label: "Keuangan",      icon: DollarSign,   emoji: "💰", group: "zero" },
  { key: "roadmap",    label: "Roadmap",       icon: Calendar,     emoji: "📅", group: "zero" },
  { key: "trading",    label: "Trading",       icon: TrendingUp,   emoji: "📈", group: "zero" },
  { key: "crypto",     label: "Crypto",        icon: Globe,        emoji: "🌐", group: "zero" },
  { key: "personal",   label: "Personal",      icon: User,         emoji: "🧘", group: "zero" },
];

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard", intel: "Intel Feed", markets: "Markets",
  "my-day": "My Day", journal: "Journal", learn: "Learn Hub",
  "build-lab": "ZERØ BUILD LAB", trading: "Trading", crypto: "Crypto",
  roadmap: "Roadmap", keuangan: "Keuangan", personal: "Personal",
};

const groups: Record<string, { label: string }> = {
  main:  { label: "" },
  intel: { label: "INTELLIGENCE" },
  zero:  { label: "ZERØ BUILD" },
};

// Greeting based on vibe
function getGreeting(vibe: string, name = "Windu") {
  if (vibe === "morning")   return `Good morning, ${name}`;
  if (vibe === "afternoon") return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

const Index = () => {
  const { data, update, saved } = useAppData();
  const { vibe } = useTheme();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (key: string) => {
    setActiveSection(key);
    setSidebarOpen(false);
  };

  const addNote = () => {
    const sectionKey = activeSection === "build-lab" ? "buildLab" : activeSection;
    const dataSection = (data as any)[sectionKey];
    if (dataSection && "notes" in dataSection) {
      const note = {
        id: Math.random().toString(36).slice(2, 9),
        title: "New Note", body: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      update((d: any) => ({
        ...d,
        [sectionKey]: { ...d[sectionKey], notes: [note, ...d[sectionKey].notes] },
      }));
    }
  };

  const renderPage = () => {
    switch (activeSection) {
      case "dashboard":  return <DashboardPage data={data} update={update} onNavigate={navigate} />;
      case "intel":      return <IntelPage />;
      case "markets":    return <MarketsPage />;
      case "my-day":     return <MyDayPage />;
      case "journal":    return <JournalPage />;
      case "learn":      return <LearnPage />;
      case "build-lab":  return <BuildLabPage data={data} update={update} />;
      case "trading":    return <TradingPage />;
      case "crypto":     return <CryptoPage data={data} update={update} />;
      case "roadmap":    return <RoadmapPage data={data} update={update} />;
      case "keuangan":   return <KeuanganPage data={data} update={update} />;
      case "personal":   return <PersonalPage data={data} update={update} />;
      default: return null;
    }
  };

  const groupedSections = sections.reduce<Record<string, typeof sections>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const hasNoteSupport = [
    "build-lab", "trading", "crypto", "roadmap", "keuangan", "personal",
  ].includes(activeSection);

  const vibeInfo = VIBES[vibe];

  return (
    <div className="flex min-h-screen bg-background">

      {/* ZERØ AURA — Global floating affirmation toasts */}
      <AffirmationToast />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside
        className={`zero-sidebar fixed lg:sticky top-0 left-0 z-50 h-screen w-60 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Ghost photo background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=60)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.07,
          pointerEvents: "none",
        }} />
        {/* Everything else sits above ghost */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Logo Block */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: "1px solid hsl(var(--sidebar-border))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="zero-logo-mark">Z∅</div>
            <div>
              <p style={{
                fontFamily: "Space Mono, monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "hsl(var(--sidebar-primary))",
                lineHeight: 1,
              }}>
                ZERØ
              </p>
              <p style={{
                fontSize: 9,
                fontFamily: "Space Grotesk, sans-serif",
                letterSpacing: "0.08em",
                color: "hsl(var(--sidebar-foreground) / 0.45)",
                marginTop: 2,
                lineHeight: 1,
              }}>
                COMMAND v3.0
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{
              background: "transparent", border: "none",
              color: "hsl(var(--sidebar-foreground) / 0.5)",
              cursor: "pointer", padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Greeting */}
        <div style={{
          padding: "12px 16px 8px",
          borderBottom: "1px solid hsl(var(--sidebar-border) / 0.5)",
        }}>
          <p style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            color: "hsl(var(--sidebar-foreground) / 0.55)",
            letterSpacing: "0.01em",
          }}>
            {vibeInfo.emoji} {getGreeting(vibe)}
          </p>
          <p style={{
            fontFamily: "Space Mono, monospace",
            fontSize: 9,
            color: "hsl(var(--sidebar-foreground) / 0.3)",
            marginTop: 2,
            letterSpacing: "0.05em",
          }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
          {Object.entries(groupedSections).map(([groupKey, items]) => (
            <div key={groupKey}>
              {groups[groupKey]?.label && (
                <p className="zero-group-label">{groups[groupKey].label}</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => navigate(s.key)}
                    className={`zero-nav-item ${activeSection === s.key ? "active" : ""}`}
                  >
                    <span style={{ fontSize: 15, lineHeight: 1 }}>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid hsl(var(--sidebar-border))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <ThemePicker />
        </div>
        </div>{/* end inner z-index wrapper */}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header
          className="zero-header sticky top-0 z-30"
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px 0 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-muted)",
                padding: 4,
                borderRadius: 6,
              }}
            >
              <Menu size={18} />
            </button>
            <h2 style={{
              fontFamily: "Space Mono, monospace",
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "0.1em",
              color: "var(--color-text)",
              opacity: 0.8,
            }}>
              {sectionTitles[activeSection]}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saved && (
              <span
                className="animate-fade-in"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "hsl(var(--primary))",
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              >
                <Check size={11} /> Saved
              </span>
            )}
            {hasNoteSupport && (
              <button
                onClick={addNote}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 7,
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 500,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={13} /> New Note
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: "24px 20px",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
        }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Index;
