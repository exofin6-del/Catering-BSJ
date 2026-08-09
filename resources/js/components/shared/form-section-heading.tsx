import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { FieldLegend } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export function FormSectionHeading({
    children,
    className,
    icon: Icon,
    title,
    description,
}: {
    children?: ReactNode;
    className?: string;
    icon: LucideIcon;
    title: string;
    description?: string;
}) {
    return (
        <FieldLegend
            className={cn('flex items-start gap-2.5 font-normal', className)}
        >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                        {title}
                    </span>
                    {children}
                </div>
                {description && (
                    <p className="text-xs leading-snug text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </FieldLegend>
    );
}
