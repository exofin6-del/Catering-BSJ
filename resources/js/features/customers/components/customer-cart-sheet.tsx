import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ShoppingCart, Trash2 } from 'lucide-react';
import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import {
    OrderPackageDetailList,
    OrderSummaryList,
} from '@/components/shared/order-summaries';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { formatOrderPrice } from '@/features/orders/utils/order-format';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import type { CustomerCartLine } from '../hooks/use-customer-cart';

type CustomerCartSheetProps = {
    checkoutHref: string;
    lines: CustomerCartLine[];
    open: boolean;
    total: number;
    onChangeQuantity: (key: string, amount: number) => void;
    onOpenChange: (open: boolean) => void;
    onRemove: (key: string) => void;
    onSetQuantity: (key: string, value: string) => void;
};

export function CustomerCartSheet({
    checkoutHref,
    lines,
    open,
    total,
    onChangeQuantity,
    onOpenChange,
    onRemove,
    onSetQuantity,
}: CustomerCartSheetProps) {
    const isMobile = useIsMobile();
    const summaryItems = lines.map((line) =>
        customerCartSummaryItem({
            line,
            onChangeQuantity,
            onRemove,
            onSetQuantity,
        }),
    );

    return (
        <Drawer
            open={open}
            showSwipeHandle={false}
            swipeDirection={isMobile ? 'right' : 'right'}
            onOpenChange={onOpenChange}
        >
            <DrawerContent className="m-0 h-[100svh] max-h-none w-full max-w-none rounded-none border-0 bg-card text-card-foreground shadow-xl [--drawer-inset:0px] md:m-2 md:h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-1rem)] md:w-[28rem] md:max-w-[calc(100vw-1rem)] md:rounded-3xl md:border md:[--drawer-inset:--spacing(2)]">
                <DrawerHeader className="relative border-b border-border/50 px-4 py-4 text-left md:px-5">
                    <div className="flex items-center gap-3 md:block">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="size-9 shrink-0 rounded-full bg-primary/10 text-primary transition-all duration-200 hover:bg-primary/20 md:hidden"
                            aria-label="Kembali"
                            onClick={() => onOpenChange(false)}
                        >
                            <ChevronLeft className="size-7" />
                        </Button>
                        <div className="min-w-0 flex-1 md:block">
                            <DrawerTitle className="text-base font-bold text-foreground">
                                Keranjang pesanan
                            </DrawerTitle>
                            <DrawerDescription className="text-xs text-muted-foreground">
                                Periksa kembali pilihan dan jumlah pesanan Anda.
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
                    {lines.length === 0 ? (
                        <div className="grid min-h-72 place-items-center text-center">
                            <div className="grid justify-items-center gap-3">
                                <span className="grid size-12 place-items-center rounded-full bg-muted">
                                    <ShoppingCart className="size-5 text-muted-foreground" />
                                </span>
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Keranjang masih kosong
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Tambahkan menu atau paket dari katalog.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <OrderSummaryList
                            items={summaryItems}
                            variant="plain"
                        />
                    )}
                </div>

                {lines.length > 0 && (
                    <DrawerFooter className="border-t border-border/50 bg-background/95 px-4 py-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl md:px-5 md:pb-4">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Estimasi total
                                </p>
                                <p className="truncate text-lg font-bold text-foreground tabular-nums">
                                    {formatOrderPrice(total)}
                                </p>
                            </div>
                            <Button
                                asChild
                                size="default"
                                className="rounded-xl font-medium"
                            >
                                <Link
                                    href={checkoutHref}
                                    prefetch="mount"
                                    cacheFor="1m"
                                    preserveScroll
                                    className="gap-2 data-loading:pointer-events-none data-loading:opacity-75"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Checkout
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    );
}

function customerCartSummaryItem({
    line,
    onChangeQuantity,
    onRemove,
    onSetQuantity,
}: {
    line: CustomerCartLine;
    onChangeQuantity: (key: string, amount: number) => void;
    onRemove: (key: string) => void;
    onSetQuantity: (key: string, value: string) => void;
}): OrderSummaryItemData {
    return {
        id: line.key,
        image: line.image,
        imageAlt: line.name,
        meta: (
            <span className="block truncate">
                {line.categoryName} · Min | {line.minimumOrder} pesanan
            </span>
        ),
        name: line.name,
        details:
            line.packageContents.length > 0
                ? {
                      content: (
                          <OrderPackageDetailList
                              items={line.packageContents.map((content) => ({
                                  ...content,
                                  price:
                                      content.price > 0
                                          ? formatOrderPrice(content.price)
                                          : 'Termasuk',
                              }))}
                          />
                      ),
                      label: `Tampilkan detail ${line.name}`,
                  }
                : undefined,
        quantityControl: {
            detailAction: (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive hover:text-destructive"
                    aria-label={`Hapus ${line.name}`}
                    onClick={() => onRemove(line.key)}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            ),
            layout: 'right-stacked',
            min: line.minimumOrder,
            onDecrease: () => onChangeQuantity(line.key, -1),
            onIncrease: () => onChangeQuantity(line.key, 1),
            onValueCommit: (value) => onSetQuantity(line.key, value),
            onValueChange: (value) => onSetQuantity(line.key, value),
            subtotal: formatOrderPrice(line.subtotal),
            subtotalDetail: line.subtotalDetail,
            value: line.item.qty,
        },
    };
}
