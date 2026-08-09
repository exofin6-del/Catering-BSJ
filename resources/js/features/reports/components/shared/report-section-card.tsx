import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ReportSectionCardProps = {
    children: ReactNode;
    className?: string;
    description?: string;
    icon: LucideIcon;
    title: string;
};

export function ReportSectionCard({
    children,
    className,
    description,
    icon: Icon,
    title,
}: ReportSectionCardProps) {
    return (
        <Card
            className={cn(
                'relative overflow-hidden rounded-xl border-border/50 bg-card/50 shadow-sm shadow-slate-950/[0.02] backdrop-blur-sm',
                className,
            )}
        >
            <div className="absolute inset-y-0 left-0 w-1 bg-primary/20" />
            <CardHeader className="flex flex-row items-start justify-between gap-4 p-5 pb-4 sm:p-6 sm:pb-5">
                <div className="grid min-w-0 gap-1.5">
                    <CardTitle className="text-base font-bold tracking-tight">
                        {title}
                    </CardTitle>
                    {description && (
                        <CardDescription className="text-xs leading-relaxed text-muted-foreground/80">
                            {description}
                        </CardDescription>
                    )}
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary shadow-xs dark:bg-primary/10">
                    <Icon className="size-4.5" strokeWidth={2.5} />
                </span>
            </CardHeader>
            <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
                {children}
            </CardContent>
        </Card>
    );
}
