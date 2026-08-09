import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Eye,
    MoreVertical,
    Pencil,
    Trash2,
    Utensils,
    Star,
} from 'lucide-react';

import { DataTableDetailEditQuickActions } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import menu from '@/routes/menu';
import type { MenuItem } from '@/types';

import {
    formatMenuPrice,
    menuDiscountPercentage,
    resolveMenuPrice,
} from '../../utils/menu-price';

export type MenuTableActions = {
    onActiveChange?: (item: MenuItem, isActive: boolean) => void;
    onDelete?: (item: MenuItem) => void;
    onEdit?: (item: MenuItem) => void;
    onMove?: (item: MenuItem, direction: 'up' | 'down') => void;
    onView?: (item: MenuItem) => void;
};

export function MenuRecommendedBadge({
    className,
    iconOnly = false,
}: {
    className?: string;
    iconOnly?: boolean;
}) {
    return (
        <Badge
            aria-label={iconOnly ? 'Rekomendasi' : undefined}
            variant="secondary"
            className={cn(
                'shrink-0 rounded-lg',
                iconOnly
                    ? 'flex size-5 items-center justify-center p-0'
                    : 'flex h-5 items-center gap-1 px-2 text-[12px] leading-none font-medium',
                className,
            )}
        >
            {iconOnly ? (
                <Star className="size-3 fill-current" />
            ) : (
                <>
                    <Star className="size-3 fill-current" />
                    Rekomendasi
                </>
            )}
        </Badge>
    );
}

export function MenuName({ item }: { item: MenuItem }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <MenuThumbnail item={item} />
            <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                        {item.name}
                    </span>
                    {item.is_recommended ? (
                        <MenuRecommendedBadge className="hidden sm:flex" />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="truncate">{menuSubtitle(item)}</span>
                </div>
            </div>
        </div>
    );
}

export function MenuThumbnail({
    item,
    className,
}: {
    item: MenuItem;
    className?: string;
}) {
    const imageUrl =
        item.primary_image ??
        item.images?.find((image) => image.is_primary)?.image_url ??
        item.images?.[0]?.image_url;

    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted ${className ?? 'size-12'}`}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={item.name}
                    className="size-full object-cover"
                    loading="lazy"
                />
            ) : (
                <Utensils className="size-5 text-muted-foreground" />
            )}
        </div>
    );
}

export function MenuPrice({
    item,
    className,
    stacked = false,
}: {
    item: MenuItem;
    className?: string;
    stacked?: boolean;
}) {
    const price = resolveMenuPrice(item);
    const discountPercent = menuDiscountPercentage(
        price.originalPrice,
        price.displayPrice,
    );

    return (
        <div
            className={`${stacked ? 'flex flex-col items-start gap-1' : 'flex flex-wrap items-baseline gap-2'} ${className ?? ''}`}
        >
            <div className="text-sm font-medium">
                {formatMenuPrice(price.displayPrice)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
                {price.hasPromo ? (
                    <>
                        <span className="text-xs text-muted-foreground line-through">
                            {formatMenuPrice(price.originalPrice)}
                        </span>
                        {discountPercent > 0 ? (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 text-[11px] leading-none"
                            >
                                -{discountPercent}%
                            </Badge>
                        ) : null}
                    </>
                ) : (
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Harga normal
                    </span>
                )}
            </div>
        </div>
    );
}

export function MenuStatusBadge({
    className,
    item,
}: {
    className?: string;
    item: MenuItem;
}) {
    const isActive = Boolean(item.is_active);

    return (
        <Badge
            variant={isActive ? 'secondary' : 'outline'}
            className={className}
        >
            {isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
    );
}

export function MenuStatusControl({
    item,
    onActiveChange,
    showLabel = true,
}: {
    item: MenuItem;
    onActiveChange?: (item: MenuItem, isActive: boolean) => void;
    showLabel?: boolean;
}) {
    const isActive = Boolean(item.is_active);
    const statusLabel = isActive ? 'Aktif' : 'Nonaktif';
    const checkbox = (
        <Checkbox
            checked={isActive}
            disabled={!onActiveChange}
            aria-label={`${isActive ? 'Nonaktifkan' : 'Aktifkan'} ${item.name}`}
            onCheckedChange={(value) => onActiveChange?.(item, value === true)}
        />
    );

    if (!showLabel) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">{checkbox}</span>
                </TooltipTrigger>
                <TooltipContent>{statusLabel}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <MenuStatusBadge item={item} />
            {checkbox}
        </div>
    );
}

export function MenuActions({
    disableMoveDown = true,
    disableMoveUp = true,
    item,
    onDelete,
    onEdit,
    onMove,
    onView,
}: MenuTableActions & {
    disableMoveDown?: boolean;
    disableMoveUp?: boolean;
    item: MenuItem;
    triggerClassName?: string;
}) {
    const itemId = item.id;
    const hasRoute = itemId !== undefined;
    const viewHref = !onView && hasRoute ? menu.show(itemId) : undefined;
    const editHref = !onEdit && hasRoute ? menu.edit(itemId) : undefined;

    return (
        <div className="flex items-center justify-end gap-1.5">
            <DataTableDetailEditQuickActions
                editHref={editHref}
                item={item}
                onEdit={onEdit}
                onView={onView}
                prefetch
                viewHref={viewHref}
                viewLabel="Lihat detail"
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex size-8 shrink-0 appearance-none items-center justify-center border-none bg-transparent p-0 text-muted-foreground shadow-none ring-0 outline-none hover:text-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent"
                    >
                        <MoreVertical className="size-5" />
                        <span className="sr-only">Buka aksi menu</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            disabled={!onView && !hasRoute}
                            onSelect={() => {
                                if (onView) {
                                    onView(item);
                                }
                            }}
                            asChild={!onView && hasRoute}
                        >
                            {!onView && itemId !== undefined ? (
                                <Link href={menu.show(itemId)} prefetch>
                                    <Eye />
                                    Lihat detail
                                </Link>
                            ) : (
                                <>
                                    <Eye />
                                    Lihat detail
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!onEdit && !hasRoute}
                            onSelect={() => {
                                if (onEdit) {
                                    onEdit(item);
                                }
                            }}
                            asChild={!onEdit && hasRoute}
                        >
                            {!onEdit && itemId !== undefined ? (
                                <Link href={menu.edit(itemId)} prefetch>
                                    <Pencil />
                                    Edit
                                </Link>
                            ) : (
                                <>
                                    <Pencil />
                                    Edit
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            disabled={disableMoveUp}
                            onSelect={() => onMove?.(item, 'up')}
                        >
                            <ArrowUp />
                            Naikkan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={disableMoveDown}
                            onSelect={() => onMove?.(item, 'down')}
                        >
                            <ArrowDown />
                            Turunkan
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        disabled={!onDelete}
                        onSelect={() => onDelete?.(item)}
                    >
                        <Trash2 />
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function menuSubtitle(item: MenuItem): string {
    const categoryName = item.menu_category?.name ?? 'Tanpa kategori';
    const minOrder = item.min_order ?? 1;

    return `${categoryName} | Min. ${minOrder} porsi`;
}
