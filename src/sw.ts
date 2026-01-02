import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

(self as any).skipWaiting();
(self as any).clientsClaim();

// Web Share Target & File Handling is handled via launchQueue in Home.tsx
// We don't need to intercept the POST request here as it can interfere with the browser's
// native delivery of files to the launchQueue consumer.
