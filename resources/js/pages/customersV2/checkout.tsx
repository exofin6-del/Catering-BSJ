import { zodResolver } from '@hookform/resolvers/zod';
import type { Errors } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronLeft,
    LoaderCircle,
    ShoppingBag,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { storeCheckout } from '@/actions/App/Http/Controllers/CustomerV2/CustomerController';
import {
    OrderPackageDetailList,
    OrderSummaryList,
    OrderSummaryTotals,
} from '@/components/shared/order-summaries';
import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Form } from '@/components/ui/form';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type { CustomerCartLine } from '@/features/customers/hooks/use-customer-cart';
import type {
    CustomerBusiness,
    CustomerCheckoutProps,
} from '@/features/customers/types/customer-storefront-types';
import { OrderCustomerStep } from '@/features/orders/components/form/steps/order-customer-step';
import { customerOrderFormSchema } from '@/features/orders/schema/order-form-schema';
import type { OrderFormData } from '@/features/orders/types/order-types';
import { applyOrderFormServerErrors } from '@/features/orders/utils/order-form-errors';
import {
    buildOrderPayload,
    initialOrderFormData,
} from '@/features/orders/utils/order-form-values';
import { formatOrderPrice } from '@/features/orders/utils/order-format';
import {
    removePersistentState,
    usePersistedFormState,
} from '@/lib/hooks/use-persistent-state';
import { home } from '@/routes';

const CustomerCheckoutFormId = 'customer-checkout-form';
const CustomerCheckoutStorageKey = 'customer-checkout-form.v1';

type StorefrontCheckoutFlash = {
    order_code?: string;
    whatsapp_url?: string;
};

export const layout = null;

export default function CustomerCheckoutPage({
    business,
    businessSetting,
    menuItems,
    packages,
}: CustomerCheckoutProps) {
    const cart = useCustomerCartStore(menuItems, packages);
    const clearCart = cart.clear;
    const [processing, setProcessing] = useState(false);
    const hasErrorRef = useRef(false);
    const defaultValues = useMemo<OrderFormData>(
        () => ({
            ...initialOrderFormData(),
            items: cart.items,
            payment_type: 'full',
            status: 'pending_confirmation',
        }),
        [cart.items],
    );
    const form = useForm<OrderFormData>({
        defaultValues,
        resolver: zodResolver(customerOrderFormSchema),
    });
    usePersistedFormState(form, CustomerCheckoutStorageKey, ['proof_image']);

    useEffect(() => {
        form.setValue('items', cart.items, {
            shouldDirty: false,
            shouldValidate: false,
        });
    }, [cart.items, form]);

    const handleCheckoutFlash = useCallback(
        (flash?: Record<string, unknown> | null): boolean => {
            const checkout = flash?.storefront_checkout;

            if (!isStorefrontCheckoutFlash(checkout)) {
                return false;
            }

            clearCart();
            removePersistentState(CustomerCheckoutStorageKey);

            return true;
        },
        [clearCart],
    );

    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash as
                | Record<string, unknown>
                | undefined;

            handleCheckoutFlash(flash);
        });
    }, [handleCheckoutFlash]);

    function submit(values: OrderFormData): void {
        const payload = buildOrderPayload({
            ...values,
            items: cart.items,
            payment_type: 'full',
            status: 'pending_confirmation',
        });

        router.visit(storeCheckout.url(), {
            data: payload,
            method: 'post',
            onError: (errors: Errors) => {
                hasErrorRef.current = true;
                applyOrderFormServerErrors(errors, form.setError);
                toast.error('Pesanan belum dapat dibuat.', {
                    description: firstErrorMessage(errors),
                });
            },
            onFinish: (visit) => {
                setProcessing(false);

                // The backend redirects to WhatsApp via Inertia::location()
                // (HTTP 409 + X-Inertia-Location), which never fires
                // onFlash/onSuccess. Only onFinish runs, so clear the cart
                // and reset the form here on a successful checkout.
                if (visit.completed && !hasErrorRef.current) {
                    clearCart();
                    removePersistentState(CustomerCheckoutStorageKey);
                    form.reset({
                        ...initialOrderFormData(),
                        items: [],
                        payment_type: 'full',
                        status: 'pending_confirmation',
                    });
                }
            },
            onFlash: handleCheckoutFlash,
            onNetworkError: () => {
                hasErrorRef.current = true;
                toast.error('Koneksi bermasalah. Silakan coba kembali.');
            },
            onStart: () => {
                hasErrorRef.current = false;
                form.clearErrors();
                setProcessing(true);
            },
            preserveScroll: true,
        });
    }

    const itemError = form.formState.errors.items?.message;
    const canCheckout = business.is_open && Boolean(business.whatsapp_number);

    return (
        <>
            <Head title={`Checkout - ${business.name}`} />

            <div className="storefront-theme min-h-screen bg-background text-foreground">
                <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => window.history.back()}
                            className="size-9 rounded-full bg-primary/10 text-primary transition-all duration-200 hover:bg-primary/20"
                            aria-label="Kembali"
                        >
                            <ChevronLeft className="size-7" />
                        </Button>
                        <div className="grid gap-1">
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                Lengkapi detail pesanan
                            </h1>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Isi informasi acara, lalu lanjutkan konfirmasi
                                pesanan melalui WhatsApp.
                            </p>
                        </div>
                    </div>

                    {cart.lines.length > 0 ? (
                        <Form {...form}>
                            <form
                                id={CustomerCheckoutFormId}
                                className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(20rem,28vw,24rem)]"
                                onSubmit={(e) => form.handleSubmit(submit)(e)}
                            >
                                <OrderCustomerStep
                                    business={business}
                                    businessSetting={businessSetting}
                                    layout="stacked"
                                    surface="storefront"
                                />

                                <CustomerCheckoutSummary
                                    business={business}
                                    itemError={
                                        typeof itemError === 'string'
                                            ? itemError
                                            : undefined
                                    }
                                    lines={cart.lines}
                                    processing={processing}
                                    total={cart.total}
                                    canCheckout={canCheckout}
                                />
                            </form>
                        </Form>
                    ) : (
                        <Empty className="min-h-[28rem] border bg-muted/20">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <ShoppingBag />
                                </EmptyMedia>
                                <EmptyTitle>Keranjang masih kosong</EmptyTitle>
                                <EmptyDescription>
                                    Tambahkan menu atau paket dari katalog
                                    sebelum membuka checkout.
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button asChild>
                                    <Link href={home()} preserveScroll>
                                        <ArrowLeft className="size-4" />
                                        Kembali ke katalog
                                    </Link>
                                </Button>
                            </EmptyContent>
                        </Empty>
                    )}
                </main>
            </div>
        </>
    );
}

function CustomerCheckoutSummary({
    business,
    canCheckout,
    itemError,
    lines,
    processing,
    total,
}: {
    business: CustomerBusiness;
    canCheckout: boolean;
    itemError?: string;
    lines: CustomerCartLine[];
    processing: boolean;
    total: number;
}) {
    const summaryItems = lines.map(customerCheckoutSummaryItem);

    return (
        <aside className="min-w-0 rounded-xl border border-border/70 bg-card p-4 xl:sticky xl:top-5 xl:p-5">
            <div className="grid gap-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                        <h2 className="font-semibold">Item yang dipesan</h2>
                        <p className="text-xs leading-5 text-muted-foreground">
                            Periksa kembali item sebelum membuat pesanan.
                        </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {lines.length}
                    </span>
                </div>

                <OrderSummaryList items={summaryItems} variant="compact" />
                <OrderSummaryTotals
                    itemCount={lines.length}
                    subtotal={formatOrderPrice(total)}
                    total={formatOrderPrice(total)}
                />

                {itemError ? (
                    <p className="text-sm text-destructive">{itemError}</p>
                ) : null}

                <div className="grid gap-2">
                    <Button
                        type="submit"
                        form={CustomerCheckoutFormId}
                        className="h-10 w-full"
                        disabled={!canCheckout || processing}
                    >
                        {processing ? (
                            <LoaderCircle className="size-5 animate-spin" />
                        ) : (
                            <img
                                src="/images/ikon-whatsapp.png"
                                alt="WhatsApp"
                                className="size-5 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                        {processing
                            ? 'Mencatat pesanan...'
                            : 'Buat pesanan & lanjut WhatsApp'}
                    </Button>

                    {!business.is_open ? (
                        <p className="text-center text-xs text-destructive">
                            Catering sedang tidak menerima order baru.
                        </p>
                    ) : !business.whatsapp_number ? (
                        <p className="text-center text-xs text-destructive">
                            Nomor WhatsApp belum diatur oleh admin.
                        </p>
                    ) : null}
                </div>
            </div>
        </aside>
    );
}

function customerCheckoutSummaryItem(
    line: CustomerCartLine,
): OrderSummaryItemData {
    return {
        id: line.key,
        image: line.image,
        imageAlt: line.name,
        meta: line.categoryName,
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
        quantity: line.item.qty,
        total: formatOrderPrice(line.subtotal),
        unitPrice: formatOrderPrice(line.unitPrice),
    };
}

function isStorefrontCheckoutFlash(
    value: unknown,
): value is StorefrontCheckoutFlash {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const checkout = value as Partial<StorefrontCheckoutFlash>;

    return (
        (checkout.order_code === undefined ||
            typeof checkout.order_code === 'string') &&
        typeof checkout.whatsapp_url === 'string'
    );
}

function firstErrorMessage(errors: Errors): string | undefined {
    return Object.values(errors).find(
        (message): message is string =>
            typeof message === 'string' && message.trim() !== '',
    );
}
