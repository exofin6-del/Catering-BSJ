import type { LucideIcon } from 'lucide-react';

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BusinessSettingCardHeader({
    description,
    icon: Icon,
    title,
}: {
    description: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <CardHeader className="px-5 sm:px-6">
            <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4" />
                </div>
                <div className="grid gap-0.5">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-xs">
                        {description}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
    );
}
