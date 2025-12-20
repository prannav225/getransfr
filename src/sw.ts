import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

(self as any).skipWaiting();
(self as any).clientsClaim();

// Handle Share Target
(self as any).addEventListener('fetch', (event: any) => {
  if (event.request.method === 'POST' && event.request.url.includes('/')) {
    // This is likely a share target request
    event.respondWith(
      (async () => {
        // We redirect to /?shared=true
        // The launchQueue in Home.tsx will pick up the files if supported
        // Or we could store them in IDB, but that's overkill for now
        return Response.redirect('/?shared=true', 303);
      })()
    );
  }
});
