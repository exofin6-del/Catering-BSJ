import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    FieldContent,
    FieldDescription,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { CategoryFormValues } from '../../schema/category-form-schema';
import { labelForCategoryType, resolveCategoryIconOption } from './constants';

export function CategoryFormSummaryAside({
    className,
    values,
}: {
    className?: string;
    values: CategoryFormValues;
}) {
    const iconOption = resolveCategoryIconOption(values.icon);
    const Icon = iconOption.icon;
    const categoryName = values.name.trim() || 'Nama kategori';
    const categoryType = labelForCategoryType(values.type);

    return (
        <aside className={cn('min-w-0', className)}>
            <FieldSet className="gap-5">
                <FieldContent>
                    <FieldLegend className="text-md font-semibold text-foreground">
                        Ringkasan kategori
                    </FieldLegend>
                    <FieldDescription className="text-sm leading-snug">
                        Periksa tampilan kategori sebelum disimpan.
                    </FieldDescription>
                </FieldContent>

                <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-sm font-semibold text-muted-foreground">
                            <Icon className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold">
                                {categoryName}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {categoryType}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2 border-t border-border/60 pt-3 text-sm">
                        <SummaryRow
                            label="Nama kategori"
                            value={categoryName}
                        />
                        <SummaryRow label="Tipe" value={categoryType} />
                        <SummaryRow
                            label="Status"
                            value={
                                <Badge
                                    variant={
                                        values.isActive
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                >
                                    {values.isActive ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            }
                        />
                        <SummaryRow
                            label="Ikon"
                            value={
                                values.icon.trim()
                                    ? iconOption.label
                                    : 'Belum diisi'
                            }
                        />
                    </div>
                </div>
            </FieldSet>
        </aside>
    );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="flex max-w-[60%] justify-end text-right font-medium break-words">
                {value}
            </span>
        </div>
    );
}
