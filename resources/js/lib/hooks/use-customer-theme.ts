import { usePage } from '@inertiajs/react';
import { useLayoutEffect } from 'react';
import type { CustomerTheme } from '@/features/customers/types/customer-theme';
import { refreshAppearanceTheme } from '@/lib/hooks/use-appearance';
import type { SharedData } from '@/types';

type CustomerThemePageProps = SharedData & {
    customerTheme?: CustomerTheme;
};

/**
 * Applies the admin-configured customer theme to the document root.
 *
 * This hook mirrors the logic in `PublicLayout` so that pages using
 * `CustomerLayout` (customers V2) also respect the theme set by the
 * admin in business settings.
 *
 * It sets `data-customer-theme` on `<html>` which triggers the CSS
 * variable overrides defined in `app.css`. The admin dark-mode class
 * is removed while the customer theme is active so colors stay clean.
 */
export function useCustomerTheme(): void {
    const { customerTheme } = usePage<CustomerThemePageProps>().props;

    useLayoutEffect(() => {
        if (!customerTheme) {
            return;
        }

        const root = document.documentElement;
        root.classList.remove('admin-dark');
        root.style.colorScheme = 'light';
        root.dataset.customerTheme = customerTheme;
    }, [customerTheme]);
}
