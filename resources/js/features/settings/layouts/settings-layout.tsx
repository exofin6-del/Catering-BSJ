import { Link } from '@inertiajs/react';
import { Building2, Palette, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/lib/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import business from '@/routes/business';
import { edit } from '@/routes/profile';
import type { NavLinkItem } from '@/types';

const sidebarNavItems: NavLinkItem[] = [
    {
        title: 'Bisnis',
        href: business.edit(),
        icon: Building2,
    },
    {
        title: 'Akun',
        href: edit(),
        icon: UserRound,
    },
    {
        title: 'Tampilan',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="mx-auto w-full max-w-7xl overflow-x-clip px-4 py-3 sm:px-6 sm:py-4 lg:px-4">
            <div className="grid max-w-full min-w-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
                <aside className="z-10 lg:sticky lg:top-20">
                    <nav
                        className="w-full min-w-0 [scrollbar-width:none] overflow-x-auto rounded-lg bg-background/95 backdrop-blur-sm lg:flex lg:w-auto lg:flex-col lg:overflow-visible lg:bg-transparent lg:backdrop-blur-none [&::-webkit-scrollbar]:hidden"
                        aria-label="Pengaturan"
                    >
                        <div className="flex w-full min-w-0 gap-0.5 py-1 lg:flex-col lg:py-0">
                            {sidebarNavItems.map((item, index) => (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'h-9 shrink-0 justify-start gap-2 rounded-md px-3 text-muted-foreground transition-colors lg:w-full',
                                        isCurrentOrParentUrl(item.href)
                                            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground'
                                            : 'hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="size-4" />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </nav>
                </aside>

                <main className="w-full min-w-0 pb-10">
                    <div className="max-w-3xl space-y-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
