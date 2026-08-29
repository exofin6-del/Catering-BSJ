import { usePage } from '@inertiajs/react';
import BsjLogoIcon from '@/components/brand/bsj-logo-icon';

interface AppLogoProps {
    name?: string;
    size?: string | number;
    className?: string;
    description?: string | null;
}

export default function AppLogo({
    name: propName,
    size: propSize,
    description: propDescription,
}: AppLogoProps) {
    const { business } = usePage().props as any;

    const name =
        propName || business?.business_name || business?.name || 'Nama Bisnis';
    const description =
        propDescription ?? business?.description ?? 'Catering & Prasmanan';

    const isFullSize = propSize === 'full';

    const logoBox = (
        <span className="flex size-12 shrink-0 items-center justify-center text-primary">
            <BsjLogoIcon className="size-12 fill-current" />
        </span>
    );

    if (isFullSize) {
        return <div className="flex items-center">{logoBox}</div>;
    }

    return (
        <div className="flex items-center gap-1">
            {logoBox}

            <div className="min-w-0 flex-1 text-left">
                <span className="mb-1 block truncate font-['Manrope'] text-[18px] leading-none font-extrabold tracking-[-0.045em] text-primary">
                    {name}
                </span>

                {description && (
                    <span className="block truncate text-[11px] leading-none font-medium tracking-[0.01em] text-muted-foreground">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
}
