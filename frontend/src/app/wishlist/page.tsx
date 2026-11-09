"use client";

import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/wishlist-context";
import { usePageCopy } from "@/hooks/queries";

export default function WishlistPage() {
  const { items, count, isLoading } = useWishlist();
  const { copy } = usePageCopy("wishlist");

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">{copy?.eyebrow ?? "Saved Energy"}</p>
      <h1 className="heading text-section-title text-foreground">
        {copy?.title ?? "Wishlist"} {count > 0 && <span className="text-accent">({count})</span>}
      </h1>

      <div className="mt-12">
        {isLoading && <ProductGridSkeleton count={4} />}
        {!isLoading && items.length === 0 && (
          <div className="max-w-md">
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Tap the heart on any piece to keep it here.
            </p>
            <Button className="mt-8" size="lg" asChild>
              <Link href="/shop">Discover the Drop</Link>
            </Button>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
