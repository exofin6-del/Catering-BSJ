import { AppContent } from '@/components/shared/app-shell/app-content';
import { AppShell } from '@/components/shared/app-shell/app-shell';
import { AppSidebar } from '@/components/shared/app-shell/app-sidebar';
import { AppSidebarHeader } from '@/components/shared/app-shell/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    action,
    actions,
    back,
    children,
    breadcrumbs = [],
    title,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader
                    action={action}
                    actions={actions}
                    back={back}
                    breadcrumbs={breadcrumbs}
                    title={title}
                />
                {children}
            </AppContent>
        </AppShell>
    );
}
