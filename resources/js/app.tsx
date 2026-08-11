import { createInertiaApp, router } from '@inertiajs/react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import SettingsLayout from '@/features/settings/layouts/settings-layout';
import AdminLayout from '@/layouts/admin-layout';
import AuthLayout from '@/layouts/auth-layout';
import CustomerLayout from '@/layouts/customer/customer-layout';
import PublicLayout from '@/layouts/public-layout';
import { initializeTheme } from '@/lib/hooks/use-appearance';
import { useFlashToast } from '@/lib/hooks/use-flash-toast';

// NProgress configuration
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.08 });

let nprogressTimeout: ReturnType<typeof setTimeout> | null = null;

router.on('start', () => {
    if (nprogressTimeout) {
        clearTimeout(nprogressTimeout);
    }

    nprogressTimeout = setTimeout(() => {
        NProgress.start();
    }, 250);
});

router.on('progress', (event) => {
    if (event.detail.progress?.percentage) {
        NProgress.set(event.detail.progress.percentage / 100);
    }
});

router.on('finish', () => {
    if (nprogressTimeout) {
        clearTimeout(nprogressTimeout);

        nprogressTimeout = null;
    }

    NProgress.done();
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function AppProviders({ children }: { children: React.ReactNode }) {
    useFlashToast();

    return (
        <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
        </TooltipProvider>
    );
}

createInertiaApp({
    pages: {
        path: './pages',
        extension: '.tsx',
    },

    title: (title) => (title ? `${title} - ${appName}` : appName),

    layout: (name) => {
        // Pages with no layout (standalone full-screen pages)
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

    progress: false,
});

// Apply saved theme
initializeTheme();
