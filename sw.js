const CACHE_NAME = 'webcheck-v2'; // Cambia il nome ogni volta che fai modifiche importanti
const ASSETS = ['./', './index.html', './app.js', './manifest.json'];

// Installazione: salva i file necessari
self.addEventListener('install', e => {
    self.skipWaiting(); // Forza l'attivazione immediata del nuovo codice
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});
// Strategia Network First: prova il web, se fallisce usa la cache
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

// Pulizia vecchie cache
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});