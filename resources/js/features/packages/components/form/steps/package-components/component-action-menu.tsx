import { ArrowDown, ArrowUp, MoreVertical, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PackageComponentActionMenu({
    createChoiceDisabled = false,
    deleteLabel,
    disabledDown,
    disabledUp,
    onCreateChoice,
    onDelete,
    onMoveDown,
    onMoveUp,
}: {
    createChoiceDisabled?: boolean;
    deleteLabel: string;
    disabledDown: boolean;
    disabledUp: boolean;
    onCreateChoice?: () => void;
    onDelete: () => void;
    onMoveDown: () => void;
    onMoveUp: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground"
                    aria-label="Aksi komponen"
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                {onCreateChoice ? (
                    <>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                disabled={createChoiceDisabled}
                                onSelect={onCreateChoice}
                            >
                                <Plus className="size-4" />
                                Buat Pilihan
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                    </>
                ) : null}

                <DropdownMenuGroup>
                    <DropdownMenuItem disabled={disabledUp} onSelect={onMoveUp}>
                        <ArrowUp className="size-4" />
                        Naikkan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={disabledDown}
                        onSelect={onMoveDown}
                    >
                        <ArrowDown className="size-4" />
                        Turunkan
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 className="size-4" />
                    {deleteLabel}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function PackageChoiceActionMenu({
    disabledDelete,
    isRecommended,
    onDelete,
    onRecommendedChange,
}: {
    disabledDelete: boolean;
    isRecommended: boolean;
    onDelete: () => void;
    onRecommendedChange: (value: boolean) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground"
                    aria-label="Aksi pilihan"
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                    <DropdownMenuCheckboxItem
                        checked={isRecommended}
                        onCheckedChange={(checked) =>
                            onRecommendedChange(checked === true)
                        }
                    >
                        Rekomendasi pilihan
                    </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    disabled={disabledDelete}
                    onSelect={onDelete}
                >
                    <Trash2 className="size-4" />
                    Hapus pilihan
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
