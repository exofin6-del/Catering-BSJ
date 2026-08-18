import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    interface PageProps {
        name?: string;
        auth: Auth;
        sidebarOpen?: boolean;
        business: {
            business_name: string;
            description: string | null;
            whatsapp_number: string | null;
        };
    }
}
