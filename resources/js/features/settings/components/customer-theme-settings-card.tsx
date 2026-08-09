import { LoaderCircle, Palette, Save } from 'lucide-react';

import InputError from '@/components/shared/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { customerThemeOptions } from '@/features/customers/types/customer-theme';
import type { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';

import { BusinessSettingCardHeader } from './business-setting-card-header';

export function CustomerThemeSettingsCard({
    settings,
}: {
    settings: ReturnType<typeof useBusinessSettings>;
}) {
    const { submitTheme, themeForm } = settings;

    return (
        <Card className="overflow-hidden">
            <BusinessSettingCardHeader
                icon={Palette}
                title="Tampilan customer"
                description="Pilih warna storefront customer. Tema ini terpisah dari dark mode admin."
            />
            <CardContent className="px-5 sm:px-6">
                <form
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    onSubmit={submitTheme}
                >
                    {customerThemeOptions.map((theme) => {
                        const selected =
                            themeForm.data.customer_theme === theme.value;

                        return (
                            <button
                                key={theme.value}
                                type="button"
                                aria-pressed={selected}
                                className={`group relative flex items-center gap-3 overflow-hidden rounded-lg border p-3 text-left transition-colors ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50 hover:bg-muted/40'}`}
                                onClick={() =>
                                    themeForm.setData(
                                        'customer_theme',
                                        theme.value,
                                    )
                                }
                            >
                                <span
                                    aria-hidden="true"
                                    className={`relative block h-24 w-28 shrink-0 overflow-hidden rounded-md border border-black/5 ${theme.previewClassName}`}
                                >
                                    <span className="absolute inset-x-0 top-0 h-3 bg-[var(--theme-accent)]" />
                                    <span className="absolute top-5 right-2 left-2 h-1.5 rounded-sm bg-[var(--theme-surface)]" />
                                    <span
                                        className="absolute top-8 right-2 left-2 h-9 rounded-md border bg-[var(--theme-card)] shadow-sm"
                                        style={{
                                            borderColor:
                                                'var(--theme-card-border)',
                                        }}
                                    />
                                    <span className="absolute right-2 bottom-1.5 left-2 h-3 rounded border border-[var(--theme-input-border)] bg-[var(--theme-card)]" />
                                    <span className="absolute right-3 bottom-3 h-2 w-7 rounded-full bg-[var(--theme-accent)]" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-medium">
                                        {theme.label}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        {theme.description}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                    <InputError
                        className="sm:col-span-2 xl:col-span-3"
                        message={themeForm.errors.customer_theme}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                !themeForm.isDirty || themeForm.processing
                            }
                        >
                            {themeForm.processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Simpan
                        </Button>

                        {themeForm.isDirty && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    themeForm.reset();
                                    themeForm.clearErrors();
                                }}
                            >
                                Batal
                            </Button>
                        )}
                    </div>
                    <p className="min-h-4 text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">
                        {themeForm.isDirty
                            ? 'Ada perubahan yang belum disimpan.'
                            : themeForm.recentlySuccessful
                              ? 'Perubahan berhasil disimpan.'
                              : ''}
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
