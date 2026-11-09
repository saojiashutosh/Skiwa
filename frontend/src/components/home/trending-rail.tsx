"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback } from "react";

import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { useProducts } from "@/hooks/queries";

export function TrendingRail() {
  const { data, isLoading } = useProducts({ trending: true, page_size: 8 });
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const products = data?.results ?? [];
  if (!isLoading && !products.length) return null;

  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="container">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="label-caps mb-4">On Everyone&apos;s Back</p>
              <h2 className="heading text-section-title text-foreground">Trending</h2>
            </div>
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={scrollPrev}
                aria-label="Previous products"
                className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                aria-label="Next products"
                className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-foreground"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-12">
          {isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4 md:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="min-w-0 flex-[0_0_70%] sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_23%]"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
