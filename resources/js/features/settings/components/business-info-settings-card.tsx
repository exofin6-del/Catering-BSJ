import { Building2, LoaderCircle, Save, X } from 'lucide-react';

import InputError from '@/components/shared/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';

import { BusinessSettingCardHeader } from './business-setting-card-header';

export function BusinessInfoSettingsCard({
    settings,
}: {
    settings: ReturnType<typeof useBusinessSettings>;
}) {
    const { infoForm, submitInfo } = settings;

    const hasPendingChanges = infoForm.isDirty;

    return (
        <Card className="overflow-hidden">
            <BusinessSettingCardHeader
                icon={Building2}
                title="Informasi bisnis"
                description="Nama dan status penerimaan order."
            />
            <CardContent className="px-5 sm:px-6">
                <form className="grid gap-5" onSubmit={submitInfo}>
                    {/* Nama + WhatsApp */}
                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="business_name">Nama catering</Label>
                            <Input
                                id="business_name"
                                value={infoForm.data.business_name}
                                placeholder="Nama Bisnis"
                                onChange={(e) =>
                                    infoForm.setData(
                                        'business_name',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={infoForm.errors.business_name}
                            />
                        </div>
                        {/* WhatsApp */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="whatsapp_number">
                                Nomor WhatsApp
                            </Label>

                            <Input
                                id="whatsapp_number"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="Contoh: 081234567890"
                                value={infoForm.data.whatsapp_number}
                                onChange={(e) =>
                                    infoForm.setData(
                                        'whatsapp_number',
                                        e.target.value,
                                    )
                                }
                            />

                            <InputError
                                message={infoForm.errors.whatsapp_number}
                            />
                        </div>
                    </div>

                    {/* Status buka */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            className="mt-0.5"
                            checked={infoForm.data.is_open}
                            onCheckedChange={(checked) =>
                                infoForm.setData('is_open', checked === true)
                            }
                        />
                        <span className="grid gap-0.5">
                            <span className="text-sm font-medium">
                                Terima order baru
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Nonaktifkan saat bisnis tutup atau kapasitas
                                penuh.
                            </span>
                        </span>
                    </label>
                    <InputError message={infoForm.errors.is_open} />

                    {/* Tombol aksi */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!hasPendingChanges || infoForm.processing}
                        >
                            {infoForm.processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Simpan
                        </Button>
                        {hasPendingChanges && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    infoForm.reset();
                                    infoForm.clearErrors();
                                }}
                            >
                                <X className="mr-1 size-4" />
                                Batal
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {hasPendingChanges
                            ? 'Ada perubahan yang belum disimpan.'
                            : infoForm.recentlySuccessful
                              ? 'Berhasil disimpan.'
                              : ''}
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
