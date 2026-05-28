// src/components/PWAInstall.tsx
// ─── ZERØ COMMAND — PWA Install Prompt ───────────────────────────────────────
// Shows install button on desktop (Chrome/Edge/Samsung) and
// Shows "Add to Home Screen" guide on iOS Safari

import { useState, useEffect, useRef } from "react";
import { Download, X, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "unknown">("unknown");
  const dismissed = useRef(false);

  useEffect(() => {
    // Cek apakah udah diinstall
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      setPlatform("ios");
      // iOS Safari ga punya beforeinstallprompt, jadi kita show manual guide
      const isSafari = /safari/.test(ua) && !/chrome/.test(ua) && !/crios/.test(ua);
      const alreadyDismissed = localStorage.getItem("pwa-ios-dismissed") === "1";
      if (isSafari && !alreadyDismissed) {
        // Delay 3 detik biar user settle dulu
        setTimeout(() => setShowBanner(true), 3000);
      }
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Chromium browsers (Chrome, Edge, Samsung, Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);

      const alreadyDismissed = localStorage.getItem("pwa-banner-dismissed") === "1";
      if (!alreadyDismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chromium install flow
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } else if (platform === "ios") {
      // Show iOS manual guide
      setShowIOSGuide(true);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    dismissed.current = true;
    setShowBanner(false);
    setShowIOSGuide(false);
    if (platform === "ios") {
      localStorage.setItem("pwa-ios-dismissed", "1");
    } else {
      localStorage.setItem("pwa-banner-dismissed", "1");
    }
  };

  // Udah diinstall, ga perlu show apapun
  if (isInstalled) return null;

  // iOS guide modal
  if (showIOSGuide) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 16px 24px",
        }}
        onClick={handleDismiss}
      >
        <div
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 16,
            padding: "24px 20px",
            maxWidth: 360,
            width: "100%",
            textAlign: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 8 }}>
            Install ZERØ COMMAND
          </p>
          <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginBottom: 20, lineHeight: 1.5 }}>
            Tambahkan ke Home Screen untuk akses cepat layaknya native app.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
            {[
              { step: "1", icon: "⬆️", text: 'Tap tombol Share di bawah browser (kotak dengan panah ke atas)' },
              { step: "2", icon: "➕", text: 'Scroll ke bawah, pilih "Add to Home Screen"' },
              { step: "3", icon: "✅", text: 'Tap "Add" di pojok kanan atas' },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: "hsl(var(--muted) / 0.5)",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: 13, color: "hsl(var(--foreground))", lineHeight: 1.4 }}>{s.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleDismiss}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Nanti aja
          </button>
        </div>
      </div>
    );
  }

  // Install banner (bottom strip)
  if (!showBanner) return null;

  const isDesktop = platform === "desktop";
  const icon = isDesktop ? <Monitor size={16} /> : <Smartphone size={16} />;
  const label = deferredPrompt
    ? `Install App ${isDesktop ? "(Desktop)" : "(HP)"}`
    : "Add to Home Screen";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        maxWidth: "calc(100vw - 32px)",
        minWidth: 280,
        backdropFilter: "blur(12px)",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: "hsl(var(--primary) / 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "hsl(var(--primary))",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0, fontFamily: "var(--font-sans)" }}>
          ZERØ COMMAND
        </p>
        <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0, marginTop: 1 }}>
          Install untuk akses offline
        </p>
      </div>

      <button
        onClick={handleInstall}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "7px 12px",
          borderRadius: 8,
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <Download size={12} />
        Install
      </button>

      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "hsl(var(--muted-foreground))",
          padding: 4,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
