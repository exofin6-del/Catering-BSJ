import { Head, router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { OrderDetail } from '@/features/orders/components/shared/order-detail';
import {
    canCompleteOrder,
    canSettleOrder,
    getSettleButtonLabel,
    getSettleHref,
} from '@/features/orders/components/table/order-table-actions';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';
import type { Order } from '@/types';

export default function OrderShow({ order }: { order?: Order | null }) {
    if (!order) {
        return (
            <>
                <Head title="Detail Order" />
                <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                    <div className="px-4 text-sm text-muted-foreground lg:px-6">
                        Order tidak ditemukan.
                    </div>
                </div>
            </>
        );
    }

    const [processing, setProcessing] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);

    useEffect(() => {
        const handleConfirmEvent = () => {
            setOpenConfirm(true);
        };
        window.addEventListener('confirm-complete-order', handleConfirmEvent);

        return () => {
            window.removeEventListener(
                'confirm-complete-order',
                handleConfirmEvent,
            );
        };
    }, []);

    const handleConfirmComplete = () => {
        setProcessing(true);
        router.patch(
            orderRoute.status.url(order.id),
            {
                status: 'completed',
            },
            {
                onSuccess: () => {
                    toast.success(
                        'Status order berhasil diperbarui menjadi Selesai.',
                    );
                    setOpenConfirm(false);
                },
                onError: () => {
                    toast.error('Gagal memperbarui status order.');
                },
                onFinish: () => {
                    setProcessing(false);
                },
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title={`Detail ${order.order_code}`} />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-1 flex-col px-4 lg:px-6">
                    <OrderDetail order={order} />
                </div>
            </div>

            <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Catat order selesai?</DialogTitle>
                        <DialogDescription>
                            Order akan ditandai selesai dan tidak bisa diedit
                            lagi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenConfirm(false)}
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            Kembali
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            disabled={processing}
                            onClick={handleConfirmComplete}
                            className="cursor-pointer"
                        >
                            {processing ? null : (
                                <CheckCircle2 className="size-4" />
                            )}
                            {processing ? 'Memproses...' : 'Catat Selesai'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

OrderShow.layout = ({ order }: { order?: Order | null }) => ({
    title: 'Detail Order',
    back: {
        label: 'Kembali ke Order',
        href: orderRoute.index(),
    },
    actions:
        order?.id !== undefined
            ? [
                  ...(canSettleOrder(order)
                      ? [
                            {
                                label: getSettleButtonLabel(order),
                                href: getSettleHref(order),
                                icon: 'circle-dollar-sign' as const,
                                variant: 'outline' as const,
                            },
                        ]
                      : []),
                  ...(canCompleteOrder(order, true)
                      ? [
                            {
                                label: 'Catat Selesai',
                                icon: 'check-circle' as const,
                                variant: 'success' as const,
                                onClick: () => {
                                    window.dispatchEvent(
                                        new CustomEvent(
                                            'confirm-complete-order',
                                        ),
                                    );
                                },
                            },
                        ]
                      : []),
                  ...(order.can_edit
                      ? [
                            {
                                label: 'Edit',
                                href: orderRoute.edit(order.id),
                                icon: 'pencil' as const,
                            },
                        ]
                      : []),
              ]
            : undefined,
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
            title: 'Detail',
            href: order?.id ? orderRoute.show(order.id) : orderRoute.index(),
        },
    ],
});
