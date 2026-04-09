// ─── ZERØ AURA — AffirmationToast.tsx ───────────────────────────────────────
// Floating affirmation toasts — surprise you while you work
// Tiap ~4 menit, muncul quote dari pojok bawah, 7 detik, lenyap sendiri

import { useState, useEffect, useCallback } from "react";

// ─── AFFIRMATIONS ─────────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  { text: "Wealth is being built in moments like this.", sub: "Keep going." },
  { text: "Gue bukan nunggu siap. Gue bergerak sambil belajar.", sub: "ZERØ mindset." },
  { text: "Every focused hour compounds into freedom.", sub: "Stay in it." },
  { text: "The market rewards patience and punishes panic.", sub: "Breathe. Analyze. Execute." },
  { text: "Gue sedang membangun sesuatu yang akan gue banggain.", sub: "One brick at a time." },
  { text: "Billionaires don't have more hours. They have better systems.", sub: "Build yours." },
  { text: "Modal kecil, mental besar. That's the real leverage.", sub: "ZERØ BUILD." },
  { text: "Clarity is the most underrated form of wealth.", sub: "Know what you want." },
  { text: "The best time to start was yesterday. Now is second best.", sub: "Let's go." },
  { text: "Gue bukan competitor orang lain. Gue competitor diri sendiri kemarin.", sub: "Level up daily." },
  { text: "Profit is a byproduct of obsessive preparation.", sub: "Prepare accordingly." },
  { text: "Lo lagi di sini, fokus, ngebangun — itu udah lebih dari kebanyakan orang.", sub: "Real talk." },
  { text: "First you build the habit. Then the habit builds you.", sub: "Consistency wins." },
  { text: "Risk taken with knowledge is called investing. Fear is the real loss.", sub: "Stay sharp." },
  { text: "Setiap Rp yang lo kelola dengan bijak adalah langkah ke freedom.", sub: "Keep stacking." },
  { text: "Great things are done by those who refuse ordinary days.", sub: "Today counts." },
  { text: "Your future self is watching how you spend this hour.", sub: "Make it count." },
  { text: "Lo lagi di jalur yang bener. Tetap di sana.", sub: "Trust the process." },
  { text: "The market is always open for those who are ready.", sub: "Be ready." },
  { text: "Compounding works on money, skills, and mindset.", sub: "Invest in all three." },
];

// Curated luxury photo IDs from Unsplash
const PHOTO_IDS = [
  "photo-1486406146926-c627a92ad1ab", // Manhattan aerial
  "photo-1512453979798-5ea266f8880c", // Dubai skyline
  "photo-1470075801209-17f9ec0099cd", // City night lights
  "photo-1497366216548-37526070297c", // Luxury office
  "photo-1449824913935-59a10b8d2000", // Sunrise city
  "photo-1568992687947-868a62a9f521", // Glass architecture
  "photo-1545324418-cc1a3fa10c00", // High-rise interior
  "photo-1600607687939-ce8a6c25118c", // Luxury penthouse
];

// ─── INTERVAL CONFIG ──────────────────────────────────────────────────────────
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 min
const MAX_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const TOAST_DURATION_MS = 7000;
const FADE_MS = 600;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function AffirmationToast() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);

  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => { setVisible(false); setFading(false); }, FADE_MS);
  }, []);

  const show = useCallback(() => {
    setCurrent(Math.floor(Math.random() * AFFIRMATIONS.length));
    setPhotoIdx(Math.floor(Math.random() * PHOTO_IDS.length));
    setVisible(true);
    setFading(false);
    // Auto-dismiss
    setTimeout(dismiss, TOAST_DURATION_MS);
  }, [dismiss]);

  useEffect(() => {
    // First toast after 90 seconds (so not too immediate)
    const first = setTimeout(show, 90_000);

    let interval: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      interval = setTimeout(() => { show(); schedule(); }, delay);
    };
    schedule();

    return () => { clearTimeout(first); clearTimeout(interval); };
  }, [show]);

  if (!visible) return null;

  const aff = AFFIRMATIONS[current];
  const photoId = PHOTO_IDS[photoIdx];

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 300,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(12px) scale(0.97)" : "translateY(0) scale(1)",
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1), transform ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1)`,
        animation: !fading ? "auraSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : undefined,
      }}
    >
      {/* Background photo */}
      <div style={{ position: "relative", height: 130 }}>
        <img
          src={`https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=75`}
          alt=""
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: "brightness(0.45) saturate(1.2)",
          }}
        />
        {/* Gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)",
        }} />
        {/* ZERØ badge */}
        <div style={{
          position: "absolute", top: 10, left: 12,
          fontFamily: "Space Mono, monospace",
          fontSize: 8,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
        }}>
          ZERØ AURA
        </div>
        {/* Dismiss hint */}
        <div style={{
          position: "absolute", top: 8, right: 10,
          fontSize: 16, color: "rgba(255,255,255,0.3)",
          lineHeight: 1,
        }}>
          ×
        </div>
      </div>

      {/* Text content */}
      <div style={{
        padding: "14px 16px 16px",
        background: "rgba(12, 12, 20, 0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <p style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.90)",
          lineHeight: 1.5,
          marginBottom: 6,
          letterSpacing: "0.01em",
        }}>
          {aff.text}
        </p>
        <p style={{
          fontFamily: "Space Mono, monospace",
          fontSize: 9,
          letterSpacing: "0.12em",
          color: "rgba(201,168,76,0.7)",
          textTransform: "uppercase",
        }}>
          {aff.sub}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        height: 2,
        background: "rgba(201,168,76,0.6)",
        animation: `auraProgress ${TOAST_DURATION_MS}ms linear forwards`,
        borderRadius: "0 0 16px 16px",
      }} />

      <style>{`
        @keyframes auraSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes auraProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
