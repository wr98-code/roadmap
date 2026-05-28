import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "icons/*.png"],
      manifest: {
        name: "ZERØ COMMAND",
        short_name: "ZERØ",
        description: "ZERØ BUILD LAB — Personal Command Center",
        theme_color: "#0d0d18",
        background_color: "#0d0d18",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["productivity", "finance", "utilities"],
        shortcuts: [
          {
            name: "My Day",
            short_name: "My Day",
            description: "Open daily checklist",
            url: "/?page=my-day",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Trading",
            short_name: "Trading",
            description: "Open trading dashboard",
            url: "/?page=trading",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Keuangan",
            short_name: "Keuangan",
            description: "Open financial tracker",
            url: "/?page=keuangan",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        // Cache semua aset static
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Offline fallback ke index.html
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        // Cache strategies
        runtimeCaching: [
          {
            // API calls — Network first, fallback ke cache
            urlPattern: /^\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "zero-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 hari
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
              },
            },
          },
        ],
        // Skip waiting — update langsung tanpa nunggu reload
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // Matiin di dev biar ga ganggu HMR
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));
