import { Link } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    ChevronLeft,
    CircleDollarSign,
    Download,
    Menu,
    Pencil,
    Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Fragment } from 'react';
import { Breadcrumbs } from '@/components/shared/app-shell/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type {
    AppLayoutAction,
    AppLayoutBack,
    BreadcrumbItem as BreadcrumbItemType,
} from '@/types';
import Heading from '../heading';

export function AppSidebarHeader({
    action,
    actions,
    back,
    breadcrumbs = [],
    title,
    showTrigger = true,
    onBack,
}: {
    action?: AppLayoutAction;
    actions?: AppLayoutAction[];
    back?: AppLayoutBack;
    breadcrumbs?: BreadcrumbItemType[];
    title?: string;
    showTrigger?: boolean;
    onBack?: () => void;
}) {
    const resolvedActions = actions ?? (action ? [action] : []);

    return (
        <header className="sticky top-0 z-20 flex h-15 shrink-0 items-center border-b border-sidebar-border/50 bg-sidebar/80 px-4 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:bg-background/80 md:px-6">
            <div className="relative grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1.5">
                {/* MOBILE TITLE CENTER LAYAR */}
                {title ? (
                    <div className="pointer-events-none absolute inset-x-12 top-1/2 z-0 flex -translate-y-1/2 justify-center md:hidden">
                        <div className="max-w-full min-w-0 truncate text-center">
                            <Heading title={title} />
                        </div>
                    </div>
                ) : null}

                {/* LEFT: back / sidebar */}
                <div className="relative z-10 self-center">
                    <div className="flex shrink-0 items-center">
                        {back ? (
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="-ml-2 size-9 hover:bg-transparent"
                            >
                                <Link
                                    href={back.href}
                                    prefetch
                                    aria-label={back.label ?? 'Kembali'}
                                >
                                    <ChevronLeft className="size-7" />
                                </Link>
                            </Button>
                        ) : onBack ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-ml-2 size-9 hover:bg-transparent"
                                onClick={onBack}
                                aria-label="Kembali"
                            >
                                <ChevronLeft className="size-7" />
                            </Button>
                        ) : showTrigger ? (
                            <SidebarTrigger
                                variant="ghost"
                                className="-ml-2 size-9 hover:bg-transparent md:hidden"
                            >
                                <Menu className="size-7" />
                            </SidebarTrigger>
                        ) : null}
                    </div>
                </div>

                {/* CENTER: desktop title + breadcrumb */}
                <div className="min-w-0">
                    <div className="hidden h-7 min-w-0 items-center md:flex">
                        {title ? <Heading title={title} /> : null}
                    </div>

                    <div className="hidden min-w-0 md:block">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>

                {/* RIGHT: actions */}
                <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 self-center">
                    {resolvedActions.map((currentAction) => {
                        if (currentAction.content) {
                            return (
                                <Fragment key={currentAction.label}>
                                    {currentAction.content}
                                </Fragment>
                            );
                        }

                        const ActionIcon = layoutActionIcon(currentAction.icon);
                        const buttonContent = (
                            <>
                                <ActionIcon className="size-5" />
                                <span className="sr-only">
                                    {currentAction.label}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="hidden sm:inline"
                                >
                                    {currentAction.label}
                                </span>
                            </>
                        );

                        if (currentAction.href) {
                            return (
                                <Button
                                    key={currentAction.label}
                                    asChild
                                    size="sm"
                                    variant={
                                        currentAction.variant === 'success'
                                            ? 'ghost'
                                            : currentAction.variant
                                    }
                                    className={cn(
                                        'h-9 px-2.5 sm:px-3',
                                        currentAction.variant === 'success' &&
                                            'border border-emerald-200/50 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
                                    )}
                                >
                                    {currentAction.native ? (
                                        <a href={currentAction.href as string}>
                                            {buttonContent}
                                        </a>
                                    ) : (
                                        <Link
                                            href={currentAction.href}
                                            prefetch
                                        >
                                            {buttonContent}
                                        </Link>
                                    )}
                                </Button>
                            );
                        }

                        return (
                            <Button
                                key={currentAction.label}
                                size="sm"
                                variant={
                                    currentAction.variant === 'success'
                                        ? 'ghost'
                                        : currentAction.variant
                                }
                                className={cn(
                                    'h-9 cursor-pointer px-2.5 sm:px-3',
                                    currentAction.variant === 'success' &&
                                        'border border-emerald-200/50 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
                                )}
                                onClick={currentAction.onClick}
                            >
                                {buttonContent}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}

function layoutActionIcon(icon: AppLayoutAction['icon']): LucideIcon {
    if (icon === 'circle-dollar-sign') {
        return CircleDollarSign;
    }

    if (icon === 'download') {
        return Download;
    }

    if (icon === 'pencil') {
        return Pencil;
    }

    if (icon === 'check') {
        return Check;
    }

    if (icon === 'check-circle') {
        return CheckCircle2;
    }

    return Plus;
}
