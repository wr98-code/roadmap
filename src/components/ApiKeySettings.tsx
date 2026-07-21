// ─── ZERØ COMMAND — ApiKeySettings.tsx ────────────────────────────────────────
// Settings kunci-kunci rahasia — SEMUA hanya tersimpan di localStorage device
// ini, tidak pernah ikut ke bundle build (anti bocor "view source"):
//   1. Groq API Key  → fitur AI (Intel, Learn, translate headline).
//   2. Sync Token    → akses endpoint cloud sync /api/data* yang terproteksi
//      (harus sama dengan env SYNC_TOKEN di Cloudflare Pages).
// Pakai helper yang sudah ada: src/lib/api.ts + src/lib/cloudStorage.ts.

import { useEffect, useState } from "react";
import { KeyRound, X, Check, Trash2, Cloud } from "lucide-react";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/api";
import { getSyncToken, setSyncToken, clearSyncToken } from "@/lib/cloudStorage";

function maskSecret(s: string): string {
  if (!s) return "";
  if (s.length <= 8) return "••••";
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

interface SecretRowProps {
  label: string;
  hint: string;
  stored: string;
  draft: string;
  placeholder: string;
  onDraft: (v: string) => void;
  onSave: () => void;
  onRemove: () => void;
}

function SecretRow({ label, hint, stored, draft, placeholder, onDraft, onSave, onRemove }: SecretRowProps) {
  const hasVal = !!stored;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{label}</span>
        <span style={{
          fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.06em",
          color: hasVal ? "#10b981" : "#94a3b8",
          background: hasVal ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.12)",
          padding: "2px 7px", borderRadius: 5,
        }}>
          {hasVal ? "TERPASANG" : "KOSONG"}
        </span>
        {hasVal && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            {maskSecret(stored)}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input
          type="password"
          value={draft}
          onChange={e => onDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onSave(); }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1, minWidth: 0, boxSizing: "border-box", padding: "9px 11px", borderRadius: 9,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            outline: "none", color: "#f1f5f9", fontSize: 12, fontFamily: "var(--font-mono)",
            caretColor: "#3b82f6",
          }}
        />
        <button
          onClick={onSave}
          disabled={!draft.trim()}
          title="Simpan"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 38, borderRadius: 9, cursor: draft.trim() ? "pointer" : "not-allowed",
            background: draft.trim() ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)",
            border: draft.trim() ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: draft.trim() ? "#3b82f6" : "rgba(255,255,255,0.3)",
          }}
        >
          <Check size={13} />
        </button>
        {hasVal && (
          <button
            onClick={onRemove}
            title="Hapus"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, borderRadius: 9, cursor: "pointer",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <p style={{ margin: "7px 0 0", fontSize: 10.5, lineHeight: 1.55, color: "rgba(255,255,255,0.38)" }}>{hint}</p>
    </div>
  );
}

export function ApiKeySettings() {
  const [open, setOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyStored, setKeyStored] = useState("");
  const [tokDraft, setTokDraft] = useState("");
  const [tokStored, setTokStored] = useState("");

  useEffect(() => {
    if (open) {
      setKeyStored(getApiKey());
      setTokStored(getSyncToken());
      setKeyDraft("");
      setTokDraft("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hasAny = !!keyStored || !!tokStored;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Settings: API key & Sync token"
        style={{
          width: 36, height: 36, borderRadius: 9,
          background: "var(--rail-btn-bg)", border: "1px solid var(--rail-btn-border)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-hover)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--rail-btn-bg)"; }}
      >
        <KeyRound size={14} color="var(--rail-icon)" />
        <span style={{
          position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%",
          background: hasAny ? "#10b981" : "#64748b",
          boxShadow: hasAny ? "0 0 5px #10b981" : "none",
        }} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200, display: "flex",
            alignItems: "flex-start", justifyContent: "center", paddingTop: 80,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 470, maxWidth: "92vw", maxHeight: "84vh", overflowY: "auto", borderRadius: 18,
              background: "rgba(10,10,24,0.97)", border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.12)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <KeyRound size={15} color="#3b82f6" />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Keys & Sync</span>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={16} color="rgba(255,255,255,0.4)" />
              </button>
            </div>

            <div style={{ padding: "16px 18px 6px" }}>
              <SecretRow
                label="Groq API Key"
                hint="Untuk fitur AI (Intel, Learn Hub, translate headline). Gratis di console.groq.com. Tersimpan hanya di browser ini — tidak pernah ikut ter-build ke situs."
                stored={keyStored}
                draft={keyDraft}
                placeholder={keyStored ? "Ganti key (gsk_…)" : "Tempel key Groq (gsk_…)"}
                onDraft={setKeyDraft}
                onSave={() => {
                  if (!keyDraft.trim()) return;
                  setApiKey(keyDraft);
                  setKeyStored(getApiKey());
                  setKeyDraft("");
                }}
                onRemove={() => { clearApiKey(); setKeyStored(""); }}
              />

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0 16px" }} />

              <SecretRow
                label="Sync Token"
                hint="Kunci akses cloud backup (Cloudflare KV). Harus sama dengan environment variable SYNC_TOKEN di Cloudflare Pages. Tanpa token, data tetap aman tersimpan lokal — hanya sinkronisasi antar-device yang non-aktif."
                stored={tokStored}
                draft={tokDraft}
                placeholder={tokStored ? "Ganti token…" : "Tempel sync token…"}
                onDraft={setTokDraft}
                onSave={() => {
                  if (!tokDraft.trim()) return;
                  setSyncToken(tokDraft);
                  setTokStored(getSyncToken());
                  setTokDraft("");
                }}
                onRemove={() => { clearSyncToken(); setTokStored(""); }}
              />

              <div style={{
                display: "flex", gap: 8, alignItems: "flex-start", margin: "0 0 16px", padding: "10px 12px",
                borderRadius: 10, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)",
              }}>
                <Cloud size={13} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.6, color: "rgba(255,255,255,0.5)" }}>
                  Setelah mengubah token di sini, muat ulang halaman supaya sinkronisasi
                  memakai token baru. Perubahan data selalu tersimpan instan di perangkat.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
