import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "G.png",
        "getransfr-logo.png",
      ],
      manifest: {
        name: "Getransfr — Instant File Transfer",
        short_name: "Getransfr",
        description:
          "Fast, secure peer-to-peer file transfer on the same Wi-Fi network. No internet required.",
        theme_color: "#020817",
        background_color: "#020817",
        display: "standalone",
        orientation: "portrait-primary",
        categories: ["productivity", "utilities"],
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        share_target: {
          action: "/_share",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            files: [
              {
                name: "files",
                accept: ["*/*"],
              },
            ],
          },
        },
        file_handlers: [
          {
            action: "/",
            accept: {
              "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
              "video/*": [".mp4", ".mov", ".avi", ".mkv"],
              "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
              "application/pdf": [".pdf"],
              "application/zip": [".zip", ".7z", ".rar"],
              "text/*": [".txt", ".md", ".json", ".csv", ".js", ".ts"],
            },
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "dicebear-avatars-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Don't cache socket.io connections or API calls
        navigateFallback: null,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  server: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-framer": ["framer-motion"],
          "vendor-socket": ["socket.io-client"],
          "vendor-utils": ["lucide-react", "date-fns"],
        },
      },
    },
  },
});
