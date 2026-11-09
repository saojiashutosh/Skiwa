"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminProducts } from "@/hooks/admin";
import { formatINR } from "@/lib/utils";

export default function StudioProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminProducts({
    ...(search ? { search } : {}),
    page: String(page),
    page_size: "20",
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Catalog</p>
          <h1 className="heading text-5xl text-foreground">Products</h1>
        </div>
        <Button asChild>
          <Link href="/studio/products/new">
            <Plus className="h-4 w-4" aria-hidden /> New Product
          </Link>
        </Button>
      </div>

      <div className="mt-8 flex max-w-sm items-center gap-2 border-b border-border pb-2">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search name, description, SKU…"
          className="h-9 border-0 px-0 focus-visible:border-0"
        />
      </div>

      {isLoading ? (
        <Skeleton className="mt-8 h-96 w-full" />
      ) : (
        <>
          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Product", "Category", "Drop", "Price", "Stock", "Flags", "Status"].map(
                  (header) => (
                    <th key={header} className="label-caps pb-3 pr-4 font-normal">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.results ?? []).map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.02]">
                  <td className="py-4 pr-4">
                    <Link
                      href={`/studio/products/${product.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">/{product.slug}</p>
                  </td>
                  <td className="py-4 pr-4 text-muted-foreground">{product.category_name}</td>
                  <td className="py-4 pr-4 text-muted-foreground">
                    {product.collection_name || "—"}
                  </td>
                  <td className="py-4 pr-4 text-foreground">{formatINR(product.price)}</td>
                  <td className="py-4 pr-4">
                    <span className={product.total_stock === 0 ? "text-accent" : "text-foreground"}>
                      {product.total_stock}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-xs text-muted-foreground">
                    {[
                      product.is_featured && "Featured",
                      product.is_new_arrival && "New",
                      product.is_trending && "Trending",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="py-4">
                    <span
                      className={`border px-2 py-1 font-button text-[10px] uppercase tracking-widest ${
                        product.is_active
                          ? "border-border text-foreground"
                          : "border-accent/40 text-accent"
                      }`}
                    >
                      {product.is_active ? "Live" : "Hidden"}
                    </span>
                  </td>
                </tr>
              ))}
              {data && data.results.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Prev
              </Button>
              <span className="label-caps">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
