"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/studio/product-form";

export default function StudioNewProductPage() {
  const router = useRouter();

  return (
    <div>
      <Link href="/studio/products" className="label-caps hover:text-foreground">
        ← Products
      </Link>
      <h1 className="heading mt-4 text-5xl text-foreground">New Product</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Create the product first — you&apos;ll add images, sizes and stock on the next screen.
      </p>
      <div className="mt-10 max-w-4xl">
        <ProductForm onSaved={(product) => router.push(`/studio/products/${product.id}`)} />
      </div>
    </div>
  );
}
