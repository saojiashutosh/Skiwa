"use client";

import { ArrowLeft, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { EMPTY_FILTERS, FilterPanel, type ShopFilters } from "@/components/shop/filter-panel";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageCopy, useProducts, type ProductFilters } from "@/hooks/queries";

const SORT_OPTIONS = [
  { label: "Newest", value: "-created_at" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Name A–Z", value: "name" },
] as const;

const PAGE_SIZE = 12;

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<ShopFilters>({
    ...EMPTY_FILTERS,
    category: searchParams.get("category") ?? "",
    collection: searchParams.get("collection") ?? "",
  });
  const [ordering, setOrdering] = useState<string>("-created_at");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Deep-linkable category/collection.
  useEffect(() => {
    setFilters((current) => ({
      ...current,
      category: searchParams.get("category") ?? current.category,
      collection: searchParams.get("collection") ?? current.collection,
    }));
  }, [searchParams]);

  useEffect(() => setPage(1), [filters, ordering]);

  const query: ProductFilters = useMemo(
    () => ({
      category: filters.category || undefined,
      collection: filters.collection || undefined,
      color: filters.colors.length ? filters.colors : undefined,
      size: filters.sizes.length ? filters.sizes : undefined,
      min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
      max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      in_stock: filters.inStockOnly || undefined,
      on_sale: filters.onSale || undefined,
      ordering,
      page,
      page_size: PAGE_SIZE,
    }),
    [filters, ordering, page],
  );

  const { data, isLoading, isError } = useProducts(query);
  const { copy, isLoading: copyLoading } = usePageCopy("shop");
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.collection ? 1 : 0) +
    filters.colors.length +
    filters.sizes.length +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    router.replace("/shop");
  };

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      {/* Page header — copy managed from the backend */}
      <div className="mb-12">
        {copyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-64" />
          </div>
        ) : (
          <>
            <p className="label-caps mb-3">{copy?.eyebrow ?? "The Catalog"}</p>
            <h1 className="heading text-section-title text-foreground">
              {copy?.title ?? "Shop All"}
            </h1>
            {copy?.body && (
              <p className="mt-4 max-w-md text-sm text-muted-foreground">{copy.body}</p>
            )}
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex items-center justify-between gap-4 border-y border-border py-4">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 font-button text-xs uppercase tracking-[0.2em] text-foreground lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <p className="hidden text-xs text-muted-foreground lg:block">
          {data ? `${data.count} ${data.count === 1 ? "piece" : "pieces"}` : "—"}
        </p>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="hidden items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent lg:flex"
            >
              <X className="h-3 w-3" aria-hidden /> Clear all
            </button>
          )}
          <label className="flex items-center gap-2">
            <span className="label-caps hidden sm:inline">Sort</span>
            <select
              value={ordering}
              onChange={(event) => setOrdering(event.target.value)}
              className="border border-border bg-background px-3 py-2 font-button text-xs uppercase tracking-widest text-foreground focus:border-foreground/40 focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <FilterPanel filters={filters} onChange={setFilters} />
        </aside>

        {/* Grid */}
        <div>
          {isLoading && <ProductGridSkeleton count={8} />}
          {isError && (
            <p className="py-20 text-center text-sm text-muted-foreground">
              Could not load products. Is the API running?
            </p>
          )}
          {data && data.results.length === 0 && (
            <div className="py-20 text-center">
              <p className="heading text-3xl text-foreground/30">Nothing here</p>
              <p className="mt-3 text-sm text-muted-foreground">
                No products match these filters.
              </p>
              <Button variant="outline" className="mt-6" onClick={clearAll}>
                Clear Filters
              </Button>
            </div>
          )}
          {data && data.results.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
                {data.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <span className="font-button text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    aria-label="Next page"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto p-6">
          <SheetTitle className="heading text-2xl text-foreground">Filters</SheetTitle>
          <SheetDescription className="sr-only">Filter the catalog</SheetDescription>
          <div className="mt-6">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>
          <div className="mt-8 flex gap-3">
            <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
              View Results
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container pt-36"><ProductGridSkeleton /></div>}>
      <ShopContent />
    </Suspense>
  );
}
