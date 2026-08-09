import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Eye,
    MoreVertical,
    Package as PackageIcon,
    Pencil,
    Trash2,
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
import paket from '@/routes/paket';
import type { MenuPackage } from '@/types';

import { packageSubtitle } from '../../utils/package-format';
import {
    formatPackagePrice,
    packageDiscountPercentage,
    summarizePackagePrice,
} from '../../utils/package-price';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from '../shared/package-badges';

export type PackageTableActions = {
    onActiveChange?: (item: MenuPackage, isActive: boolean) => void;
    onDelete?: (item: MenuPackage) => void;
    onEdit?: (item: MenuPackage) => void;
    onMove?: (item: MenuPackage, direction: 'up' | 'down') => void;
    onView?: (item: MenuPackage) => void;
};

export function PackageName({ item }: { item: MenuPackage }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <PackageThumbnail item={item} />
            <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                        {item.name}
                    </span>
                    {item.is_recommended ? (
                        <PackageRecommendedBadge className="hidden sm:flex" />
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="truncate">{packageSubtitle(item)}</span>
                </div>
            </div>
        </div>
    );
}

export function PackageThumbnail({
    className,
    item,
}: {
    className?: string;
    item: MenuPackage;
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
                <PackageIcon className="size-5 text-muted-foreground" />
            )}
        </div>
    );
}

export function PackagePrice({
    className,
    item,
    stacked = false,
}: {
    className?: string;
    item: MenuPackage;
    stacked?: boolean;
}) {
    const price = summarizePackagePrice(item);
    const discountPercent = packageDiscountPercentage(
        price.originalPrice,
        price.activePrice,
    );

    return (
        <div
            className={`${stacked ? 'flex flex-col items-start gap-1' : 'flex flex-wrap items-baseline gap-2'} ${className ?? ''}`}
        >
            <div className="text-sm font-medium">
                {price.startsFrom ? 'Mulai ' : ''}
                {formatPackagePrice(price.activePrice)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
                {price.hasDiscount ? (
                    <>
                        <span className="text-xs text-muted-foreground line-through">
                            {formatPackagePrice(price.originalPrice)}
                        </span>
                        {discountPercent > 0 ? (
                            <PackageDiscountBadge
                                discountPercent={discountPercent}
                            />
                        ) : null}
                    </>
                ) : (
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Harga paket
                    </span>
                )}
            </div>
        </div>
    );
}

export function PackageStatusControl({
    item,
    onActiveChange,
    showLabel = true,
}: {
    item: MenuPackage;
    onActiveChange?: (item: MenuPackage, isActive: boolean) => void;
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
            <PackageStatusBadge item={item} />
            {checkbox}
        </div>
    );
}

export function PackageStatusBadge({
    className,
    item,
}: {
    className?: string;
    item: MenuPackage;
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

export function PackageActions({
    disableMoveDown = true,
    disableMoveUp = true,
    item,
    onDelete,
    onEdit,
    onMove,
    onView,
}: PackageTableActions & {
    disableMoveDown?: boolean;
    disableMoveUp?: boolean;
    item: MenuPackage;
}) {
    const itemId = item.id;
    const hasRoute = itemId !== undefined;
    const viewHref = !onView && hasRoute ? paket.show(itemId) : undefined;
    const editHref = !onEdit && hasRoute ? paket.edit(itemId) : undefined;

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
                        <span className="sr-only">Buka aksi paket</span>
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
                                <Link href={paket.show(itemId)} prefetch>
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
                                <Link href={paket.edit(itemId)} prefetch>
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
