import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { MenuPackage } from '@/types';

import { packageSubtitle } from '../../utils/package-format';
import { PackageRecommendedBadge } from '../shared/package-badges';
import {
    PackageActions,
    PackagePrice,
    PackageStatusBadge,
    PackageThumbnail,
} from './package-table-parts';
import type { PackageTableActions } from './package-table-parts';

type PackageCardProps = PackageTableActions & {
    canMove?: boolean;
    item: MenuPackage;
    rowCount: number;
    rowIndex: number;
};

export function PackageCard({
    canMove = false,
    item,
    onDelete,
    onEdit,
    onMove,
    onView,
    rowCount,
    rowIndex,
}: PackageCardProps) {
    const disableMoveUp = !canMove || !onMove || rowIndex <= 0;
    const disableMoveDown = !canMove || !onMove || rowIndex >= rowCount - 1;

    return (
        <Card className="w-full max-w-full min-w-0 gap-0 overflow-hidden rounded-none border-none bg-transparent py-0 shadow-none">
            <div className="flex w-full min-w-0 items-start gap-3 overflow-hidden py-3">
                <div className="relative size-16 shrink-0">
                    <PackageThumbnail
                        item={item}
                        className="size-full rounded-lg"
                    />
                </div>

                <div className="flex min-h-16 min-w-0 flex-1 items-start gap-2 overflow-hidden border-b pb-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                        <div className="min-w-0 space-y-0.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <CardTitle className="min-w-0 flex-1 truncate text-sm leading-tight font-bold">
                                    {item.name}
                                </CardTitle>

                                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                                    {item.is_recommended ? (
                                        <PackageRecommendedBadge iconOnly />
                                    ) : null}
                                    <PackageStatusBadge item={item} />
                                </div>
                            </div>

                            <CardDescription className="truncate text-xs leading-tight font-medium text-muted-foreground">
                                {packageSubtitle(item)}
                            </CardDescription>
                        </div>

                        <div className="min-w-0 truncate pr-4">
                            <PackagePrice item={item} className="min-w-0" />
                        </div>
                    </div>

                    <div className="flex h-16 shrink-0 items-center justify-center">
                        <PackageActions
                            item={item}
                            disableMoveUp={disableMoveUp}
                            disableMoveDown={disableMoveDown}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onMove={onMove}
                            onView={onView}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}
