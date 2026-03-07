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

// Estratégia de fetch: Strict Offline (Bloqueio de rede externa)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.');

    // Bloqueio Air-Gapped: Se tentar sair para a internet fora da rede privada, bloqueia
    if (!isLocal && !url.hostname.includes('supabase')) {
        console.warn('🛑 [SW] Bloqueio Air-Gapped: Tentativa de conexão externa abortada:', url.hostname);
        event.respondWith(new Response('Conexão Externa Bloqueada por Segurança', { status: 403 }));
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
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
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
