// ─── ZERØ COMMAND — ThemePicker.tsx ──────────────────────────────────────────
import { useTheme, VIBES } from "@/lib/theme";

export function ThemePicker() {
  const { vibe, isAuto, cycleVibe, resetToAuto } = useTheme();
  const info = VIBES[vibe];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {isAuto && (
        <span style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.12em", color: "hsl(var(--sidebar-primary) / 0.5)", textTransform: "uppercase" }}>
          AUTO
        </span>
      )}
      <button
        onClick={cycleVibe}
        className="vibe-badge"
        title="Click to cycle vibe"
      >
        <span style={{ fontSize: 11 }}>{info.emoji}</span>
        {info.label}
      </button>
      {!isAuto && (
        <button
          onClick={resetToAuto}
          title="Reset to auto"
          style={{ width: 20, height: 20, borderRadius: 6, border: "1px solid hsl(var(--sidebar-border))", background: "transparent", color: "hsl(var(--sidebar-foreground) / 0.4)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "hsl(var(--sidebar-foreground))")}
          onMouseLeave={e => (e.currentTarget.style.color = "hsl(var(--sidebar-foreground) / 0.4)")}
        >↺</button>
      )}
    </div>
  );
}
