import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderMenuItem, OrderPackage } from '@/types';
import { useCustomerCart } from '../hooks/use-customer-cart';
import {
    getCartOpen,
    setCartOpen as setCartOpenInStore,
    subscribeCartStore,
} from './customer-cart-store';

export function useCustomerCartStore(
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
) {
    const cart = useCustomerCart(menuItems, packages);
    const [cartOpen, setCartOpenState] = useState(getCartOpen);

    useEffect(() => {
        return subscribeCartStore(() => {
            setCartOpenState(getCartOpen());
        });
    }, []);

    const setCartOpen = useCallback((open: boolean): void => {
        setCartOpenInStore(open);
    }, []);

    return useMemo(
        () => ({
            ...cart,
            cartOpen,
            setCartOpen,
        }),
        [cart, cartOpen, setCartOpen],
    );
}
