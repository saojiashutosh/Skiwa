"use client";

import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { CollectionCardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/hooks/queries";

export function CollectionShowcase() {
  const { data: collections, isLoading } = useCollections();

  return (
    <section className="border-t border-border py-20 md:py-32">
      <div className="container">
        <Reveal>
          <p className="label-caps mb-4">The Archive</p>
          <h2 className="heading text-section-title text-foreground">
            Every <span className="text-accent">Drop</span>
          </h2>
        </Reveal>

        <div className="mt-14 space-y-20 md:space-y-28">
          {isLoading && <CollectionCardSkeleton />}
          {(collections ?? []).map((collection, index) => {
            const reversed = index % 2 === 1;
            return (
              <Reveal key={collection.id}>
                <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                  <Link
                    href={`/collections/${collection.slug}`}
                    className={`group relative block aspect-[4/3] overflow-hidden bg-muted ${reversed ? "md:order-2" : ""}`}
                  >
                    {collection.image && (
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/10" />
                  </Link>

                  <div className={reversed ? "md:order-1" : ""}>
                    <p className="label-caps text-accent">{collection.drop_number}</p>
                    <h3 className="heading mt-3 text-4xl text-foreground md:text-6xl">
                      {collection.name}
                    </h3>
                    {collection.tagline && (
                      <p className="mt-3 font-body text-sm italic text-muted-foreground">
                        “{collection.tagline}”
                      </p>
                    )}
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {collection.description}
                    </p>
                    <Button variant="outline" className="mt-8" asChild>
                      <Link href={`/collections/${collection.slug}`}>
                        Explore {collection.drop_number}
                      </Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
