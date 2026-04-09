// ─── ZERO COMMAND — ThemePicker.tsx ──────────────────────────────────────────
import { useTheme, VIBES } from "@/lib/theme";

export function ThemePicker() {
  const { vibe, isAuto, cycleVibe, resetToAuto } = useTheme();
  const info = VIBES[vibe];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Auto indicator */}
      {isAuto && (
        <span style={{
          fontSize: 9,
          fontFamily: "Space Mono, monospace",
          color: "hsl(var(--sidebar-primary))",
          opacity: 0.7,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          AUTO
        </span>
      )}

      {/* Vibe badge — click to cycle */}
      <button
        onClick={cycleVibe}
        title={`Current: ${info.label} ${info.emoji} — click to cycle`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 9px",
          borderRadius: 20,
          border: "1px solid hsl(var(--sidebar-primary) / 0.25)",
          background: "hsl(var(--sidebar-primary) / 0.10)",
          color: "hsl(var(--sidebar-primary))",
          cursor: "pointer",
          fontSize: 10,
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 500,
          letterSpacing: "0.04em",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--sidebar-primary) / 0.18)")}
        onMouseLeave={e => (e.currentTarget.style.background = "hsl(var(--sidebar-primary) / 0.10)")}
      >
        <span style={{ fontSize: 12 }}>{info.emoji}</span>
        {info.label}
      </button>

      {/* Reset to auto — only shows when manually overridden */}
      {!isAuto && (
        <button
          onClick={resetToAuto}
          title="Reset to auto (time-based)"
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            border: "1px solid hsl(var(--sidebar-border))",
            background: "transparent",
            color: "hsl(var(--sidebar-foreground) / 0.5)",
            cursor: "pointer",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "hsl(var(--sidebar-foreground))")}
          onMouseLeave={e => (e.currentTarget.style.color = "hsl(var(--sidebar-foreground) / 0.5)")}
        >
          ↺
        </button>
      )}
    </div>
  );
}
