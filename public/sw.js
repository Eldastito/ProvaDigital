/**
 * Service Worker - ExamePad PWA
 * 
 * Funcionalidades:
 * - Cache de assets estáticos
 * - Offline fallback
 * - Background sync (futuro)
 * - Push notifications (futuro)
 */

const CACHE_NAME = 'examepad-v1';
const OFFLINE_URL = '/offline.html';

// Assets para cache imediato
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );

    // Força ativação imediata
    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Assume controle imediato
    self.clients.claim();
});

// Estratégia de fetch: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
    // Ignora requisições não-GET
    if (event.request.method !== 'GET') return;

    // Ignora requisições para APIs externas
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Se a resposta for válida, clona e salva no cache
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Se falhar (offline), tenta buscar do cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Se for navegação e não tiver cache, mostra página offline
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }

                    // Retorna resposta vazia para outros recursos
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});

// Background Sync (para sincronizar dados quando voltar online)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-results') {
        event.waitUntil(syncResults());
    }
});

/**
 * Sincroniza resultados que estão enfileirados no IndexedDB
 * Requer acesso ao Dexie no Worker ou API nativa de sincronização
 */
async function syncResults() {
    console.log('[SW] Sincronização em segundo plano iniciada...');
    // A implementação real depende do acesso ao IndexedDB compartilhado
    // Geralmente comunicamos com o app via BroadcastChannel ou pegamos dados brutos
}

/**
 * Listener de Mensagens do App para o SW
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PREFETCH_EXAM') {
        const { urls } = event.data;
        console.log('[SW] Recebido comando de prefetch:', urls.length, 'assets');

        event.waitUntil(
            caches.open('examepad-exams-v1').then((cache) => {
                return cache.addAll(urls).catch(err => {
                    console.warn('[SW] Falha em alguns assets no prefetch, continuando...', err);
                });
            })
        );
    }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const urlToOpen = event.notification.data || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Se já tiver uma janela aberta, foca nela
                    for (const client of clientList) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Senão, abre nova janela
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

console.log('[SW] Service Worker loaded with Sync & Cache messaging');
