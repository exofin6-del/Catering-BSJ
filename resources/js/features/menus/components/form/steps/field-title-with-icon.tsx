import type { LucideIcon } from 'lucide-react';

export function FieldTitleWithIcon({
    icon: Icon,
    title,
}: {
    icon: LucideIcon;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm font-medium">
            <Icon className="size-4 text-muted-foreground" />
            {title}
        </div>
    );
}
