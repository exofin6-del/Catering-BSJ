import { MapPin, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { LocationCommand } from '@/components/shared/mapV2/location-command';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import type {
    OrderFormErrors,
    UpdateOrderFormField,
} from '@/features/orders/types/location-form-types';
import { coordinateFromValues, formatCoordinate } from '@/lib/location-utils';
import { cn } from '@/lib/utils';
import type { OrderFormData, OrderFormProps } from '../../../types/order-types';
import { resolveOperationalTimeRange } from '../../../utils/order-schedule-logic';
import { OrderDatePicker, OrderTimePicker } from '../order-schedule-picker';

export function OrderCustomerStep({
    business,
    businessSetting,
    layout = 'default',
    originalEventDate,
    surface,
}: {
    business?: CustomerBusiness;
    businessSetting?: OrderFormProps['businessSetting'];
    layout?: 'default' | 'stacked';
    originalEventDate?: string;
    surface?: 'storefront';
}) {
    const [isLocationCommandOpen, setIsLocationCommandOpen] = useState(false);
    const { control, formState, getValues, setValue } =
        useFormContext<OrderFormData>();
    const watchedValues = useWatch({ control });
    const data = { ...getValues(), ...watchedValues } as OrderFormData;
    const selectedCoordinate = useMemo(
        () => coordinateFromValues(data.latitude, data.longitude),
        [data.latitude, data.longitude],
    );
    const locationInputValue =
        selectedCoordinate && data.event_address.trim()
            ? data.event_address.trim()
            : selectedCoordinate
              ? `${formatCoordinate(selectedCoordinate[0])}, ${formatCoordinate(selectedCoordinate[1])}`
              : '';
    const hasLocationValue = Boolean(selectedCoordinate);
    const locationErrors = useMemo<OrderFormErrors>(
        () => ({
            address_name: fieldErrorMessage(
                formState.errors.address_name?.message,
            ),
            event_address: fieldErrorMessage(
                formState.errors.event_address?.message,
            ),
            latitude: fieldErrorMessage(formState.errors.latitude?.message),
            longitude: fieldErrorMessage(formState.errors.longitude?.message),
        }),
        [
            formState.errors.address_name?.message,
            formState.errors.event_address?.message,
            formState.errors.latitude?.message,
            formState.errors.longitude?.message,
        ],
    );
    const coordinateError =
        locationErrors.latitude ?? locationErrors.longitude ?? null;
    const handleUpdateField: UpdateOrderFormField = (field, value) => {
        setValue(field, value, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const handleClearLocation = () => {
        handleUpdateField('event_address', '');
        handleUpdateField('latitude', '');
        handleUpdateField('longitude', '');
    };

    const { maxTime, minTime } = resolveOperationalTimeRange(
        businessSetting?.operational_start_time,
        businessSetting?.operational_end_time,
    );

    return (
        <>
            <div className="grid gap-5">
                <div
                    className={cn(
                        'grid items-start gap-5',
                        layout === 'default' && 'lg:grid-cols-[3fr_1.5fr]',
                    )}
                >
                    <section className="admin-card min-w-0 p-4 md:p-5">
                        <FieldSet className="gap-5">
                            <FieldContent>
                                <FieldLegend className="text-base font-semibold text-foreground">
                                    Informasi pelanggan
                                </FieldLegend>
                                <FieldDescription className="text-sm leading-snug">
                                    Data dasar pemesan dan jadwal acara
                                </FieldDescription>
                            </FieldContent>

                            <FieldGroup className="gap-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FormField
                                        control={control}
                                        name="customer_name"
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel htmlFor="customer_name">
                                                    Nama pelanggan
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id="customer_name"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    autoComplete="name"
                                                    placeholder="Nama pemesan"
                                                    value={field.value ?? ''}
                                                />
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            </Field>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="phone"
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel htmlFor="phone">
                                                    No. HP
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id="phone"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    autoComplete="tel"
                                                    placeholder="08xxxxxxxxxx"
                                                    value={field.value ?? ''}
                                                />
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FormField
                                        control={control}
                                        name="event_name"
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel htmlFor="event_name">
                                                    Nama acara
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id="event_name"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="Contoh: Pernikahan, rapat, ulang tahun"
                                                    value={field.value ?? ''}
                                                />
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            </Field>
                                        )}
                                    />

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <FormField
                                            control={control}
                                            name="event_date"
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel htmlFor="event_date">
                                                        Tanggal acara
                                                    </FieldLabel>
                                                    <OrderDatePicker
                                                        invalid={
                                                            fieldState.invalid
                                                        }
                                                        onBlur={field.onBlur}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        originalEventDate={
                                                            originalEventDate
                                                        }
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                </Field>
                                            )}
                                        />

                                        <FormField
                                            control={control}
                                            name="event_time"
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor="event_time"
                                                        className="inline-flex items-center gap-1.5"
                                                    >
                                                        Jam acara
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium text-muted-foreground">
                                                            {minTime}–{maxTime}{' '}
                                                            WIB
                                                        </span>
                                                    </FieldLabel>
                                                    <OrderTimePicker
                                                        endTime={
                                                            businessSetting?.operational_end_time
                                                        }
                                                        invalid={
                                                            fieldState.invalid
                                                        }
                                                        onBlur={field.onBlur}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        startTime={
                                                            businessSetting?.operational_start_time
                                                        }
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    </section>

                    <aside className="admin-card min-w-0 p-4 md:p-5">
                        <FieldSet className="gap-5">
                            <FieldContent>
                                <FieldLegend className="text-md font-semibold text-foreground">
                                    Lokasi
                                </FieldLegend>
                                <FieldDescription className="text-sm leading-snug">
                                    Tentukan alamat acara.
                                </FieldDescription>
                            </FieldContent>

                            <FieldGroup className="gap-5">
                                <FormField
                                    control={control}
                                    name="address_name"
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="address_name">
                                                Nama Alamat
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="address_name"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Gedung, rumah, kantor"
                                                value={field.value ?? ''}
                                            />
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        </Field>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="event_address"
                                    render={({ field, fieldState }) => (
                                        <Field
                                            className="min-w-0"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="event_address">
                                                Lokasi acara
                                            </FieldLabel>
                                            <InputGroup
                                                className="max-w-full cursor-pointer overflow-hidden"
                                                onClick={() =>
                                                    setIsLocationCommandOpen(
                                                        true,
                                                    )
                                                }
                                            >
                                                <InputGroupAddon>
                                                    <MapPin className="size-4" />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    id="event_address"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    readOnly
                                                    className="min-w-0 cursor-pointer caret-transparent"
                                                    value={locationInputValue}
                                                    placeholder={
                                                        hasLocationValue
                                                            ? undefined
                                                            : 'Pilih lokasi di maps'
                                                    }
                                                    title={
                                                        locationInputValue ||
                                                        'Pilih lokasi di maps'
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key ===
                                                                'Enter' ||
                                                            event.key === ' '
                                                        ) {
                                                            event.preventDefault();
                                                            setIsLocationCommandOpen(
                                                                true,
                                                            );
                                                        }
                                                    }}
                                                />
                                                {hasLocationValue && (
                                                    <InputGroupAddon
                                                        align="inline-end"
                                                        className="shrink-0 pr-1 has-[>button]:mr-0"
                                                    >
                                                        <InputGroupButton
                                                            aria-label="Hapus lokasi acara"
                                                            size="icon-xs"
                                                            className="shrink-0"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                handleClearLocation();
                                                            }}
                                                        >
                                                            <X className="size-3.5" />
                                                        </InputGroupButton>
                                                    </InputGroupAddon>
                                                )}
                                            </InputGroup>
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        </Field>
                                    )}
                                />

                                {coordinateError && (
                                    <FieldError
                                        errors={[{ message: coordinateError }]}
                                    />
                                )}
                            </FieldGroup>
                        </FieldSet>
                    </aside>
                </div>

                <section className="admin-card min-w-0 p-4 md:p-5">
                    <FieldSet className="gap-5">
                        <FieldContent>
                            <FieldLegend className="text-md font-semibold text-foreground">
                                Catatan
                            </FieldLegend>
                            <FieldDescription className="text-sm leading-snug">
                                Tambahkan instruksi atau permintaan khusus.
                            </FieldDescription>
                        </FieldContent>

                        <FormField
                            control={control}
                            name="notes"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="notes">
                                        Catatan order
                                    </FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="notes"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Catatan tambahan untuk order ini"
                                        value={field.value ?? ''}
                                    />
                                    <FieldDescription>
                                        Informasi tambahan terkait pesanan,
                                        acara, atau permintaan pelanggan.
                                    </FieldDescription>
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                    </FieldSet>
                </section>
            </div>

            <LocationCommand
                open={isLocationCommandOpen}
                onOpenChange={setIsLocationCommandOpen}
                selectedLatitude={data.latitude}
                selectedLongitude={data.longitude}
                selectedAddress={data.event_address}
                onLocationSelect={(loc) => {
                    handleUpdateField('latitude', loc.latitude);
                    handleUpdateField('longitude', loc.longitude);
                    handleUpdateField('event_address', loc.address);
                }}
                businessLatitude={businessSetting?.business_lat}
                businessLongitude={businessSetting?.business_lng}
                maxOrderKm={businessSetting?.max_order_km}
                business={business}
                surface={surface}
            />
        </>
    );
}

function fieldErrorMessage(message: unknown): string | undefined {
    return typeof message === 'string' ? message : undefined;
}
