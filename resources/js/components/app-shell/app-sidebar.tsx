import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    LayoutGrid,
    Package,
    Settings,
    Tags,
    UtensilsCrossed,
} from 'lucide-react';
import { NavFooter } from '@/components/app-shell/nav-footer';
import { NavMain } from '@/components/app-shell/nav-main';
import { NavUser } from '@/components/app-shell/nav-user';
import AppLogo from '@/components/brand/app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import business from '@/routes/business';
import categories from '@/routes/categories';
import menu from '@/routes/menu';
import order from '@/routes/order';
import paket from '@/routes/paket';
import report from '@/routes/report';
import schedule from '@/routes/schedule';
import type { NavItem, NavLinkItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Kategori',
        href: categories.index(),
        icon: Tags,
        match: ['/admin/kategori'],
    },
    {
        title: 'Menu',
        href: menu.index(),
        icon: UtensilsCrossed,
        match: ['/admin/menu'],
    },
    {
        title: 'Paket',
        href: paket.index(),
        icon: Package,
        match: ['/admin/paket'],
    },
    {
        title: 'Order',
        href: order.index(),
        icon: ClipboardList,
        match: ['/admin/order'],
    },
    {
        title: 'Jadwal',
        href: schedule.index(),
        icon: CalendarDays,
        match: ['/admin/jadwal'],
    },
    {
        title: 'Laporan',
        href: report.index().url,
        icon: BarChart3,
        match: ['/admin/laporan'],
    },
    {
        title: 'Pengaturan',
        href: business.edit(),
        icon: Settings,
        match: ['/admin/settings'],
    },
];

const footerNavItems: NavLinkItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: FolderGit2,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <div className="group/sidebar-header relative flex h-12 items-center">
                    <div className="flex min-w-0 flex-1 items-center overflow-hidden group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:group-hover/sidebar-header:hidden group-data-[collapsible=icon]:[&>div]:gap-0 group-data-[collapsible=icon]:[&>div]:min-w-0 group-data-[collapsible=icon]:[&>div]:overflow-hidden group-data-[collapsible=icon]:[&>div>span]:size-8 group-data-[collapsible=icon]:[&>div>span>svg]:size-8">
                        <AppLogo />
                    </div>
                    <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:-translate-x-1/2 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:group-hover/sidebar-header:flex" />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
