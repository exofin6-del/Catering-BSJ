import { Check, CircleDollarSign } from 'lucide-react';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import {
    OrderPackageDetailList,
    OrderSummaryList,
    OrderSummaryTotals,
} from '@/components/shared/order-summaries';
import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import {
    FieldContent,
    FieldDescription,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
    Order,
    OrderItem,
    OrderMenuItem,
    OrderPackage,
    OrderPayment,
} from '@/types';

import type { OrderFormItem } from '../../types/order-types';
import type { OrderFormSummary } from '../../utils/order-form-values';
import {
    defaultPackageChoice,
    orderFormItemUnitPrice,
    packageChoicePrice,
} from '../../utils/order-form-values';
import {
    formatOrderDateTime,
    formatOrderPrice,
    numberValue,
} from '../../utils/order-format';
import { OrderCustomerSummary } from './order-customer-summary';

export function orderSnapshotSummary(order: Order): OrderFormSummary {
    return {
        subtotal: numberValue(order.subtotal),
        total: numberValue(order.total_price),
    };
}

export function orderSnapshotSummaryItems(
    order: Order,
): OrderSummaryItemData[] {
    return order.items.map((item) => {
        const sourceItem =
            item.item_type === 'package' ? item.package : item.menu_item;
        const categoryName =
            item.item_type === 'package'
                ? item.package?.package_category?.name
                : item.menu_item?.menu_category?.name;

        return {
            details:
                item.item_type === 'package'
                    ? {
                          content: <OrderPackageSnapshotDetails item={item} />,
                          label: `Tampilkan detail ${item.name_snapshot}`,
                      }
                    : undefined,
            id: `order-item-${item.id}`,
            image: sourceItem?.primary_image,
            imageAlt: item.name_snapshot,
            meta:
                categoryName ||
                (item.item_type === 'package' ? 'Paket' : 'Menu'),
            name: item.name_snapshot,
            quantity: String(item.qty ?? 1),
            total: formatOrderPrice(item.subtotal),
            unitPrice: formatOrderPrice(item.price_snapshot),
        };
    });
}

export function OrderFormSummaryAside({
    className,
    customerSummary,
    items,
    itemSummaries,
    menuItems,
    packages,
    payments = [],
    summary,
    showCustomerTab = true,
}: {
    className?: string;
    customerSummary?: ReactNode;
    items: OrderFormItem[];
    itemSummaries?: OrderSummaryItemData[];
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
    payments?: OrderPayment[];
    summary: OrderFormSummary;
    showCustomerTab?: boolean;
}) {
    const summaryItems = useMemo(
        () => itemSummaries ?? paymentSummaryItems(items, menuItems, packages),
        [itemSummaries, items, menuItems, packages],
    );

    const paymentCount = payments.length;
    const itemCount = summaryItems.length;

    return (
        <aside className={cn('min-w-0', className)}>
            <FieldSet className="gap-5">
                <FieldContent>
                    <FieldLegend className="text-md font-semibold text-foreground">
                        Ringkasan order
                    </FieldLegend>
                    <FieldDescription className="text-sm leading-snug">
                        Periksa item order, informasi pelanggan, dan riwayat
                        pembayaran.
                    </FieldDescription>
                </FieldContent>

                <Tabs defaultValue="items" className="gap-4">
                    <TabsList
                        variant="line"
                        className="w-full justify-start gap-5 border-b border-border/70 p-0 group-data-[orientation=horizontal]/tabs:h-10"
                    >
                        <TabsTrigger
                            value="items"
                            className="h-10 flex-none rounded-none px-0 text-xs group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                        >
                            Item order
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none font-semibold text-muted-foreground">
                                {itemCount}
                            </span>
                        </TabsTrigger>
                        {showCustomerTab && (
                            <TabsTrigger
                                value="customer"
                                className="h-10 flex-none rounded-none px-0 text-xs group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                            >
                                Pelanggan
                            </TabsTrigger>
                        )}
                        {paymentCount > 0 ? (
                            <TabsTrigger
                                value="payments"
                                className="h-10 flex-none rounded-none px-0 text-xs group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                            >
                                Pembayaran
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none font-semibold text-muted-foreground">
                                    {paymentCount}
                                </span>
                            </TabsTrigger>
                        ) : null}
                    </TabsList>

                    <TabsContent value="items">
                        {summaryItems.length > 0 ? (
                            <div className="grid gap-3">
                                <OrderSummaryList
                                    items={summaryItems}
                                    variant="compact"
                                />
                                <OrderSummaryTotals
                                    itemCount={itemCount}
                                    subtotal={formatOrderPrice(
                                        summary.subtotal,
                                    )}
                                    total={formatOrderPrice(summary.total)}
                                />
                            </div>
                        ) : (
                            <p className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                                Belum ada item order.
                            </p>
                        )}
                    </TabsContent>

                    {showCustomerTab && (
                        <TabsContent value="customer">
                            {customerSummary ?? <OrderCustomerSummary />}
                        </TabsContent>
                    )}

                    {paymentCount > 0 ? (
                        <TabsContent value="payments">
                            <PaymentHistoryList payments={payments} />
                            <PaymentTotalsSummary
                                total={summary.total}
                                payments={payments}
                            />
                        </TabsContent>
                    ) : null}
                </Tabs>
            </FieldSet>
        </aside>
    );
}

function PaymentHistoryList({ payments }: { payments: OrderPayment[] }) {
    return (
        <div className="overflow-hidden rounded-lg bg-muted/20">
            <div className="divide-y divide-border/60">
                {payments.map((payment) => (
                    <ExistingPaymentRow key={payment.id} payment={payment} />
                ))}
            </div>
        </div>
    );
}

function PaymentTotalsSummary({
    total,
    payments,
}: {
    total: number;
    payments: OrderPayment[];
}) {
    const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = total - paidAmount;

    return (
        <>
            <div className="mt-3 border-t border-border/30 pt-3">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Total Tagihan
                        </span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                            {formatOrderPrice(total)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Telah Dibayar
                        </span>
                        <span className="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                            -{formatOrderPrice(paidAmount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/30 pt-2">
                        <span className="text-xs font-semibold text-foreground">
                            Sisa Tagihan
                        </span>
                        <span
                            className={cn(
                                'text-base font-bold tabular-nums',
                                remaining > 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400',
                            )}
                        >
                            {formatOrderPrice(remaining)}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

function OrderPackageSnapshotDetails({ item }: { item: OrderItem }) {
    const selectedItems = item.selected_items ?? [];

    if (selectedItems.length === 0) {
        return (
            <p className="mt-2 rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                Detail pilihan paket belum tersedia.
            </p>
        );
    }

    return (
        <div className="mt-2 grid gap-1.5 border-t border-border/60 pt-2.5">
            {selectedItems.map((selectedItem, index) => {
                const selectedPrice = numberValue(selectedItem.price);

                return (
                    <div
                        key={`${selectedItem.package_item_id ?? 'item'}-${selectedItem.menu_item_id ?? index}`}
                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-0.5 text-[11px]"
                    >
                        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
                            <Check className="size-2.5 stroke-[3]" />
                        </span>
                        <span className="min-w-0 truncate font-medium text-foreground">
                            {selectedItem.package_item_name &&
                            selectedItem.package_item_name
                                .trim()
                                .toLowerCase() !==
                                selectedItem.name?.trim().toLowerCase()
                                ? `${selectedItem.package_item_name}: `
                                : ''}
                            {selectedItem.name ?? 'Menu tidak tersedia'}
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                            {selectedPrice > 0
                                ? formatOrderPrice(selectedPrice)
                                : 'Termasuk'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function ExistingPaymentRow({ payment }: { payment: OrderPayment }) {
    return (
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            {payment.proof_image ? (
                <a
                    href={payment.proof_image}
                    target="_blank"
                    rel="noreferrer"
                    className="size-11 shrink-0 overflow-hidden rounded-md border bg-background"
                    title="Lihat bukti pembayaran"
                >
                    <img
                        src={payment.proof_image}
                        alt="Bukti pembayaran"
                        className="size-full object-cover"
                    />
                </a>
            ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                    <CircleDollarSign className="size-4" />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                    {paymentTypeLabel(payment)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {paymentMethodLabel(payment.method)} ·{' '}
                    {formatOrderDateTime(payment.paid_at)}
                </p>
            </div>

            <div className="col-start-2 flex items-center justify-end gap-2 sm:col-start-auto">
                <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                    {formatOrderPrice(payment.amount)}
                </span>
            </div>
        </div>
    );
}

function paymentSummaryItems(
    items: OrderFormItem[],
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): OrderSummaryItemData[] {
    return items.map((item, index) => {
        const packageItem =
            item.item_type === 'package'
                ? packages.find(
                      (currentPackage) =>
                          String(currentPackage.id) === item.package_id,
                  )
                : undefined;
        const menuItem =
            item.item_type === 'menu_item'
                ? menuItems.find(
                      (currentMenuItem) =>
                          String(currentMenuItem.id) === item.menu_item_id,
                  )
                : undefined;
        const selectedItem =
            item.item_type === 'package' ? packageItem : menuItem;
        const categoryName =
            item.item_type === 'package'
                ? packageItem?.package_category?.name
                : menuItem?.menu_category?.name;
        const quantity = numericQuantity(item.qty);
        const unitPrice = orderFormItemUnitPrice(item, menuItems, packages);

        return {
            details: packageItem
                ? {
                      content: (
                          <PaymentPackageDetails
                              item={item}
                              packageItem={packageItem}
                          />
                      ),
                      label: `Tampilkan detail ${packageItem.name}`,
                  }
                : undefined,
            id: `${item.item_type}-${selectedItem?.id ?? 'missing'}-${index}`,
            image: selectedItem?.primary_image,
            imageAlt: selectedItem?.name,
            meta:
                categoryName ||
                (item.item_type === 'package' ? 'Paket' : 'Menu'),
            name:
                selectedItem?.name ??
                (item.item_type === 'package'
                    ? 'Paket tidak tersedia'
                    : 'Menu tidak tersedia'),
            quantity: `${quantity}`,
            total: formatOrderPrice(unitPrice * quantity),
            unitPrice: formatOrderPrice(unitPrice),
        };
    });
}

function PaymentPackageDetails({
    item,
    packageItem,
}: {
    item: OrderFormItem;
    packageItem: OrderPackage;
}) {
    return (
        <OrderPackageDetailList
            items={packageItem.items.map((component) => {
                const selectedMenuItemId = item.selected_items.find(
                    (selectedItem) =>
                        selectedItem.package_item_id === String(component.id),
                )?.menu_item_id;
                const selectedChoice = component.item_prices.find(
                    (choice) =>
                        String(choice.menu_item_id) === selectedMenuItemId,
                );
                const resolvedChoice =
                    selectedChoice ?? defaultPackageChoice(component);
                const selectedName =
                    component.item_prices.length > 0
                        ? (resolvedChoice?.menu_item?.name ?? 'Belum dipilih')
                        : (component.menu_item?.name ?? component.name);
                const selectedPrice =
                    component.item_prices.length > 0
                        ? packageChoicePrice(resolvedChoice)
                        : numberValue(
                              component.package_price ??
                                  component.menu_item?.promo_price ??
                                  component.menu_item?.base_price,
                          );
                const selectedImage =
                    component.item_prices.length > 0
                        ? resolvedChoice?.menu_item?.primary_image
                        : component.menu_item?.primary_image;

                return {
                    id: component.id,
                    image: selectedImage,
                    name: selectedName,
                    price:
                        selectedPrice > 0
                            ? formatOrderPrice(selectedPrice)
                            : 'Termasuk',
                };
            })}
        />
    );
}

function numericQuantity(value: string): number {
    const quantity = Number(value);

    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function paymentTypeLabel(payment: OrderPayment): string {
    if (payment.type === 'dp') {
        return 'Pembayaran DP';
    }

    if (payment.type === 'remaining') {
        return 'Pelunasan';
    }

    return 'Pembayaran lunas';
}

function paymentMethodLabel(method: OrderPayment['method']): string {
    if (method === 'transfer') {
        return 'Transfer';
    }

    if (method === 'cash') {
        return 'Tunai';
    }

    return 'Manual';
}
