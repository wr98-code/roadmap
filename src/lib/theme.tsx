// ─── ZERO COMMAND — theme.tsx ─────────────────────────────────────────────────
// Auto time-based vibe: Morning ☀️ | Afternoon 💼 | Night 🌙
// Manual override stored in localStorage

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Vibe = "morning" | "afternoon" | "night";

interface VibeInfo {
  label: string;
  emoji: string;
  hours: string;
}

export const VIBES: Record<Vibe, VibeInfo> = {
  morning:   { label: "Morning",   emoji: "☀️",  hours: "05–11" },
  afternoon: { label: "Afternoon", emoji: "💼",  hours: "12–16" },
  night:     { label: "Night",     emoji: "🌙",  hours: "17–04" },
};

const VIBE_ORDER: Vibe[] = ["morning", "afternoon", "night"];

function getAutoVibe(): Vibe {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "night";
}

interface ThemeContextType {
  vibe: Vibe;
  isAuto: boolean;
  setVibe: (v: Vibe) => void;
  cycleVibe: () => void;
  resetToAuto: () => void;
  // legacy compat
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  vibe: "morning",
  isAuto: true,
  setVibe: () => {},
  cycleVibe: () => {},
  resetToAuto: () => {},
  theme: "light",
  toggleTheme: () => {},
});

const VIBE_KEY = "zero-vibe-override";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [vibe, setVibeState] = useState<Vibe>(() => {
    const stored = localStorage.getItem(VIBE_KEY) as Vibe | null;
    return stored && VIBE_ORDER.includes(stored) ? stored : getAutoVibe();
  });

  const [isAuto, setIsAuto] = useState<boolean>(() => {
    return !localStorage.getItem(VIBE_KEY);
  });

  // Auto-update every minute when in auto mode
  useEffect(() => {
    if (!isAuto) return;
    const tick = () => {
      const auto = getAutoVibe();
      setVibeState(auto);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [isAuto]);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-morning", "theme-afternoon", "theme-night", "dark-mode", "light-mode");
    root.classList.add(`theme-${vibe}`);
    if (vibe === "night") root.classList.add("dark-mode");
  }, [vibe]);

  const setVibe = (v: Vibe) => {
    setVibeState(v);
    setIsAuto(false);
    localStorage.setItem(VIBE_KEY, v);
  };

  const cycleVibe = () => {
    const idx = VIBE_ORDER.indexOf(vibe);
    const next = VIBE_ORDER[(idx + 1) % VIBE_ORDER.length];
    setVibe(next);
  };

  const resetToAuto = () => {
    setIsAuto(true);
    localStorage.removeItem(VIBE_KEY);
    setVibeState(getAutoVibe());
  };

  // Legacy compat
  const theme: "light" | "dark" = vibe === "night" ? "dark" : "light";
  const toggleTheme = () => cycleVibe();

  return (
    <ThemeContext.Provider value={{ vibe, isAuto, setVibe, cycleVibe, resetToAuto, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
