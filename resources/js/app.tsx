import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import SettingsLayout from '@/features/settings/layouts/settings-layout';
import AdminLayout from '@/layouts/admin-layout';
import AuthLayout from '@/layouts/auth-layout';
import CustomerLayout from '@/layouts/customer/customer-layout';
import PublicLayout from '@/layouts/public-layout';
import { initializeTheme } from '@/lib/hooks/use-appearance';
import { useFlashToast } from '@/lib/hooks/use-flash-toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

declare global {
    interface Window {
        __inertiaAppBootstrapped?: boolean;
    }
}

function AppProviders({ children }: { children: React.ReactNode }) {
    useFlashToast();

    return (
        <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
        </TooltipProvider>
    );
}

// Idempotency guard: in Vite dev, HMR can re-execute this entry module after
// page-graph changes. Without the guard, createInertiaApp() would run twice and
// mount two independent React roots — duplicating every layout-level UI such as
// the customer login dialog. A fresh page load resets the flag, so production
// behavior is unaffected.
if (!window.__inertiaAppBootstrapped) {
    window.__inertiaAppBootstrapped = true;

    createInertiaApp({
        pages: {
            path: './pages',
            extension: '.tsx',
        },

        title: (title) => (title ? `${title} - ${appName}` : appName),

        layout: (name) => {
            // Standalone full-screen page without a layout
            if (name === 'customersV2/checkout') {
                return null;
            }

            if (name.startsWith('customersV2/')) {
                return CustomerLayout;
            }

            switch (true) {
                case name === 'welcome':
                    return PublicLayout;

                case name.startsWith('auth/'):
                    return AuthLayout;

                case name.startsWith('settings/'):
                    return [AdminLayout, SettingsLayout];

                default:
                    return AdminLayout;
            }
        },

        strictMode: true,

        withApp(app) {
            return <AppProviders>{app}</AppProviders>;
        },

        progress: {
            color: '#4B5563',
        },
    });
}

// Apply saved theme
initializeTheme();
