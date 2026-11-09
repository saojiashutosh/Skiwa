"use client";

/**
 * Types + hooks for the staff-only Studio panel (/studio → /api/manage/).
 * Server-side security lives in DRF (IsAdminUser); these are conveniences.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Order, Paginated } from "@/lib/types";

/* -- Types (mirror apps/manage/serializers.py) -------------------- */

export interface ManageStats {
  revenue_total: string;
  orders_total: number;
  orders_open: number;
  customers_total: number;
  products_total: number;
  low_stock_count: number;
  low_stock: {
    variant_id: number;
    product: string;
    product_id: number;
    sku: string;
    quantity: number;
  }[];
  recent_orders: AdminOrderRow[];
}

export interface AdminOrderRow {
  number: string;
  email: string;
  status: string;
  status_display: string;
  payment_status: string;
  total: string;
  item_count: number;
  created_at: string;
}

export interface AdminImage {
  id: number;
  product: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
  url: string;
}

export interface AdminVariant {
  id: number;
  product: number;
  color: number | null;
  size: number;
  sku: string;
  price_override: string | null;
  stock: number;
  color_name: string;
  size_name: string;
  price: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  category: number;
  category_name: string;
  collection: number | null;
  collection_name: string;
  description: string;
  fabric: string;
  care_instructions: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_trending: boolean;
  is_active: boolean;
  images: AdminImage[];
  variants: AdminVariant[];
  total_stock: number;
  created_at: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface AdminCollection {
  id: number;
  drop_number: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image_url: string;
  release_date: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
}

export interface AdminColor {
  id: number;
  name: string;
  slug: string;
  hex_code: string;
}

export interface AdminSize {
  id: number;
  name: string;
  label: string;
  sort_order: number;
}

export interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  value: string;
  min_subtotal: string;
  max_discount: string | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

export interface AdminBanner {
  id: number;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  placement: "hero" | "drop" | "editorial";
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface AdminPageCopy {
  id: number;
  key: string;
  eyebrow: string;
  title: string;
  body: string;
}

export interface AdminReview {
  id: number;
  product_name: string;
  user_email: string;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

/* -- Hooks --------------------------------------------------------- */

export function useStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => (await api.get<ManageStats>("/manage/stats/")).data,
    staleTime: 30_000,
  });
}

/** Generic list hook: resources without pagination return plain arrays. */
export function useAdminList<T>(resource: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ["admin", resource, params ?? {}],
    queryFn: async () => (await api.get<T>(`/manage/${resource}/`, { params })).data,
  });
}

export function useAdminProducts(params?: Record<string, string>) {
  return useAdminList<Paginated<AdminProduct>>("products", params);
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => (await api.get<AdminProduct>(`/manage/products/${id}/`)).data,
    enabled: Boolean(id),
  });
}

export function useAdminOrder(number: string) {
  return useQuery({
    queryKey: ["admin", "order", number],
    queryFn: async () => (await api.get<Order>(`/manage/orders/${number}/`)).data,
    enabled: Boolean(number),
  });
}

/** Invalidate every admin query (and the public catalog mirrors). */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    // Storefront queries showing the same data:
    ["products", "product", "collections", "collection", "categories", "banners", "page-copy", "facets"].forEach(
      (key) => queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };
}
