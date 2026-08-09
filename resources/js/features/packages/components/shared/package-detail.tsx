import { useState } from 'react';
import type { ReactNode } from 'react';

import { DetailGalleryLayout } from '@/components/shared/detail-gallery-layout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { MenuPackage } from '@/types';

import {
    formatPackageDate,
    packageDisplayDataFromItem,
} from '../../utils/package-format';
import type { PackageDisplayData } from '../../utils/package-format';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from './package-badges';
import { PackageComponentList } from './package-component-list';

type PackageDetailProps = {
    item?: MenuPackage;
    display?: PackageDisplayData;
    footerAction?: ReactNode;
    galleryAction?: ReactNode;
    items?: MenuPackage['items'];
    layoutMode?: 'grid' | 'stack';
    primaryAction?: ReactNode;
    showThumbnails?: boolean;
    showAbout?: boolean;
    thumbnailPosition?: 'bottom' | 'side';
};

export function PackageDetail({
    item,
    display: displayProp,
    footerAction,
    galleryAction,
    items: itemsProp,
    layoutMode = 'grid',
    primaryAction,
    showThumbnails = true,
    showAbout = true,
    thumbnailPosition = 'side',
}: PackageDetailProps) {
    const display = displayProp ?? packageDisplayDataFromItem(item!);
    const items = itemsProp ?? item!.items;

    return (
        <DetailGalleryLayout
            asideFooter={footerAction}
            images={display.galleryImages}
            fallbackLabel={display.fallbackImageLabel}
            galleryAction={galleryAction}
            layoutMode={layoutMode}
            showThumbnails={showThumbnails}
            thumbnailPosition={thumbnailPosition}
            overlay={
                display.isRecommended ? (
                    <PackageRecommendedBadge className="pointer-events-auto shadow-md backdrop-blur-sm select-none" />
                ) : null
            }
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <h1
                        className={cn(
                            'leading-tight font-semibold text-foreground',
                            layoutMode === 'grid'
                                ? 'text-3xl sm:text-4xl'
                                : 'text-xl',
                        )}
                    >
                        {display.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {display.subtitle}
                    </p>
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                    <span
                        className={cn(
                            'font-semibold',
                            layoutMode === 'grid' ? 'text-2xl' : 'text-xl',
                        )}
                    >
                        {display.priceLabel}
                    </span>
                    {display.priceOriginalLabel ? (
                        <span
                            className={cn(
                                'text-muted-foreground line-through',
                                layoutMode === 'grid' ? 'text-sm' : 'text-xs',
                            )}
                        >
                            {display.priceOriginalLabel}
                        </span>
                    ) : null}
                    {display.priceDiscountPercent > 0 ? (
                        <PackageDiscountBadge
                            discountPercent={display.priceDiscountPercent}
                        />
                    ) : display.priceBadgeLabel ? (
                        <Badge variant="outline">
                            {display.priceBadgeLabel}
                        </Badge>
                    ) : null}
                </div>
            </div>

            {primaryAction ? (
                <div className="shrink-0">{primaryAction}</div>
            ) : null}

            <Tabs
                defaultValue="description"
                className={cn(
                    'flex-none gap-0',
                    layoutMode === 'grid' &&
                        'lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden',
                )}
            >
                <TabsList
                    variant="line"
                    className="w-full justify-start gap-5 border-b border-border/70 p-0 group-data-[orientation=horizontal]/tabs:h-10"
                >
                    <TabsTrigger
                        value="description"
                        className="h-10 flex-none rounded-none px-0 text-sm group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                    >
                        Deskripsi
                    </TabsTrigger>
                    <TabsTrigger
                        value="menu"
                        className="h-10 flex-none rounded-none px-0 text-sm group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                    >
                        Isi Paket
                    </TabsTrigger>
                    {showAbout && (
                        <TabsTrigger
                            value="about"
                            className="h-10 flex-none rounded-none px-0 text-sm group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                        >
                            Tentang
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent
                    value="description"
                    className={cn(
                        'pt-4',
                        layoutMode === 'grid' &&
                            '[scrollbar-width:thin] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2',
                    )}
                >
                    <PackageDescriptionSection
                        description={display.description}
                        layoutMode={layoutMode}
                    />
                </TabsContent>

                <TabsContent
                    value="menu"
                    className={cn(
                        'pt-4',
                        layoutMode === 'grid' &&
                            '[scrollbar-width:thin] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2',
                    )}
                >
                    <PackageComponentList items={items} />
                </TabsContent>

                {showAbout && (
                    <TabsContent
                        value="about"
                        className={cn(
                            'pt-4',
                            layoutMode === 'grid' &&
                                '[scrollbar-width:thin] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2',
                        )}
                    >
                        <PackageAboutSection
                            categoryName={display.categoryName}
                            display={display}
                            minOrder={item?.min_order}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </DetailGalleryLayout>
    );
}

function PackageDescriptionSection({
    description,
    layoutMode,
}: {
    description: string;
    layoutMode: 'grid' | 'stack';
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongDescription = description.length > 180;
    const truncatedText = isLongDescription
        ? `${description.slice(0, 180)}...`
        : description;

    if (layoutMode === 'stack') {
        return (
            <section
                className="space-y-2"
                aria-labelledby="package-description-title"
            >
                <p className="text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </section>
        );
    }

    return (
        <section
            className="space-y-2"
            aria-labelledby="package-description-title"
        >
            {/* Desktop View: Full text */}
            <div className="hidden text-sm leading-6 text-muted-foreground select-text lg:block">
                <p className="whitespace-pre-line">{description}</p>
            </div>

            {/* Mobile/Tablet View: Truncated text with Read MoreToggle */}
            <div className="text-sm leading-6 text-muted-foreground select-text lg:hidden">
                <p className="whitespace-pre-line">
                    {isExpanded ? description : truncatedText}
                </p>
                {isLongDescription && (
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-2 text-xs font-semibold text-primary hover:underline focus:outline-none"
                    >
                        {isExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}
                    </button>
                )}
            </div>
        </section>
    );
}

function PackageAboutSection({
    categoryName,
    display,
    minOrder,
}: {
    categoryName: string;
    display: PackageDisplayData;
    minOrder?: number | null;
}) {
    return (
        <section className="space-y-4" aria-labelledby="package-about-title">
            <div className="grid gap-2 text-sm">
                <PackageAboutRow label="Kategori">
                    {categoryName || 'Tanpa kategori'}
                </PackageAboutRow>

                <PackageAboutRow label="Status">
                    <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge
                            variant={display.isActive ? 'secondary' : 'outline'}
                        >
                            {display.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    </div>
                </PackageAboutRow>

                <PackageAboutRow label="Min. order">
                    {minOrder ? `${minOrder} porsi` : '1 porsi'}
                </PackageAboutRow>
            </div>

            {display.auditItems && display.auditItems.length > 0 ? (
                <div className="grid gap-2 border-t border-border/60 pt-3">
                    {display.auditItems.map((audit) => (
                        <PackageAuditRow
                            key={audit.label}
                            label={audit.label}
                            date={audit.date}
                            userName={audit.userName}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}

function PackageAboutRow({
    children,
    label,
}: {
    children: ReactNode;
    label: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium break-words">
                {children}
            </span>
        </div>
    );
}

function PackageAuditRow({
    date,
    label,
    userName,
}: {
    date?: string | null;
    label: string;
    userName?: string | null;
}) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium break-words">
                {formatAuditDate(date, userName)}
            </span>
        </div>
    );
}

function formatAuditDate(
    value: string | null | undefined,
    userName: string | null | undefined,
): string {
    if (!value) {
        return '-';
    }

    const formattedDate = formatPackageDate(value);

    if (!userName) {
        return formattedDate;
    }

    return `${formattedDate} oleh ${userName}`;
}
