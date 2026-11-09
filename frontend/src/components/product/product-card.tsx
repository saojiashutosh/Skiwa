"use client";

import { Heart, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { api } from "@/lib/api";
import type { ProductDetail, ProductListItem, Variant } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

export function ProductCard({ product, priority = false }: { product: ProductListItem; priority?: boolean }) {
  const { has, toggle } = useWishlist();
  const { addItem } = useCart();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const wishlisted = has(product.id);

  const openQuickAdd = async () => {
    setQuickAddOpen(true);
    if (variants || loadingVariants) return;
    setLoadingVariants(true);
    try {
      const { data } = await api.get<ProductDetail>(`/products/${product.slug}/`);
      setVariants(data.variants);
    } catch {
      toast.error("Could not load sizes. Try the product page.");
      setQuickAddOpen(false);
    } finally {
      setLoadingVariants(false);
    }
  };

  const quickAdd = (variant: Variant) => {
    addItem({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.primary_image,
      size: variant.size.name,
      color: variant.color?.name ?? "",
      price: variant.price,
      maxStock: variant.stock,
    });
    setQuickAddOpen(false);
  };

  // Unique sizes with an in-stock variant (first color available wins).
  const sizeOptions = variants
    ? [...new Map(variants.filter((v) => v.stock > 0).map((v) => [v.size.name, v])).values()]
    : [];

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
        <div
          className="relative aspect-[3/4] overflow-hidden bg-muted"
          onMouseLeave={() => setQuickAddOpen(false)}
        >
          {product.primary_image ? (
            <>
              <Image
                src={product.primary_image}
                alt={product.name}
                fill
                priority={priority}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-all duration-700 ease-luxe",
                  product.hover_image && "group-hover:opacity-0",
                  !product.hover_image && "group-hover:scale-105",
                )}
              />
              {product.hover_image && (
                <Image
                  src={product.hover_image}
                  alt={`${product.name} — alternate view`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="scale-105 object-cover opacity-0 transition-all duration-700 ease-luxe group-hover:scale-100 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-2xl text-white/10">
              SKIWAA
            </div>
          )}

          {/* Status badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.is_new_arrival && <Badge>New</Badge>}
            {product.discount_percent > 0 && (
              <Badge variant="accent">-{product.discount_percent}%</Badge>
            )}
            {!product.in_stock && <Badge variant="outline">Sold Out</Badge>}
          </div>

          {/* Quick add — slides up on hover (desktop) */}
          {product.in_stock && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 translate-y-full bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-luxe group-hover:translate-y-0",
                quickAddOpen && "translate-y-0",
              )}
              onClick={(event) => event.preventDefault()}
            >
              {!quickAddOpen ? (
                <button
                  type="button"
                  onClick={openQuickAdd}
                  className="flex w-full items-center justify-center gap-2 py-3 font-button text-[11px] uppercase tracking-[0.25em] text-foreground transition-colors hover:text-accent"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Quick Add
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-1 p-2">
                  {loadingVariants && (
                    <span className="py-1.5 font-button text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Loading…
                    </span>
                  )}
                  {sizeOptions.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => quickAdd(variant)}
                      className="min-w-10 border border-border px-2 py-1.5 font-button text-[11px] uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:bg-accent hover:text-white"
                    >
                      {variant.size.name}
                    </button>
                  ))}
                  {!loadingVariants && variants && !sizeOptions.length && (
                    <span className="py-1.5 font-button text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Out of stock
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist heart */}
      <button
        type="button"
        onClick={() => toggle(product)}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            wishlisted ? "fill-accent text-accent" : "text-white",
          )}
          aria-hidden
        />
      </button>

      {/* Meta */}
      <div className="mt-4 space-y-1">
        <p className="label-caps">{product.category_name}</p>
        <Link
          href={`/products/${product.slug}`}
          className="block font-body text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-foreground">{formatINR(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatINR(product.compare_at_price)}
            </span>
          )}
        </div>
        {product.colors.length > 1 && (
          <div className="flex gap-1.5 pt-1">
            {product.colors.map((color) => (
              <span
                key={color.id}
                title={color.name}
                className="h-3 w-3 rounded-full border border-white/20"
                style={{ backgroundColor: color.hex_code }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
