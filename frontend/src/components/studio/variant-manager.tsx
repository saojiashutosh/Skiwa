"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SelectField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminList,
  useInvalidateAdmin,
  type AdminColor,
  type AdminSize,
  type AdminVariant,
} from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

interface VariantManagerProps {
  productId: number;
  variants: AdminVariant[];
}

export function VariantManager({ productId, variants }: VariantManagerProps) {
  const { data: colors } = useAdminList<AdminColor[]>("colors");
  const { data: sizes } = useAdminList<AdminSize[]>("sizes");
  const invalidate = useInvalidateAdmin();

  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [stock, setStock] = useState("25");
  const [adding, setAdding] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});

  const add = async () => {
    if (!sizeId) {
      toast.error("Pick at least a size.");
      return;
    }
    setAdding(true);
    try {
      await api.post("/manage/variants/", {
        product: productId,
        color: colorId ? Number(colorId) : null,
        size: Number(sizeId),
        stock: Number(stock) || 0,
      });
      invalidate();
      toast.success("Variant added (SKU auto-generated).");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not add the variant — duplicate color/size?"));
    } finally {
      setAdding(false);
    }
  };

  const saveStock = async (variant: AdminVariant) => {
    const draft = stockDrafts[variant.id];
    if (draft === undefined || Number(draft) === variant.stock) return;
    try {
      await api.patch(`/manage/variants/${variant.id}/`, { stock: Number(draft) || 0 });
      invalidate();
      toast.success(`${variant.sku} stock → ${draft}`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const remove = async (variant: AdminVariant) => {
    try {
      await api.delete(`/manage/variants/${variant.id}/`);
      invalidate();
      toast.success(`${variant.sku} removed.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <section className="mt-12">
      <h2 className="heading border-b border-border pb-3 text-2xl text-foreground">
        Variants & Stock
      </h2>

      <table className="mt-4 w-full max-w-3xl text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {["SKU", "Color", "Size", "Stock", ""].map((header, index) => (
              <th key={index} className="label-caps pb-3 pr-4 font-normal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {variants.map((variant) => (
            <tr key={variant.id}>
              <td className="py-3 pr-4 text-foreground">{variant.sku}</td>
              <td className="py-3 pr-4 text-muted-foreground">{variant.color_name || "—"}</td>
              <td className="py-3 pr-4 text-muted-foreground">{variant.size_name}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    className="h-9 w-24"
                    value={stockDrafts[variant.id] ?? String(variant.stock)}
                    onChange={(event) =>
                      setStockDrafts((current) => ({ ...current, [variant.id]: event.target.value }))
                    }
                    onBlur={() => saveStock(variant)}
                    onKeyDown={(event) => event.key === "Enter" && saveStock(variant)}
                  />
                  {variant.stock === 0 && (
                    <span className="font-button text-[10px] uppercase tracking-widest text-accent">
                      Out
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 text-right">
                <button
                  type="button"
                  onClick={() => remove(variant)}
                  aria-label={`Delete ${variant.sku}`}
                  className="text-muted-foreground transition-colors hover:text-accent"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
          {variants.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-muted-foreground">
                No variants yet — the product shows as sold out until one has stock.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-[1fr_1fr_120px_auto]">
        <SelectField label="Color" value={colorId} onChange={setColorId}>
          <option value="">No color</option>
          {(colors ?? []).map((color) => (
            <option key={color.id} value={color.id}>
              {color.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Size" value={sizeId} onChange={setSizeId}>
          <option value="">Select size…</option>
          {(sizes ?? []).map((size) => (
            <option key={size.id} value={size.id}>
              {size.name} {size.label && `(${size.label})`}
            </option>
          ))}
        </SelectField>
        <div>
          <Label>Stock</Label>
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            className="mt-2"
          />
        </div>
        <div className="self-end">
          <Button variant="outline" onClick={add} loading={adding}>
            Add Variant
          </Button>
        </div>
      </div>
    </section>
  );
}
