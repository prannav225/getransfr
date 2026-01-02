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
    // We respond with a simple script that redirects to GET.
    // This avoids the server-side 405 error on static hosts like Vercel.
    // The shared files are still preserved in the browser's launchQueue.
    event.respondWith(
      new Response(
        '<script>window.location.href="/?share-target=true"</script>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    );
  }
});

