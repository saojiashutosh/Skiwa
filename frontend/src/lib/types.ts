/** API entity types — mirror the Django REST serializers. */

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_email_verified: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  kind: "shipping" | "billing";
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface Color {
  id: number;
  name: string;
  slug: string;
  hex_code: string;
}

export interface Size {
  id: number;
  name: string;
  label: string;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  product_count: number;
}

export interface Collection {
  id: number;
  drop_number: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  release_date: string | null;
  is_featured: boolean;
  product_count: number;
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string;
  sort_order: number;
}

export interface Variant {
  id: number;
  sku: string;
  color: Color | null;
  size: Size;
  price: string;
  stock: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  discount_percent: number;
  category: string;
  category_name: string;
  collection: string | null;
  collection_name: string | null;
  primary_image: string;
  hover_image: string;
  colors: Color[];
  is_featured: boolean;
  is_new_arrival: boolean;
  is_trending: boolean;
  in_stock: boolean;
  avg_rating: number | null;
  review_count: number;
}

export interface ProductDetail extends Omit<ProductListItem, "primary_image" | "hover_image" | "colors"> {
  description: string;
  fabric: string;
  care_instructions: string;
  images: ProductImage[];
  variants: Variant[];
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PageCopy {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  placement: "hero" | "drop" | "editorial";
  image: string;
}

export interface Review {
  id: number;
  rating: number;
  title: string;
  body: string;
  author: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface Coupon {
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  value: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  description: string;
  price: string;
  free_above: string | null;
  eta_days_min: number;
  eta_days_max: number;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_slug: string;
  sku: string;
  size: string;
  color: string;
  image: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Order {
  number: string;
  email: string;
  status: string;
  status_display: string;
  payment_status: string;
  payment_status_display: string;
  shipping_address: Record<string, string>;
  billing_address: Record<string, string>;
  subtotal: string;
  discount: string;
  coupon_code: string;
  shipping_method: string;
  shipping_fee: string;
  total: string;
  tracking_number: string;
  tracking_url: string;
  customer_note: string;
  cancel_reason: string;
  return_reason: string;
  items: OrderItem[];
  can_cancel: boolean;
  can_return: boolean;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderListItem {
  number: string;
  status: string;
  status_display: string;
  payment_status: string;
  total: string;
  item_count: number;
  preview_image: string;
  created_at: string;
}

/** Local (guest) cart line, stored in localStorage and mirrored server-side after login. */
export interface CartLine {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: string;
  quantity: number;
  maxStock: number;
}

export interface RazorpayCheckoutPayload {
  key: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
}
