'use client';

import type { ReactNode } from 'react';

import { DetailGalleryLayout } from '@/components/shared/detail-gallery-layout';
import type { DetailGalleryImage } from '@/components/shared/detail-gallery-layout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { MenuDisplayData } from '../types/menu-types';
import { MenuDetailPrice } from './menu-detail-price';
import type { MenuDetailPriceValue } from './menu-detail-price';
import { MenuRecommendedBadge } from './table/menu-table-parts';

export function MenuDetailView({
    categoryName,
    display,
    footerAction,
    layoutMode = 'grid',
    price,
    primaryAction,
    showThumbnails = true,
    showAbout = true,
}: {
    categoryName: string;
    display: MenuDisplayData;
    footerAction?: ReactNode;
    layoutMode?: 'grid' | 'stack';
    price: MenuDetailPriceValue;
    primaryAction?: ReactNode;
    showThumbnails?: boolean;
    showAbout?: boolean;
}) {
    const galleryImages: DetailGalleryImage[] = display.images.map((image) => ({
        alt: image.alt,
        id: image.id,
        isPrimary: image.isPrimary,
        url: image.url,
    }));

    return (
        <DetailGalleryLayout
            asideFooter={footerAction}
            images={galleryImages}
            fallbackLabel={display.fallbackImageLabel}
            layoutMode={layoutMode}
            showThumbnails={showThumbnails}
            overlay={
                display.isRecommended ? (
                    <MenuRecommendedBadge className="pointer-events-auto shadow-md backdrop-blur-sm select-none" />
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

                <MenuDetailPrice price={price} />
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
                    {showAbout ? (
                        <TabsTrigger
                            value="information"
                            className="h-10 flex-none rounded-none px-0 text-sm group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                        >
                            Informasi
                        </TabsTrigger>
                    ) : null}
                </TabsList>

                <TabsContent
                    value="description"
                    className={cn(
                        'pt-4',
                        layoutMode === 'grid' &&
                            '[scrollbar-width:thin] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2',
                    )}
                >
                    <MenuDescriptionSection description={display.description} />
                </TabsContent>

                {showAbout ? (
                    <TabsContent
                        value="information"
                        className={cn(
                            'pt-4',
                            layoutMode === 'grid' &&
                                '[scrollbar-width:thin] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2',
                        )}
                    >
                        <MenuAboutSection
                            categoryName={categoryName}
                            display={display}
                        />
                    </TabsContent>
                ) : null}
            </Tabs>
        </DetailGalleryLayout>
    );
}

function MenuDescriptionSection({ description }: { description: string }) {
    return (
        <section className="space-y-2" aria-labelledby="menu-description-title">
            <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
                {description}
            </p>
        </section>
    );
}

function MenuAboutSection({
    categoryName,
    display,
}: {
    categoryName: string;
    display: MenuDisplayData;
}) {
    return (
        <section className="space-y-4" aria-labelledby="menu-about-title">
            <div className="grid gap-2 text-sm">
                <MenuAboutRow label="Kategori">
                    {categoryName || 'Tanpa kategori'}
                </MenuAboutRow>

                <MenuAboutRow label="Status">
                    <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge
                            variant={display.isActive ? 'secondary' : 'outline'}
                        >
                            {display.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    </div>
                </MenuAboutRow>

                <MenuAboutRow label="Min. order">
                    {display.minOrder ? `${display.minOrder} porsi` : '1 porsi'}
                </MenuAboutRow>
            </div>

            {display.auditItems && display.auditItems.length > 0 ? (
                <div className="grid gap-2 border-t border-border/60 pt-3">
                    {display.auditItems.map((audit) => (
                        <MenuAuditRow
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

function MenuAboutRow({
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

function MenuAuditRow({
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

    const formattedDate = formatDate(value);

    if (!userName) {
        return formattedDate;
    }

    return `${formattedDate} oleh ${userName}`;
}

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}
