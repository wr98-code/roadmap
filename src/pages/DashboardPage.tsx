// ─── ZERO COMMAND — DashboardPage.tsx ────────────────────────────────────────
// Vision Board | Billionaire Affirmation Hero | Status Board | Quick Links
import { useState, useEffect } from "react";
import { AppData } from "@/lib/store";
import { SectionCard } from "@/components/SectionCard";
import { EditableText } from "@/components/EditableText";
import { Activity, Zap, TrendingUp, Globe, Calendar, DollarSign, User, RefreshCw } from "lucide-react";

interface Props {
  data: AppData;
  update: (fn: (prev: AppData) => AppData) => void;
  onNavigate: (section: string) => void;
}

// ─── CURATED BILLIONAIRE LIFESTYLE PHOTOS (Unsplash) ──────────────────────────
// High-life, luxury workspace, city views, private aviation, architecture
const VISION_PHOTOS = [
  {
    id: "photo-1486406146926-c627a92ad1ab", // Manhattan skyline aerial
    caption: "Think at the top.",
    credit: "Unsplash",
  },
  {
    id: "photo-1545324418-cc1a3fa10c00", // Luxury high-rise interior
    caption: "Design your environment, design your life.",
    credit: "Unsplash",
  },
  {
    id: "photo-1512453979798-5ea266f8880c", // Dubai skyline
    caption: "Cities are built by those who refused to settle.",
    credit: "Unsplash",
  },
  {
    id: "photo-1470075801209-17f9ec0099cd", // Aerial city night lights
    caption: "While the world sleeps, you build.",
    credit: "Unsplash",
  },
  {
    id: "photo-1497366216548-37526070297c", // Minimalist luxury office
    caption: "Clarity creates wealth.",
    credit: "Unsplash",
  },
  {
    id: "photo-1497366754035-f200968a6e72", // Open plan modern workspace
    caption: "Build systems, not just hustle.",
    credit: "Unsplash",
  },
  {
    id: "photo-1507003211169-0a1dd7228f2d", // Luxury hotel lobby
    caption: "Move with intention. Arrive with precision.",
    credit: "Unsplash",
  },
  {
    id: "photo-1600607687939-ce8a6c25118c", // Luxury penthouse living
    caption: "Scarcity is a mindset. Abundance is a decision.",
    credit: "Unsplash",
  },
  {
    id: "photo-1449824913935-59a10b8d2000", // City skyline sunrise
    caption: "Every sunrise is a new balance sheet.",
    credit: "Unsplash",
  },
  {
    id: "photo-1464082354059-27db6ce50048", // Aerial ocean view luxury coast
    caption: "The ocean doesn't apologize for its depth.",
    credit: "Unsplash",
  },
  {
    id: "photo-1568992687947-868a62a9f521", // Modern glass architecture
    caption: "Precision is the language of excellence.",
    credit: "Unsplash",
  },
  {
    id: "photo-1534430480872-3498386e7856", // Luxury interior design
    caption: "Your standard becomes your ceiling. Raise it.",
    credit: "Unsplash",
  },
];

// ─── DAILY AFFIRMATIONS ────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  "Gue bukan waiting for opportunity — gue adalah opportunity itu sendiri.",
  "Modal kecil, mental billionaire. That's the edge.",
  "Every trade is data. Every loss is tuition. Keep going.",
  "Wealth isn't luck. It's compounding small right decisions.",
  "Gue build empire dari layar laptop ini. Satu line of code, satu trade, satu hari.",
  "The best investment is the one you understand deeply.",
  "Patience is the ultimate leverage. Billionaires know this.",
  "Gue punya visi yang lebih besar dari rasa takutnya.",
  "Financial freedom is built in the hours others waste.",
  "First million is a mindset. Then it becomes math.",
  "Gue bukan nunggu siap. Gue belajar sambil bergerak.",
  "Risk isn't the enemy. Ignorance is.",
];

// Get deterministic daily photo & affirmation (changes daily, consistent per day)
function getDailyIndex(len: number): number {
  const day = Math.floor(Date.now() / 86_400_000);
  return day % len;
}

const quickLinks = [
  { key: "build-lab", label: "BUILD LAB", icon: Zap },
  { key: "trading",   label: "Trading",   icon: TrendingUp },
  { key: "crypto",    label: "Crypto",    icon: Globe },
  { key: "roadmap",   label: "Roadmap",   icon: Calendar },
  { key: "keuangan",  label: "Keuangan",  icon: DollarSign },
  { key: "personal",  label: "Personal",  icon: User },
];

export function DashboardPage({ data, update, onNavigate }: Props) {
  const statuses = data.buildLab.statusBoard;
  const [photoIdx, setPhotoIdx] = useState(() => getDailyIndex(VISION_PHOTOS.length));
  const [affirmIdx, setAffirmIdx] = useState(() => getDailyIndex(AFFIRMATIONS.length));
  const [imgLoaded, setImgLoaded] = useState(false);

  const photo = VISION_PHOTOS[photoIdx];
  const affirmation = AFFIRMATIONS[affirmIdx];

  const nextPhoto = () => {
    setImgLoaded(false);
    setPhotoIdx((i) => (i + 1) % VISION_PHOTOS.length);
    setAffirmIdx((i) => (i + 1) % AFFIRMATIONS.length);
  };

  const statusColor = (s: string) => {
    if (s.includes("AKTIF"))    return "bg-primary/20 text-primary";
    if (s.includes("✅"))       return "bg-emerald-900/30 text-emerald-400";
    if (s.includes("CRITICAL")) return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── VISION BOARD HERO ──────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        height: 240,
        background: "#0a0a14",
        border: "1px solid var(--color-border)",
      }}>
        {/* Photo */}
        <img
          key={photo.id}
          src={`https://images.unsplash.com/${photo.id}?auto=format&fit=crop&w=1200&q=80`}
          alt="Vision"
          onLoad={() => setImgLoaded(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.8s ease",
            filter: "brightness(0.55) saturate(1.1)",
          }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)",
        }} />

        {/* Content overlay */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px 20px",
        }}>
          {/* Top: label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontFamily: "Space Mono, monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
            }}>
              Vision Board · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <button
              onClick={nextPhoto}
              title="Next photo"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, padding: "4px 8px",
                cursor: "pointer", color: "rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 10, fontFamily: "Space Grotesk, sans-serif",
                backdropFilter: "blur(8px)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            >
              <RefreshCw size={10} /> Next
            </button>
          </div>

          {/* Bottom: caption + affirmation */}
          <div>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 11,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 6,
              letterSpacing: "0.02em",
            }}>
              "{photo.caption}"
            </p>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.4,
              letterSpacing: "0.01em",
              maxWidth: 480,
            }}>
              {affirmation}
            </p>
          </div>
        </div>
      </div>

      {/* ── STATUS BOARD ───────────────────────────────────────────────── */}
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

      {/* ── TODAY'S FOCUS ──────────────────────────────────────────────── */}
      <SectionCard title="Today's Focus">
        <EditableText
          value={data.dashboard.todayFocus}
          onChange={(val) =>
            update((d) => ({ ...d, dashboard: { ...d.dashboard, todayFocus: val } }))
          }
        />
      </SectionCard>

      {/* ── QUICK LINKS ────────────────────────────────────────────────── */}
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
