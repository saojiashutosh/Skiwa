"use client";

import Image from "next/image";
import Link from "next/link";

import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections, useProducts } from "@/hooks/queries";

export function FeaturedDrop() {
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const featured = collections?.find((collection) => collection.is_featured) ?? collections?.[0];

  const { data: products, isLoading: productsLoading } = useProducts(
    { collection: featured?.slug, page_size: 4 },
    Boolean(featured),
  );

  // No drops in the backend yet — nothing to feature.
  if (!collectionsLoading && !featured) return null;

  return (
    <section className="container py-20 md:py-32">
      {/* Editorial header — straight from the backend */}
      <div className="grid gap-10 md:grid-cols-2 md:items-end">
        {collectionsLoading ? (
          <>
            <div className="space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-16 w-3/4" />
            </div>
            <div className="space-y-2 md:ml-auto md:w-full md:max-w-md">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </>
        ) : (
          <>
            <Reveal>
              <p className="label-caps mb-4 text-accent">{featured!.drop_number}</p>
              <h2 className="heading text-section-title text-foreground">{featured!.name}</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:ml-auto">
                {featured!.description}
              </p>
            </Reveal>
          </>
        )}
      </div>

      {/* Drop banner */}
      {collectionsLoading ? (
        <Skeleton className="mt-14 aspect-[21/9] w-full" />
      ) : (
        featured?.image && (
          <Reveal className="mt-14">
            <Link
              href={`/collections/${featured.slug}`}
              className="group relative block aspect-[21/9] overflow-hidden bg-muted"
            >
              <Parallax amount={40} className="h-full">
                <div className="relative h-[120%] w-full -translate-y-[8%]">
                  <Image
                    src={featured.image}
                    alt={featured.name}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
                  />
                </div>
              </Parallax>
              <div className="absolute inset-0 bg-black/30 transition-colors duration-500 group-hover:bg-black/20" />
              <span className="absolute bottom-6 left-6 font-heading text-3xl uppercase tracking-widest text-white md:bottom-10 md:left-10 md:text-5xl">
                {featured.tagline || featured.name}
              </span>
            </Link>
          </Reveal>
        )
      )}

      {/* Products */}
      <div className="mt-14">
        {collectionsLoading || productsLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {(products?.results ?? []).map((product, index) => (
              <Reveal key={product.id} delay={index * 0.08}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {featured && (
        <Reveal className="mt-14 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href={`/collections/${featured.slug}`}>View Full Collection</Link>
          </Button>
        </Reveal>
      )}
    </section>
  );
}
