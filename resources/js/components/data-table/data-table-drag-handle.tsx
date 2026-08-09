import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { IconGripVertical } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';

type Props = {
    id: UniqueIdentifier;
    label?: string;
};

export function DataTableDragHandle({ id, label = 'Drag to reorder' }: Props) {
    const { attributes, listeners } = useSortable({
        id,
    });

    return (
        <Button
            type="button"
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <IconGripVertical className="size-3 text-muted-foreground" />
            <span className="sr-only">{label}</span>
        </Button>
    );
}
