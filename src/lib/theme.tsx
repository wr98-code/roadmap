import { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type AccentColor = "lime" | "cyan" | "amber" | "rose" | "violet" | "blue";
export type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  accent: "lime",
  setMode: () => {},
  setAccent: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const ACCENT_MAP: Record<AccentColor, { primary: string; ring: string; label: string; preview: string }> = {
  lime:   { primary: "73 89% 66%",   ring: "73 89% 66%",   label: "Lime",   preview: "#c8f55a" },
  cyan:   { primary: "187 85% 53%",  ring: "187 85% 53%",  label: "Cyan",   preview: "#22d3ee" },
  amber:  { primary: "38 92% 50%",   ring: "38 92% 50%",   label: "Amber",  preview: "#f59e0b" },
  rose:   { primary: "347 77% 50%",  ring: "347 77% 50%",  label: "Rose",   preview: "#e11d48" },
  violet: { primary: "263 70% 58%",  ring: "263 70% 58%",  label: "Violet", preview: "#8b5cf6" },
  blue:   { primary: "217 91% 60%",  ring: "217 91% 60%",  label: "Blue",   preview: "#3b82f6" },
};

export const ACCENTS = ACCENT_MAP;

const STORAGE_KEY = "zero-theme";

function loadTheme(): { mode: ThemeMode; accent: AccentColor } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { mode: "dark", accent: "lime" };
}

function applyTheme(mode: ThemeMode, accent: AccentColor) {
  const root = document.documentElement;
  const accentVals = ACCENT_MAP[accent];

  // Apply accent
  root.style.setProperty("--primary", accentVals.primary);
  root.style.setProperty("--ring", accentVals.ring);
  root.style.setProperty("--accent", accentVals.primary);
  root.style.setProperty("--sidebar-primary", accentVals.primary);
  root.style.setProperty("--sidebar-ring", accentVals.ring);

  // Apply mode
  if (mode === "dark") {
    root.classList.remove("light-mode");
    root.classList.add("dark-mode");
  } else {
    root.classList.remove("dark-mode");
    root.classList.add("light-mode");
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent }));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ mode, accent }, setState] = useState(loadTheme);

  useEffect(() => {
    applyTheme(mode, accent);
  }, [mode, accent]);

  const setMode = (m: ThemeMode) => setState((s) => ({ ...s, mode: m }));
  const setAccent = (a: AccentColor) => setState((s) => ({ ...s, accent: a }));

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
