const defaultOperationalStartTime = '08:00';
const defaultOperationalEndTime = '17:00';
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function normalizeTime(value: string | undefined, fallback: string): string {
    const time = value?.slice(0, 5) ?? '';

    return timePattern.test(time) ? time : fallback;
}

export function resolveOperationalTimeRange(
    startTime?: string,
    endTime?: string,
): { maxTime: string; minTime: string } {
    const minTime = normalizeTime(startTime, defaultOperationalStartTime);
    const maxTime = normalizeTime(endTime, defaultOperationalEndTime);

    if (minTime >= maxTime) {
        return {
            maxTime: defaultOperationalEndTime,
            minTime: defaultOperationalStartTime,
        };
    }

    return { maxTime, minTime };
}

export function clampOrderTime(
    value: string,
    minTime: string,
    maxTime: string,
): string {
    const time = value.slice(0, 5);

    if (time === '' || !timePattern.test(time)) {
        return '';
    }

    if (time < minTime) {
        return minTime;
    }

    if (time > maxTime) {
        return maxTime;
    }

    return time;
}

export function formatOrderTimeInput(value: string | undefined): string {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) {
        return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseOrderTimeInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length !== 4) {
        return '';
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
