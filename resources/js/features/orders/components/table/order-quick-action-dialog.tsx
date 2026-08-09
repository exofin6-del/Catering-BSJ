import { CheckCircle2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Order, OrderStatus } from '@/types';

export type OrderQuickActionDialogState = {
    kind: 'cancel' | 'complete';
    order: Order;
};

export function OrderQuickActionDialog({
    action,
    onOpenChange,
    onStatusConfirm,
}: {
    action: OrderQuickActionDialogState;
    onOpenChange: (open: boolean) => void;
    onStatusConfirm: (order: Order, status: OrderStatus) => void;
}) {
    const isCompleteAction = action.kind === 'complete';

    function confirm(): void {
        onStatusConfirm(
            action.order,
            isCompleteAction ? 'completed' : 'canceled',
        );
        onOpenChange(false);
    }

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isCompleteAction
                            ? 'Catat order selesai?'
                            : 'Batalkan order?'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCompleteAction
                            ? 'Order akan ditandai selesai dan tidak bisa diedit lagi.'
                            : 'Order yang dibatalkan tidak akan masuk jadwal aktif.'}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Kembali
                    </Button>
                    <Button
                        type="button"
                        variant={isCompleteAction ? 'default' : 'destructive'}
                        onClick={confirm}
                    >
                        {isCompleteAction ? (
                            <CheckCircle2 className="size-4" />
                        ) : (
                            <X className="size-4" />
                        )}
                        {isCompleteAction ? 'Catat Selesai' : 'Batalkan Order'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
