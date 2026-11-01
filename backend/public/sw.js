const CACHE_NAME = 'madinagrigest-shell-v1';
const APP_ROOT = '/';

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch(APP_ROOT);
        if (!response.ok) throw new Error(`Impossible de mettre l’application en cache (HTTP ${response.status}).`);
        await cache.put(APP_ROOT, response);

        const manifestResponse = await fetch('/build/manifest.json');
        if (!manifestResponse.ok) {
            throw new Error(`Impossible de lire le manifeste Vite (HTTP ${manifestResponse.status}).`);
        }

        const manifest = await manifestResponse.json();
        const assets = new Set(['/build/manifest.json']);
        for (const entry of Object.values(manifest)) {
            if (entry.file) assets.add(`/build/${entry.file}`);
            for (const asset of [...(entry.css ?? []), ...(entry.assets ?? [])]) {
                assets.add(`/build/${asset}`);
            }
        }

        await cache.addAll([...assets]);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names.filter((name) => name.startsWith('madinagrigest-shell-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(APP_ROOT, response.clone());
                }
                return response;
            } catch {
                const cached = await caches.match(APP_ROOT);
                if (cached) return cached;
                return new Response('Connexion nécessaire pour charger MadinAgriGest.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                });
            }
        })());
        return;
    }

    if (url.pathname.startsWith('/build/')) {
        event.respondWith((async () => {
            const cached = await caches.match(request);
            if (cached) return cached;
            const response = await fetch(request);
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response.clone());
            }
            return response;
        })());
    }
});
