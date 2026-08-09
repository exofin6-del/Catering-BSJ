import { ShoppingCart } from 'lucide-react';

import { DetailGalleryLayout } from '@/components/shared/detail-gallery-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuRecommendedBadge } from '@/features/menus/components/table/menu-table-parts';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import {
    formatOrderPrice,
    numberValue,
} from '@/features/orders/utils/order-format';
import { PackageDiscountBadge } from '@/features/packages/components/shared/package-badges';
import type { OrderMenuItem, OrderPackage, OrderPackageItem } from '@/types';

import type { CustomerCatalogItem } from '../types/customer-storefront-types';

type CustomerItemDetailProps = {
    entry: CustomerCatalogItem;
    open: boolean;
    onAdd: (item: OrderFormItem) => void;
    onOpenChange: (open: boolean) => void;
};

export function CustomerItemDetail({
    entry,
    open,
    onAdd,
    onOpenChange,
}: CustomerItemDetailProps) {
    if (entry.type === 'package') {
        return (
            <CustomerPackageDetail
                packageItem={entry.item}
                open={open}
                onAdd={(item) => {
                    onAdd(item);
                    onOpenChange(false);
                }}
                onOpenChange={onOpenChange}
            />
        );
    }

    return (
        <CustomerMenuDetail
            menuItem={entry.item}
            open={open}
            onAdd={(item) => {
                onAdd(item);
                onOpenChange(false);
            }}
            onOpenChange={onOpenChange}
        />
    );
}

function CustomerPackageDetail({
    packageItem,
    open,
    onAdd,
    onOpenChange,
}: {
    packageItem: OrderPackage;
    open: boolean;
    onAdd: (item: OrderFormItem) => void;
    onOpenChange: (open: boolean) => void;
}) {
    const minOrder = packageItem.min_order ?? 1;

    function handleAdd(): void {
        onAdd({
            item_type: 'package',
            menu_item_id: '',
            package_id: String(packageItem.id),
            qty: String(minOrder),
            selected_items: [],
        });
    }

    const images = packageItem.primary_image
        ? [
              {
                  alt: packageItem.name || 'Foto paket',
                  id: 'primary-image',
                  isPrimary: true,
                  url: packageItem.primary_image,
              },
          ]
        : [];

    const categoryName = packageItem.package_category?.name ?? 'Paket';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-1rem)] gap-0 overflow-y-auto p-0 sm:max-h-[min(calc(100dvh-1rem),38rem)] sm:max-w-3xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{packageItem.name}</DialogTitle>
                    <DialogDescription>
                        Detail paket {packageItem.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 p-4 sm:p-5">
                    <DetailGalleryLayout
                        images={images}
                        fallbackLabel="Foto paket"
                        layoutMode="stack"
                        showThumbnails={false}
                        overlay={
                            packageItem.is_recommended ? (
                                <MenuRecommendedBadge className="pointer-events-auto shadow-md backdrop-blur-sm select-none" />
                            ) : null
                        }
                    >
                        <div className="space-y-3">
                            <div className="grid gap-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {categoryName}
                                </p>
                                <div className="flex items-center gap-2">
                                    <h3 className="line-clamp-2 text-xl font-semibold tracking-tight sm:text-2xl">
                                        {packageItem.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-xl font-semibold sm:text-2xl">
                                    {formatOrderPrice(packageItem.price)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Min. {minOrder} porsi</span>
                                <span>·</span>
                                <span>{packageItem.items.length} komponen</span>
                            </div>
                        </div>
                    </DetailGalleryLayout>
                </div>

                {packageItem.description || packageItem.items.length > 0 ? (
                    <Tabs
                        defaultValue={
                            packageItem.description ? 'description' : 'contents'
                        }
                        className="border-t"
                    >
                        <TabsList
                            variant="line"
                            className="w-full justify-start gap-5 border-b border-border/70 px-4 sm:px-5"
                        >
                            {packageItem.description ? (
                                <TabsTrigger
                                    value="description"
                                    className="h-10 flex-none rounded-none px-0 text-sm"
                                >
                                    Deskripsi
                                </TabsTrigger>
                            ) : null}
                            {packageItem.items.length > 0 ? (
                                <TabsTrigger
                                    value="contents"
                                    className="h-10 flex-none rounded-none px-0 text-sm"
                                >
                                    Isi Paket
                                </TabsTrigger>
                            ) : null}
                        </TabsList>

                        {packageItem.description ? (
                            <TabsContent
                                value="description"
                                className="px-4 pt-4 sm:px-5"
                            >
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {packageItem.description}
                                </p>
                            </TabsContent>
                        ) : null}

                        {packageItem.items.length > 0 ? (
                            <TabsContent
                                value="contents"
                                className="px-4 pt-4 sm:px-5"
                            >
                                <div className="grid gap-3">
                                    {packageItem.items.map(
                                        (packageItemComponent) => (
                                            <PackageComponentRow
                                                key={packageItemComponent.id}
                                                component={packageItemComponent}
                                            />
                                        ),
                                    )}
                                </div>
                            </TabsContent>
                        ) : null}
                    </Tabs>
                ) : null}

                <div className="sticky bottom-0 border-t bg-background px-4 py-3 sm:px-5">
                    <Button className="w-full" onClick={handleAdd}>
                        <ShoppingCart className="size-4" />
                        Tambah ke keranjang
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PackageComponentRow({ component }: { component: OrderPackageItem }) {
    return (
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                {component.menu_item?.primary_image ? (
                    <img
                        src={component.menu_item.primary_image}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">
                        {component.name?.charAt(0) ?? '?'}
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-foreground">
                    {component.name ?? component.menu_item?.name ?? 'Isi paket'}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                    {component.package_price
                        ? formatOrderPrice(component.package_price)
                        : 'Menu tetap'}
                </p>
            </div>

            {component.item_prices.length > 0 ? (
                <Badge variant="outline" className="shrink-0 text-[11px]">
                    {component.item_prices.length} pilihan
                </Badge>
            ) : null}
        </div>
    );
}

function CustomerMenuDetail({
    menuItem,
    open,
    onAdd,
    onOpenChange,
}: {
    menuItem: OrderMenuItem;
    open: boolean;
    onAdd: (item: OrderFormItem) => void;
    onOpenChange: (open: boolean) => void;
}) {
    const minOrder = menuItem.min_order ?? 1;
    const originalPrice = menuItem.base_price ?? menuItem.price;
    const promoPrice = menuItem.promo_price;
    const hasPromo =
        promoPrice !== undefined &&
        promoPrice !== null &&
        promoPrice !== '' &&
        numberValue(promoPrice) < numberValue(originalPrice);
    const displayPrice = hasPromo ? promoPrice : originalPrice;
    const discountPercent =
        hasPromo && numberValue(originalPrice) > 0
            ? Math.round(
                  ((numberValue(originalPrice) - numberValue(promoPrice!)) /
                      numberValue(originalPrice)) *
                      100,
              )
            : 0;

    function handleAdd(): void {
        onAdd({
            item_type: 'menu_item',
            menu_item_id: String(menuItem.id),
            package_id: '',
            qty: String(minOrder),
            selected_items: [],
        });
    }

    const images = menuItem.primary_image
        ? [
              {
                  alt: menuItem.name || 'Foto menu',
                  id: 'primary-image',
                  isPrimary: true,
                  url: menuItem.primary_image,
              },
          ]
        : [];

    const categoryName = menuItem.menu_category?.name ?? 'Menu';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-1rem)] gap-0 overflow-y-auto p-0 sm:max-h-[min(calc(100dvh-1rem),38rem)] sm:max-w-3xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{menuItem.name}</DialogTitle>
                    <DialogDescription>
                        Detail menu {menuItem.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 p-4 sm:p-5">
                    <DetailGalleryLayout
                        images={images}
                        fallbackLabel="Foto menu"
                        layoutMode="stack"
                        showThumbnails={false}
                        overlay={
                            menuItem.is_recommended ? (
                                <MenuRecommendedBadge className="pointer-events-auto shadow-md backdrop-blur-sm select-none" />
                            ) : null
                        }
                    >
                        <div className="space-y-3">
                            <div className="grid gap-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {categoryName}
                                </p>
                                <h3 className="line-clamp-2 text-xl font-semibold tracking-tight sm:text-2xl">
                                    {menuItem.name}
                                </h3>
                            </div>

                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-xl font-semibold sm:text-2xl">
                                    {formatOrderPrice(displayPrice)}
                                </span>
                                {hasPromo ? (
                                    <span className="text-sm text-muted-foreground line-through">
                                        {formatOrderPrice(originalPrice)}
                                    </span>
                                ) : null}
                                {discountPercent > 0 ? (
                                    <PackageDiscountBadge
                                        discountPercent={discountPercent}
                                    />
                                ) : null}
                            </div>

                            {menuItem.description ? (
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {menuItem.description}
                                </p>
                            ) : null}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Min. {minOrder} porsi</span>
                            </div>
                        </div>
                    </DetailGalleryLayout>
                </div>

                {menuItem.description ? (
                    <Tabs defaultValue="description" className="border-t">
                        <TabsList
                            variant="line"
                            className="w-full justify-start gap-5 border-b border-border/70 px-4 sm:px-5"
                        >
                            <TabsTrigger
                                value="description"
                                className="h-10 flex-none rounded-none px-0 text-sm"
                            >
                                Deskripsi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="description"
                            className="px-4 pt-4 sm:px-5"
                        >
                            <p className="text-sm leading-6 text-muted-foreground">
                                {menuItem.description}
                            </p>
                        </TabsContent>
                    </Tabs>
                ) : null}

                <div className="sticky bottom-0 border-t bg-background px-4 py-3 sm:px-5">
                    <Button className="w-full" onClick={handleAdd}>
                        <ShoppingCart className="size-4" />
                        Tambah ke keranjang
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
