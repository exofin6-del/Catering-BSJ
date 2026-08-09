import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { CategoryRecord } from '@/types';

import {
    CategoryActions,
    CategoryMark,
    CategoryStatusBadge,
    CategoryTypeBadge,
    CategoryUsage,
} from './category-table-parts';
import type { CategoryTableActions } from './category-table-parts';

type CategoryCardProps = CategoryTableActions & {
    category: CategoryRecord;
    canMove?: boolean;
    rowCount?: number;
    rowIndex?: number;
};

export function CategoryCard({
    category,
    canMove = false,
    rowCount = 0,
    rowIndex = 0,
    onDelete,
    onEdit,
    onMove,
}: CategoryCardProps) {
    const disableMoveUp = !canMove || !onMove || rowIndex <= 0;
    const disableMoveDown = !canMove || !onMove || rowIndex >= rowCount - 1;

    return (
        <Card className="w-full max-w-full min-w-0 gap-0 overflow-hidden rounded-none border-none bg-transparent py-0 shadow-none">
            <div className="flex w-full min-w-0 items-start gap-3 overflow-hidden py-3">
                <CategoryMark category={category} className="size-14" />

                <div className="flex min-h-14 min-w-0 flex-1 items-center gap-2 overflow-hidden border-b pb-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
                        {/* Baris 1: Nama & Badge (Tipe + Status) */}
                        <div className="flex min-w-0 items-center justify-between gap-2">
                            <CardTitle className="min-w-0 flex-1 truncate text-sm leading-tight font-bold">
                                {category.name}
                            </CardTitle>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <CategoryTypeBadge category={category} />
                                <CategoryStatusBadge category={category} />
                            </div>
                        </div>

                        {/* Baris 2: Slug & Pemakaian */}
                        <div className="flex min-w-0 items-center justify-between gap-2">
                            <CardDescription className="min-w-0 flex-1 truncate text-xs leading-tight font-medium text-muted-foreground">
                                {category.slug}
                            </CardDescription>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <CategoryUsage category={category} />
                            </div>
                        </div>
                    </div>

                    <div className="flex h-14 shrink-0 items-center justify-center">
                        <CategoryActions
                            category={category}
                            disableMoveUp={disableMoveUp}
                            disableMoveDown={disableMoveDown}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onMove={onMove}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}
