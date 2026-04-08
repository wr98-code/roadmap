import { useState } from "react";
import { useAppData } from "@/lib/store";
import {
  Home, Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  Menu, X, Plus, Check, Newspaper, BarChart2, BookOpen, CheckSquare,
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

const sections = [
  { key: "dashboard", label: "Home", icon: Home, emoji: "🏠", group: "main" },
  { key: "intel", label: "Intel Feed", icon: Newspaper, emoji: "📡", group: "intel" },
  { key: "markets", label: "Market Prices", icon: BarChart2, emoji: "💹", group: "intel" },
  { key: "my-day", label: "My Day", icon: CheckSquare, emoji: "✅", group: "intel" },
  { key: "journal", label: "Journal", icon: BookOpen, emoji: "📝", group: "intel" },
  { key: "build-lab", label: "ZERØ BUILD LAB", icon: Zap, emoji: "⚡", group: "zero" },
  { key: "keuangan", label: "Keuangan", icon: DollarSign, emoji: "💰", group: "zero" },
  { key: "roadmap", label: "Roadmap", icon: Calendar, emoji: "📅", group: "zero" },
  { key: "trading", label: "Trading", icon: TrendingUp, emoji: "💹", group: "zero" },
  { key: "crypto", label: "Crypto Market", icon: Globe, emoji: "🌐", group: "zero" },
  { key: "personal", label: "Personal", icon: User, emoji: "🧘", group: "zero" },
];

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  intel: "Intel Feed",
  markets: "Market Prices",
  "my-day": "My Day",
  journal: "Journal",
  "build-lab": "ZERØ BUILD LAB",
  trading: "Trading",
  crypto: "Crypto Market",
  roadmap: "Roadmap",
  keuangan: "Keuangan",
  personal: "Personal",
};

const groups: Record<string, { label: string; color: string }> = {
  main: { label: "", color: "transparent" },
  intel: { label: "INTELLIGENCE", color: "#2563eb" },
  zero: { label: "ZERØ BUILD LAB", color: "var(--primary)" },
};

const Index = () => {
  const { data, update, saved } = useAppData();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (key: string) => {
    setActiveSection(key);
    setSidebarOpen(false);
  };

  const addNote = () => {
    const section = activeSection;
    const sectionKey = section === "build-lab" ? "buildLab" : section;
    const dataSection = (data as any)[sectionKey];
    if (dataSection && "notes" in dataSection) {
      const note = {
        id: Math.random().toString(36).slice(2, 9),
        title: "New Note",
        body: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      update((d: any) => ({
        ...d,
        [sectionKey]: {
          ...d[sectionKey],
          notes: [note, ...d[sectionKey].notes],
        },
      }));
    }
  };

  const renderPage = () => {
    switch (activeSection) {
      case "dashboard": return <DashboardPage data={data} update={update} onNavigate={navigate} />;
      case "intel": return <IntelPage />;
      case "markets": return <MarketsPage />;
      case "my-day": return <MyDayPage />;
      case "journal": return <JournalPage />;
      case "build-lab": return <BuildLabPage data={data} update={update} />;
      case "trading": return <TradingPage data={data} update={update} />;
      case "crypto": return <CryptoPage data={data} update={update} />;
      case "roadmap": return <RoadmapPage data={data} update={update} />;
      case "keuangan": return <KeuanganPage data={data} update={update} />;
      case "personal": return <PersonalPage data={data} update={update} />;
      default: return null;
    }
  };

  // Group sections for sidebar rendering
  const groupedSections = sections.reduce<Record<string, typeof sections>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const hasNoteSupport = ["build-lab", "trading", "crypto", "roadmap", "keuangan", "personal"].includes(activeSection);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r border-border bg-surface flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-heading text-sm tracking-widest text-primary">ZERØ COMMAND</h1>
            <p style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2, fontFamily: "monospace" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {Object.entries(groupedSections).map(([groupKey, items]) => (
            <div key={groupKey}>
              {groups[groupKey]?.label && (
                <p style={{
                  fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                  letterSpacing: 2, color: "var(--muted-foreground)",
                  padding: "0 8px", marginBottom: 4, marginTop: 4,
                }}>
                  {groups[groupKey].label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => navigate(s.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                      activeSection === s.key
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-heading">ZERØ v2.0</p>
          <ThemePicker />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-sm tracking-wide text-foreground">
              {sectionTitles[activeSection]}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-primary animate-fade-in">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            {hasNoteSupport && (
              <button
                onClick={addNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> New Note
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-4xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Index;
