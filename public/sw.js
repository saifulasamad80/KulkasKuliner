const CACHE_NAME = 'kulkaskuliner-v2';

// Aset statis yang mutlak harus ada untuk PWA
const urlsToCache = [
  '/',
  '/cart',
  '/manifest.json',
  '/kulkul.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = { title: 'KulkasKuliner', body: 'Ada pembaruan baru.', url: '/admin' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Payload yang rusak tidak boleh membuat service worker mati.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'kulkaskuliner-order',
      data: { url: data.url || '/admin' },
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/admin', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) {
        void existing.navigate(targetUrl);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. BYPASS MUTLAK: Jangan pernah sentuh URL Admin, Supabase API, atau file internal Vercel/Next.js
  if (
    url.pathname.startsWith('/admin') ||
    url.hostname.includes('supabase.co') ||
    request.method !== 'GET'
  ) {
    return; // Biarkan browser yang mengurus langsung
  }

  // 2. NETWORK-FIRST (Fallback to Cache): Untuk navigasi HTML (Katalog & Cart)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response.ok) return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // Jika offline, berikan versi cache
          return caches.match(request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 3. CACHE-FIRST (Fallback to Network): Untuk gambar (jpeg, png) dan font saja
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        });
      })
    );
  }
});
