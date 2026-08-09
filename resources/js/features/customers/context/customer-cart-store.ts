import type { OrderFormItem } from '@/features/orders/types/order-types';

const CartStorageKey = 'customer-storefront-cart.v1';

function readFromStorage(): OrderFormItem[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(CartStorageKey);

        if (!raw) {
            return [];
        }

        const parsed: unknown = JSON.parse(raw);

        return Array.isArray(parsed) ? (parsed as OrderFormItem[]) : [];
    } catch {
        return [];
    }
}

function writeToStorage(items: OrderFormItem[]): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(CartStorageKey, JSON.stringify(items));
    } catch {
        // Ignore storage quota and privacy-mode errors.
    }
}

let cartOpen = false;
let cartItems: OrderFormItem[] = readFromStorage();

const listeners = new Set<() => void>();

function notifyListeners(): void {
    listeners.forEach((listener) => listener());
}

export function subscribeCartStore(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function getCartOpen(): boolean {
    return cartOpen;
}

export function setCartOpen(open: boolean): void {
    cartOpen = open;
    notifyListeners();
}

export function getCartItems(): OrderFormItem[] {
    return cartItems;
}

export function updateCartItems(
    updater: (current: OrderFormItem[]) => OrderFormItem[],
): void {
    cartItems = updater(cartItems);
    writeToStorage(cartItems);
    notifyListeners();
}
