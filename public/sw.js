/**
 * Service Worker - ExamePad PWA
 * 
 * Funcionalidades:
 * - Cache de assets estáticos
 * - Offline fallback
 * - Background sync (futuro)
 * - Push notifications (futuro)
 */

const CACHE_NAME = 'examepad-v2';
const OFFLINE_URL = '/offline.html';

// Assets para cache imediato
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/index.css',
    '/social1.png',
    '/icon-192.png',
    '/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('👷 [SW] Instalando Versão V2...');

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('👷 [SW] Prefetching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );

    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 [SW] Ativando e limpando caches antigos...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && !cacheName.startsWith('examepad-exams-')) {
                        console.log('🗑️ [SW] Deletando cache obsoleto:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Estratégia de fetch: Stale-While-Revalidate (Melhor para apps offline-first)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignora Supabase e APIs externas dinâmicas no cache de assets
    if (event.request.url.includes('supabase') || event.request.url.includes('google-analytics')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch((err) => {
                console.warn('📡 [SW] Falha de rede capturada:', event.request.url);
                return cachedResponse; // Garantia de retorno do cache em caso de erro de rede
            });

            return cachedResponse || fetchPromise;
        }).catch(() => {
            if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
            }
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
