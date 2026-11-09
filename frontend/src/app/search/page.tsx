"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { usePageCopy, useProducts } from "@/hooks/queries";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    setInput(initial);
    setQuery(initial);
  }, [initial]);

  const { data, isLoading } = useProducts({ search: query, page_size: 24 }, Boolean(query));
  const results = query ? (data?.results ?? []) : [];

  const submit = () => {
    const trimmed = input.trim();
    setQuery(trimmed);
    router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const { copy } = usePageCopy("search");

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">{copy?.eyebrow ?? "Search"}</p>
      <h1 className="heading text-section-title text-foreground">
        {copy?.title ?? "Find Your Energy"}
      </h1>

      <div className="mt-10 flex max-w-2xl items-center gap-3 border-b border-foreground/30 pb-3 transition-colors focus-within:border-foreground">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Search tees, hoodies, drops…"
          className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          autoFocus
        />
      </div>

      <div className="mt-14">
        {query && isLoading && <ProductGridSkeleton count={8} />}
        {query && !isLoading && (
          <>
            <p className="mb-8 text-sm text-muted-foreground">
              {data?.count ?? 0} {data?.count === 1 ? "result" : "results"} for “{query}”
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
        {!query && (
          <p className="text-sm text-muted-foreground">
            Try “oversized tee”, “hoodie”, “Neo Tokyo” or “Ronin”.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container pt-36"><ProductGridSkeleton /></div>}>
      <SearchContent />
    </Suspense>
  );
}
