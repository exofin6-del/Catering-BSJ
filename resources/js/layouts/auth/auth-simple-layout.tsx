import BsjLogoIcon from '@/components/brand/bsj-logo-icon';

import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children, title }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <span className="flex size-15 shrink-0 items-center justify-center text-primary">
                            <BsjLogoIcon className="size-15" />
                        </span>
                        <span className="sr-only">{title}</span>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
