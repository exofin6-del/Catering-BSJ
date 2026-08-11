import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const listenerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (listenerRef.current) {
            return;
        }

        listenerRef.current = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });

        return () => {
            listenerRef.current?.();
            listenerRef.current = null;
        };
    }, []);
}
