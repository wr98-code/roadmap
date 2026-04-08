import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { EditableText } from "@/components/EditableText";
import { Activity, Zap, TrendingUp, Globe, Calendar, DollarSign, User } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

const quickLinks = [
  { key: "build-lab", label: "ZERØ BUILD LAB", icon: Zap },
  { key: "trading", label: "Trading", icon: TrendingUp },
  { key: "crypto", label: "Crypto Market", icon: Globe },
  { key: "roadmap", label: "Roadmap", icon: Calendar },
  { key: "keuangan", label: "Keuangan", icon: DollarSign },
  { key: "personal", label: "Personal", icon: User },
];

export function DashboardPage({ data, update, onNavigate }: Props) {
  const statuses = data.buildLab.statusBoard;

  const statusColor = (s: string) => {
    if (s.includes("AKTIF")) return "bg-primary/20 text-primary";
    if (s.includes("✅")) return "bg-emerald-900/30 text-emerald-400";
    if (s.includes("CRITICAL")) return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Status Board" icon={<Activity className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-heading text-xs text-muted-foreground">Area</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Status</th>
                <th className="pb-2 font-heading text-xs text-muted-foreground">Prioritas</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((s) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-2.5 text-foreground">{s.area}</td>
                  <td className="py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground font-heading text-xs">{s.prioritas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Today's Focus">
        <EditableText
          value={data.dashboard.todayFocus}
          onChange={(val) =>
            update((d) => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))
          }
        />
      </SectionCard>

      <SectionCard title="Quick Links">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.key}
              onClick={() => onNavigate(link.key)}
              className="flex items-center gap-2 p-3 rounded-md bg-muted/50 hover:bg-primary/10 hover:border-primary/30 border border-transparent text-sm text-foreground transition-all"
            >
              <link.icon className="h-4 w-4 text-primary" />
              {link.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <p className="text-xs text-muted-foreground text-right">
        Last updated: {new Date(data.dashboard.lastUpdated).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
