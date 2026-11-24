import { useCallback, useEffect, useState } from 'react';
import { getCentralProductPrice, useCentralPricing } from './pricingConfig';
import { calculateShipping, isCODAvailable, isCarrierSupported } from './shippingConfig';

export interface CartItem {
  productId: string;
  name: string;
  category: 'purchase' | 'rental' | 'accessory' | 'roaming';
  quantity: number;
  image?: string;
  roamingPackageId?: string;
  unitPriceOverrideBdt?: number;
}

export const CART_STORAGE_KEY = 'dslink_cart_v1';
export const CART_UPDATED_EVENT = 'dslink-cart-updated';

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.productId === 'string' && Number(item.quantity) > 0)
      .map((item) => ({
        productId: String(item.productId),
        name: String(item.name || item.productId),
        category: item.category || (String(item.productId).includes('rental') ? 'rental' : 'purchase'),
        quantity: Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1))),
        image: item.image ? String(item.image) : undefined,
        roamingPackageId: item.roamingPackageId ? String(item.roamingPackageId) : undefined,
        unitPriceOverrideBdt: Number.isFinite(Number(item.unitPriceOverrideBdt))
          ? Math.round(Number(item.unitPriceOverrideBdt))
          : undefined,
      }));
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: items }));
}

export function addItemToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }): CartItem[] {
  const current = readStoredCart();
  const qtyToAdd = Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1)));
  const idx = current.findIndex(
    (c) => c.productId === item.productId && (c.roamingPackageId || '') === (item.roamingPackageId || '')
  );
  if (idx >= 0) {
    current[idx] = {
      ...current[idx],
      quantity: Math.min(20, current[idx].quantity + qtyToAdd),
    };
  } else {
    current.push({
      productId: item.productId,
      name: item.name,
      category: item.category,
      quantity: qtyToAdd,
      image: item.image,
      roamingPackageId: item.roamingPackageId,
      unitPriceOverrideBdt: item.unitPriceOverrideBdt,
    });
  }
  writeStoredCart(current);
  return current;
}

export function updateCartItemQuantity(productId: string, quantity: number): CartItem[] {
  const current = readStoredCart();
  const next =
    quantity <= 0
      ? current.filter((c) => c.productId !== productId)
      : current.map((c) =>
          c.productId === productId
            ? { ...c, quantity: Math.min(20, Math.max(1, Math.floor(quantity))) }
            : c
        );
  writeStoredCart(next);
  return next;
}

export function removeCartItem(productId: string): CartItem[] {
  const next = readStoredCart().filter((c) => c.productId !== productId);
  writeStoredCart(next);
  return next;
}

export function clearCart(): CartItem[] {
  writeStoredCart([]);
  return [];
}

export function getCartCount(): number {
  return readStoredCart().reduce((sum, item) => sum + item.quantity, 0);
}

if (typeof window !== 'undefined') {
  (window as any).__DSLINK_CART__ = {
    getItems: readStoredCart,
    getCount: getCartCount,
    addItem: addItemToCart,
    updateQuantity: updateCartItemQuantity,
    removeItem: removeCartItem,
    clear: clearCart,
  };
}

export function useCart(shippingCountryCode = 'BD') {
  const { getPrice } = useCentralPricing();
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    const sync = () => setItems(readStoredCart());
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const enrichedItems = items.map((item) => {
    const unitPriceBdt =
      item.category === 'roaming' && item.unitPriceOverrideBdt !== undefined
        ? item.unitPriceOverrideBdt
        : getPrice(item.productId, item.unitPriceOverrideBdt ?? getCentralProductPrice(item.productId));
    return {
      ...item,
      unitPriceBdt,
      lineTotalBdt: unitPriceBdt * item.quantity,
    };
  });

  const subtotalBdt = enrichedItems.reduce((sum, i) => sum + i.lineTotalBdt, 0);
  const itemCount = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);
  const hasRental = enrichedItems.some((i) => i.category === 'rental');
  const shippingFeeBdt = itemCount > 0 ? calculateShipping(shippingCountryCode) : 0;
  const totalBdt = subtotalBdt + shippingFeeBdt;
  const codAvailable = isCODAvailable(shippingCountryCode, hasRental);
  const carrierAvailable = isCarrierSupported(shippingCountryCode);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(addItemToCart(item));
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setItems(updateCartItemQuantity(productId, qty));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(removeCartItem(productId));
  }, []);

  const clear = useCallback(() => {
    setItems(clearCart());
  }, []);

  return {
    items: enrichedItems,
    itemCount,
    subtotalBdt,
    shippingFeeBdt,
    totalBdt,
    hasRental,
    codAvailable,
    carrierAvailable,
    addItem,
    setQuantity,
    removeItem,
    clear,
  };
}
