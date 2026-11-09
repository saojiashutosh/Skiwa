"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useProducts } from "@/hooks/queries";
import { formatINR } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useProducts(
    { search: debounced, page_size: 6 },
    debounced.length >= 2,
  );
  const results = debounced.length >= 2 ? (data?.results ?? []) : [];

  const submit = () => {
    if (!query.trim()) return;
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-24 max-w-xl translate-y-0 p-0">
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <DialogDescription className="sr-only">
          Search the SKIWAA catalog
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="Search tees, hoodies, drops…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {isFetching && (
            <span className="label-caps animate-pulse">Searching</span>
          )}
        </div>

        {results.length > 0 && (
          <ul className="max-h-[50vh] overflow-y-auto p-3">
            {results.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-4 p-3 transition-colors hover:bg-white/5"
                >
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-muted">
                    {product.primary_image && (
                      <Image src={product.primary_image} alt={product.name} fill sizes="44px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category_name}</p>
                  </div>
                  <span className="text-sm text-foreground">{formatINR(product.price)}</span>
                </Link>
              </li>
            ))}
            <li className="p-3">
              <button
                type="button"
                onClick={submit}
                className="label-caps transition-colors hover:text-foreground"
              >
                View all results →
              </button>
            </li>
          </ul>
        )}

        {debounced.length >= 2 && !isFetching && results.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            Nothing found for “{debounced}”. Try “tee”, “hoodie” or a drop name.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
