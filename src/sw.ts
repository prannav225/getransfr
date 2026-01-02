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
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll('files');
        
        if (files.length > 0) {
          // Open IndexedDB to store files temporarily
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('SharedFilesDB', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('files');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          // Store files as an array
          await new Promise((resolve, reject) => {
            const transaction = db.transaction('files', 'readwrite');
            transaction.objectStore('files').put(files, 'pending_share');
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
          });
        }
        
        // Redirect to a clean GET URL
        return Response.redirect('/?share-target=true', 303);
      } catch (err) {
        console.error('[SW] Share failure:', err);
        return Response.redirect('/?share-error=true', 303);
      }
    })());
  }
});

