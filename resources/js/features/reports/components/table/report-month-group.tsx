import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportMonthGroup } from '../../utils/report-group-utils';
import { formatReportPrice } from '../../utils/report-utils';
import { ReportDateGroupSection } from './report-date-group';

export function ReportMonthGroupSection({
    group,
    isCurrentMonth,
    isGroupCollapsed,
    onToggleGroup,
}: {
    group: ReportMonthGroup;
    isCurrentMonth: boolean;
    isGroupCollapsed: (groupId: string) => boolean;
    onToggleGroup: (groupId: string) => void;
}) {
    const isCollapsed = isGroupCollapsed(group.id);

    return (
        <div className="group/month overflow-hidden transition-all">
            <ReportMonthHeader
                count={group.count}
                isCollapsed={isCollapsed}
                isCurrentMonth={isCurrentMonth}
                label={group.label}
                totalPaid={group.totalPaid}
                onToggle={() => onToggleGroup(group.id)}
            />

            {isCurrentMonth ? (
                <div className="space-y-1.5 px-4 pb-3 sm:px-5 sm:pb-4">
                    {group.days.map((dayGroup) => (
                        <ReportDateGroupSection
                            key={dayGroup.id}
                            group={dayGroup}
                            isCollapsed={isGroupCollapsed(dayGroup.id)}
                            onToggle={() => onToggleGroup(dayGroup.id)}
                        />
                    ))}
                </div>
            ) : (
                !isCollapsed && (
                    <div className="space-y-1.5 px-4 pb-3 sm:px-5 sm:pb-4">
                        {group.days.map((dayGroup) => (
                            <ReportDateGroupSection
                                key={dayGroup.id}
                                group={dayGroup}
                                isCollapsed={isGroupCollapsed(dayGroup.id)}
                                onToggle={() => onToggleGroup(dayGroup.id)}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

function ReportMonthHeader({
    count,
    isCollapsed,
    isCurrentMonth,
    label,
    onToggle,
    totalPaid,
}: {
    count: number;
    isCollapsed: boolean;
    isCurrentMonth: boolean;
    label: string;
    onToggle: () => void;
    totalPaid: number;
}) {
    return (
        <button
            type="button"
            className={cn(
                'group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors',
                isCurrentMonth ? 'cursor-default' : 'hover:bg-muted/20',
            )}
            aria-expanded={!isCollapsed}
            onClick={isCurrentMonth ? undefined : onToggle}
            disabled={isCurrentMonth}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="grid min-w-0 gap-0">
                    <h3 className="truncate text-sm font-semibold text-foreground/90">
                        {label}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                        <span>{count.toLocaleString('id-ID')} transaksi</span>
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-sm font-semibold text-foreground/70 tabular-nums sm:inline">
                    {formatReportPrice(totalPaid)}
                </span>
                {!isCurrentMonth && (
                    <ChevronDown
                        className={cn(
                            'size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-muted-foreground',
                            !isCollapsed && 'rotate-180',
                        )}
                    />
                )}
            </div>
        </button>
    );
}
