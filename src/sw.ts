/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { saveSharedData, SharedFileItem, clearOldSharedData } from './utils/shareStorage';

declare const self: ServiceWorkerGlobalScope;

// 1. Clean up outdated caches from previous versions
cleanupOutdatedCaches();

// 2. Workbox precache injection point
precacheAndRoute(self.__WB_MANIFEST || []);

// 3. Immediate activation on update
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      // Clean up stale shared records older than 10 minutes
      await clearOldSharedData(10 * 60 * 1000);
    })()
  );
});

// 4. Web Share Target POST request interception
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept POST request sent from OS Share Sheet to /share-target
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const title = formData.get('title')?.toString() || '';
          const text = formData.get('text')?.toString() || '';
          const sharedUrl = formData.get('url')?.toString() || '';

          const files: SharedFileItem[] = [];
          const candidateKeys = ['images', 'image', 'photos', 'photo', 'files', 'file'];

          for (const key of candidateKeys) {
            const fileList = formData.getAll(key);
            for (const item of fileList) {
              if (typeof item === 'object' && item !== null && 'size' in item) {
                const blobItem = item as unknown as Blob;
                const fileName = 'name' in item ? (item as any).name : `shared_image_${Date.now()}.jpg`;
                files.push({
                  name: fileName,
                  type: blobItem.type || 'image/jpeg',
                  data: blobItem,
                });
              }
            }
          }

          // Generate unique shared session identifier
          const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

          // Store payload in IndexedDB (accessible by both ServiceWorker and Window)
          await saveSharedData({
            id: shareId,
            title,
            text,
            url: sharedUrl,
            files,
            timestamp: Date.now(),
          });

          // W3C Web Share Target Standard: HTTP 303 See Other redirect to GET handler
          return Response.redirect(`/share-target?sharedId=${shareId}`, 303);
        } catch (error) {
          console.error('[ServiceWorker] Failed to process Web Share Target POST:', error);
          // Fallback to GET route with error indicator
          return Response.redirect('/share-target?error=post_failed', 303);
        }
      })()
    );
  }
});
