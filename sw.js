/*
 * Hanzi Tracker — Service Worker
 * Cache-first for the main app (large single file), network-first for CDN assets.
 */

const CACHE_VERSION = 'hanzi-tracker-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png'
];

// CDN assets that we'll cache opportunistically
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;600;700&family=Baloo+2:wght@400;500;600;700;800&display=swap',
  'https://unpkg.com/pinyin-pro@3.28.1/dist/index.js',
  'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js'
];

// Install — pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — strategy depends on the request
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and Firebase/analytics calls
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com/identitytoolkit') ||
      url.hostname.includes('firestore.googleapis.com')) return;

  // App shell files: cache-first (they're large, update via version bump)
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Google Fonts CSS & font files: stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // CDN JS libraries: stale-while-revalidate
  if (url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Firebase SDK: network-first (must be fresh for auth)
  if (url.hostname.includes('gstatic.com/firebasejs')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Unicode data: cache-first after first successful fetch
  if (url.hostname.includes('unicode.org') ||
      url.hostname.includes('r.jina.ai')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(event.request));
});


// --- Caching strategies ---

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Offline and not cached — return a basic offline page
    return new Response('Offline — please connect to the internet and reload.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}
