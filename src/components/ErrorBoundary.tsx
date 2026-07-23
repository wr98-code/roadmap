// ─── ZERØ COMMAND — ErrorBoundary.tsx ─────────────────────────────────────────
// Jaring pengaman: kalau ada render error (mis. blob data rusak), tampilkan
// fallback yang menenangkan — BUKAN layar putih total. Data tetap aman di
// localStorage; reload biasanya memulihkan.

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message || "Unknown error" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ZERØ ErrorBoundary caught:", err, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, background: "#0d0d18", fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          width: 460, maxWidth: "90vw", borderRadius: 16, padding: "28px 26px",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "ui-monospace, monospace", fontWeight: 700, letterSpacing: "0.14em", color: "#ef4444", marginBottom: 10 }}>
            <AlertTriangle size={12} /> ADA MASALAH RENDER
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px" }}>
            Aplikasi berhenti sesaat
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: "0 0 6px" }}>
            Tenang — <strong style={{ color: "rgba(255,255,255,0.8)" }}>data kamu aman</strong> tersimpan di
            perangkat ini (localStorage) dan tidak hilang. Coba muat ulang halaman.
          </p>
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 10px", margin: "12px 0 18px", wordBreak: "break-word" }}>
            {this.state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 10, cursor: "pointer", border: "1px solid rgba(59,130,246,0.4)",
              background: "rgba(59,130,246,0.18)", color: "#3b82f6", fontSize: 13, fontWeight: 600,
            }}
          >
            <RefreshCw size={13} /> Muat ulang
          </button>
        </div>
      </div>
    );
  }
}
