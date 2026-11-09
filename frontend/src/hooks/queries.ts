"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  Banner,
  Category,
  Collection,
  Color,
  Order,
  OrderListItem,
  PageCopy,
  Paginated,
  ProductDetail,
  ProductListItem,
  Review,
  ShippingMethod,
  Size,
} from "@/lib/types";

/* -- Catalog ----------------------------------------------------- */

export interface ProductFilters {
  category?: string;
  collection?: string;
  color?: string[];
  size?: string[];
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
  new?: boolean;
  trending?: boolean;
  on_sale?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

function filterParams(filters: ProductFilters): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) return;
    params[key] = Array.isArray(value) ? value.join(",") : String(value);
  });
  return params;
}

export function useProducts(filters: ProductFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ProductListItem>>("/products/", {
        params: filterParams(filters),
      });
      return data;
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get<ProductDetail>(`/products/${slug}/`)).data,
    enabled: Boolean(slug),
  });
}

export function useRelatedProducts(slug: string) {
  return useQuery({
    queryKey: ["related", slug],
    queryFn: async () => (await api.get<ProductListItem[]>(`/products/${slug}/related/`)).data,
    enabled: Boolean(slug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories/")).data,
    staleTime: 60_000,
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => (await api.get<Collection[]>("/collections/")).data,
    staleTime: 60_000,
  });
}

export function useCollection(slug: string) {
  return useQuery({
    queryKey: ["collection", slug],
    queryFn: async () => (await api.get<Collection>(`/collections/${slug}/`)).data,
    enabled: Boolean(slug),
  });
}

export function useFacets() {
  return useQuery({
    queryKey: ["facets"],
    queryFn: async () =>
      (await api.get<{ colors: Color[]; sizes: Size[] }>("/products/facets/")).data,
    staleTime: 60_000,
  });
}

/**
 * Backend-managed page copy, keyed by page ("shop", "collections", …).
 * Edit it in Django admin → Core → Page copy; no frontend deploy needed.
 */
export function usePageCopy(key: string) {
  const query = useQuery({
    queryKey: ["page-copy"],
    queryFn: async () => (await api.get<PageCopy[]>("/content/")).data,
    staleTime: 60_000,
  });
  return {
    copy: query.data?.find((entry) => entry.key === key),
    isLoading: query.isLoading,
  };
}

export function useBanners(placement?: string) {
  return useQuery({
    queryKey: ["banners", placement],
    queryFn: async () =>
      (await api.get<Banner[]>("/banners/", { params: placement ? { placement } : {} })).data,
    staleTime: 60_000,
  });
}

export function useReviews(slug: string) {
  return useQuery({
    queryKey: ["reviews", slug],
    queryFn: async () =>
      (await api.get<Paginated<Review>>(`/products/${slug}/reviews/`)).data,
    enabled: Boolean(slug),
  });
}

/* -- Checkout / account ------------------------------------------ */

export function useShippingMethods(enabled = true) {
  return useQuery({
    queryKey: ["shipping-methods"],
    queryFn: async () => (await api.get<ShippingMethod[]>("/shipping/methods/")).data,
    staleTime: 60_000,
    enabled,
  });
}

export function useOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get<Paginated<OrderListItem>>("/orders/")).data,
    enabled,
  });
}

export function useOrder(number: string, enabled: boolean) {
  return useQuery({
    queryKey: ["order", number],
    queryFn: async () => (await api.get<Order>(`/orders/${number}/`)).data,
    enabled: enabled && Boolean(number),
  });
}
