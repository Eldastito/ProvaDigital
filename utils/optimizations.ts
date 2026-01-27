/**
 * Performance Optimizations Utils
 * 
 * Utilitários para otimização de performance.
 * Sprint 0 - Parte 3
 */

/**
 * Debounce - Aguarda execução até que pare de ser chamada
 * Útil para: inputs de busca, resize events, scroll events
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle - Limita a taxa de execução
 * Útil para: scroll events, mouse move, continuous updates
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * MemoizeOne - Memoriza resultado da última chamada
 * Útil para: cálculos pesados, transformações de dados
 */
export function memoizeOne<T extends (...args: any[]) => any>(
    func: T
): T {
    let lastArgs: any[] | null = null;
    let lastResult: ReturnType<T> | null = null;

    return ((...args: Parameters<T>) => {
        if (
            lastArgs &&
            args.length === lastArgs.length &&
            args.every((arg, index) => arg === lastArgs![index])
        ) {
            return lastResult;
        }

        lastArgs = args;
        lastResult = func(...args);
        return lastResult;
    }) as T;
}

/**
 * Debounced Value Hook - React hook para valores debounced
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Batch operations - Agrupa múltiplas operações em uma
 */
export class BatchOperations<T, R> {
    private queue: T[] = [];
    private timer: NodeJS.Timeout | null = null;
    private processor: (items: T[]) => Promise<R[]>;
    private delay: number;

    constructor(processor: (items: T[]) => Promise<R[]>, delay: number = 100) {
        this.processor = processor;
        this.delay = delay;
    }

    add(item: T): Promise<R> {
        return new Promise<R>((resolve, reject) => {
            const index = this.queue.length;
            this.queue.push(item);

            if (this.timer) {
                clearTimeout(this.timer);
            }

            this.timer = setTimeout(async () => {
                const items = [...this.queue];
                this.queue = [];
                this.timer = null;

                try {
                    const results = await this.processor(items);
                    resolve(results[index]);
                } catch (error) {
                    reject(error);
                }
            }, this.delay);
        });
    }
}

/**
 * Cache simples com TTL
 */
export class SimpleCache<T> {
    private cache = new Map<string, { value: T; expiry: number }>();

    set(key: string, value: T, ttlMs: number): void {
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttlMs
        });
    }

    get(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * IndexedDB Cleanup - Limpar dados antigos
 */
export async function cleanOldIndexedDBData(
    dbName: string,
    storeName: string,
    daysOld: number = 7
): Promise<number> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
            let deletedCount = 0;

            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = (event: any) => {
                const cursor = event.target.result;

                if (cursor) {
                    const record = cursor.value;

                    // Assumindo que o registro tem um campo 'timestamp'
                    if (record.timestamp && record.timestamp < cutoffDate) {
                        cursor.delete();
                        deletedCount++;
                    }

                    cursor.continue();
                } else {
                    // Finished
                    db.close();
                    console.log(`🧹 Limpeza IndexedDB: ${deletedCount} registros removidos`);
                    resolve(deletedCount);
                }
            };

            cursorRequest.onerror = () => {
                db.close();
                reject(cursorRequest.error);
            };
        };
    });
}

/**
 * Lazy Image Loading - Carregar imagens sob demanda
 */
export function setupLazyImages(): void {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    const src = img.getAttribute('data-src');

                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach((img) => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Performance Monitor - Monitorar performance da aplicação
 */
export class PerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();

    mark(name: string): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(Date.now());
    }

    measure(name: string, startMark: string, endMark?: string): number {
        const startTimes = this.metrics.get(startMark);
        const endTimes = endMark ? this.metrics.get(endMark) : null;

        if (!startTimes || startTimes.length === 0) {
            return 0;
        }

        const start = startTimes[startTimes.length - 1];
        const end = endTimes && endTimes.length > 0
            ? endTimes[endTimes.length - 1]
            : Date.now();

        return end - start;
    }

    getAverage(markName: string): number {
        const times = this.metrics.get(markName);
        if (!times || times.length === 0) return 0;

        const sum = times.reduce((a, b) => a + b, 0);
        return sum / times.length;
    }

    report(): void {
        console.group('📊 Performance Report');
        this.metrics.forEach((times, name) => {
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            console.log(`${name}: ${avg.toFixed(2)}ms (${times.length} samples)`);
        });
        console.groupEnd();
    }

    clear(): void {
        this.metrics.clear();
    }
}

/**
 * Request Deduplication - Evitar requisições duplicadas
 */
export class RequestDeduplicator<T> {
    private pending = new Map<string, Promise<T>>();

    async deduplicate(key: string, fetcher: () => Promise<T>): Promise<T> {
        // Se já existe uma requisição pendente, retorna ela
        if (this.pending.has(key)) {
            return this.pending.get(key)!;
        }

        // Criar nova promise
        const promise = fetcher().finally(() => {
            this.pending.delete(key);
        });

        this.pending.set(key, promise);
        return promise;
    }
}

/**
 * Virtual Scroll Helper - Renderizar apenas itens visíveis
 */
export function calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 3
): { start: number; end: number } {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems, visibleEnd + overscan);

    return { start, end };
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const requestDeduplicator = new RequestDeduplicator();

// React import for hook
import React from 'react';
