import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Printer,
    Calendar,
    User,
    Phone,
    MapPin,
    Building2,
    FileText,
    CreditCard,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    formatOrderDate,
    formatOrderDateTime,
    formatOrderPrice,
    formatOrderTime,
    orderItemDescription,
    orderPaidAmount,
    orderPaymentMethodLabel,
    orderPaymentStatusLabels,
    orderPaymentTypeLabel,
    orderReceiptDate,
    orderRemainingAmount,
    orderStatusLabels,
    orderStatusBadgeClass,
    paymentStatusBadgeClass,
} from '@/features/orders/utils/order-format';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';
import type { Order } from '@/types';

export default function OrderReceipt({ order }: { order?: Order | null }) {
    if (!order) {
        return (
            <>
                <Head title="Struk Order" />
                <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                    <div className="px-4 text-sm text-muted-foreground lg:px-6">
                        Order tidak ditemukan.
                    </div>
                </div>
            </>
        );
    }

    const paidAmount = orderPaidAmount(order);
    const remainingAmount = orderRemainingAmount(order);
    const receiptDate = orderReceiptDate(order);
    const isPaid = remainingAmount <= 0;

    return (
        <>
            <Head title={`Struk ${order.order_code}`} />

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    header, aside, nav, button, footer, .print-hidden, [data-sidebar], .sidebar-header, .sidebar-inset-header {
                        display: none !important;
                    }
                    body, html {
                        background-color: #fff !important;
                        color: #000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-receipt-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: #fff !important;
                    }
                    a {
                        text-decoration: none !important;
                        color: #000 !important;
                    }
                    @page {
                        margin: 15mm;
                        size: A4;
                    }
                }
            `,
                }}
            />

            <div className="@container/main flex flex-1 flex-col bg-slate-50/50 py-6 md:py-10 dark:bg-slate-950/20 print:bg-white print:py-0">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 md:gap-8 lg:px-6 print:max-w-none print:px-0">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Link href={orderRoute.show(order.id)}>
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali ke Detail
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => window.print()}
                            className="rounded-lg shadow-sm"
                        >
                            <Printer className="mr-2 size-4" />
                            Cetak Struk
                        </Button>
                    </div>

                    <section className="print-receipt-container relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/40 sm:p-8 md:p-10 dark:border-slate-800/80 dark:bg-slate-900 dark:shadow-none">
                        {isPaid && (
                            <div className="pointer-events-none absolute top-24 right-6 rotate-12 transform opacity-15 select-none sm:top-12 sm:right-12 dark:opacity-20 print:opacity-30">
                                <div className="rounded-lg border-4 border-double border-emerald-600 px-4 py-2 text-2xl font-extrabold tracking-widest text-emerald-600 uppercase sm:text-3xl dark:border-emerald-500 dark:text-emerald-500">
                                    Lunas / Paid
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800/60">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                                    <Building2 className="size-6" />
                                </div>
                                <div>
                                    <h1 className="font-sans text-xl font-bold tracking-tight text-slate-950 uppercase dark:text-white">
                                        Catering App
                                    </h1>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Premium Food & Catering Services
                                    </p>
                                </div>
                            </div>
                            <div className="text-left text-xs text-slate-500 sm:text-right dark:text-slate-400 print:text-left print:sm:text-right">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                    Catering Services Jakarta
                                </p>
                                <p className="mt-1">
                                    Jl. Jenderal Sudirman No. 45, Jakarta Pusat
                                </p>
                                <p>
                                    Telp/WA: +62 812-3456-7890 | email:
                                    catering@cateringapp.com
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 border-b border-slate-100 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start dark:border-slate-800/60">
                            <div>
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    Struk Pembayaran Resmi
                                </span>
                                <h2 className="mt-1.5 font-mono text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {order.order_code}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Dibuat pada{' '}
                                    {formatOrderDateTime(receiptDate)}
                                </p>
                            </div>
                            <div className="flex flex-row items-center gap-2.5 sm:flex-col sm:items-end">
                                <div className="flex gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${paymentStatusBadgeClass(
                                            order.payment_status,
                                        )}`}
                                    >
                                        {
                                            orderPaymentStatusLabels[
                                                order.payment_status
                                            ]
                                        }
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${orderStatusBadgeClass(
                                            order.status,
                                        )}`}
                                    >
                                        {orderStatusLabels[order.status]}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 py-6 md:grid-cols-2">
                            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/30">
                                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                    <User className="size-3.5" />
                                    Pelanggan (Ditagih Kepada)
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {order.customer_name}
                                    </p>
                                    <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                        <Phone className="size-3" />
                                        {order.phone}
                                    </p>
                                    {order.event_address && (
                                        <p className="mt-2 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400">
                                            <MapPin className="mt-0.5 size-3 shrink-0" />
                                            <span>
                                                {order.address_name && (
                                                    <strong className="block text-slate-700 dark:text-slate-300">
                                                        {order.address_name}
                                                    </strong>
                                                )}
                                                {order.event_address}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/30">
                                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                    <Calendar className="size-3.5" />
                                    Detail Acara & Jadwal
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <span className="block text-[10px] font-medium text-slate-400 uppercase dark:text-slate-500">
                                            Nama Acara
                                        </span>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {order.event_name || '-'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="block text-[10px] font-medium text-slate-400 uppercase dark:text-slate-500">
                                                Tanggal
                                            </span>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {formatOrderDate(
                                                    order.event_date,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-medium text-slate-400 uppercase dark:text-slate-500">
                                                Waktu
                                            </span>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {formatOrderTime(
                                                    order.event_time,
                                                )}{' '}
                                                WIB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="py-4">
                            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                <FileText className="size-3.5" />
                                Daftar Pesanan
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                                            <th className="w-12 px-4 py-3 text-center">
                                                No
                                            </th>
                                            <th className="px-4 py-3">
                                                Menu / Paket
                                            </th>
                                            <th className="w-20 px-4 py-3 text-center">
                                                Qty
                                            </th>
                                            <th className="w-36 px-4 py-3 text-right">
                                                Harga
                                            </th>
                                            <th className="w-36 px-4 py-3 text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {order.items.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10"
                                            >
                                                <td className="px-4 py-3 text-center font-medium text-slate-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {item.name_snapshot}
                                                    </p>
                                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                                                        {orderItemDescription(
                                                            item,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-center font-medium text-slate-700 tabular-nums dark:text-slate-300">
                                                    {item.qty}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 tabular-nums dark:text-slate-400">
                                                    {formatOrderPrice(
                                                        item.price_snapshot,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums dark:text-slate-200">
                                                    {formatOrderPrice(
                                                        item.subtotal,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="border-b border-slate-100 py-4 pb-6 dark:border-slate-800/60">
                            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                <CreditCard className="size-3.5" />
                                Riwayat Pembayaran
                            </h3>
                            {order.payments.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                                    <table className="w-full border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                                                <th className="px-4 py-3">
                                                    Tanggal
                                                </th>
                                                <th className="px-4 py-3">
                                                    Jenis
                                                </th>
                                                <th className="px-4 py-3">
                                                    Metode
                                                </th>
                                                <th className="px-4 py-3">
                                                    Catatan
                                                </th>
                                                <th className="w-36 px-4 py-3 text-right">
                                                    Jumlah
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/60">
                                            {order.payments.map((payment) => (
                                                <tr
                                                    key={payment.id}
                                                    className="text-slate-700 hover:bg-slate-50/30 dark:text-slate-300 dark:hover:bg-slate-900/10"
                                                >
                                                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                                                        {formatOrderDateTime(
                                                            payment.paid_at ??
                                                                payment.created_at,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium font-semibold text-slate-800 dark:text-slate-200">
                                                        {orderPaymentTypeLabel(
                                                            payment.type,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {orderPaymentMethodLabel(
                                                                payment.method,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="max-w-xs truncate px-4 py-3 text-slate-400 italic dark:text-slate-500">
                                                        {payment.notes || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800 tabular-nums dark:text-slate-200">
                                                        {formatOrderPrice(
                                                            payment.amount,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-6 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900/5 dark:text-slate-500">
                                    Belum ada pembayaran yang dicatat untuk
                                    pesanan ini.
                                </div>
                            )}
                        </div>

                        <div className="grid gap-6 pt-6 sm:grid-cols-2">
                            <div className="space-y-1 text-[11px] text-slate-400 dark:text-slate-500">
                                <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Syarat & Ketentuan:
                                </h4>
                                <p>
                                    1. Struk ini merupakan bukti pembayaran
                                    resmi yang sah secara sistem.
                                </p>
                                <p>
                                    2. Pesanan akan diproses setelah pembayaran
                                    uang muka (DP) minimal 50% diterima.
                                </p>
                                <p>
                                    3. Pelunasan tagihan selambat-lambatnya
                                    dilakukan 3 hari (H-3) sebelum hari
                                    pelaksanaan acara.
                                </p>
                                <p>
                                    4. Pembatalan pesanan yang telah
                                    dikonfirmasi akan dikenakan ketentuan biaya
                                    pembatalan sesuai kebijakan.
                                </p>
                            </div>

                            <div className="h-fit space-y-3.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/30">
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>Subtotal Pesanan</span>
                                    <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-300">
                                        {formatOrderPrice(order.subtotal)}
                                    </span>
                                </div>
                                <Separator className="bg-slate-100 dark:bg-slate-800/60" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        Total Tagihan
                                    </span>
                                    <span className="text-base font-black text-slate-950 tabular-nums dark:text-white">
                                        {formatOrderPrice(order.total_price)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>Jumlah Telah Dibayar</span>
                                    <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                                        -{formatOrderPrice(paidAmount)}
                                    </span>
                                </div>
                                <Separator className="bg-slate-100 dark:bg-slate-800/60" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        Sisa Tagihan
                                    </span>
                                    <span
                                        className={`text-base font-extrabold tabular-nums ${
                                            remainingAmount > 0
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-emerald-600 dark:text-emerald-400'
                                        }`}
                                    >
                                        {formatOrderPrice(remainingAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
                            <p className="font-medium text-slate-500 dark:text-slate-400">
                                Terima kasih atas kepercayaan Anda menggunakan
                                jasa Catering kami!
                            </p>
                            <p className="mt-1">
                                Struk ini dicetak secara otomatis dan sah tanpa
                                tanda tangan basah.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

OrderReceipt.layout = ({ order }: { order?: Order | null }) => ({
    title: 'Struk Order',
    back: {
        label: 'Kembali ke Order',
        href: orderRoute.index(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Order',
            href: orderRoute.index(),
        },
        {
            title: 'Struk',
            href: order?.id ? orderRoute.receipt(order.id) : orderRoute.index(),
        },
    ],
});
