import type { CacheEntry } from './types';

const DEFAULT_TTL = 1000 * 60 * 5; // 5 menit

export class MemoryCache<T> {
    private readonly store = new Map<string, CacheEntry<T>>();

    constructor(private readonly ttl = DEFAULT_TTL) {}

    get(key: string): T | undefined {
        const entry = this.store.get(key);

        if (!entry) {
            return undefined;
        }

        if (Date.now() - entry.timestamp > this.ttl) {
            this.store.delete(key);

            return undefined;
        }

        return entry.value;
    }

    set(key: string, value: T): void {
        this.store.set(key, {
            timestamp: Date.now(),
            value,
        });
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    size(): number {
        return this.store.size;
    }
}

/* ============================================================================
 * Shared caches
 * ========================================================================== */

import type { PlaceFeature } from './types';

export const searchCache = new MemoryCache<PlaceFeature[]>();

export const nearbyCache = new MemoryCache<PlaceFeature[]>();
