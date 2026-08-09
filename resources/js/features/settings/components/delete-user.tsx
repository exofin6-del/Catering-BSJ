import { Form } from '@inertiajs/react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/shared/input-error';
import PasswordInput from '@/components/shared/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section className="overflow-hidden rounded-xl border border-destructive/20 bg-card">
            <div className="flex items-start gap-3 border-b border-destructive/15 px-4 py-4 sm:px-5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <Trash2 className="size-4" />
                </div>
                <div className="grid gap-1">
                    <h3 className="font-semibold">Hapus akun</h3>
                    <p className="text-sm text-muted-foreground">
                        Tindakan ini permanen dan tidak dapat dibatalkan.
                    </p>
                </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
                <Dialog>
                    <DialogTrigger
                        render={
                            <Button
                                size="sm"
                                variant="destructive"
                                data-test="delete-user-button"
                            >
                                <Trash2 className="size-4" />
                                Hapus akun
                            </Button>
                        }
                    />
                    <DialogContent>
                        <DialogTitle>Hapus akun secara permanen?</DialogTitle>
                        <DialogDescription>
                            Masukkan password untuk mengonfirmasi penghapusan
                            akun dan seluruh datanya.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="delete_password">
                                            Password
                                        </Label>

                                        <PasswordInput
                                            id="delete_password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Password"
                                            autoComplete="current-password"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose
                                            render={
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        resetAndClearErrors()
                                                    }
                                                >
                                                    Batal
                                                </Button>
                                            }
                                        />

                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                            data-test="confirm-delete-user-button"
                                        >
                                            {processing ? (
                                                <LoaderCircle className="size-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="size-4" />
                                            )}
                                            Hapus permanen
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
