import { Check, ShoppingCart, Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { OrderSummaryList } from '@/components/shared/order-summaries';
import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
} from '@/components/ui/drawer';
import { customerCartLine } from '@/features/customers/hooks/use-customer-cart';
import type { CustomerCartLine } from '@/features/customers/hooks/use-customer-cart';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import {
    menuConfirmItem,
    packageConfirmItem,
    selectedChoiceMenuItemId,
    toggleSelectedPackageChoice,
} from '@/features/orders/utils/order-confirm-values';
import { packageChoicePrice } from '@/features/orders/utils/order-form-values';
import { formatOrderPrice } from '@/features/orders/utils/order-format';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from '@/features/packages/components/shared/package-badges';
import { packageDiscountPercentage } from '@/features/packages/utils/package-price';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type {
    OrderMenuItem,
    OrderPackage,
    OrderPackageChoice,
    OrderPackageItem,
    PriceValue,
} from '@/types';

const drawerAnimationDuration = 450;

type OrderConfirmSelection =
    | { menuItem: OrderMenuItem; type: 'menu_item' }
    | { packageItem: OrderPackage; type: 'package' };

type OrderConfirmDialogProps = OrderConfirmSelection & {
    open: boolean;
    /** Upper bound for the quantity input. Omit for unlimited (admin). */
    maxQuantity?: number;
    onCancel?: () => void;
    onConfirm: (item: OrderFormItem) => void;
    onOpenChange: (open: boolean) => void;
};

type OrderConfirmContentProps = OrderConfirmSelection & {
    onCancel: () => void;
    onConfirm: (item: OrderFormItem) => void;
    maxQuantity?: number;
};

export function OrderConfirmDialog(props: OrderConfirmDialogProps) {
    const isMobile = useIsMobile();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const closeTimeout = useRef<number | null>(null);

    useEffect(() => {
        const animationFrame = window.requestAnimationFrame(() => {
            setIsDrawerOpen(props.open);
        });

        return () => window.cancelAnimationFrame(animationFrame);
    }, [props.open]);

    useEffect(
        () => () => {
            if (closeTimeout.current !== null) {
                window.clearTimeout(closeTimeout.current);
            }
        },
        [],
    );

    function closeDrawer(): void {
        setIsDrawerOpen(false);

        if (closeTimeout.current !== null) {
            window.clearTimeout(closeTimeout.current);
        }

        closeTimeout.current = window.setTimeout(() => {
            props.onCancel?.();
            props.onOpenChange(false);
        }, drawerAnimationDuration);
    }

    function handleDrawerOpenChange(open: boolean): void {
        if (!open) {
            closeDrawer();

            return;
        }

        setIsDrawerOpen(true);
        props.onOpenChange(true);
    }

    return (
        <Drawer
            open={isDrawerOpen}
            onOpenChange={handleDrawerOpenChange}
            showSwipeHandle={isMobile}
            swipeDirection={isMobile ? 'down' : 'right'}
        >
            <DrawerContent className="m-0 h-auto max-h-[92dvh] min-h-[70dvh] w-full max-w-none rounded-t-3xl rounded-b-none border-x-0 border-b-0 [--drawer-inset:0px] md:m-2 md:h-auto md:max-h-[calc(100dvh-1rem)] md:min-h-0 md:w-[28rem] md:max-w-[calc(100vw-1rem)] md:rounded-3xl md:border md:[--drawer-inset:--spacing(2)] md:data-[swipe-axis=x]:top-0 md:data-[swipe-axis=x]:bottom-auto">
                {props.type === 'menu_item' ? (
                    <OrderConfirmContent
                        menuItem={props.menuItem}
                        type="menu_item"
                        maxQuantity={props.maxQuantity}
                        onCancel={closeDrawer}
                        onConfirm={props.onConfirm}
                    />
                ) : (
                    <OrderConfirmContent
                        packageItem={props.packageItem}
                        type="package"
                        maxQuantity={props.maxQuantity}
                        onCancel={closeDrawer}
                        onConfirm={props.onConfirm}
                    />
                )}
            </DrawerContent>
        </Drawer>
    );
}

function OrderConfirmContent(props: OrderConfirmContentProps) {
    const selectedMenuItem = props.type === 'menu_item' ? props.menuItem : null;
    const selectedPackage = props.type === 'package' ? props.packageItem : null;
    const maxQuantity = props.maxQuantity ?? Number.POSITIVE_INFINITY;
    const [draftItem, setDraftItem] = useState<OrderFormItem>(() =>
        props.type === 'menu_item'
            ? menuConfirmItem(props.menuItem)
            : packageConfirmItem(props.packageItem, null),
    );
    const packageItems = selectedPackage?.items ?? [];
    const choiceGroups = packageItems.filter(
        (packageItem) => packageItem.item_prices.length > 0,
    );
    const minOrder =
        selectedPackage?.min_order ?? selectedMenuItem?.min_order ?? 1;
    const quantity = Number(draftItem.qty);
    const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
    const isQuantityValid =
        Number.isInteger(quantity) &&
        normalizedQuantity >= minOrder &&
        normalizedQuantity <= maxQuantity;
    const isPackageSelectionValid = choiceGroups.every((packageItem) =>
        hasSelectedChoice(draftItem, packageItem),
    );
    const canConfirm = isQuantityValid && isPackageSelectionValid;
    const cartLine = customerCartLine(
        draftItem,
        selectedMenuItem ? [selectedMenuItem] : [],
        selectedPackage ? [selectedPackage] : [],
    );
    const subtotal = cartLine.subtotal;
    function handleQtyChange(qty: string): void {
        const parsed = Number(qty);
        const next =
            Number.isFinite(parsed) && parsed > maxQuantity
                ? String(maxQuantity)
                : qty;

        setDraftItem((currentItem) => ({ ...currentItem, qty: next }));
    }

    function handleQtyStep(change: number): void {
        const currentQuantity = isQuantityValid ? normalizedQuantity : minOrder;
        const requested = Math.min(
            maxQuantity,
            Math.max(minOrder, currentQuantity + change),
        );

        handleQtyChange(String(requested));
    }

    function handleQtyCommit(): void {
        const clamped = Math.min(
            maxQuantity,
            Math.max(
                minOrder,
                Number.isFinite(quantity) ? Math.floor(quantity) : minOrder,
            ),
        );

        handleQtyChange(String(clamped));
    }

    function handleChoiceChange(
        packageItemId: string,
        menuItemId: string,
    ): void {
        setDraftItem((currentItem) => ({
            ...currentItem,
            selected_items: toggleSelectedPackageChoice(
                currentItem,
                packageItemId,
                menuItemId,
            ),
        }));
    }

    function handleConfirm(): void {
        if (!canConfirm) {
            return;
        }

        props.onConfirm({
            ...draftItem,
            qty: String(
                Math.min(
                    maxQuantity,
                    Math.max(minOrder, normalizedQuantity),
                ),
            ),
        });
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-background">
            <ConfirmProductOverview
                cartLine={cartLine}
                draftQty={draftItem.qty}
                isQuantityValid={isQuantityValid}
                maxQuantity={maxQuantity}
                minOrder={minOrder}
                onQtyChange={handleQtyChange}
                onQtyCommit={handleQtyCommit}
                onQtyStep={handleQtyStep}
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {packageItems.length > 0 ? (
                    <PackageChoiceFields
                        item={draftItem}
                        packageItems={packageItems}
                        onChoiceChange={handleChoiceChange}
                    />
                ) : null}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/60 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl md:px-5 md:pb-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="truncate text-lg font-bold text-foreground tabular-nums">
                        {formatOrderPrice(subtotal)}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="hidden sm:inline-flex"
                        onClick={props.onCancel}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={!canConfirm}
                        className="min-w-32 rounded-xl"
                        onClick={handleConfirm}
                    >
                        <ShoppingCart className="size-4" />
                        Tambah item
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ConfirmProductOverview({
    cartLine,
    draftQty,
    isQuantityValid,
    maxQuantity,
    minOrder,
    onQtyChange,
    onQtyCommit,
    onQtyStep,
}: {
    cartLine: CustomerCartLine;
    draftQty: string;
    isQuantityValid: boolean;
    maxQuantity: number;
    minOrder: number;
    onQtyChange: (qty: string) => void;
    onQtyCommit: () => void;
    onQtyStep: (change: number) => void;
}) {
    const name = cartLine.name;
    const description = isQuantityValid
        ? `${cartLine.categoryName} | Min. ${minOrder} pesanan`
        : Number(draftQty) > maxQuantity
          ? `Maksimal ${maxQuantity} per item.`
          : `Jumlah minimal ${minOrder}.`;
    const summaryItem: OrderSummaryItemData = {
        id: cartLine.key,
        image: cartLine.image,
        imageAlt: name,
        meta: <span className="block truncate">{description}</span>,
        metaClassName: !isQuantityValid ? 'text-destructive' : undefined,
        name,
        quantityControl: {
            ariaInvalid: !isQuantityValid,
            ariaLabel: 'Jumlah pesanan',
            layout: 'right-stacked',
            max: Number.isFinite(maxQuantity) ? maxQuantity : undefined,
            min: minOrder,
            onDecrease: () => onQtyStep(-1),
            onIncrease: () => onQtyStep(1),
            onValueChange: onQtyChange,
            onValueCommit: () => onQtyCommit(),
            subtotal: formatOrderPrice(cartLine.subtotal),
            subtotalDetail: cartLine.subtotalDetail,
            value: draftQty,
        },
    };

    return (
        <section className="shrink-0 px-4 py-4 md:px-5">
            <DrawerTitle className="sr-only">{name}</DrawerTitle>
            <DrawerDescription className="sr-only">
                {description}
            </DrawerDescription>
            <OrderSummaryList items={[summaryItem]} variant="plain" />
        </section>
    );
}

function PackageChoiceFields({
    item,
    packageItems,
    onChoiceChange,
}: {
    item: OrderFormItem;
    packageItems: OrderPackageItem[];
    onChoiceChange: (packageItemId: string, menuItemId: string) => void;
}) {
    const choiceGroups = packageItems.filter(
        (packageItem) => packageItem.item_prices.length > 0,
    );
    const fixedItems = packageItems.filter(
        (packageItem) => packageItem.item_prices.length === 0,
    );

    return (
        <section className="grid gap-6 px-4 pt-4 pb-5 md:px-5 md:pt-5">
            {choiceGroups.length > 0 ? (
                <div className="grid gap-5">
                    {choiceGroups.map((packageItem) => (
                        <PackageChoiceGroup
                            key={packageItem.id}
                            item={item}
                            packageItem={packageItem}
                            onChoiceChange={onChoiceChange}
                        />
                    ))}
                </div>
            ) : null}

            {fixedItems.length > 0 ? (
                <div className="grid gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            Sudah termasuk
                        </h4>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                            {fixedItems.length} item
                        </span>
                    </div>

                    <div className="grid gap-2">
                        {fixedItems.map((packageItem) => (
                            <PackageFixedItem
                                key={packageItem.id}
                                item={packageItem}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}

function PackageFixedItem({ item }: { item: OrderPackageItem }) {
    const menuItem = item.menu_item;
    const menuName = menuItem?.name ?? item.name ?? 'Isi paket';
    const finalPrice =
        item.package_price ??
        menuItem?.promo_price ??
        menuItem?.base_price ??
        0;
    const discountPercent = packageDiscountPercentage(
        menuItem?.base_price,
        finalPrice,
    );

    return (
        <div className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-2xl bg-muted/30 p-2.5 text-xs">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background text-muted-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                {menuItem?.primary_image ? (
                    <img
                        src={menuItem.primary_image}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Utensils className="size-5 text-muted-foreground" />
                )}
            </div>

            <div className="grid min-w-0 flex-1 gap-1.5">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <h4 className="min-w-0 truncate text-sm font-semibold text-foreground">
                        {menuName}
                    </h4>
                </div>
                {discountPercent > 0 || item.is_recommended ? (
                    <div className="flex flex-wrap items-center gap-1">
                        {discountPercent > 0 ? (
                            <PackageDiscountBadge
                                discountPercent={discountPercent}
                            />
                        ) : null}
                        {item.is_recommended ? (
                            <PackageRecommendedBadge />
                        ) : null}
                    </div>
                ) : null}
            </div>

            <PackagePriceDisplay
                basePrice={menuItem?.base_price}
                discountPercent={discountPercent}
                finalPrice={finalPrice}
            />

            <PackageSelectionCheckbox checked disabled />
        </div>
    );
}

function PackagePriceDisplay({
    basePrice,
    discountPercent,
    finalPrice,
}: {
    basePrice: PriceValue;
    discountPercent: number;
    finalPrice: PriceValue;
}) {
    return (
        <div className="grid min-w-0 shrink-0 justify-items-end text-right leading-tight">
            {discountPercent > 0 ? (
                <span className="max-w-full truncate text-[10px] font-medium text-muted-foreground line-through">
                    {formatOrderPrice(basePrice)}
                </span>
            ) : null}
            <span className="max-w-full truncate text-sm font-semibold text-foreground tabular-nums">
                {formatOrderPrice(finalPrice)}
            </span>
        </div>
    );
}

function PackageChoiceGroup({
    item,
    packageItem,
    onChoiceChange,
}: {
    item: OrderFormItem;
    packageItem: OrderPackageItem;
    onChoiceChange: (packageItemId: string, menuItemId: string) => void;
}) {
    const selectedMenuItemId = selectedChoiceMenuItemId(item, packageItem);

    return (
        <section className="grid gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
                <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {packageItem.name}
                </h4>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                    Pilih satu
                </span>
            </div>

            <div
                role="group"
                aria-label={`Pilihan ${packageItem.name}`}
                className="grid gap-2"
            >
                {packageItem.item_prices.map((choice) => (
                    <PackageChoiceOption
                        key={choice.id}
                        choice={choice}
                        isSelected={
                            String(choice.menu_item_id) === selectedMenuItemId
                        }
                        packageItemId={String(packageItem.id)}
                        onChoiceChange={onChoiceChange}
                    />
                ))}
            </div>
        </section>
    );
}

function PackageChoiceOption({
    choice,
    isSelected,
    packageItemId,
    onChoiceChange,
}: {
    choice: OrderPackageChoice;
    isSelected: boolean;
    packageItemId: string;
    onChoiceChange: (packageItemId: string, menuItemId: string) => void;
}) {
    const label = choice.menu_item?.name ?? `Menu #${choice.menu_item_id}`;
    const image = choice.menu_item?.primary_image;
    const finalPrice = packageChoicePrice(choice);
    const discountPercent = packageDiscountPercentage(
        choice.menu_item?.base_price,
        finalPrice,
    );

    function handleChoiceSelect(): void {
        onChoiceChange(packageItemId, String(choice.menu_item_id));
    }

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            className="flex min-h-16 w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl bg-muted/30 p-2.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleChoiceSelect}
        >
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background text-muted-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Utensils className="size-5" />
                )}
            </span>

            <span className="grid min-w-0 flex-1 gap-1.5">
                <span className="truncate text-sm font-semibold text-foreground">
                    {label}
                </span>
                {discountPercent > 0 || choice.is_recommended ? (
                    <span className="flex flex-wrap items-center gap-1">
                        {discountPercent > 0 ? (
                            <PackageDiscountBadge
                                discountPercent={discountPercent}
                            />
                        ) : null}
                        {choice.is_recommended ? (
                            <PackageRecommendedBadge />
                        ) : null}
                    </span>
                ) : null}
            </span>

            <PackagePriceDisplay
                basePrice={choice.menu_item?.base_price}
                discountPercent={discountPercent}
                finalPrice={finalPrice}
            />

            <PackageSelectionCheckbox checked={isSelected} />
        </button>
    );
}

function PackageSelectionCheckbox({
    checked,
    disabled = false,
}: {
    checked: boolean;
    disabled?: boolean;
}) {
    return (
        <span
            aria-hidden="true"
            aria-disabled={disabled || undefined}
            className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-transparent group-hover:border-primary/50',
                disabled && 'cursor-not-allowed opacity-60',
            )}
        >
            <Check className="size-3 stroke-[3]" />
        </span>
    );
}

function hasSelectedChoice(
    item: OrderFormItem,
    packageItem: OrderPackageItem,
): boolean {
    return selectedChoiceMenuItemId(item, packageItem) !== '';
}
