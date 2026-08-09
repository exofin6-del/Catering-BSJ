const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});
const monthRangeFormatter = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
});

export function formatScheduleDate(date: string): string {
    return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export function formatScheduleGoogleMapsUrl(
    latitude: unknown,
    longitude: unknown,
): string {
    if (latitude === null || latitude === undefined || latitude === '') {
        return 'Lokasi belum tersedia';
    }

    if (longitude === null || longitude === undefined || longitude === '') {
        return 'Lokasi belum tersedia';
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90 ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
    ) {
        return 'Lokasi belum tersedia';
    }

    const query = encodeURIComponent(`${parsedLatitude},${parsedLongitude}`);

    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function formatScheduleMonthRange(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);

    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
        return month;
    }

    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 0);

    return `${startDate.getDate()}–${endDate.getDate()} ${monthRangeFormatter.format(startDate)}`;
}

export function formatScheduleMenuItems(
    items: ReadonlyArray<{ name: string; qty: number }>,
): string {
    if (items.length === 0) {
        return 'Belum ada menu';
    }

    return items.map((item) => `${item.name} x ${item.qty}`).join('\n');
}

export function formatSchedulePrice(value: unknown): string {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(numberValue);
}

export function moveScheduleMonth(month: string, amount: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(year, monthNumber - 1 + amount, 1);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function scheduleYearOptions(): string[] {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 7 }, (_, index) =>
        String(currentYear - 3 + index),
    );
}

export function scheduleMonthName(month: string): string {
    return new Date(`2024-${month}-01`).toLocaleString('id-ID', {
        month: 'long',
    });
}
