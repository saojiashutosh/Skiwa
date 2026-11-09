"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CheckField, Field, TextField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminList, useInvalidateAdmin, type AdminCategory } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

const EMPTY = { name: "", description: "", image_url: "", sort_order: "0", is_active: true };
type FormState = typeof EMPTY;

export default function StudioCategoriesPage() {
  const { data: categories, isLoading } = useAdminList<AdminCategory[]>("categories");
  const invalidate = useInvalidateAdmin();

  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const open = (category?: AdminCategory) => {
    setEditing(category ?? null);
    setForm(
      category
        ? {
            name: category.name,
            description: category.description,
            image_url: category.image_url,
            sort_order: String(category.sort_order),
            is_active: category.is_active,
          }
        : EMPTY,
    );
    setDialogOpen(true);
  };

  const set = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (!form.name) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (editing) {
        await api.patch(`/manage/categories/${editing.id}/`, payload);
      } else {
        await api.post("/manage/categories/", payload);
      }
      invalidate();
      toast.success(editing ? "Category updated." : "Category created.");
      setDialogOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the category."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Catalog</p>
          <h1 className="heading text-5xl text-foreground">Categories</h1>
        </div>
        <Button onClick={() => open()}>
          <Plus className="h-4 w-4" aria-hidden /> New Category
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="mt-8 h-64 w-full" />
      ) : (
        <table className="mt-8 w-full max-w-3xl text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Name", "Slug", "Order", "Status", ""].map((header, index) => (
                <th key={index} className="label-caps pb-3 pr-4 font-normal">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(categories ?? []).map((category) => (
              <tr key={category.id} className="hover:bg-white/[0.02]">
                <td className="py-4 pr-4 text-foreground">{category.name}</td>
                <td className="py-4 pr-4 text-muted-foreground">/{category.slug}</td>
                <td className="py-4 pr-4 text-muted-foreground">{category.sort_order}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`border px-2 py-1 font-button text-[10px] uppercase tracking-widest ${
                      category.is_active ? "border-border text-foreground" : "border-accent/40 text-accent"
                    }`}
                  >
                    {category.is_active ? "Live" : "Hidden"}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => open(category)}
                    aria-label={`Edit ${category.name}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="heading text-3xl text-foreground">
            {editing ? `Edit ${editing.name}` : "New Category"}
          </DialogTitle>
          <DialogDescription className="sr-only">Category editor</DialogDescription>
          <div className="mt-6 grid gap-5">
            <Field label="Name" value={form.name} onChange={(name) => set({ name })} />
            <TextField label="Description" value={form.description} onChange={(description) => set({ description })} rows={3} />
            <Field label="Image URL" value={form.image_url} onChange={(image_url) => set({ image_url })} placeholder="https://…" />
            <div className="grid grid-cols-2 items-end gap-5">
              <Field label="Sort Order" type="number" value={form.sort_order} onChange={(sort_order) => set({ sort_order })} />
              <CheckField label="Live on store" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
            </div>
          </div>
          <div className="mt-8">
            <Button onClick={save} loading={saving}>
              {editing ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
