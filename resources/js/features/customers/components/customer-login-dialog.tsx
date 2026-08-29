import { usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { googleRedirect as googleRedirectRoute } from '@/actions/App/Http/Controllers/CustomerV2/CustomerAuthenticationController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { SharedData } from '@/types';

type CustomerLoginDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function CustomerLoginDialog({
    open,
    onOpenChange,
}: CustomerLoginDialogProps) {
    const page = usePage<SharedData & { googleClientId: string | null }>();

    const googleClientId = page.props.googleClientId;

    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setIsRedirecting(false);
        }

        onOpenChange(nextOpen);
    };

    const handleGoogleLogin = () => {
        if (!googleClientId) {
            return;
        }

        setIsRedirecting(true);

        // Full-page redirect to Google's account chooser. Google returns the
        // ID token to the login page, which posts it back to the server —
        // no browser-dependent FedCM/GSI prompt involved.
        window.location.href = googleRedirectRoute.url();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader className="items-center text-center">
                    <DialogTitle className="text-xl">
                        Log in or Sign up
                    </DialogTitle>

                    <DialogDescription>
                        Log in or create an account to continue.
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup>
                    <Field>
                        {googleClientId ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="w-full gap-3"
                                disabled={isRedirecting}
                                onClick={handleGoogleLogin}
                            >
                                {isRedirecting ? (
                                    <LoaderCircle className="size-5 animate-spin" />
                                ) : (
                                    <svg
                                        className="size-5"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fill="#4285F4"
                                            d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.42Z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.5Z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.09.31-1.59V7.88H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.12l3.24-2.53Z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.43 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z"
                                        />
                                    </svg>
                                )}

                                <span>
                                    {isRedirecting
                                        ? 'Mengalihkan ke Google...'
                                        : 'Continue with Google'}
                                </span>
                            </Button>
                        ) : (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-xs text-destructive">
                                Login Google belum dikonfigurasi.
                            </div>
                        )}
                    </Field>

                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                        Or continue with
                    </FieldSeparator>
                    <Field>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Email"
                            required
                        />
                    </Field>
                    <Button type="submit">Continue</Button>
                    <FieldDescription className="text-center">
                        Dengan melanjutkan, Anda menyetujui ketentuan layanan
                        dan kebijakan privasi.
                    </FieldDescription>
                </FieldGroup>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Opens the global customer login dialog rendered once by the customer
 * layout. Consumers (cart sheet, user menu) never render the dialog
 * themselves — they just call `showLogin()`.
 */
export function useCustomerLogin() {
    return {
        showLogin: () => {
            window.dispatchEvent(new CustomEvent('show-customer-login'));
        },
    };
}
