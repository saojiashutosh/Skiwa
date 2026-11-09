"use client";

import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { CollectionCardSkeleton } from "@/components/skeletons";
import { useCategories } from "@/hooks/queries";

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="container py-20 md:py-28">
      <Reveal>
        <p className="label-caps mb-4">Shop by Category</p>
        <h2 className="heading text-section-title text-foreground">The Essentials</h2>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => <CollectionCardSkeleton key={index} />)}
        {(categories ?? []).map((category, index) => (
          <Reveal key={category.id} delay={index * 0.1}>
            <Link
              href={`/shop?category=${category.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-muted"
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/35 transition-colors duration-500 group-hover:bg-black/25" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="font-heading text-3xl uppercase tracking-wider text-white md:text-4xl">
                  {category.name}
                </p>
                <p className="label-caps mt-2 text-white/70">
                  {category.product_count} {category.product_count === 1 ? "piece" : "pieces"} →
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
