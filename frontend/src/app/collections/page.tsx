"use client";

import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { CollectionCardSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections, usePageCopy } from "@/hooks/queries";

export default function CollectionsPage() {
  const { data: collections, isLoading } = useCollections();
  const { copy, isLoading: copyLoading } = usePageCopy("collections");

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <div className="mb-14">
        {copyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-72" />
            <Skeleton className="h-3 w-96 max-w-full" />
          </div>
        ) : (
          <>
            <p className="label-caps mb-3">{copy?.eyebrow ?? "The Archive"}</p>
            <h1 className="heading text-section-title text-foreground">
              {copy?.title ?? "Collections"}
            </h1>
            {copy?.body && (
              <p className="mt-4 max-w-md text-sm text-muted-foreground">{copy.body}</p>
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => <CollectionCardSkeleton key={index} />)}
        {(collections ?? []).map((collection, index) => (
          <Reveal key={collection.id} delay={index * 0.08}>
            <Link
              href={`/collections/${collection.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-muted"
            >
              {collection.image && (
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/25" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="label-caps text-accent">{collection.drop_number}</p>
                <p className="mt-2 font-heading text-4xl uppercase tracking-wider text-white">
                  {collection.name}
                </p>
                <p className="mt-2 text-xs text-white/70">
                  {collection.product_count} {collection.product_count === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
