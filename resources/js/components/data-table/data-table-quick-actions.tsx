import { Link } from '@inertiajs/react';
import { Eye, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RouteDefinition } from '@/wayfinder';

import { getDataTableDetailEditQuickActionState } from './data-table-quick-actions-state';

export type DataTableQuickActionTone = 'default' | 'destructive' | 'success';

type DataTableQuickActionBreakpoint =
    | 'always'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl';

const quickActionsBreakpointClasses: Record<
    DataTableQuickActionBreakpoint,
    string
> = {
    '2xl': 'hidden 2xl:flex',
    always: 'flex',
    lg: 'hidden lg:flex',
    md: 'hidden md:flex',
    sm: 'hidden sm:flex',
    xl: 'hidden xl:flex',
};

export function DataTableQuickActions({
    breakpoint = 'xl',
    children,
    className,
}: {
    breakpoint?: DataTableQuickActionBreakpoint;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'items-center gap-1',
                quickActionsBreakpointClasses[breakpoint],
                className,
            )}
        >
            {children}
        </div>
    );
}

export function DataTableQuickActionButton({
    compact = false,
    disabled = false,
    href,
    icon,
    label,
    onClick,
    prefetch = false,
    tone = 'default',
}: {
    compact?: boolean;
    disabled?: boolean;
    href?: RouteDefinition<'get'>;
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    prefetch?: boolean;
    tone?: DataTableQuickActionTone;
}) {
    const className = cn(
        compact
            ? 'size-8 border border-border/60 p-0 shadow-none'
            : 'h-8 gap-1.5 px-2.5 text-xs whitespace-nowrap',
        tone === 'destructive' &&
            'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20',
        tone === 'success' &&
            'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
        tone === 'default' &&
            (compact
                ? 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'),
    );
    const content = compact ? (
        <>
            {icon}
            <span className="sr-only">{label}</span>
        </>
    ) : (
        <>
            {icon}
            {label}
        </>
    );

    const button =
        href && !disabled ? (
            <Button asChild variant="ghost" size="sm" className={className}>
                <Link
                    href={href}
                    prefetch={prefetch}
                    title={label}
                    aria-label={label}
                >
                    {content}
                </Link>
            </Button>
        ) : (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className={className}
                title={label}
                aria-label={label}
                disabled={disabled}
                onClick={onClick}
            >
                {content}
            </Button>
        );

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return button;
}

export function DataTableDetailEditQuickActionButtons<TData>({
    editHref,
    editLabel = 'Edit',
    item,
    onEdit,
    onView,
    prefetch = false,
    viewHref,
    viewLabel = 'Detail',
}: {
    editHref?: RouteDefinition<'get'>;
    editLabel?: string;
    item: TData;
    onEdit?: (item: TData) => void;
    onView?: (item: TData) => void;
    prefetch?: boolean;
    viewHref?: RouteDefinition<'get'>;
    viewLabel?: string;
}) {
    const { canEdit, canView } = getDataTableDetailEditQuickActionState({
        editHref,
        hasEditHandler: Boolean(onEdit),
        hasViewHandler: Boolean(onView),
        viewHref,
    });

    return (
        <>
            {canView ? (
                <DataTableQuickActionButton
                    compact
                    icon={<Eye className="size-3.5" />}
                    href={onView ? undefined : viewHref}
                    label={viewLabel}
                    onClick={onView ? () => onView(item) : undefined}
                    prefetch={prefetch}
                />
            ) : null}
            {canEdit ? (
                <DataTableQuickActionButton
                    compact
                    icon={<Pencil className="size-3.5" />}
                    href={onEdit ? undefined : editHref}
                    label={editLabel}
                    onClick={onEdit ? () => onEdit(item) : undefined}
                    prefetch={prefetch}
                />
            ) : null}
        </>
    );
}

export function DataTableDetailEditQuickActions<TData>({
    breakpoint,
    className,
    editHref,
    editLabel,
    item,
    onEdit,
    onView,
    prefetch,
    viewHref,
    viewLabel,
}: {
    breakpoint?: DataTableQuickActionBreakpoint;
    className?: string;
    editHref?: RouteDefinition<'get'>;
    editLabel?: string;
    item: TData;
    onEdit?: (item: TData) => void;
    onView?: (item: TData) => void;
    prefetch?: boolean;
    viewHref?: RouteDefinition<'get'>;
    viewLabel?: string;
}) {
    const { hasActions } = getDataTableDetailEditQuickActionState({
        editHref,
        hasEditHandler: Boolean(onEdit),
        hasViewHandler: Boolean(onView),
        viewHref,
    });

    if (!hasActions) {
        return null;
    }

    return (
        <DataTableQuickActions breakpoint={breakpoint} className={className}>
            <DataTableDetailEditQuickActionButtons
                editHref={editHref}
                editLabel={editLabel}
                item={item}
                onEdit={onEdit}
                onView={onView}
                prefetch={prefetch}
                viewHref={viewHref}
                viewLabel={viewLabel}
            />
        </DataTableQuickActions>
    );
}
