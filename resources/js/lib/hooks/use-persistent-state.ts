import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useWatch } from 'react-hook-form';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

type PersistentStateValue<T> = T | (() => T);
type PersistentStateDeserializer<T> = (value: unknown) => T | undefined;

type UsePersistentStateResult<T> = readonly [
    T,
    Dispatch<SetStateAction<T>>,
    () => void,
];

export function usePersistentState<T>(
    storageKey: string,
    initialValue: PersistentStateValue<T>,
    deserialize?: PersistentStateDeserializer<T>,
): UsePersistentStateResult<T> {
    const resolvedInitial = resolveInitialValue(initialValue);
    const initialValueRef = useRef<T>(resolvedInitial);
    const hydratedRef = useRef(false);

    // Initialize with the default value so the server render and the client
    // hydration render are identical. Hydrating from localStorage happens
    // in an effect after mount to avoid React hydration mismatches.
    const [state, setState] = useState<T>(resolvedInitial);

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedRef.current) {
            return;
        }

        hydratedRef.current = true;

        const storedState = readPersistentState(storageKey, deserialize);

        if (storedState === undefined) {
            return;
        }

        // Defer the setState to a microtask so we avoid calling it
        // synchronously within the effect body, which would otherwise
        // trigger a cascading render.
        Promise.resolve().then(() => setState(storedState));
    }, [deserialize, storageKey]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedRef.current) {
            return;
        }

        writePersistentState(storageKey, state);
    }, [state, storageKey]);

    const clear = useCallback((): void => {
        removePersistentState(storageKey);
        setState(initialValueRef.current);
    }, [storageKey]);

    return [state, setState, clear] as const;
}

export function removePersistentState(storageKey: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(storageKey);
}

export function usePersistedFormState<T extends FieldValues>(
    form: UseFormReturn<T>,
    storageKey: string,
    excludeKeys: string[] = [],
): void {
    const [isHydrated, setIsHydrated] = useState(false);
    const { control, getValues, reset } = form;
    const watchedValues = useWatch({ control });
    const serializedValues = JSON.stringify(
        withoutKeys(watchedValues, excludeKeys),
    );

    useEffect(() => {
        const storedState = readPersistentState<Partial<T>>(storageKey);

        if (isRecord(storedState)) {
            reset({
                ...getValues(),
                ...storedState,
            });
        }

        // Defer setting hydrated to avoid synchronous setState inside effect
        // which can cause cascading renders. Schedule on microtask.
        Promise.resolve().then(() => setIsHydrated(true));
    }, [getValues, reset, storageKey]);

    useEffect(() => {
        if (!isHydrated) {
            return;
        }

        writePersistentState(storageKey, JSON.parse(serializedValues));
    }, [isHydrated, serializedValues, storageKey]);
}

function resolveInitialValue<T>(initialValue: PersistentStateValue<T>): T {
    return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
}

function readPersistentState<T>(
    storageKey: string,
    deserialize?: PersistentStateDeserializer<T>,
): T | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    try {
        const storedValue = window.localStorage.getItem(storageKey);

        if (storedValue === null) {
            return undefined;
        }

        const parsedValue: unknown = JSON.parse(storedValue);

        return deserialize ? deserialize(parsedValue) : (parsedValue as T);
    } catch {
        return undefined;
    }
}

function writePersistentState<T>(storageKey: string, state: T): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
        // Ignore storage quota and privacy-mode errors.
    }
}

function withoutKeys<T extends object>(value: T, keys: string[]): Partial<T> {
    const result = { ...value } as Partial<T>;

    keys.forEach((key) => {
        delete result[key as keyof T];
    });

    return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
