const CACHE_NAME = 'kulkaskuliner-v1.0';

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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. BYPASS MUTLAK: Jangan pernah sentuh URL Admin, Supabase API, atau file internal Vercel/Next.js
  if (
    url.pathname.startsWith('/admin') ||
    url.hostname.includes('supabase.co') ||
    request.method !== 'GET'
  ) {
    return; // Biarkan browser yang mengurus langsung
  }

  // 2. NETWORK-FIRST (Fallback to Cache): Untuk navigasi HTML (Katalog & Cart)
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache diam-diam dengan HTML terbaru
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // Jika offline, berikan versi cache
          return caches.match(request);
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