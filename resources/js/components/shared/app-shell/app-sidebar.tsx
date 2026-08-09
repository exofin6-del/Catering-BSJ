import { Link } from '@inertiajs/react';
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
import { NavFooter } from '@/components/shared/app-shell/nav-footer';
import { NavMain } from '@/components/shared/app-shell/nav-main';
import { NavUser } from '@/components/shared/app-shell/nav-user';
import AppLogo from '@/components/shared/brand/app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
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
        match: ['/kategori'],
    },
    {
        title: 'Menu',
        href: menu.index(),
        icon: UtensilsCrossed,
        match: ['/menu'],
    },
    {
        title: 'Paket',
        href: paket.index(),
        icon: Package,
        match: ['/paket'],
    },
    {
        title: 'Order',
        href: order.index(),
        icon: ClipboardList,
        match: ['/order'],
    },
    {
        title: 'Jadwal',
        href: schedule.index(),
        icon: CalendarDays,
        match: ['/jadwal'],
    },
    {
        title: 'Laporan',
        href: report.index().url,
        icon: BarChart3,
        match: ['/laporan'],
    },
    {
        title: 'Pengaturan',
        href: business.edit(),
        icon: Settings,
        match: ['/settings'],
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
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
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
