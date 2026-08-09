import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Heading({
    title,
    description,
    variant = 'default',
    actions,
    icon: Icon,
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    actions?: ReactNode;
    icon?: LucideIcon;
}) {
    return (
        <header
            className={`flex items-start justify-between gap-4 ${variant === 'small' ? 'flex-row' : 'flex-col'}`}
        >
            <div className={variant === 'small' ? '' : 'space-y-0.5'}>
                <div className="flex items-center gap-2">
                    {Icon && (
                        <Icon
                            className={
                                variant === 'small'
                                    ? 'size-4 text-muted-foreground'
                                    : 'size-5 text-muted-foreground'
                            }
                        />
                    )}
                    <h2
                        className={
                            variant === 'small'
                                ? 'text-base font-medium'
                                : 'text-xl font-semibold tracking-tight'
                        }
                    >
                        {title}
                    </h2>
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">{actions}</div>
            )}
        </header>
    );
}
