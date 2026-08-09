export function customerWhatsAppUrl(
    number: string | null | undefined,
    message?: string,
): string | null {
    if (!number) {
        return null;
    }

    const digits = number.replace(/\D+/g, '');

    if (!digits) {
        return null;
    }

    const query = message ? `?text=${encodeURIComponent(message)}` : '';

    return `https://wa.me/${digits}${query}`;
}
