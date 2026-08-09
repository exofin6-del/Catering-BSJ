import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { MenuItem } from '@/types';

import {
    MenuActions,
    MenuPrice,
    MenuRecommendedBadge,
    MenuStatusBadge,
    MenuThumbnail,
    menuSubtitle,
} from './menu-table-parts';
import type { MenuTableActions } from './menu-table-parts';

type MenuCardProps = MenuTableActions & {
    canMove?: boolean;
    item: MenuItem;
    rowIndex: number;
    rowCount: number;
};

export function MenuCard({
    canMove = false,
    item,
    onDelete,
    onEdit,
    onMove,
    onView,
    rowCount,
    rowIndex,
}: MenuCardProps) {
    const disableMoveUp = !canMove || !onMove || rowIndex <= 0;
    const disableMoveDown = !canMove || !onMove || rowIndex >= rowCount - 1;

    return (
        <Card className="w-full max-w-full min-w-0 gap-0 overflow-hidden rounded-none border-none bg-transparent py-0 shadow-none">
            <div className="flex w-full min-w-0 items-start gap-3 overflow-hidden py-3">
                <div className="relative size-16 shrink-0">
                    <MenuThumbnail
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
                                        <MenuRecommendedBadge iconOnly />
                                    ) : null}
                                    <MenuStatusBadge item={item} />
                                </div>
                            </div>

                            <CardDescription className="truncate text-xs leading-tight font-medium text-muted-foreground">
                                {menuSubtitle(item)}
                            </CardDescription>
                        </div>

                        <div className="min-w-0 truncate pr-4">
                            <MenuPrice item={item} className="min-w-0" />
                        </div>
                    </div>

                    <div className="flex h-16 shrink-0 items-center justify-center">
                        <MenuActions
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
