"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CheckField, Field, SelectField, TextField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import {
  useAdminList,
  useInvalidateAdmin,
  type AdminCategory,
  type AdminCollection,
  type AdminProduct,
} from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

interface ProductFormProps {
  product?: AdminProduct;
  onSaved: (product: AdminProduct) => void;
}

export function ProductForm({ product, onSaved }: ProductFormProps) {
  const { data: categories } = useAdminList<AdminCategory[]>("categories");
  const { data: collections } = useAdminList<AdminCollection[]>("collections");
  const invalidate = useInvalidateAdmin();

  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product ? String(product.category) : "",
    collection: product?.collection ? String(product.collection) : "",
    price: product?.price ?? "",
    compare_at_price: product?.compare_at_price ?? "",
    description: product?.description ?? "",
    fabric: product?.fabric ?? "240 GSM French Terry Cotton",
    care_instructions:
      product?.care_instructions ??
      "Machine wash cold, inside out. Do not bleach. Tumble dry low. Iron inside out.",
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? true,
    is_trending: product?.is_trending ?? false,
    is_active: product?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (!form.name || !form.category || !form.price || !form.description) {
      toast.error("Name, category, price and description are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category: Number(form.category),
        collection: form.collection ? Number(form.collection) : null,
        compare_at_price: form.compare_at_price || null,
      };
      const { data } = product
        ? await api.patch<AdminProduct>(`/manage/products/${product.id}/`, payload)
        : await api.post<AdminProduct>("/manage/products/", payload);
      invalidate();
      toast.success(product ? "Product updated." : "Product created.");
      onSaved(data);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the product."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Name" value={form.name} onChange={(name) => set({ name })} className="lg:col-span-2" required />

      <SelectField label="Category" value={form.category} onChange={(category) => set({ category })}>
        <option value="">Select a category…</option>
        {(categories ?? []).map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>

      <SelectField label="Drop / Collection" value={form.collection} onChange={(collection) => set({ collection })}>
        <option value="">No drop</option>
        {(collections ?? []).map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.drop_number} — {collection.name}
          </option>
        ))}
      </SelectField>

      <Field label="Price (₹)" type="number" value={form.price} onChange={(price) => set({ price })} required />
      <Field
        label="Compare-at Price (₹, optional strike-through)"
        type="number"
        value={form.compare_at_price ?? ""}
        onChange={(compare_at_price) => set({ compare_at_price })}
      />

      <TextField
        label="Description"
        value={form.description}
        onChange={(description) => set({ description })}
        className="lg:col-span-2"
      />
      <Field label="Fabric" value={form.fabric} onChange={(fabric) => set({ fabric })} />
      <Field
        label="Care Instructions"
        value={form.care_instructions}
        onChange={(care_instructions) => set({ care_instructions })}
      />

      <div className="flex flex-wrap gap-6 lg:col-span-2">
        <CheckField label="Featured" checked={form.is_featured} onChange={(is_featured) => set({ is_featured })} />
        <CheckField label="New arrival" checked={form.is_new_arrival} onChange={(is_new_arrival) => set({ is_new_arrival })} />
        <CheckField label="Trending" checked={form.is_trending} onChange={(is_trending) => set({ is_trending })} />
        <CheckField label="Live on store" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
      </div>

      <div className="lg:col-span-2">
        <Button onClick={save} loading={saving}>
          {product ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
