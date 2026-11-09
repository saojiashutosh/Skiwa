"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useCategories, useCollections, useFacets } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export interface ShopFilters {
  category: string;
  collection: string;
  colors: string[];
  sizes: string[];
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  onSale: boolean;
}

export const EMPTY_FILTERS: ShopFilters = {
  category: "",
  collection: "",
  colors: [],
  sizes: [],
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
  onSale: false,
};

interface FilterPanelProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const { data: categories } = useCategories();
  const { data: collections } = useCollections();
  const { data: facets } = useFacets();

  const set = (patch: Partial<ShopFilters>) => onChange({ ...filters, ...patch });

  return (
    <Accordion type="multiple" defaultValue={["category", "collection", "size"]} className="w-full">
      <AccordionItem value="category">
        <AccordionTrigger>Category</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2.5">
            {(categories ?? []).map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() =>
                    set({ category: filters.category === category.slug ? "" : category.slug })
                  }
                  className={cn(
                    "text-sm transition-colors hover:text-foreground",
                    filters.category === category.slug ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {category.name}
                  <span className="ml-2 text-xs text-muted-foreground/60">
                    {category.product_count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="collection">
        <AccordionTrigger>Drop</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2.5">
            {(collections ?? []).map((collection) => (
              <li key={collection.id}>
                <button
                  type="button"
                  onClick={() =>
                    set({
                      collection: filters.collection === collection.slug ? "" : collection.slug,
                    })
                  }
                  className={cn(
                    "text-sm transition-colors hover:text-foreground",
                    filters.collection === collection.slug ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {collection.drop_number} — {collection.name}
                </button>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="size">
        <AccordionTrigger>Size</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-2">
            {(facets?.sizes ?? []).map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => set({ sizes: toggleValue(filters.sizes, size.name) })}
                className={cn(
                  "min-w-11 border px-3 py-2 font-button text-xs uppercase tracking-widest transition-colors",
                  filters.sizes.includes(size.name)
                    ? "border-accent bg-accent text-white"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {size.name}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="color">
        <AccordionTrigger>Color</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-3">
            {(facets?.colors ?? []).map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.name}
                aria-label={`Filter by ${color.name}`}
                onClick={() => set({ colors: toggleValue(filters.colors, color.slug) })}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-all",
                  filters.colors.includes(color.slug)
                    ? "border-accent scale-110"
                    : "border-white/20 hover:border-white/60",
                )}
                style={{ backgroundColor: color.hex_code }}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price">
        <AccordionTrigger>Price</AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min ₹"
              value={filters.minPrice}
              onChange={(event) => set({ minPrice: event.target.value })}
              className="h-10"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max ₹"
              value={filters.maxPrice}
              onChange={(event) => set({ maxPrice: event.target.value })}
              className="h-10"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="availability">
        <AccordionTrigger>Availability</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(event) => set({ inStockOnly: event.target.checked })}
                className="h-4 w-4 accent-[#C1121F]"
              />
              In stock only
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={filters.onSale}
                onChange={(event) => set({ onSale: event.target.checked })}
                className="h-4 w-4 accent-[#C1121F]"
              />
              On sale
            </label>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
