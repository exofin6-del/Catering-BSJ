import { resolveCategoryIconOption } from './constants';

export function CategoryIconLabel({
    icon,
    label,
}: {
    icon: string;
    label: string;
}) {
    const Icon = resolveCategoryIconOption(icon).icon;

    return (
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
                <Icon className="size-4" />
            </span>
            <span className="truncate">{label}</span>
        </span>
    );
}
