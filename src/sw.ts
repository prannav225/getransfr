import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

(self as any).skipWaiting();
(self as any).clientsClaim();

// Handle Web Share Target POST requests
(self as any).addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/') {
    event.respondWith(Response.redirect('/?share-target=true', 303));
  }
});

