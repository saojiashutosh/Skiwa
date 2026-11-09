export const SITE_NAME = "SKIWAA";
export const SITE_TAGLINE = "Wear Your Energy";
export const SITE_DESCRIPTION =
  "SKIWAA — premium streetwear inspired by anime, typography and art. Minimal. Bold. Timeless.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const INSTAGRAM_URL = "https://instagram.com/skiwaa.in";
export const SUPPORT_EMAIL = "support@skiwaa.in";

export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const STORAGE_KEYS = {
  access: "skiwaa_access",
  refresh: "skiwaa_refresh",
  user: "skiwaa_user",
  cart: "skiwaa_cart",
  wishlist: "skiwaa_wishlist",
} as const;

export const FREE_SHIPPING_ABOVE = 1999;
