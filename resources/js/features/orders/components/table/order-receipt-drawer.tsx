import { usePage } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import type { Order } from '@/types';

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
    orderReceiptDownloadFilename,
    orderReceiptDate,
    orderRemainingAmount,
    orderStatusLabels,
} from '../../utils/order-format';

export function OrderReceiptDrawer({
    open,
    order,
    onOpenChange,
}: {
    open: boolean;
    order: Order;
    onOpenChange: (open: boolean) => void;
}) {
    const { business } = usePage().props;
    const [isDownloading, setIsDownloading] = useState(false);

    function handlePrint() {
        const cleanupPrintMode = () => {
            document.body.classList.remove('printing-order-receipt');
        };

        document.body.classList.add('printing-order-receipt');
        window.addEventListener('afterprint', cleanupPrintMode, {
            once: true,
        });
        window.print();
    }

    async function handleDownloadJpg() {
        setIsDownloading(true);

        try {
            const canvas = buildReceiptCanvas(order, business);

            const jpeg = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);

                            return;
                        }

                        reject(new Error('Unable to create JPG.'));
                    },
                    'image/jpeg',
                    0.95,
                );
            });

            const downloadUrl = URL.createObjectURL(jpeg);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = orderReceiptDownloadFilename(order);
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
            toast.success('Struk JPG berhasil diunduh.');
        } catch {
            toast.error('Struk JPG gagal diunduh. Silakan coba lagi.');
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
            <DrawerContent className="m-0 h-dvh max-h-dvh max-w-none rounded-none border-y-0 border-r-0 [--drawer-content-width:min(100vw,40rem)] [--drawer-inset:0px] sm:m-2 sm:h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-1rem)] sm:rounded-3xl sm:border sm:[--drawer-inset:--spacing(2)]">
                <DrawerHeader className="relative border-b px-5 py-4 pr-14 text-left sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="min-w-0">
                            <DrawerTitle className="truncate text-lg font-semibold">
                                Struk Pembayaran
                            </DrawerTitle>
                            <DrawerDescription className="truncate text-xs">
                                {order.order_code}
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>

                <div
                    data-order-receipt-scroll-area
                    className="min-h-0 flex-1 overflow-y-auto bg-muted/25 p-4 sm:p-6"
                >
                    <OrderReceiptPaper order={order} />
                </div>

                <DrawerFooter className="shrink-0 border-t bg-background px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] sm:px-6">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isDownloading}
                            onClick={handleDownloadJpg}
                        >
                            <Download className="size-4" />
                            {isDownloading ? 'Menyiapkan JPG...' : 'Unduh'}
                        </Button>
                        <Button type="button" onClick={handlePrint}>
                            <Printer className="size-4" />
                            Cetak struk
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function OrderReceiptPaper({ order }: { order: Order }) {
    const { business } = usePage().props;
    const paidAmount = orderPaidAmount(order);
    const remainingAmount = orderRemainingAmount(order);

    return (
        <div className="py-2">
            <article
                data-order-receipt-paper
                className="relative mx-auto max-w-md overflow-hidden border-y-4 border-dashed border-black bg-white px-5 py-8 text-black sm:px-6 [&_*]:!border-black [&_*]:!bg-white [&_*]:!text-black"
            >
                {/* 1. BRANDING & HEADER */}
                <header className="space-y-1 text-center">
                    <h2 className="font-sans text-base font-extrabold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                        Catering BSJ
                    </h2>
                    <p className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400">
                        Gedongan Kec. Baki, Kabupaten, Sukoharjo, Jawa Tengah
                    </p>
                    {business.whatsapp_number && (
                        <p className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400">
                            Telp: {business.whatsapp_number}
                        </p>
                    )}
                </header>

                <div className="my-4 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                {/* 2. ORDER IDENTIFICATION & META */}
                <section className="space-y-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                        <span>NO ORDER:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {order.order_code}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>TANGGAL:</span>
                        <span className="tabular-nums">
                            {formatOrderDateTime(orderReceiptDate(order))}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>PELANGGAN:</span>
                        <span className="max-w-[200px] truncate text-right font-bold text-zinc-800 dark:text-zinc-200">
                            {order.customer_name}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>TELEPON:</span>
                        <span className="tabular-nums">{order.phone}</span>
                    </div>
                    {order.event_name && (
                        <div className="flex justify-between">
                            <span>ACARA:</span>
                            <span className="max-w-[200px] truncate text-right">
                                {order.event_name}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>JADWAL:</span>
                        <span className="tabular-nums">
                            {formatOrderDate(order.event_date)} @{' '}
                            {formatOrderTime(order.event_time)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>STATUS BAYAR:</span>
                        <Badge
                            variant="outline"
                            className="h-5 rounded-full border-black bg-white px-2 py-0 font-sans text-[10px] font-semibold text-black"
                        >
                            {orderPaymentStatusLabels[order.payment_status]}
                        </Badge>
                    </div>
                    {order.event_address && (
                        <div className="mt-2 flex flex-col border-t border-dashed border-zinc-100 pt-2 dark:border-zinc-900">
                            <span className="text-[10px] font-bold text-zinc-400">
                                LOKASI ANTAR:
                            </span>
                            <span className="mt-1 font-sans text-[11px] leading-normal whitespace-pre-wrap text-zinc-500 dark:text-zinc-400">
                                {order.address_name && (
                                    <strong className="block text-zinc-700 dark:text-zinc-300">
                                        {order.address_name}
                                    </strong>
                                )}
                                {order.event_address}
                            </span>
                        </div>
                    )}
                </section>

                <div className="my-4 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                {/* 3. ITEMS TABLE */}
                <section className="font-mono text-xs">
                    <div className="flex justify-between border-b border-dashed border-zinc-200 pb-2 text-[10px] font-bold text-zinc-400 uppercase dark:border-zinc-800 dark:text-zinc-500">
                        <span>Item / Deskripsi</span>
                        <span className="text-right">Total</span>
                    </div>
                    <div className="divide-y divide-dashed divide-zinc-100 dark:divide-zinc-900">
                        {order.items.map((item) => (
                            <div key={item.id} className="space-y-1 py-3">
                                <div className="flex justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                                    <span className="max-w-[250px] break-words">
                                        {item.name_snapshot}
                                    </span>
                                    <span className="tabular-nums">
                                        {formatOrderPrice(item.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <span>
                                        {item.qty} x{' '}
                                        {formatOrderPrice(item.price_snapshot)}
                                    </span>
                                </div>
                                {item.selected_items &&
                                    item.selected_items.length > 0 && (
                                        <p className="mt-0.5 text-[10px] leading-normal text-zinc-400 italic dark:text-zinc-500">
                                            Isi: {orderItemDescription(item)}
                                        </p>
                                    )}
                            </div>
                        ))}
                    </div>
                </section>

                <div className="my-4 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                {/* 4. PAYMENTS LEDGER */}
                <section className="font-mono text-xs">
                    <div className="mb-2 border-b border-dashed border-zinc-200 pb-2 text-[10px] font-bold text-zinc-400 uppercase dark:border-zinc-800 dark:text-zinc-500">
                        <span>Riwayat Bayar</span>
                        <span className="float-right">Jumlah</span>
                    </div>
                    {order.payments.length > 0 ? (
                        <div className="divide-y divide-dashed divide-zinc-100 dark:divide-zinc-900">
                            {order.payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="py-2.5 text-[11px]"
                                >
                                    <div className="flex justify-between font-medium text-zinc-700 dark:text-zinc-300">
                                        <span>
                                            {orderPaymentTypeLabel(
                                                payment.type,
                                            )}{' '}
                                            (
                                            {orderPaymentMethodLabel(
                                                payment.method,
                                            )}
                                            )
                                        </span>
                                        <span className="font-bold text-zinc-800 tabular-nums dark:text-zinc-200">
                                            {formatOrderPrice(payment.amount)}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                                        <span>
                                            {formatOrderDateTime(
                                                payment.paid_at ??
                                                    payment.created_at,
                                            )}
                                        </span>
                                        {payment.notes && (
                                            <span className="max-w-[150px] truncate text-right italic">
                                                {payment.notes}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-[11px] text-zinc-400 italic dark:text-zinc-500">
                            Belum ada pembayaran dicatat
                        </div>
                    )}
                </section>

                <div className="my-4 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                {/* 5. TOTALS SUMMARY */}
                <section className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                        <span>SUBTOTAL:</span>
                        <span className="tabular-nums">
                            {formatOrderPrice(order.subtotal)}
                        </span>
                    </div>
                    <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                        <span>TOTAL TAGIHAN:</span>
                        <span className="tabular-nums">
                            {formatOrderPrice(order.total_price)}
                        </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>TELAH DIBAYAR:</span>
                        <span className="tabular-nums">
                            -{formatOrderPrice(paidAmount)}
                        </span>
                    </div>
                    <div className="my-3 border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                    <div className="dark:border-zinc-850 flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:bg-zinc-900/60">
                        <div>
                            <span className="block text-[10px] font-bold text-zinc-400 uppercase dark:text-zinc-500">
                                Sisa Tagihan
                            </span>
                            <span className="font-sans text-[10px] text-zinc-500 dark:text-zinc-400">
                                {orderStatusLabels[order.status]}
                            </span>
                        </div>
                        <span className="text-base font-black tabular-nums">
                            {formatOrderPrice(remainingAmount)}
                        </span>
                    </div>
                </section>

                {/* 6. FOOTER */}
                <footer className="mt-6 space-y-1 border-t border-dashed border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                    <p className="font-bold">*** TERIMA KASIH ***</p>
                    <p className="font-sans">Catering App & Kitchen Services</p>
                    <p className="font-sans">
                        Bukti pembayaran ini dicetak secara digital
                    </p>
                </footer>
            </article>
        </div>
    );
}

type ReceiptBusiness = {
    business_name: string;
    whatsapp_number: string | null;
};

function buildReceiptCanvas(
    order: Order,
    business: ReceiptBusiness,
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const scale = 2;
    const width = 720;
    const padding = 48;
    const contentWidth = width - padding * 2;
    const lineHeight = 28;
    const itemLineCount = order.items.reduce((total, item) => {
        const description = item.selected_items?.length
            ? `Isi: ${orderItemDescription(item)}`
            : '';

        return (
            total +
            2 +
            countWrappedLines(item.name_snapshot, 360) +
            countWrappedLines(description, contentWidth)
        );
    }, 0);
    const paymentLineCount = order.payments.reduce(
        (total, payment) =>
            total + 2 + countWrappedLines(payment.notes ?? '', 250),
        0,
    );

    canvas.width = width * scale;
    canvas.height = Math.max(
        1_400,
        (620 + itemLineCount * lineHeight + paymentLineCount * lineHeight) *
            scale,
    );

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Canvas is not supported.');
    }

    context.scale(scale, scale);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, canvas.height / scale);
    context.fillStyle = '#18181b';
    context.textBaseline = 'top';

    let cursor = padding;
    const divider = () => {
        context.save();
        context.strokeStyle = '#a1a1aa';
        context.setLineDash([8, 6]);
        context.beginPath();
        context.moveTo(padding, cursor);
        context.lineTo(width - padding, cursor);
        context.stroke();
        context.restore();
        cursor += 28;
    };
    const write = (
        text: string,
        x: number,
        options: {
            align?: CanvasTextAlign;
            bold?: boolean;
            color?: string;
            size?: number;
        } = {},
    ) => {
        context.font = `${options.bold ? '700' : '400'} ${options.size ?? 20}px Arial, sans-serif`;
        context.fillStyle = options.color ?? '#27272a';
        context.textAlign = options.align ?? 'left';
        context.fillText(text, x, cursor);
    };
    const writeWrapped = (
        text: string,
        x: number,
        maxWidth: number,
        options: {
            align?: CanvasTextAlign;
            bold?: boolean;
            color?: string;
            size?: number;
        } = {},
    ) => {
        const lines = wrapText(
            context,
            text,
            maxWidth,
            options.size ?? 20,
            options.bold ?? false,
        );

        for (const line of lines) {
            write(line, x, options);
            cursor += lineHeight;
        }
    };
    const writeRow = (label: string, value: string, bold = false) => {
        write(label, padding, { size: 18 });
        write(value, width - padding, { align: 'right', bold, size: 18 });
        cursor += lineHeight;
    };

    context.textAlign = 'center';
    context.font = '700 28px Arial, sans-serif';
    context.fillStyle = '#18181b';
    context.fillText(
        business.business_name || 'Catering BSJ',
        width / 2,
        cursor,
    );
    cursor += 38;
    context.font = '400 16px Arial, sans-serif';
    context.fillStyle = '#52525b';
    context.fillText('Bukti pembayaran digital', width / 2, cursor);
    cursor += 26;

    if (business.whatsapp_number) {
        context.fillText(
            `Telp: ${business.whatsapp_number}`,
            width / 2,
            cursor,
        );
        cursor += 26;
    }

    divider();
    writeRow('NO ORDER:', order.order_code, true);
    writeRow('TANGGAL:', formatOrderDateTime(orderReceiptDate(order)));
    writeRow('PELANGGAN:', order.customer_name, true);
    writeRow('TELEPON:', order.phone);

    if (order.event_name) {
        writeRow('ACARA:', order.event_name);
    }

    writeRow(
        'JADWAL:',
        `${formatOrderDate(order.event_date)} @ ${formatOrderTime(order.event_time)}`,
    );
    writeRow(
        'STATUS BAYAR:',
        orderPaymentStatusLabels[order.payment_status],
        true,
    );

    if (order.event_address) {
        cursor += 8;
        write('LOKASI ANTAR:', padding, {
            bold: true,
            color: '#71717a',
            size: 16,
        });
        cursor += 24;

        if (order.address_name) {
            writeWrapped(order.address_name, padding, contentWidth, {
                bold: true,
                size: 18,
            });
        }

        writeWrapped(order.event_address, padding, contentWidth, {
            color: '#52525b',
            size: 18,
        });
    }

    divider();
    write('ITEM / DESKRIPSI', padding, {
        bold: true,
        color: '#71717a',
        size: 16,
    });
    write('TOTAL', width - padding, {
        align: 'right',
        bold: true,
        color: '#71717a',
        size: 16,
    });
    cursor += 30;
    divider();

    for (const item of order.items) {
        writeWrapped(item.name_snapshot, padding, 360, {
            bold: true,
            size: 18,
        });
        const itemTop =
            cursor - lineHeight * countWrappedLines(item.name_snapshot, 360);
        const priceY = cursor;

        cursor = itemTop;
        write(formatOrderPrice(item.subtotal), width - padding, {
            align: 'right',
            bold: true,
            size: 18,
        });
        cursor = priceY;
        write(
            `${item.qty} x ${formatOrderPrice(item.price_snapshot)}`,
            padding,
            { color: '#52525b', size: 16 },
        );
        cursor += 24;

        if (item.selected_items?.length) {
            writeWrapped(
                `Isi: ${orderItemDescription(item)}`,
                padding,
                contentWidth,
                { color: '#71717a', size: 15 },
            );
        }

        cursor += 12;
    }

    divider();
    write('RIWAYAT BAYAR', padding, { bold: true, color: '#71717a', size: 16 });
    write('JUMLAH', width - padding, {
        align: 'right',
        bold: true,
        color: '#71717a',
        size: 16,
    });
    cursor += 30;
    divider();

    if (order.payments.length) {
        for (const payment of order.payments) {
            write(
                `${orderPaymentTypeLabel(payment.type)} (${orderPaymentMethodLabel(payment.method)})`,
                padding,
                { bold: true, size: 17 },
            );
            write(formatOrderPrice(payment.amount), width - padding, {
                align: 'right',
                bold: true,
                size: 17,
            });
            cursor += 24;
            write(
                formatOrderDateTime(payment.paid_at ?? payment.created_at),
                padding,
                { color: '#71717a', size: 15 },
            );

            if (payment.notes) {
                writeWrapped(payment.notes, width - padding, 250, {
                    align: 'right',
                    color: '#71717a',
                    size: 15,
                });
            } else {
                cursor += 24;
            }

            cursor += 8;
        }
    } else {
        write('Belum ada pembayaran dicatat', width / 2, {
            align: 'center',
            color: '#71717a',
            size: 16,
        });
        cursor += 28;
    }

    divider();
    writeRow('SUBTOTAL:', formatOrderPrice(order.subtotal));
    writeRow('TOTAL TAGIHAN:', formatOrderPrice(order.total_price), true);
    writeRow('TELAH DIBAYAR:', `-${formatOrderPrice(orderPaidAmount(order))}`);
    divider();
    write('SISA TAGIHAN', padding, { bold: true, color: '#52525b', size: 18 });
    write(formatOrderPrice(orderRemainingAmount(order)), width - padding, {
        align: 'right',
        bold: true,
        size: 24,
    });
    cursor += 36;
    write(orderStatusLabels[order.status], padding, {
        color: '#71717a',
        size: 15,
    });
    cursor += 34;
    divider();
    write('*** TERIMA KASIH ***', width / 2, {
        align: 'center',
        bold: true,
        size: 17,
    });
    cursor += 26;
    write('Struk ini dicetak secara digital', width / 2, {
        align: 'center',
        color: '#71717a',
        size: 15,
    });

    const completedCanvas = document.createElement('canvas');
    completedCanvas.width = canvas.width;
    completedCanvas.height = Math.ceil((cursor + padding) * scale);
    completedCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

    return completedCanvas;
}

function countWrappedLines(text: string, maxWidth: number): number {
    if (!text) {
        return 0;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        return 1;
    }

    return wrapText(context, text, maxWidth, 20, false).length;
}

function wrapText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    size: number,
    bold: boolean,
): string[] {
    context.font = `${bold ? '700' : '400'} ${size}px Arial, sans-serif`;

    return text.split('\n').flatMap((paragraph) => {
        const words = paragraph.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let line = '';

        for (const word of words) {
            const nextLine = line ? `${line} ${word}` : word;

            if (line && context.measureText(nextLine).width > maxWidth) {
                lines.push(line);
                line = word;
            } else {
                line = nextLine;
            }
        }

        if (line) {
            lines.push(line);
        }

        return lines.length ? lines : [''];
    });
}
