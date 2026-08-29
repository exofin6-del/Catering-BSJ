import { router } from '@inertiajs/react';
import { useEffect } from 'react';

const STORAGE_KEY = 'scroll_positions';
const MAX_ENTRIES = 50;

function getScrollMap(): Record<string, number> {
    try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
        return {};
    }
}

function saveScrollMap(map: Record<string, number>): void {
    try {
        // Trim to max entries (keep most recent)
        const keys = Object.keys(map);

        if (keys.length > MAX_ENTRIES) {
            const trimmed: Record<string, number> = {};
            keys.slice(-MAX_ENTRIES).forEach((k) => {
                trimmed[k] = map[k];
            });
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        }
    } catch {
        // sessionStorage unavailable (private browsing, storage full, etc.)
    }
}

/**
 * Saves the current page's scroll position before navigation,
 * then restores it when the user returns to that URL.
 *
 * Works with body-scroll layouts (no overflow container needed).
 * Safe to mount multiple times — only one listener is active at a time.
 */
export function useScrollRestoration(): void {
    useEffect(() => {
        // Detect if this mount is caused by a manual page reload (F5 / Refresh)
        const isReload =
            window.performance &&
            window.performance.getEntriesByType('navigation')[0]
                ? (
                      window.performance.getEntriesByType(
                          'navigation',
                      )[0] as PerformanceNavigationTiming
                  ).type === 'reload'
                : window.performance.navigation.type === 1;

        // If it's a manual reload, let browser's native scroll restoration handle it smoothly.
        if (isReload) {
            return;
        }

        // Restore scroll for the current URL on mount (only for Inertia SPA navigation)
        const currentUrl = window.location.pathname + window.location.search;
        const map = getScrollMap();
        const savedY = map[currentUrl];

        if (savedY !== undefined && savedY > 0) {
            // requestAnimationFrame ensures the page has painted before scrolling
            const rafId = requestAnimationFrame(() => {
                window.scrollTo({ top: savedY, behavior: 'instant' });
            });

            return () => cancelAnimationFrame(rafId);
        }
    }, []);

    useEffect(() => {
        // Save scroll position before each navigation away
        const removeBeforeListener = router.on('before', () => {
            const currentUrl =
                window.location.pathname + window.location.search;
            const y = window.scrollY;
            const map = getScrollMap();

            if (y > 0) {
                map[currentUrl] = y;
            } else {
                delete map[currentUrl];
            }

            saveScrollMap(map);
        });

        return removeBeforeListener;
    }, []);
}
