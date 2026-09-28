"use client";

import { useCallback, useSyncExternalStore } from "react";

// Tiny localStorage-backed stores for the cart and wishlist. They live only in the
// browser; prices are always re-checked on the server when an order is placed.

export type CartProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  image: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
};
export type CartItem = CartProduct & { qty: number };

type Listener = () => void;

function createStore<T>(key: string | null, initial: T) {
  let state = initial;
  let loaded = key === null;
  const listeners = new Set<Listener>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key!);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      // Private mode or corrupted value: start empty.
    }
  };

  return {
    get(): T {
      load();
      return state;
    },
    getServer(): T {
      return initial;
    },
    set(next: T) {
      state = next;
      if (key) {
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage full or blocked; keep the in-memory state.
        }
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (!key || e.key !== key) return;
        try {
          state = e.newValue ? (JSON.parse(e.newValue) as T) : initial;
        } catch {
          state = initial;
        }
        listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

const EMPTY_CART: CartItem[] = [];
const EMPTY_WISH: CartProduct[] = [];

const cartStore = createStore<CartItem[]>("dt-cart-v1", EMPTY_CART);
const wishStore = createStore<CartProduct[]>("dt-wishlist-v1", EMPTY_WISH);
const drawerStore = createStore<{ open: boolean; lastAdded: number | null }>(null, { open: false, lastAdded: null });

const MAX_QTY = 99;

function clampQty(qty: number, stock: number): number {
  const cap = stock > 0 ? Math.min(stock, MAX_QTY) : MAX_QTY;
  return Math.max(1, Math.min(cap, Math.floor(qty)));
}

export function useCart() {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.get, cartStore.getServer);

  const add = useCallback((product: CartProduct, qty = 1) => {
    const current = cartStore.get();
    const existing = current.find((i) => i.id === product.id);
    const next = existing
      ? current.map((i) => (i.id === product.id ? { ...i, ...product, qty: clampQty(i.qty + qty, product.stock) } : i))
      : [...current, { ...product, qty: clampQty(qty, product.stock) }];
    cartStore.set(next);
    drawerStore.set({ open: true, lastAdded: product.id });
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    cartStore.set(cartStore.get().map((i) => (i.id === id ? { ...i, qty: clampQty(qty, i.stock) } : i)));
  }, []);

  const remove = useCallback((id: number) => {
    cartStore.set(cartStore.get().filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => cartStore.set(EMPTY_CART), []);

  /** Replace stored product data (price, stock…) with fresh values from the server. */
  const refresh = useCallback((fresh: CartProduct[]) => {
    const byId = new Map(fresh.map((p) => [p.id, p]));
    cartStore.set(
      cartStore
        .get()
        .filter((i) => byId.has(i.id))
        .map((i) => {
          const p = byId.get(i.id)!;
          return { ...i, ...p, qty: clampQty(i.qty, p.stock) };
        }),
    );
  }, []);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  return { items, count, subtotal, add, setQty, remove, clear, refresh };
}

export function useWishlist() {
  const items = useSyncExternalStore(wishStore.subscribe, wishStore.get, wishStore.getServer);
  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback((product: CartProduct) => {
    const current = wishStore.get();
    wishStore.set(current.some((i) => i.id === product.id) ? current.filter((i) => i.id !== product.id) : [product, ...current]);
  }, []);
  const remove = useCallback((id: number) => wishStore.set(wishStore.get().filter((i) => i.id !== id)), []);
  const refresh = useCallback((fresh: CartProduct[]) => {
    const byId = new Map(fresh.map((p) => [p.id, p]));
    wishStore.set(wishStore.get().filter((i) => byId.has(i.id)).map((i) => ({ ...i, ...byId.get(i.id)! })));
  }, []);
  return { items, has, toggle, remove, refresh, count: items.length };
}

export function useCartDrawer() {
  const state = useSyncExternalStore(drawerStore.subscribe, drawerStore.get, drawerStore.getServer);
  const open = useCallback(() => drawerStore.set({ ...drawerStore.get(), open: true }), []);
  const close = useCallback(() => drawerStore.set({ open: false, lastAdded: null }), []);
  return { ...state, openDrawer: open, closeDrawer: close };
}
