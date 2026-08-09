import { useLayoutEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';

export default function PublicLayout({ children }: PropsWithChildren) {
    useCustomerTheme();

    // Restore scroll position synchronously before paint (useLayoutEffect)
    useLayoutEffect(() => {
        const handleBeforeUnload = () => {
            sessionStorage.setItem('customer-scroll-y', String(window.scrollY));
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        const savedScrollY = sessionStorage.getItem('customer-scroll-y');

        if (savedScrollY === null) {
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }

        sessionStorage.removeItem('customer-scroll-y');

        const targetScrollY = Number.parseInt(savedScrollY, 10);

        if (Number.isFinite(targetScrollY) && targetScrollY >= 0) {
            const maximumScrollY = Math.max(
                0,
                document.documentElement.scrollHeight - window.innerHeight,
            );

            window.scrollTo(0, Math.min(targetScrollY, maximumScrollY));
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return <>{children}</>;
}
