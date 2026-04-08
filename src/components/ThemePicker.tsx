import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemePicker() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 7,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "transparent",
        cursor: "pointer",
        color: "var(--sidebar-foreground)",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}
