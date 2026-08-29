import type { VisitOptions } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { menuDetail, packageDetail } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage } from '@/types';
import type { CustomerCatalogItem } from '../types/customer-storefront-types';
import {
    customerCatalogItems,
    customerCatalogItemCategory,
    filterCustomerCatalog,
} from '../utils/customer-catalog';
import { CustomerPaketCard, CustomerProductCard } from './customer-catalog';

const MAX_INTERESTED_ITEMS = 10;

export function CustomerSearchResults({
    menuItems,
    packages,
    query,
}: {
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
    query: string;
}) {
    const cart = useCustomerCartStore(menuItems, packages);
    const [selectedItem, setSelectedItem] =
        useState<CustomerCatalogItem | null>(null);
    const items = useMemo(
        () => customerCatalogItems(menuItems, packages),
        [menuItems, packages],
    );
    const results = useMemo(
        () => filterCustomerCatalog(items, 'all', 'all', query),
        [items, query],
    );
    const interestedItems = useMemo(
        () => customerInterestedItems(items, results, query),
        [items, results, query],
    );

    function handleViewDetail(item: CustomerCatalogItem): void {
        const href =
            item.type === 'package'
                ? packageDetail.url({ package: item.item.id })
                : menuDetail.url({ menuItem: item.item.id });

        const detailOptions: VisitOptions = {
            preserveScroll: false,
            preserveState: true,
        };

        router.visit(href, detailOptions);
    }

    function handleConfirm(item: OrderFormItem): void {
        const added = cart.add(item);

        if (!added) {
            toast.error('Keranjang maksimal sepuluh jenis item.');

            return;
        }

        toast.success(
            selectedItem?.type === 'package'
                ? 'Paket ditambahkan ke keranjang.'
                : 'Menu ditambahkan ke keranjang.',
        );
        setSelectedItem(null);
    }

    return (
        <section className="grid gap-10 pt-8">
            <div className="grid gap-2">
                <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                    Hasil pencarian
                </p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {query ? (
                        <>
                            Hasil untuk{' '}
                            <span className="text-primary">“{query}”</span>
                        </>
                    ) : (
                        'Cari menu atau paket'
                    )}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                    {results.length > 0
                        ? `${results.length} item ditemukan.`
                        : 'Tidak ada item yang cocok dengan pencarian Anda.'}
                </p>
            </div>

            {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                    {results.map((item) =>
                        item.type === 'package' ? (
                            <CustomerPaketCard
                                key={item.id}
                                entry={item}
                                onAdd={() => setSelectedItem(item)}
                                onClick={() => handleViewDetail(item)}
                            />
                        ) : (
                            <CustomerProductCard
                                key={item.id}
                                entry={item}
                                onAdd={() => setSelectedItem(item)}
                                onClick={() => handleViewDetail(item)}
                            />
                        ),
                    )}
                </div>
            ) : (
                <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
                    <div className="grid justify-items-center gap-3">
                        <SearchX className="size-8 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">
                                Tidak ada hasil ditemukan
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Coba kata kunci yang lain.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {interestedItems.length > 0 ? (
                <div className="grid gap-6 border-t border-border/70 pt-10">
                    <div className="flex items-end justify-between gap-4 pb-4">
                        <div className="grid gap-1">
                            <h2 className="text-xl font-semibold tracking-tight">
                                Anda mungkin tertarik
                            </h2>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {interestedItems.length} pilihan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                        {interestedItems.map((item) => (
                            <CustomerProductCard
                                key={item.id}
                                entry={item}
                                onAdd={() => setSelectedItem(item)}
                                onClick={() => handleViewDetail(item)}
                            />
                        ))}
                    </div>
                </div>
            ) : null}

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

function customerInterestedItems(
    items: CustomerCatalogItem[],
    results: CustomerCatalogItem[],
    query: string,
): CustomerCatalogItem[] {
    const resultIds = new Set(results.map((item) => item.id));
    const resultCategories = new Set(
        results
            .map(customerCatalogItemCategory)
            .filter((category): category is string => Boolean(category)),
    );
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');

    const scored = items
        .filter((item) => item.type === 'menu_item' && !resultIds.has(item.id))
        .map((item, index) => {
            const category = customerCatalogItemCategory(item);
            const searchableText =
                `${item.item.name} ${item.item.description ?? ''} ${category ?? ''}`.toLocaleLowerCase(
                    'id-ID',
                );
            let score = 0;

            if (category && resultCategories.has(category)) {
                score += 8;
            }

            if (normalizedQuery && searchableText.includes(normalizedQuery)) {
                score += 6;
            }

            if (item.item.is_recommended) {
                score += 2;
            }

            return { entry: item, index, score };
        })
        .sort(
            (first, second) =>
                second.score - first.score || first.index - second.index,
        )
        .slice(0, MAX_INTERESTED_ITEMS)
        .map(({ entry }) => entry);

    return scored;
}
