import type { VisitOptions } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { menuDetail, packageDetail } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage } from '@/types';
import type { CustomerCatalogItem } from '../types/customer-storefront-types';
import {
    customerCatalogItems,
    customerRecommendationSections,
} from '../utils/customer-catalog';
import { CustomerPaketCard, CustomerProductCard } from './customer-catalog';

export function CustomerRecommendations({
    currentId,
    currentType,
    menuItems,
    packages,
    onAdd,
}: {
    currentId: number;
    currentType: CustomerCatalogItem['type'];
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
    onAdd: (item: OrderFormItem) => void;
}) {
    const [selectedItem, setSelectedItem] =
        useState<CustomerCatalogItem | null>(null);
    const items = useMemo(
        () => customerCatalogItems(menuItems, packages),
        [menuItems, packages],
    );
    const sections = useMemo(
        () => customerRecommendationSections(items, currentType, currentId),
        [currentId, currentType, items],
    );
    const visibleSections = sections.filter(
        (section) => section.items.length > 0,
    );

    if (visibleSections.length === 0) {
        return null;
    }

    function handleViewDetail(item: CustomerCatalogItem): void {
        const href =
            item.type === 'package'
                ? packageDetail.url({ package: item.item.id })
                : menuDetail.url({ menuItem: item.item.id });

        const detailOptions: VisitOptions = {
            preserveScroll: true,
            preserveState: true,
        };

        router.visit(href, detailOptions);
    }

    function handleConfirm(item: OrderFormItem): void {
        onAdd(item);
        toast.success(
            selectedItem?.type === 'package'
                ? 'Paket ditambahkan ke keranjang.'
                : 'Menu ditambahkan ke keranjang.',
        );
        setSelectedItem(null);
    }

    return (
        <section
            aria-labelledby="customer-recommendations-title"
            className="grid gap-10 border-t border-border/70 pt-12 md:gap-12 md:pt-16"
        >
            <div className="flex flex-col justify-between gap-4 border-l-2 border-primary pl-4 sm:flex-row sm:items-end sm:pl-5">
                <div className="grid max-w-xl gap-2">
                    <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                        Pilihan terkurasi
                    </p>
                    <h2
                        id="customer-recommendations-title"
                        className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                        Lanjutkan pilihan Anda
                    </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                    Rekomendasi yang disusun dari kategori dan pilihan yang
                    saling melengkapi.
                </p>
            </div>

            <div className="grid gap-12">
                {visibleSections.map((section) => {
                    return (
                        <section key={section.type} className="grid gap-5">
                            <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="grid gap-1">
                                        <h3 className="text-xl font-semibold tracking-tight">
                                            {section.title}
                                        </h3>
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                    {section.items.length} pilihan
                                </span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {section.items.map((item) =>
                                    item.type === 'package' ? (
                                        <CustomerPaketCard
                                            key={item.id}
                                            entry={item}
                                            onAdd={() => setSelectedItem(item)}
                                            onClick={() =>
                                                handleViewDetail(item)
                                            }
                                        />
                                    ) : (
                                        <CustomerProductCard
                                            key={item.id}
                                            entry={item}
                                            onAdd={() => setSelectedItem(item)}
                                            onClick={() =>
                                                handleViewDetail(item)
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>

            {selectedItem?.type === 'menu_item' ? (
                <OrderConfirmDialog
                    key={selectedItem.id}
                    open
                    menuItem={selectedItem.item}
                    type="menu_item"
                    onConfirm={handleConfirm}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                />
            ) : null}
            {selectedItem?.type === 'package' ? (
                <OrderConfirmDialog
                    key={selectedItem.id}
                    open
                    packageItem={selectedItem.item}
                    type="package"
                    onConfirm={handleConfirm}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                />
            ) : null}
        </section>
    );
}
