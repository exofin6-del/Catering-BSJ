import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';
import type { NavItemHref } from '@/types/navigation';

export type AppLayoutAction = {
    content?: ReactNode;
    label: string;
    href?: NavItemHref;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    icon?:
        | 'circle-dollar-sign'
        | 'download'
        | 'pencil'
        | 'plus'
        | 'check'
        | 'check-circle';
    native?: boolean;
    variant?: 'default' | 'outline' | 'success';
};

export type AppLayoutBack = {
    label?: string;
    href: NavItemHref;
};

export type AppLayoutProps = {
    action?: AppLayoutAction;
    actions?: AppLayoutAction[];
    back?: AppLayoutBack;
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};
