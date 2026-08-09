import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form';
import { cn } from '@/lib/utils';

export function PublicationStatusCard({
    activeDescription,
    activeLabel,
    activeToggleLabel,
    recommendationDescription,
}: {
    activeDescription: string;
    activeLabel: string;
    activeToggleLabel: string;
    recommendationDescription: string;
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
            <FormField
                name="isActive"
                render={({ field }) => (
                    <div className="flex min-w-0 items-center justify-between gap-4 border-b px-4 py-3">
                        <div className="min-w-0 space-y-1">
                            <div className="text-sm font-medium">
                                {activeLabel}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {activeDescription}
                            </p>
                        </div>

                        <StatusSwitch
                            checked={field.value === true}
                            label={activeToggleLabel}
                            onCheckedChange={field.onChange}
                        />
                    </div>
                )}
            />

            <div className="grid gap-3 px-4 py-3">
                <div className="space-y-1">
                    <div className="text-sm font-medium">Rekomendasi</div>
                    <p className="text-sm text-muted-foreground">
                        {recommendationDescription}
                    </p>
                </div>

                <FormField
                    name="isRecommended"
                    render={({ field }) => (
                        <label className="flex min-w-0 cursor-pointer items-center gap-3 text-sm text-muted-foreground">
                            <Checkbox
                                checked={field.value === true}
                                className="size-5 rounded-[5px]"
                                aria-label="Tampilkan sebagai rekomendasi"
                                onCheckedChange={(checked) =>
                                    field.onChange(checked === true)
                                }
                            />
                            <span className="min-w-0 truncate">
                                Tampilkan sebagai rekomendasi
                            </span>
                        </label>
                    )}
                />
            </div>
        </div>
    );
}

function StatusSwitch({
    checked,
    label,
    onCheckedChange,
}: {
    checked: boolean;
    label: string;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
                checked && 'bg-foreground',
            )}
            onClick={() => onCheckedChange(!checked)}
        >
            <span
                className={cn(
                    'pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-1',
                )}
            />
        </button>
    );
}
