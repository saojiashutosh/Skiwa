"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ImageManager } from "@/components/studio/image-manager";
import { ProductForm } from "@/components/studio/product-form";
import { VariantManager } from "@/components/studio/variant-manager";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminProduct, useInvalidateAdmin } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

export default function StudioEditProductPage() {
  const confirm = useConfirm();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invalidate = useInvalidateAdmin();
  const { data: product, isLoading } = useAdminProduct(params.id);

  const destroy = async () => {
    if (!product) return;
    const ok = await confirm({
      title: `Delete "${product.name}"?`,
      description:
        "The product and all of its variants will be removed permanently. This cannot be undone.",
      confirmLabel: "Delete product",
    });
    if (!ok) return;
    try {
      await api.delete(`/manage/products/${product.id}/`);
      invalidate();
      toast.success("Product deleted.");
      router.push("/studio/products");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not delete — it may have existing orders."));
    }
  };

  if (isLoading || !product) {
    return (
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-8 h-96 w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/studio/products" className="label-caps hover:text-foreground">
            ← Products
          </Link>
          <h1 className="heading mt-4 text-5xl text-foreground">{product.name}</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            /{product.slug} · total stock {product.total_stock}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden /> View on Store
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={destroy} className="hover:border-accent hover:bg-accent">
            <Trash2 className="h-4 w-4" aria-hidden /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-10 max-w-4xl">
        <ProductForm key={product.id} product={product} onSaved={() => invalidate()} />
        <ImageManager productId={product.id} images={product.images} />
        <VariantManager productId={product.id} variants={product.variants} />
      </div>
    </div>
  );
}
