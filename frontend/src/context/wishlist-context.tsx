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

import { api, getAccessToken } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import type { ProductListItem } from "@/lib/types";

interface WishlistContextValue {
  items: ProductListItem[];
  count: number;
  has: (productId: number) => boolean;
  toggle: (product: ProductListItem) => Promise<void>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readLocal(): ProductListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.wishlist);
    return raw ? (JSON.parse(raw) as ProductListItem[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverMode, setServerMode] = useState(false);

  const loadServer = useCallback(async () => {
    const { data } = await api.get<{ products: ProductListItem[] }>("/wishlist/");
    setItems(data.products);
    setServerMode(true);
  }, []);

  // Hydrate from server when logged in, else from localStorage.
  useEffect(() => {
    const hydrate = async () => {
      if (getAccessToken()) {
        try {
          await loadServer();
          return;
        } catch {
          /* fall through to local */
        }
      }
      setItems(readLocal());
      setServerMode(false);
    };
    hydrate().finally(() => setIsLoading(false));

    const onLogin = () => hydrate();
    const onLogout = () => {
      setItems(readLocal());
      setServerMode(false);
    };
    window.addEventListener("skiwaa:login", onLogin);
    window.addEventListener("skiwaa:logout", onLogout);
    return () => {
      window.removeEventListener("skiwaa:login", onLogin);
      window.removeEventListener("skiwaa:logout", onLogout);
    };
  }, [loadServer]);

  useEffect(() => {
    if (!serverMode && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(items));
    }
  }, [items, serverMode, isLoading]);

  const has = useCallback(
    (productId: number) => items.some((item) => item.id === productId),
    [items],
  );

  const toggle = useCallback(
    async (product: ProductListItem) => {
      const exists = items.some((item) => item.id === product.id);
      // Optimistic update either way.
      setItems((current) =>
        exists ? current.filter((item) => item.id !== product.id) : [product, ...current],
      );
      toast(exists ? "Removed from wishlist" : "Added to wishlist", {
        description: product.name,
      });
      if (serverMode) {
        try {
          await api.post("/wishlist/", { product_id: product.id });
        } catch {
          setItems((current) =>
            exists ? [product, ...current] : current.filter((item) => item.id !== product.id),
          );
          toast.error("Could not update wishlist. Try again.");
        }
      }
    },
    [items, serverMode],
  );

  const value = useMemo(
    () => ({ items, count: items.length, has, toggle, isLoading }),
    [items, has, toggle, isLoading],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return context;
}
