import {
    Calendar,
    MapPinned,
    Navigation,
    NotebookPen,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { FieldGroup } from '@/components/ui/field';
import {
    buildGoogleMapsDirectionsUrl,
    coordinateFromValues,
    formatCoordinate,
} from '@/lib/location-utils';

import type { OrderFormData } from '../../types/order-types';
import { formatOrderDate, formatOrderTime } from '../../utils/order-format';

export type OrderCustomerSummaryValues = {
    address_name?: unknown;
    customer_name?: unknown;
    event_address?: unknown;
    event_date?: unknown;
    event_name?: unknown;
    event_time?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    notes?: unknown;
    phone?: unknown;
};

export function OrderCustomerSummary() {
    const { control } = useFormContext<OrderFormData>();
    const [
        customerName = '',
        phone = '',
        eventName = '',
        eventDate = '',
        eventTime = '',
        addressName = '',
        eventAddress = '',
        latitude = '',
        longitude = '',
        notes = '',
    ] = useWatch({
        control,
        name: [
            'customer_name',
            'phone',
            'event_name',
            'event_date',
            'event_time',
            'address_name',
            'event_address',
            'latitude',
            'longitude',
            'notes',
        ],
    });

    return (
        <OrderCustomerSummaryView
            values={{
                address_name: addressName,
                customer_name: customerName,
                event_address: eventAddress,
                event_date: eventDate,
                event_name: eventName,
                event_time: eventTime,
                latitude,
                longitude,
                notes,
                phone,
            }}
        />
    );
}

export function OrderCustomerSummaryView({
    showLocationAction = false,
    values,
}: {
    showLocationAction?: boolean;
    values: OrderCustomerSummaryValues;
}) {
    const customerName = textValue(values.customer_name);
    const phone = textValue(values.phone);
    const eventName = textValue(values.event_name);
    const eventDate = textValue(values.event_date);
    const eventTime = textValue(values.event_time);
    const addressName = textValue(values.address_name);
    const eventAddress = textValue(values.event_address);
    const latitude = textValue(values.latitude);
    const longitude = textValue(values.longitude);
    const notes = textValue(values.notes);
    const selectedCoordinate = coordinateFromValues(latitude, longitude);
    const hasLocationValue = Boolean(
        eventAddress.trim() || latitude.trim() || longitude.trim(),
    );
    const locationDetail =
        eventAddress.trim() ||
        (selectedCoordinate
            ? `${formatCoordinate(selectedCoordinate[0])}, ${formatCoordinate(selectedCoordinate[1])}`
            : 'Belum ada lokasi');
    const googleMapsUrl = showLocationAction
        ? buildGoogleMapsDirectionsUrl({
              addressName,
              eventAddress,
              coordinate: selectedCoordinate,
          })
        : null;

    return (
        <FieldGroup className="gap-5">
            <OrderCustomerSummaryItem
                icon={UserRound}
                label="Pelanggan"
                value={customerName.trim() || 'Belum diisi'}
                description={phone.trim() || 'No. HP belum diisi'}
            />
            <OrderCustomerSummaryItem
                icon={Calendar}
                label="Acara"
                value={eventName.trim() || 'Belum diisi'}
                description={formatScheduleSummary(eventDate, eventTime)}
            />
            <OrderCustomerSummaryItem
                icon={MapPinned}
                label="Lokasi"
                value={
                    addressName.trim() ||
                    (hasLocationValue ? 'Lokasi acara' : 'Belum ada lokasi')
                }
                description={
                    hasLocationValue ? locationDetail : 'Pilih lokasi di maps'
                }
                action={
                    googleMapsUrl ? (
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                        >
                            <Navigation className="size-3" />
                            Dapatkan arah
                        </a>
                    ) : undefined
                }
            />
            <OrderCustomerSummaryItem
                icon={NotebookPen}
                label="Catatan"
                value={notes.trim() || 'Tidak ada catatan'}
            />
        </FieldGroup>
    );
}

function textValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function OrderCustomerSummaryItem({
    action,
    description,
    icon: Icon,
    label,
    value,
}: {
    action?: ReactNode;
    description?: string;
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground">
                    {label}
                </div>
                <div className="mt-1 text-sm font-medium break-words text-foreground">
                    {value}
                </div>
                {description || action ? (
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                        {description ? (
                            <span className="break-words">{description}</span>
                        ) : null}
                        {description && action ? (
                            <span aria-hidden="true">|</span>
                        ) : null}
                        {action}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function formatScheduleSummary(date: string, time: string): string {
    const dateText = date ? formatOrderDate(date) : null;
    const timeText = time ? formatOrderTime(time) : null;

    if (dateText && timeText) {
        return `${dateText} | ${timeText}`;
    }

    return dateText ?? timeText ?? 'Tanggal dan jam belum diisi';
}
