import AppLayoutTemplate from '@/layouts/admin/app-sidebar-layout';
import type { AppLayoutAction, AppLayoutBack, BreadcrumbItem } from '@/types';

export default function AdminLayout({
    action,
    actions,
    back,
    breadcrumbs = [],
    children,
    title,
}: {
    action?: AppLayoutAction;
    actions?: AppLayoutAction[];
    back?: AppLayoutBack;
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <AppLayoutTemplate
            action={action}
            actions={actions}
            back={back}
            breadcrumbs={breadcrumbs}
            title={title}
        >
            {children}
        </AppLayoutTemplate>
    );
}
