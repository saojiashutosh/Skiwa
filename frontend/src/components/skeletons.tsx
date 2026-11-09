import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-6 w-1/2" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container grid gap-12 py-12 lg:grid-cols-2">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="space-y-6">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-12" />
          ))}
        </div>
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}
