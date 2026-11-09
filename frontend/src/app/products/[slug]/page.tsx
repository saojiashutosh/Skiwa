"use client";

import { Heart, Minus, Plus, RotateCcw, Star, Truck } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ReviewSection } from "@/components/product/review-section";
import { ProductDetailSkeleton, ProductGridSkeleton } from "@/components/skeletons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useProduct, useRelatedProducts } from "@/hooks/queries";
import type { ProductListItem } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: product, isLoading, isError } = useProduct(params.slug);
  const { data: related, isLoading: relatedLoading } = useRelatedProducts(params.slug);
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const colors = useMemo(() => {
    if (!product) return [];
    const map = new Map(
      product.variants.filter((v) => v.color).map((v) => [v.color!.id, v.color!]),
    );
    return [...map.values()];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    const relevant = product.variants.filter(
      (v) => !selectedColorId || v.color?.id === selectedColorId,
    );
    const map = new Map(relevant.map((v) => [v.size.id, { size: v.size, stock: v.stock }]));
    return [...map.values()].sort((a, b) => a.size.sort_order - b.size.sort_order);
  }, [product, selectedColorId]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedSizeId) return null;
    return (
      product.variants.find(
        (v) =>
          v.size.id === selectedSizeId &&
          (colors.length === 0 || v.color?.id === (selectedColorId ?? v.color?.id)),
      ) ?? null
    );
  }, [product, selectedSizeId, selectedColorId, colors.length]);

  if (isError) notFound();
  if (isLoading || !product) return <div className="pt-28 md:pt-36"><ProductDetailSkeleton /></div>;

  const wishlistItem: ProductListItem = {
    ...product,
    primary_image: product.images[0]?.url ?? "",
    hover_image: product.images[1]?.url ?? "",
    colors,
  };

  const requireSelection = (): boolean => {
    if (colors.length > 0 && !selectedColorId) {
      toast.error("Select a color first.");
      return false;
    }
    if (!selectedVariant) {
      toast.error("Select a size first.");
      return false;
    }
    if (selectedVariant.stock < 1) {
      toast.error("This size is out of stock.");
      return false;
    }
    return true;
  };

  const addToCart = (): boolean => {
    if (!requireSelection() || !selectedVariant) return false;
    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url ?? "",
        size: selectedVariant.size.name,
        color: selectedVariant.color?.name ?? "",
        price: selectedVariant.price,
        maxStock: selectedVariant.stock,
      },
      quantity,
    );
    return true;
  };

  const buyNow = () => {
    if (addToCart()) router.push("/checkout");
  };

  return (
    <div className="pb-24 pt-28 md:pt-36">
      <div className="container grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Buy box */}
        <div className="lg:max-w-lg">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-caps">{product.category_name}</p>
            {product.collection_name && (
              <Badge variant="outline">{product.collection_name}</Badge>
            )}
            {product.is_new_arrival && <Badge>New</Badge>}
          </div>

          <h1 className="heading mt-4 text-5xl text-foreground md:text-6xl">{product.name}</h1>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex" aria-label={`Rated ${product.avg_rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      (product.avg_rating ?? 0) >= star - 0.5
                        ? "fill-foreground text-foreground"
                        : "text-muted-foreground/40",
                    )}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {product.avg_rating?.toFixed(1)} · {product.review_count} reviews
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl text-foreground">
              {formatINR(selectedVariant?.price ?? product.price)}
            </span>
            {product.compare_at_price && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatINR(product.compare_at_price)}
                </span>
                <span className="font-button text-xs uppercase tracking-widest text-accent">
                  {product.discount_percent}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">MRP inclusive of all taxes</p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Color selector */}
          {colors.length > 0 && (
            <div className="mt-8">
              <p className="label-caps mb-3">
                Color{" "}
                {selectedColorId && (
                  <span className="text-foreground">
                    — {colors.find((color) => color.id === selectedColorId)?.name}
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    title={color.name}
                    aria-label={`Select color ${color.name}`}
                    onClick={() => {
                      setSelectedColorId(color.id);
                      setSelectedSizeId(null);
                    }}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-all",
                      selectedColorId === color.id
                        ? "scale-110 border-accent"
                        : "border-white/20 hover:border-white/60",
                    )}
                    style={{ backgroundColor: color.hex_code }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="label-caps">Size</p>
              <span className="text-[11px] text-muted-foreground">Oversized fit — true to size</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map(({ size, stock }) => (
                <button
                  key={size.id}
                  type="button"
                  disabled={stock < 1}
                  onClick={() => setSelectedSizeId(size.id)}
                  className={cn(
                    "min-w-12 border px-4 py-3 font-button text-xs uppercase tracking-widest transition-colors",
                    selectedSizeId === size.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground hover:border-foreground",
                    stock < 1 && "cursor-not-allowed opacity-30 line-through",
                  )}
                >
                  {size.name}
                </button>
              ))}
            </div>
            {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
              <p className="mt-3 text-xs text-accent">
                Only {selectedVariant.stock} left in stock.
              </p>
            )}
          </div>

          {/* Quantity + actions */}
          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex items-center border border-border">
              <button
                type="button"
                className="px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button
                type="button"
                className="px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                disabled={quantity >= 10}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={!product.in_stock}
              onClick={addToCart}
            >
              {product.in_stock ? "Add to Cart" : "Sold Out"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14"
              onClick={() => toggle(wishlistItem)}
              aria-label="Toggle wishlist"
            >
              <Heart
                className={cn("h-5 w-5", has(product.id) && "fill-accent text-accent")}
                aria-hidden
              />
            </Button>
          </div>
          {product.in_stock && (
            <Button variant="accent" size="lg" className="mt-3 w-full" onClick={buyNow}>
              Buy Now
            </Button>
          )}

          {/* Trust row */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-foreground" aria-hidden /> Free shipping over ₹1,999
            </span>
            <span className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-foreground" aria-hidden /> 7-day easy returns
            </span>
          </div>

          {/* Info accordion */}
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="fabric">
              <AccordionTrigger>Fabric & Fit</AccordionTrigger>
              <AccordionContent>{product.fabric}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping</AccordionTrigger>
              <AccordionContent>
                Dispatched within 24–48 hours. Standard delivery in 5–7 business days across India;
                express in 2–3. Free standard shipping on orders above ₹1,999.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionTrigger>Returns</AccordionTrigger>
              <AccordionContent>
                Changed your mind? Raise a return within 7 days of delivery — unworn, unwashed,
                tags on. Refunds land back in 5–7 business days after pickup.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>Care Instructions</AccordionTrigger>
              <AccordionContent>{product.care_instructions}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection slug={product.slug} />

      {/* Related */}
      {(relatedLoading || (related && related.length > 0)) && (
        <section className="container mt-24">
          <Reveal>
            <p className="label-caps mb-3">Complete the Fit</p>
            <h2 className="heading text-4xl text-foreground md:text-5xl">You May Also Like</h2>
          </Reveal>
          <div className="mt-10">
            {relatedLoading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
                {(related ?? []).map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
