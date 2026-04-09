// ─── ZERØ AURA — AffirmationToast.tsx ────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";

const AURAS = [
  { quote: "Wealth is built in moments exactly like this one.", label: "Keep going" },
  { quote: "Every focused hour compounds into freedom.", label: "Stay in it" },
  { quote: "Gue bukan nunggu siap — gue bergerak sambil belajar.", label: "ZERØ mindset" },
  { quote: "The market rewards patience, punishes panic.", label: "Breathe. Execute." },
  { quote: "Billionaires don't have more hours. Better systems.", label: "Build yours" },
  { quote: "Modal kecil, mental besar. That's the real leverage.", label: "ZERØ Build" },
  { quote: "Profit is a byproduct of obsessive preparation.", label: "Prepare" },
  { quote: "Your future self is watching how you use this hour.", label: "Make it count" },
  { quote: "First you build the habit. Then the habit builds you.", label: "Consistency" },
  { quote: "Scarcity is a mindset. Abundance is a decision.", label: "Choose wisely" },
  { quote: "Setiap Rp yang dikelola bijak = satu langkah ke freedom.", label: "Keep stacking" },
  { quote: "Gue punya visi yang lebih besar dari rasa takutnya.", label: "Trust the vision" },
  { quote: "Risk taken with knowledge is called investing.", label: "Stay sharp" },
  { quote: "Lo lagi di sini, fokus, ngebangun — itu udah lebih.", label: "Real talk" },
  { quote: "Great things are done by those who refuse ordinary days.", label: "Today counts" },
];

const PHOTOS = [
  "photo-1486406146926-c627a92ad1ab",
  "photo-1512453979798-5ea266f8880c",
  "photo-1449824913935-59a10b8d2000",
  "photo-1497366216548-37526070297c",
  "photo-1568992687947-868a62a9f521",
  "photo-1470075801209-17f9ec0099cd",
];

const DURATION = 7000;
const FADE_MS = 500;

export function AffirmationToast() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [aura, setAura] = useState(AURAS[0]);
  const [photo, setPhoto] = useState(PHOTOS[0]);

  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => { setVisible(false); setFading(false); }, FADE_MS);
  }, []);

  const show = useCallback(() => {
    setAura(AURAS[Math.floor(Math.random() * AURAS.length)]);
    setPhoto(PHOTOS[Math.floor(Math.random() * PHOTOS.length)]);
    setVisible(true);
    setFading(false);
    setTimeout(dismiss, DURATION);
  }, [dismiss]);

  useEffect(() => {
    // First toast after 90s, then every 3-5 min
    const first = setTimeout(show, 90_000);
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => { show(); schedule(); }, 180_000 + Math.random() * 120_000);
    };
    schedule();
    return () => { clearTimeout(first); clearTimeout(t); };
  }, [show]);

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        width: 280, borderRadius: 14, overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 20px 60px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.18)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(10px) scale(0.97)" : "translateY(0) scale(1)",
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        animation: !fading ? "auraIn 0.45s cubic-bezier(0.34,1.4,0.64,1) both" : undefined,
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative", height: 105 }}>
        <img
          src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=560&q=70`}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.38) saturate(1.1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 20%, rgba(10,10,18,0.92) 100%)" }} />
        <span style={{ position: "absolute", top: 10, left: 12, fontFamily: "monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
          ZERØ AURA
        </span>
        <span style={{ position: "absolute", top: 8, right: 11, fontSize: 15, color: "rgba(255,255,255,0.22)", lineHeight: 1 }}>×</span>
      </div>

      {/* Text */}
      <div style={{ padding: "12px 15px 14px", background: "rgba(9,9,17,0.97)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic", fontSize: 13, fontWeight: 400,
          color: "rgba(255,255,255,0.86)", lineHeight: 1.55, marginBottom: 6,
        }}>
          "{aura.quote}"
        </p>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.14em", color: "rgba(201,168,76,0.6)", textTransform: "uppercase" }}>
          — {aura.label}
        </p>
      </div>

      {/* Gold progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 2,
        background: "rgba(201,168,76,0.5)",
        animation: `auraProgress ${DURATION}ms linear forwards`,
        borderRadius: "0 0 14px 14px",
      }} />

      <style>{`
        @keyframes auraIn {
          from { opacity:0; transform: translateY(16px) scale(0.95); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes auraProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
