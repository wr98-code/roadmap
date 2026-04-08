import { useState } from "react";
import { useAppData } from "@/lib/store";
import {
  Home, Zap, TrendingUp, Globe, Calendar, DollarSign, User,
  Menu, X, Plus, Check
} from "lucide-react";
import { DashboardPage } from "./DashboardPage";
import { BuildLabPage } from "./BuildLabPage";
import { TradingPage } from "./TradingPage";
import { CryptoPage } from "./CryptoPage";
import { RoadmapPage } from "./RoadmapPage";
import { KeuanganPage } from "./KeuanganPage";
import { PersonalPage } from "./PersonalPage";

const sections = [
  { key: "dashboard", label: "Home", icon: Home, emoji: "🏠" },
  { key: "build-lab", label: "ZERØ BUILD LAB", icon: Zap, emoji: "⚡" },
  { key: "trading", label: "Trading", icon: TrendingUp, emoji: "💹" },
  { key: "crypto", label: "Crypto Market", icon: Globe, emoji: "🌐" },
  { key: "roadmap", label: "Roadmap", icon: Calendar, emoji: "📅" },
  { key: "keuangan", label: "Keuangan", icon: DollarSign, emoji: "💰" },
  { key: "personal", label: "Personal", icon: User, emoji: "🧘" },
];

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  "build-lab": "ZERØ BUILD LAB",
  trading: "Trading",
  crypto: "Crypto Market",
  roadmap: "Roadmap",
  keuangan: "Keuangan",
  personal: "Personal",
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
      case "dashboard":
        return <DashboardPage data={data} update={update} onNavigate={navigate} />;
      case "build-lab":
        return <BuildLabPage data={data} update={update} />;
      case "trading":
        return <TradingPage data={data} update={update} />;
      case "crypto":
        return <CryptoPage data={data} update={update} />;
      case "roadmap":
        return <RoadmapPage data={data} update={update} />;
      case "keuangan":
        return <KeuanganPage data={data} update={update} />;
      case "personal":
        return <PersonalPage data={data} update={update} />;
      default:
        return null;
    }
  };

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
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h1 className="font-heading text-sm tracking-widest text-primary">
            ZERØ COMMAND
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections.map((s) => (
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
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-heading">ZERØ v1.0</p>
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
            {activeSection !== "dashboard" && (
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
