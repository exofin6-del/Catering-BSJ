import type { ReactNode } from 'react';

import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
    action?: ReactNode;
    className?: string;
    description?: ReactNode;
    icon?: ReactNode;
    title?: ReactNode;
};

export function EmptyState({
    action,
    className,
    description,
    icon,
    title,
}: EmptyStateProps) {
    return (
        <Empty className={cn('border-none', className)}>
            <EmptyHeader>
                {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
                {title ? <EmptyTitle>{title}</EmptyTitle> : null}
                {description ? (
                    <EmptyDescription>{description}</EmptyDescription>
                ) : null}
            </EmptyHeader>
            {action ? <EmptyContent>{action}</EmptyContent> : null}
        </Empty>
    );
}
