import type { ScheduleItem } from '../types/schedule-types';

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
    expiresAt: number;
    items: ScheduleItem[];
};

const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<ScheduleItem[]>>();

export function getCachedScheduleItems(key: string): ScheduleItem[] | null {
    const entry = cache.get(key);

    if (!entry) {
        console.debug('[schedule-export-cache] miss', key);

        return null;
    }

    if (entry.expiresAt <= Date.now()) {
        console.debug('[schedule-export-cache] expired', key);
        cache.delete(key);

        return null;
    }

    console.debug(
        '[schedule-export-cache] hit',
        key,
        'count=',
        entry.items.length,
    );

    return entry.items;
}

export function getScheduleExportItems(
    key: string,
    loader: () => Promise<ScheduleItem[]>,
): Promise<ScheduleItem[]> {
    const cachedItems = getCachedScheduleItems(key);

    if (cachedItems !== null) {
        console.debug('[schedule-export-cache] returning cached directly', key);

        return Promise.resolve(cachedItems);
    }

    const pendingRequest = pendingRequests.get(key);

    if (pendingRequest) {
        console.debug('[schedule-export-cache] using pending request', key);

        return pendingRequest;
    }

    console.debug('[schedule-export-cache] starting loader', key);

    const request = loader()
        .then((items) => {
            console.debug(
                '[schedule-export-cache] loader resolved, caching',
                key,
                'count=',
                items.length,
            );
            cache.set(key, {
                expiresAt: Date.now() + CACHE_TTL_MS,
                items,
            });

            return items;
        })
        .finally(() => {
            pendingRequests.delete(key);
            console.debug(
                '[schedule-export-cache] pending request cleared',
                key,
            );
        });

    pendingRequests.set(key, request);
    console.debug('[schedule-export-cache] pending request set', key);

    return request;
}
