import { Form, Head, usePage } from '@inertiajs/react';
import { KeyRound, LoaderCircle, Save, UserRound } from 'lucide-react';
import { useRef } from 'react';

import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/shared/heading';
import InputError from '@/components/shared/input-error';
import PasswordInput from '@/components/shared/password-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DeleteUser from '@/features/settings/components/delete-user';
import { edit } from '@/routes/profile';
import type { SharedData } from '@/types';

export default function AccountPage() {
    const { auth } = usePage<SharedData>().props;
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const newPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Akun" />

            <div className="min-w-0 space-y-5">
                <Heading
                    variant="small"
                    title="Akun"
                    description="Kelola username, password, dan akun admin."
                />

                <Card className="gap-0 overflow-hidden py-0 shadow-none">
                    <CardHeader className="border-b px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <UserRound className="size-4" />
                            </div>
                            <div className="grid gap-1">
                                <CardTitle>Username</CardTitle>
                                <CardDescription>
                                    Nama yang tampil di aplikasi.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
                        <Form
                            {...ProfileController.update.form()}
                            options={{ preserveScroll: true }}
                            className="grid gap-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="email"
                                        value={auth.user.email}
                                    />
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Username</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={auth.user.name}
                                            autoComplete="name"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                        <p className="text-xs text-muted-foreground">
                                            Login menggunakan {auth.user.email}
                                        </p>
                                    </div>
                                    <div>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <LoaderCircle className="size-4 animate-spin" />
                                            ) : (
                                                <Save className="size-4" />
                                            )}
                                            Simpan username
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden py-0 shadow-none">
                    <CardHeader className="border-b px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <KeyRound className="size-4" />
                            </div>
                            <div className="grid gap-1">
                                <CardTitle>Ganti password</CardTitle>
                                <CardDescription>
                                    Gunakan password yang kuat dan mudah
                                    diingat.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
                        <Form
                            {...SecurityController.update.form()}
                            options={{ preserveScroll: true }}
                            resetOnError={[
                                'current_password',
                                'password',
                                'password_confirmation',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                } else if (errors.password) {
                                    newPasswordInput.current?.focus();
                                }
                            }}
                            className="grid gap-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">
                                            Password saat ini
                                        </Label>
                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            autoComplete="current-password"
                                        />
                                        <InputError
                                            message={errors.current_password}
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">
                                                Password baru
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                ref={newPasswordInput}
                                                name="password"
                                                autoComplete="new-password"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">
                                                Ulangi password
                                            </Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                            />
                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <LoaderCircle className="size-4 animate-spin" />
                                            ) : (
                                                <KeyRound className="size-4" />
                                            )}
                                            Perbarui password
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <DeleteUser />
            </div>
        </>
    );
}

AccountPage.layout = {
    title: 'Pengaturan',
    breadcrumbs: [
        {
            title: 'Akun',
            href: edit(),
        },
    ],
};
