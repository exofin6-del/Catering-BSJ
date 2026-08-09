import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItemHref = NonNullable<InertiaLinkProps['href']>;

type NavItemBase = {
    title: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    match?: string[];
};

export type NavLinkItem = NavItemBase & {
    href: NavItemHref;
    children?: never;
};

export type NavGroupItem = NavItemBase & {
    href?: NavItemHref;
    children: NavLinkItem[];
};

export type NavItem = NavLinkItem | NavGroupItem;
