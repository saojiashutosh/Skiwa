"use client";

import Image from "next/image";
import { notFound, useParams } from "next/navigation";

import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useProducts } from "@/hooks/queries";

export default function CollectionDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: collection, isLoading, isError } = useCollection(slug);
  const { data: products, isLoading: productsLoading } = useProducts({
    collection: slug,
    page_size: 24,
  });

  if (isError) notFound();

  return (
    <div className="pb-24">
      {/* Hero banner */}
      <section className="relative flex min-h-[70svh] items-end overflow-hidden">
        {collection?.image ? (
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <Skeleton className="absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="container relative z-10 pb-16 pt-40">
          {collection && (
            <>
              <Reveal>
                <p className="label-caps text-accent">{collection.drop_number}</p>
              </Reveal>
              <TextReveal
                text={collection.name}
                className="heading mt-3 text-display text-white"
                delay={0.15}
              />
              {collection.tagline && (
                <Reveal delay={0.4}>
                  <p className="mt-4 text-sm italic text-white/70 md:text-base">
                    “{collection.tagline}”
                  </p>
                </Reveal>
              )}
            </>
          )}
        </div>
      </section>

      {/* Description */}
      {collection?.description && (
        <section className="container py-16 md:py-20">
          <Reveal>
            <p className="mx-auto max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
              {collection.description}
            </p>
          </Reveal>
        </section>
      )}

      {/* Products */}
      <section className="container">
        <div className="mb-10 flex items-baseline justify-between border-b border-border pb-4">
          <h2 className="heading text-3xl text-foreground md:text-4xl">The Pieces</h2>
          <p className="text-xs text-muted-foreground">
            {products ? `${products.count} products` : ""}
          </p>
        </div>
        {isLoading || productsLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {(products?.results ?? []).map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 0.06}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
