import { Trash2 } from 'lucide-react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { MenuPackage } from '@/types';

export function PackageDeleteDialog({
    item,
    open,
    onConfirm,
    onOpenChange,
}: {
    item: MenuPackage | null;
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <Trash2 className="size-5" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Hapus paket?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {item
                            ? `Paket "${item.name}" akan dihapus dari katalog. Tindakan ini tidak bisa dibatalkan.`
                            : 'Paket ini akan dihapus dari katalog.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
