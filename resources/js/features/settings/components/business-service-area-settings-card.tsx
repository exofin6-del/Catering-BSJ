import { Radius, LoaderCircle, MapPin, MapPinned, Save, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import type { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';
import { coordinateFromValues, formatCoordinate } from '@/lib/location-utils';

import { BusinessSettingCardHeader } from './business-setting-card-header';

export function BusinessServiceAreaSettingsCard({
    setIsLocationCommandOpen,
    settings,
}: {
    setIsLocationCommandOpen: Dispatch<SetStateAction<boolean>>;
    settings: ReturnType<typeof useBusinessSettings>;
}) {
    const { areaForm, radiusKm, submitArea } = settings;

    const selectedCoordinate = useMemo(
        () =>
            coordinateFromValues(
                areaForm.data.business_lat,
                areaForm.data.business_lng,
            ),
        [areaForm.data.business_lat, areaForm.data.business_lng],
    );

    const hasLocation = Boolean(selectedCoordinate);

    const locationInputValue =
        areaForm.data.business_address?.trim() ||
        (selectedCoordinate
            ? `${formatCoordinate(selectedCoordinate[0])}, ${formatCoordinate(selectedCoordinate[1])}`
            : '');

    const handleClearLocation = () => {
        areaForm.setData('business_lat', '');
        areaForm.setData('business_lng', '');
        areaForm.setData('business_address', '');
    };

    return (
        <Card className="overflow-hidden">
            <BusinessSettingCardHeader
                icon={MapPinned}
                title="Area layanan"
                description="Tentukan pusat catering dan radius maksimum pengantaran."
            />
            <CardContent className="grid gap-5 px-5 sm:px-6">
                <form className="grid gap-5" onSubmit={submitArea}>
                    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,10rem)]">
                        {/* Trigger input lokasi */}
                        <div className="grid gap-2">
                            <Label htmlFor="business_location">
                                Lokasi Catering
                            </Label>
                            <InputGroup
                                className="max-w-full cursor-pointer overflow-hidden"
                                onClick={() => setIsLocationCommandOpen(true)}
                            >
                                <InputGroupAddon>
                                    <MapPin className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="business_location"
                                    readOnly
                                    className="min-w-0 cursor-pointer caret-transparent"
                                    value={locationInputValue}
                                    placeholder="Pilih lokasi di maps"
                                    title={
                                        locationInputValue ||
                                        'Pilih lokasi di maps'
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            setIsLocationCommandOpen(true);
                                        }
                                    }}
                                />
                                {hasLocation && (
                                    <InputGroupAddon
                                        align="inline-end"
                                        className="shrink-0 pr-1 has-[>button]:mr-0"
                                    >
                                        <InputGroupButton
                                            aria-label="Hapus lokasi catering"
                                            size="icon-xs"
                                            className="shrink-0"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleClearLocation();
                                            }}
                                        >
                                            <X className="size-3.5" />
                                        </InputGroupButton>
                                    </InputGroupAddon>
                                )}
                            </InputGroup>
                        </div>

                        {/* Trigger input radius */}
                        <div className="grid gap-2">
                            <Label htmlFor="business_radius">
                                Maks. Jarak Order
                            </Label>
                            <InputGroup
                                className="max-w-full cursor-pointer overflow-hidden"
                                onClick={() => setIsLocationCommandOpen(true)}
                            >
                                <InputGroupAddon>
                                    <Radius className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="business_radius"
                                    readOnly
                                    className="min-w-0 cursor-pointer caret-transparent"
                                    value={`${radiusKm} km`}
                                    placeholder="Pilih radius"
                                    title={`${radiusKm} km`}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            setIsLocationCommandOpen(true);
                                        }
                                    }}
                                />
                            </InputGroup>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!areaForm.isDirty || areaForm.processing}
                        >
                            {areaForm.processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Simpan
                        </Button>

                        {areaForm.isDirty && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    areaForm.reset();

                                    areaForm.clearErrors();
                                }}
                            >
                                <X className="mr-1 size-4" />
                                Batal
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {areaForm.isDirty
                            ? 'Ada perubahan yang belum disimpan.'
                            : areaForm.recentlySuccessful
                              ? 'Perubahan berhasil disimpan.'
                              : ''}
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
