import { Clock3, LoaderCircle, Save, ShoppingCart } from 'lucide-react';

import InputError from '@/components/shared/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';

import { BusinessSettingCardHeader } from './business-setting-card-header';

export function BusinessHoursSettingsCard({
    settings,
}: {
    settings: ReturnType<typeof useBusinessSettings>;
}) {
    const { hoursForm, submitHours } = settings;

    return (
        <Card className="overflow-hidden">
            <BusinessSettingCardHeader
                icon={Clock3}
                title="Operasional & kapasitas"
                description="Batasi waktu dan jumlah order yang dapat diterima setiap hari."
            />
            <CardContent className="grid gap-5 px-5 sm:px-6">
                <form className="grid gap-5" onSubmit={submitHours}>
                    <div className="grid gap-5 lg:grid-cols-[180px_180px_minmax(220px,1fr)]">
                        <div className="grid gap-1.5">
                            <Label htmlFor="operational_start_time">
                                Jam buka
                            </Label>
                            <div className="relative">
                                <Clock3 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="operational_start_time"
                                    type="text"
                                    placeholder="00:00"
                                    maxLength={5}
                                    className="pl-9"
                                    value={
                                        hoursForm.data.operational_start_time
                                    }
                                    onChange={(e) => {
                                        let value = e.target.value.replace(
                                            /\D/g,
                                            '',
                                        );

                                        if (value.length > 2) {
                                            value = `${value.slice(0, 2)}:${value.slice(2, 4)}`;
                                        }

                                        hoursForm.setData(
                                            'operational_start_time',
                                            value,
                                        );
                                    }}
                                />
                            </div>
                            <InputError
                                message={
                                    hoursForm.errors.operational_start_time
                                }
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="operational_end_time">
                                Jam tutup
                            </Label>
                            <div className="relative">
                                <Clock3 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="operational_end_time"
                                    type="text"
                                    placeholder="00:00"
                                    maxLength={5}
                                    className="pl-9"
                                    value={hoursForm.data.operational_end_time}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(
                                            /\D/g,
                                            '',
                                        );

                                        if (value.length > 2) {
                                            value = `${value.slice(0, 2)}:${value.slice(2, 4)}`;
                                        }

                                        hoursForm.setData(
                                            'operational_end_time',
                                            value,
                                        );
                                    }}
                                />
                            </div>
                            <InputError
                                message={hoursForm.errors.operational_end_time}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="max_orders_per_day">
                                Maks. order/hari
                            </Label>

                            <div className="relative">
                                <ShoppingCart className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="max_orders_per_day"
                                    type="number"
                                    min={1}
                                    max={1000}
                                    className="pl-9"
                                    value={hoursForm.data.max_orders_per_day}
                                    onChange={(event) =>
                                        hoursForm.setData(
                                            'max_orders_per_day',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </div>

                            <InputError
                                message={hoursForm.errors.max_orders_per_day}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                !hoursForm.isDirty || hoursForm.processing
                            }
                        >
                            {hoursForm.processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Simpan
                        </Button>

                        {hoursForm.isDirty && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => hoursForm.reset()}
                            >
                                Batal
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {hoursForm.isDirty
                            ? 'Ada perubahan yang belum disimpan.'
                            : hoursForm.recentlySuccessful
                              ? 'Perubahan berhasil disimpan.'
                              : ''}
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
