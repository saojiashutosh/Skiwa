"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { api, apiErrorMessage, getAccessToken } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import type { CartLine, Coupon } from "@/lib/types";
import { sumDecimals } from "@/lib/utils";

interface AppliedCoupon {
  coupon: Coupon;
  discount: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cart);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  }, [items, hydrated]);

  // After login, push the guest cart into the server cart so it survives devices.
  useEffect(() => {
    const mergeToServer = () => {
      const lines = readStoredCart();
      if (!lines.length || !getAccessToken()) return;
      api
        .post("/cart/merge/", {
          items: lines.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
        })
        .catch(() => {
          /* server cart is a mirror — local stays authoritative for the UI */
        });
    };
    window.addEventListener("skiwaa:login", mergeToServer);
    return () => window.removeEventListener("skiwaa:login", mergeToServer);
  }, []);

  const subtotal = useMemo(
    () => sumDecimals(items.map((item) => parseFloat(item.price) * item.quantity)),
    [items],
  );

  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, subtotal) : 0;
  const total = Math.max(subtotal - discount, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const syncServer = useCallback((variantId: number, quantity: number) => {
    if (!getAccessToken()) return;
    api
      .post("/cart/items/", { variant_id: variantId, quantity })
      .catch(() => {/* mirror only */});
  }, []);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((item) => item.variantId === line.variantId);
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, 10, line.maxStock);
          return current.map((item) =>
            item.variantId === line.variantId ? { ...item, quantity: nextQty } : item,
          );
        }
        return [{ ...line, quantity: Math.min(quantity, line.maxStock) }, ...current];
      });
      syncServer(line.variantId, quantity);
      setIsOpen(true);
    },
    [syncServer],
  );

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.max(1, Math.min(quantity, 10, item.maxStock)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((variantId: number) => {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    if (getAccessToken()) api.delete("/cart/").catch(() => {});
  }, []);

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        const { data } = await api.post("/coupons/validate/", {
          code,
          subtotal: subtotal.toFixed(2),
        });
        setAppliedCoupon({ coupon: data.coupon, discount: parseFloat(data.discount) });
        toast.success(`Coupon ${data.coupon.code} applied.`);
      } catch (error) {
        setAppliedCoupon(null);
        throw new Error(apiErrorMessage(error, "That coupon didn't work."));
      }
    },
    [subtotal],
  );

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  // Revalidate the coupon whenever the subtotal changes beneath it.
  useEffect(() => {
    if (!appliedCoupon || subtotal <= 0) return;
    api
      .post("/coupons/validate/", { code: appliedCoupon.coupon.code, subtotal: subtotal.toFixed(2) })
      .then(({ data }) =>
        setAppliedCoupon({ coupon: data.coupon, discount: parseFloat(data.discount) }),
      )
      .catch(() => setAppliedCoupon(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const value = useMemo(
    () => ({
      items, count, subtotal, discount, total, appliedCoupon, isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon,
    }),
    [items, count, subtotal, discount, total, appliedCoupon, isOpen, addItem, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
