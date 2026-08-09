import { PackageCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { PackagePreviewState } from '../../../types/package-types';
import {
    formatPackagePrice,
    packageDiscountPercentage,
} from '../../../utils/package-price';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from '../../shared/package-badges';
import { PackageFormSummaryAside } from '../package-form-summary-aside';

export function PackagePreviewStep({
    preview,
}: {
    preview: PackagePreviewState;
}) {
    const discountPercent = packageDiscountPercentage(
        preview.totalPrice,
        preview.totalActivePrice,
    );

    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <section className="admin-card min-w-0 p-4 md:p-5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                                {preview.categoryName || 'Tanpa kategori'}
                            </Badge>
                            <Badge
                                variant={
                                    preview.isActive ? 'secondary' : 'outline'
                                }
                            >
                                {preview.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            {preview.isRecommended ? (
                                <PackageRecommendedBadge />
                            ) : null}
                        </div>
                        <h1 className="mt-3 text-2xl leading-tight font-semibold">
                            {preview.name || 'Nama paket'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Min. {preview.minOrder || '1'} porsi
                        </p>
                    </div>

                    <PackageCheck className="size-6 shrink-0 text-muted-foreground" />
                </div>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-semibold">
                        {preview.totalStartsFrom ? 'Mulai ' : ''}
                        {formatPackagePrice(preview.totalActivePrice)}
                    </span>
                    {preview.totalHasDiscount ? (
                        <span className="text-sm text-muted-foreground line-through">
                            {formatPackagePrice(preview.totalPrice)}
                        </span>
                    ) : null}
                    {discountPercent > 0 ? (
                        <PackageDiscountBadge
                            discountPercent={discountPercent}
                        />
                    ) : null}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                    <h2 className="text-sm font-semibold">Deskripsi</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {preview.description ||
                            'Belum ada deskripsi paket yang ditambahkan.'}
                    </p>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                    <h2 className="text-sm font-semibold">Komponen paket</h2>
                    {preview.components.length > 0 ? (
                        <div className="grid gap-2">
                            {preview.components.map((component) => (
                                <div
                                    key={component.id}
                                    className="rounded-md border border-border/60 bg-muted/20 p-3"
                                >
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">
                                                {component.name}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {component.isChoice
                                                    ? 'Pilih 1 item'
                                                    : 'Item tetap'}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-sm font-medium">
                                            {component.isChoice ? 'Mulai ' : ''}
                                            {formatPackagePrice(
                                                component.activePrice,
                                            )}
                                        </div>
                                    </div>

                                    {component.options.length > 0 ? (
                                        <div className="mt-3 grid gap-1.5">
                                            {component.options.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className="flex min-w-0 justify-between gap-3 text-xs text-muted-foreground"
                                                >
                                                    <span className="truncate">
                                                        {option.name}
                                                    </span>
                                                    <span className="shrink-0">
                                                        {formatPackagePrice(
                                                            option.activePrice,
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Belum ada komponen paket.
                        </p>
                    )}
                </div>
            </section>

            <PackageFormSummaryAside
                className="admin-card self-start p-4 md:p-5"
                defaultTab="publication"
                preview={preview}
            />
        </div>
    );
}
