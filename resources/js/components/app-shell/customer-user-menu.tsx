import { Link, usePage } from '@inertiajs/react';
import { LogIn, LogOut, ShoppingBag } from 'lucide-react';

import { UserInfo } from '@/components/app-shell/user-info';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomerLogin } from '@/features/customers/components/customer-login-dialog';
import { useInitials } from '@/lib/hooks/use-initials';
import { logout, orders } from '@/routes/customerV2';
import type { SharedData } from '@/types';

export function CustomerUserMenu() {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const { showLogin } = useCustomerLogin();

    if (!auth.user) {
        return (
            <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2 rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/5 transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 active:scale-95"
                onClick={showLogin}
            >
                <LogIn className="size-4" />
                Masuk
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Menu akun"
                    className="group size-9 shrink-0 cursor-pointer overflow-hidden rounded-full bg-primary/10 p-0.5 text-primary ring-2 ring-primary/20 transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none"
                >
                    <Avatar className="size-full rounded-full">
                        <AvatarImage
                            src={auth.user.avatar}
                            alt={auth.user.name}
                        />
                        <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-60 rounded-2xl p-2 shadow-lg"
            >
                <DropdownMenuLabel className="p-2 font-normal">
                    <div className="flex items-center gap-2">
                        <UserInfo user={auth.user} showEmail />
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem asChild>
                    <Link
                        href={orders()}
                        className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted focus:bg-muted focus:outline-none"
                    >
                        <ShoppingBag className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="transition-colors group-hover:text-primary">
                            Pesanan Saya
                        </span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted focus:bg-muted focus:outline-none"
                    >
                        <LogOut className="size-4 text-muted-foreground transition-colors group-hover:text-destructive" />
                        <span className="transition-colors group-hover:text-destructive">
                            Keluar
                        </span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
