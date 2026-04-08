import { Sun, Moon, Palette } from "lucide-react";
import { useTheme, ACCENTS, AccentColor } from "@/lib/theme";
import { useState } from "react";

export function ThemePicker() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Theme settings"
      >
        <Palette className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-56 bg-card border border-border rounded-lg shadow-xl p-4 space-y-4 animate-fade-in">
            {/* Mode toggle */}
            <div>
              <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground mb-2">
                Mode
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    mode === "dark"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" /> Dark
                </button>
                <button
                  onClick={() => setMode("light")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    mode === "light"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" /> Light
                </button>
              </div>
            </div>

            {/* Accent colors */}
            <div>
              <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground mb-2">
                Accent Color
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ACCENTS) as AccentColor[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setAccent(key)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-md text-xs transition-all ${
                      accent === key
                        ? "bg-muted ring-1 ring-primary/50"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="h-5 w-5 rounded-full ring-2 ring-offset-1 ring-offset-card"
                      style={{
                        backgroundColor: ACCENTS[key].preview,
                        ringColor: accent === key ? ACCENTS[key].preview : "transparent",
                      }}
                    />
                    <span className="text-muted-foreground">{ACCENTS[key].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
