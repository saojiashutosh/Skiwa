"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CheckField, Field, TextField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminList, useInvalidateAdmin, type AdminCollection } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

const EMPTY = {
  drop_number: "",
  name: "",
  tagline: "",
  description: "",
  image_url: "",
  release_date: "",
  sort_order: "0",
  is_active: true,
  is_featured: false,
};

type FormState = typeof EMPTY;

function toForm(collection: AdminCollection): FormState {
  return {
    drop_number: collection.drop_number,
    name: collection.name,
    tagline: collection.tagline,
    description: collection.description,
    image_url: collection.image_url,
    release_date: collection.release_date ?? "",
    sort_order: String(collection.sort_order),
    is_active: collection.is_active,
    is_featured: collection.is_featured,
  };
}

export default function StudioCollectionsPage() {
  const { data: collections, isLoading } = useAdminList<AdminCollection[]>("collections");
  const invalidate = useInvalidateAdmin();

  const [editing, setEditing] = useState<AdminCollection | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const open = (collection?: AdminCollection) => {
    setEditing(collection ?? null);
    setForm(collection ? toForm(collection) : EMPTY);
    setCreating(true);
  };

  const set = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (!form.drop_number || !form.name) {
      toast.error("Drop number and name are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        sort_order: Number(form.sort_order) || 0,
        release_date: form.release_date || null,
      };
      if (editing) {
        await api.patch(`/manage/collections/${editing.id}/`, payload);
      } else {
        await api.post("/manage/collections/", payload);
      }
      invalidate();
      toast.success(editing ? "Drop updated." : "Drop created.");
      setCreating(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the drop."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Catalog</p>
          <h1 className="heading text-5xl text-foreground">Drops</h1>
        </div>
        <Button onClick={() => open()}>
          <Plus className="h-4 w-4" aria-hidden /> New Drop
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="mt-8 h-64 w-full" />
      ) : (
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Drop", "Name", "Tagline", "Release", "Featured", "Status", ""].map((header, index) => (
                <th key={index} className="label-caps pb-3 pr-4 font-normal">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(collections ?? []).map((collection) => (
              <tr key={collection.id} className="hover:bg-white/[0.02]">
                <td className="py-4 pr-4 font-button text-xs uppercase tracking-widest text-accent">
                  {collection.drop_number}
                </td>
                <td className="py-4 pr-4 text-foreground">{collection.name}</td>
                <td className="py-4 pr-4 text-muted-foreground">{collection.tagline || "—"}</td>
                <td className="py-4 pr-4 text-muted-foreground">{collection.release_date ?? "—"}</td>
                <td className="py-4 pr-4">{collection.is_featured ? "★ Home" : "—"}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`border px-2 py-1 font-button text-[10px] uppercase tracking-widest ${
                      collection.is_active ? "border-border text-foreground" : "border-accent/40 text-accent"
                    }`}
                  >
                    {collection.is_active ? "Live" : "Hidden"}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => open(collection)}
                    aria-label={`Edit ${collection.name}`}
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

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="heading text-3xl text-foreground">
            {editing ? `Edit ${editing.drop_number}` : "New Drop"}
          </DialogTitle>
          <DialogDescription className="sr-only">Drop editor</DialogDescription>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label='Drop Number (e.g. "DROP 004")' value={form.drop_number} onChange={(drop_number) => set({ drop_number })} />
            <Field label="Name" value={form.name} onChange={(name) => set({ name })} />
            <Field label="Tagline" value={form.tagline} onChange={(tagline) => set({ tagline })} className="sm:col-span-2" />
            <TextField label="Description" value={form.description} onChange={(description) => set({ description })} className="sm:col-span-2" />
            <Field label="Hero Image URL" value={form.image_url} onChange={(image_url) => set({ image_url })} className="sm:col-span-2" placeholder="https://…" />
            <Field label="Release Date" type="date" value={form.release_date} onChange={(release_date) => set({ release_date })} />
            <Field label="Sort Order" type="number" value={form.sort_order} onChange={(sort_order) => set({ sort_order })} />
            <div className="flex gap-6 sm:col-span-2">
              <CheckField label="Live on store" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
              <CheckField label="Featured on home" checked={form.is_featured} onChange={(is_featured) => set({ is_featured })} />
            </div>
          </div>
          <div className="mt-8">
            <Button onClick={save} loading={saving}>
              {editing ? "Save Changes" : "Create Drop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
