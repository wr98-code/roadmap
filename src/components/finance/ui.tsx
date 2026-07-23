// ─── ZERØ COMMAND — finance/ui.tsx ────────────────────────────────────────────
// Primitives bersama halaman Keuangan, berbahasa "Atelier": geometri lembut
// (radius 12–22), elevasi hangat, Hanken Grotesk untuk UI, angka tabular,
// warna via token CSS (--gain/--loss/--cat-*) sehingga light & dark otomatis.

import { ReactNode, useEffect, useState, CSSProperties } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { CAT_KEYS, CatKey, catColor } from "@/lib/finance";

// ── Hook: resolve CSS var → literal (untuk atribut SVG Recharts) ──────────────
// Baca sinkron + re-baca via setTimeout(0): TANPA requestAnimationFrame,
// supaya tetap jalan di tab background / pane yang tidak compositing
// (rAF bisa tidak pernah fire di sana). setTimeout menutup kasus kelas tema
// yang baru terpasang oleh effect ThemeProvider setelah effect anak.
function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function useCssVar(name: string, fallback = "#888"): string {
  const { vibe } = useTheme();
  const [val, setVal] = useState(fallback);
  useEffect(() => {
    setVal(readVar(name, fallback));
    const id = setTimeout(() => setVal(readVar(name, fallback)), 0);
    return () => clearTimeout(id);
  }, [name, fallback, vibe]);
  return val;
}

/** Beberapa var sekaligus (chart butuh banyak warna literal). */
export function useCssVars(names: string[]): Record<string, string> {
  const { vibe } = useTheme();
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const next: Record<string, string> = {};
      for (const n of names) next[n] = readVar(n, "#888");
      setVals(next);
    };
    read();
    const id = setTimeout(read, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibe, names.join("|")]);
  return vals;
}

// ── Eyebrow label (identik .eyebrow) ──────────────────────────────────────────
export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.13em", textTransform: "uppercase",
        color: "var(--color-muted)", ...style,
      }}
    >
      {children}
    </span>
  );
}

export const displayFace: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontOpticalSizing: "auto",
  fontVariationSettings: "'SOFT' 32, 'WONK' 1",
  letterSpacing: "-0.03em",
  lineHeight: 1.05,
};

// ── Kartu Atelier ─────────────────────────────────────────────────────────────
export function Card({ children, style, className = "" }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      borderRadius: 22,
      boxShadow: "var(--card-shadow), var(--card-inset)",
      padding: "22px 24px",
      minWidth: 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Chip pilihan (pill lembut) ────────────────────────────────────────────────
export function Chip({
  active, color = "var(--color-primary)", onClick, children, title, small,
}: {
  active?: boolean;
  color?: string;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: small ? "4px 11px" : "7px 13px",
        borderRadius: 999,
        fontSize: small ? 12 : 13,
        fontFamily: "var(--font-sans)",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        border: `1.5px solid ${active ? color : "var(--color-border)"}`,
        background: active ? "var(--color-surface)" : "transparent",
        color: active ? color : "var(--color-muted)",
        transition: "all var(--dur-fast) var(--ease-out)",
        whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
      }}
    >
      {children}
    </button>
  );
}

// ── Input styles bersama ──────────────────────────────────────────────────────
export const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: "9px 13px",
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  color: "var(--color-text)",
  outline: "none",
  background: "var(--color-surface)",
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label style={{ fontSize: 10 }}>{label}</Label>
      {children}
    </div>
  );
}

// ── Tombol ────────────────────────────────────────────────────────────────────
export function Btn({
  onClick, children, variant = "primary", disabled, style, type = "button",
}: {
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
}) {
  const variants: Record<string, CSSProperties> = {
    primary: { background: "var(--color-primary)", border: "1px solid transparent", color: "var(--on-primary)" },
    ghost: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-muted)" },
    danger: { background: "var(--loss-soft)", border: "1px solid transparent", color: "var(--loss)" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        borderRadius: 12, padding: "9px 17px", fontSize: 13, fontWeight: 600,
        fontFamily: "var(--font-sans)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all var(--dur-fast) var(--ease-out)",
        ...variants[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Modal — lembar lembut, ikut mode terang/gelap ─────────────────────────────
export function Modal({
  title, onClose, children, width = 480,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 150,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "56px 14px calc(24px + env(safe-area-inset-bottom, 0px))",
        background: "rgba(27,24,21,0.45)", backdropFilter: "blur(6px)",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: width, borderRadius: 22,
          background: "var(--raised)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--card-shadow-hover)",
          overflow: "hidden",
          animation: "auraIn var(--dur-slow) var(--ease-soft) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
          <span style={{ ...displayFace, fontSize: 19, fontWeight: 600, color: "var(--color-text)" }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, cursor: "pointer", padding: 6, color: "var(--color-muted)", display: "flex" }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: "8px 20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Pilihan warna identitas (token Atelier) ───────────────────────────────────
export function ColorSwatches({ value, onChange }: { value: CatKey; onChange: (c: CatKey) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {CAT_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          title={k}
          aria-label={`Warna ${k}`}
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: catColor(k),
            cursor: "pointer",
            border: value === k ? "2.5px solid var(--color-text)" : "2.5px solid transparent",
            outline: value === k ? "2px solid var(--raised)" : "none",
            outlineOffset: -4,
            transition: "all var(--dur-fast) var(--ease-out)",
          }}
        />
      ))}
    </div>
  );
}

// ── Pilihan emoji sederhana ───────────────────────────────────────────────────
export function EmojiInput({
  value, onChange, presets,
}: {
  value: string;
  onChange: (e: string) => void;
  presets: string[];
}) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={4}
        aria-label="Emoji"
        style={{ ...inputStyle, width: 56, textAlign: "center", fontSize: 18, padding: "7px 4px" }}
      />
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          style={{
            fontSize: 17, padding: "4px 7px", borderRadius: 10,
            border: value === p ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
            background: value === p ? "var(--ember-soft)" : "var(--color-surface)",
            cursor: "pointer",
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ── Empty state jujur ─────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, hint, cta, compact,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  cta?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "24px 16px" : "44px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: "var(--color-dim)" }}>
        {icon}
      </div>
      <p style={{ fontSize: 14, color: "var(--color-text)", fontWeight: 600, margin: 0 }}>{title}</p>
      {hint && <p style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 5, lineHeight: 1.55, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{hint}</p>}
      {cta && <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>{cta}</div>}
    </div>
  );
}

// ── Tooltip chart custom (Recharts) — memakai token tooltip Atelier ───────────
export function TooltipBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--tooltip-bg)",
        border: "1px solid var(--tooltip-border)",
        borderRadius: 12,
        padding: "10px 13px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
        fontFamily: "var(--font-sans)",
        fontSize: 12,
        color: "var(--tooltip-text)",
        maxWidth: 250,
      }}
    >
      {children}
    </div>
  );
}

export function TooltipRow({
  color, label, value, bold,
}: {
  color?: string;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
      {color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      <span style={{ flex: 1, opacity: 0.75, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span className="num" style={{ fontWeight: bold ? 700 : 500, fontSize: 11.5, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}
