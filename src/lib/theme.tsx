// ─── ZERØ COMMAND — theme.tsx ─────────────────────────────────────────────────
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Vibe = "morning" | "afternoon" | "night";

export const VIBES: Record<Vibe, { label: string; emoji: string }> = {
  morning:   { label: "Morning",   emoji: "☀️" },
  afternoon: { label: "Afternoon", emoji: "💼" },
  night:     { label: "Night",     emoji: "🌙" },
};

const ORDER: Vibe[] = ["morning", "afternoon", "night"];

function autoVibe(): Vibe {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "night";
}

interface Ctx {
  vibe: Vibe; isAuto: boolean;
  setVibe: (v: Vibe) => void;
  cycleVibe: () => void;
  resetToAuto: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<Ctx>({ vibe: "morning", isAuto: true, setVibe: () => {}, cycleVibe: () => {}, resetToAuto: () => {}, theme: "light", toggleTheme: () => {} });
const KEY = "zero-vibe";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default identity = the warm light "atelier" lane. 2026 luxury digital is
  // light-dominant; dark is an equal partner, not the default costume.
  // Clock-based auto-vibe still available via resetToAuto(). Saved pref wins.
  const [vibe, setVibeState] = useState<Vibe>(() => {
    const s = localStorage.getItem(KEY) as Vibe | null;
    return s && ORDER.includes(s) ? s : "morning";
  });
  const [isAuto, setIsAuto] = useState(false);

  useEffect(() => {
    if (!isAuto) return;
    const tick = () => setVibeState(autoVibe());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [isAuto]);

  useEffect(() => {
    const r = document.documentElement;
    r.classList.remove("theme-morning", "theme-afternoon", "theme-night", "dark-mode", "light-mode");
    r.classList.add(`theme-${vibe}`);
    if (vibe === "night") r.classList.add("dark-mode");
  }, [vibe]);

  const setVibe = (v: Vibe) => { setVibeState(v); setIsAuto(false); localStorage.setItem(KEY, v); };
  const cycleVibe = () => { const i = ORDER.indexOf(vibe); setVibe(ORDER[(i + 1) % ORDER.length]); };
  const resetToAuto = () => { setIsAuto(true); localStorage.removeItem(KEY); setVibeState(autoVibe()); };
  const theme: "light" | "dark" = vibe === "night" ? "dark" : "light";

  return (
    <ThemeContext.Provider value={{ vibe, isAuto, setVibe, cycleVibe, resetToAuto, theme, toggleTheme: cycleVibe }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
