/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope;

// Immediate Activation
self.skipWaiting();
self.clients.claim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Robust Share Target Handler
 * Catches POST requests specifically for the Getransfr Share Target.
 */
registerRoute(
  ({ url, request }) => {
    // Intercept POSTs to either /_share or root / to prevent 405s
    return (
      request.method === "POST" &&
      (url.pathname === "/_share" || url.pathname === "/")
    );
  },
  async ({ request }) => {
    try {
      const formData = await request.formData();
      const files = formData.getAll("files");

      if (files.length > 0) {
        // Use a Promise-based IndexedDB wrapper for reliability
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open("SharedFilesDB", 2); // Version bump for fresh state
          req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains("files")) {
              req.result.createObjectStore("files");
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        await new Promise((resolve, reject) => {
          const tx = db.transaction("files", "readwrite");
          tx.objectStore("files").put(files, "pending_share");
          tx.oncomplete = resolve;
          tx.onerror = reject;
        });
      }

      // Redirect with a specific marker so the UI knows to look for files
      return Response.redirect("/?share-target=true", 303);
    } catch (err) {
      console.error("[SW] Share Interception Failed:", err);
      return Response.redirect("/?share-error=true", 303);
    }
  },
  "POST"
);
