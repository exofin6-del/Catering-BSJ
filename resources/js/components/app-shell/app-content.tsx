import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({ variant = 'sidebar', children, ...props }: Props) {
    if (variant === 'sidebar') {
        return <SidebarInset {...props}>{children}</SidebarInset>;
    }

    return (
        <main
            className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-0"
            {...props}
        >
            {children}
        </main>
    );
}
