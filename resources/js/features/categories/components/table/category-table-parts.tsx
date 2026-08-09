import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    MoreVertical,
    Package,
    Pencil,
    Tags,
    Trash2,
    Utensils,
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
import categories from '@/routes/categories';
import type { CategoryRecord } from '@/types';
import { resolveCategoryIconOption } from '../form/constants';

export type CategoryTableActions = {
    onActiveChange?: (category: CategoryRecord, isActive: boolean) => void;
    onDelete?: (category: CategoryRecord) => void;
    onEdit?: (category: CategoryRecord) => void;
    onMove?: (category: CategoryRecord, direction: 'up' | 'down') => void;
};

export function CategoryName({ category }: { category: CategoryRecord }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <CategoryMark category={category} />
            <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                        {category.name}
                    </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {category.slug}
                </p>
            </div>
        </div>
    );
}

export function CategoryMark({
    category,
    className,
}: {
    category: CategoryRecord;
    className?: string;
}) {
    const Icon = category.icon
        ? resolveCategoryIconOption(category.icon).icon
        : category.type === 'menu'
          ? Utensils
          : Package;

    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-sm font-semibold text-muted-foreground ${className ?? 'size-11'}`}
        >
            <Icon className="size-5" />
        </div>
    );
}

export function CategoryTypeBadge({ category }: { category: CategoryRecord }) {
    return (
        <Badge variant={category.type === 'menu' ? 'secondary' : 'outline'}>
            {category.type_label}
        </Badge>
    );
}

export function CategoryStatusBadge({
    category,
    className,
}: {
    category: CategoryRecord;
    className?: string;
}) {
    const isActive = Boolean(category.is_active);

    return (
        <Badge
            variant={isActive ? 'secondary' : 'outline'}
            className={className}
        >
            {isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
    );
}

export function CategoryUsage({
    category,
    stacked = false,
}: {
    category: CategoryRecord;
    stacked?: boolean;
}) {
    if (category.type === 'menu') {
        return (
            <div
                className={
                    stacked
                        ? 'flex flex-col items-start gap-1'
                        : 'flex flex-wrap items-center gap-2'
                }
            >
                <Badge variant="secondary">
                    {category.menu_items_count} menu
                </Badge>
            </div>
        );
    }

    return <Badge variant="secondary">{category.packages_count} paket</Badge>;
}

export function CategoryStatusControl({
    category,
    onActiveChange,
    showLabel = true,
}: {
    category: CategoryRecord;
    onActiveChange?: (category: CategoryRecord, isActive: boolean) => void;
    showLabel?: boolean;
}) {
    const isActive = Boolean(category.is_active);
    const statusLabel = isActive ? 'Aktif' : 'Nonaktif';
    const checkbox = (
        <Checkbox
            checked={isActive}
            disabled={!onActiveChange}
            aria-label={`${isActive ? 'Nonaktifkan' : 'Aktifkan'} ${category.name}`}
            onCheckedChange={(value) =>
                onActiveChange?.(category, value === true)
            }
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
            <CategoryStatusBadge category={category} />
            {checkbox}
        </div>
    );
}

export function CategoryActions({
    category,
    disableMoveDown = true,
    disableMoveUp = true,
    onDelete,
    onEdit,
    onMove,
}: CategoryTableActions & {
    category: CategoryRecord;
    disableMoveDown?: boolean;
    disableMoveUp?: boolean;
}) {
    const editHref = !onEdit
        ? categories.edit([category.type, category.id])
        : undefined;

    return (
        <div className="flex items-center justify-end gap-1.5">
            <DataTableDetailEditQuickActions
                editHref={editHref}
                item={category}
                onEdit={onEdit}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex size-8 shrink-0 appearance-none items-center justify-center border-none bg-transparent p-0 text-muted-foreground shadow-none ring-0 outline-none hover:text-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent"
                    >
                        <MoreVertical className="size-5" />
                        <span className="sr-only">Buka aksi kategori</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onSelect={() => onEdit?.(category)}
                            asChild={!onEdit}
                        >
                            {!onEdit ? (
                                <Link
                                    href={categories.edit([
                                        category.type,
                                        category.id,
                                    ])}
                                    prefetch
                                >
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
                            onSelect={() => onMove?.(category, 'up')}
                        >
                            <ArrowUp />
                            Naikkan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={disableMoveDown}
                            onSelect={() => onMove?.(category, 'down')}
                        >
                            <ArrowDown />
                            Turunkan
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        disabled={!onDelete}
                        onSelect={() => onDelete?.(category)}
                    >
                        <Trash2 />
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function CategoryEmptyIcon() {
    return <Tags className="size-6" />;
}
