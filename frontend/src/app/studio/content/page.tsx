"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { toast } from "sonner";

import { CheckField, Field, SelectField, TextField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminList,
  useInvalidateAdmin,
  type AdminBanner,
  type AdminPageCopy,
} from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

const EMPTY_BANNER = {
  title: "",
  subtitle: "",
  cta_label: "",
  cta_href: "",
  placement: "hero",
  image_url: "",
  sort_order: "0",
  is_active: true,
};
type BannerForm = typeof EMPTY_BANNER;

function PageCopyEditor({ entry }: { entry: AdminPageCopy }) {
  const invalidate = useInvalidateAdmin();
  const [form, setForm] = useState({ eyebrow: entry.eyebrow, title: entry.title, body: entry.body });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/manage/page-copy/${entry.id}/`, form);
      invalidate();
      toast.success(`"${entry.key}" copy updated.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border p-6">
      <p className="font-button text-[11px] uppercase tracking-[0.25em] text-accent">
        /{entry.key}
      </p>
      <div className="mt-4 grid gap-4">
        <Field label="Eyebrow" value={form.eyebrow} onChange={(eyebrow) => setForm((c) => ({ ...c, eyebrow }))} />
        <Field label="Title" value={form.title} onChange={(title) => setForm((c) => ({ ...c, title }))} />
        <TextField label="Intro (optional)" rows={2} value={form.body} onChange={(body) => setForm((c) => ({ ...c, body }))} />
        <div>
          <Button variant="outline" size="sm" onClick={save} loading={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StudioContentPage() {
  const confirm = useConfirm();
  const { data: banners, isLoading: bannersLoading } = useAdminList<AdminBanner[]>("banners");
  const { data: pageCopy, isLoading: copyLoading } = useAdminList<AdminPageCopy[]>("page-copy");
  const invalidate = useInvalidateAdmin();

  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BannerForm>(EMPTY_BANNER);
  const [saving, setSaving] = useState(false);

  const open = (banner?: AdminBanner) => {
    setEditing(banner ?? null);
    setForm(
      banner
        ? {
            title: banner.title,
            subtitle: banner.subtitle,
            cta_label: banner.cta_label,
            cta_href: banner.cta_href,
            placement: banner.placement,
            image_url: banner.image_url,
            sort_order: String(banner.sort_order),
            is_active: banner.is_active,
          }
        : EMPTY_BANNER,
    );
    setDialogOpen(true);
  };

  const set = (patch: Partial<BannerForm>) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (!form.title || !form.image_url) {
      toast.error("Title and image URL are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (editing) {
        await api.patch(`/manage/banners/${editing.id}/`, payload);
      } else {
        await api.post("/manage/banners/", payload);
      }
      invalidate();
      toast.success(editing ? "Banner updated." : "Banner created.");
      setDialogOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the banner."));
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (banner: AdminBanner) => {
    const ok = await confirm({
      title: `Delete banner "${banner.title}"?`,
      description: "It will stop appearing on the storefront right away.",
      confirmLabel: "Delete banner",
    });
    if (!ok) return;
    try {
      await api.delete(`/manage/banners/${banner.id}/`);
      invalidate();
      toast.success("Banner deleted.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div>
      <p className="label-caps mb-2">Storefront</p>
      <h1 className="heading text-5xl text-foreground">Content</h1>

      {/* Banners */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
          <h2 className="heading text-2xl text-foreground">Banners</h2>
          <Button size="sm" onClick={() => open()}>
            <Plus className="h-4 w-4" aria-hidden /> New Banner
          </Button>
        </div>
        {bannersLoading ? (
          <Skeleton className="mt-6 h-40 w-full" />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(banners ?? []).map((banner) => (
              <div key={banner.id} className="group border border-border">
                <div className="relative aspect-[21/9] bg-muted">
                  {banner.image_url && (
                    <Image src={banner.image_url} alt={banner.title} fill sizes="400px" className="object-cover" />
                  )}
                  <span className="absolute left-2 top-2 bg-background/90 px-2 py-0.5 font-button text-[10px] uppercase tracking-widest text-foreground">
                    {banner.placement}
                  </span>
                  {!banner.is_active && (
                    <span className="absolute right-2 top-2 bg-accent px-2 py-0.5 font-button text-[10px] uppercase tracking-widest text-white">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{banner.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {banner.subtitle || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => open(banner)}
                      aria-label={`Edit ${banner.title}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBanner(banner)}
                      aria-label={`Delete ${banner.title}`}
                      className="text-muted-foreground transition-colors hover:text-accent"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Page copy */}
      <section className="mt-14">
        <h2 className="heading border-b border-border pb-3 text-2xl text-foreground">
          Page Copy
          <span className="ml-3 text-sm text-muted-foreground">headings & intros per page</span>
        </h2>
        {copyLoading ? (
          <Skeleton className="mt-6 h-40 w-full" />
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(pageCopy ?? []).map((entry) => (
              <PageCopyEditor key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* Banner dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="heading text-3xl text-foreground">
            {editing ? "Edit Banner" : "New Banner"}
          </DialogTitle>
          <DialogDescription className="sr-only">Banner editor</DialogDescription>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(title) => set({ title })} className="sm:col-span-2" />
            <Field label="Subtitle" value={form.subtitle} onChange={(subtitle) => set({ subtitle })} className="sm:col-span-2" />
            <Field label="Image URL" value={form.image_url} onChange={(image_url) => set({ image_url })} className="sm:col-span-2" placeholder="https://…" />
            <SelectField label="Placement" value={form.placement} onChange={(placement) => set({ placement })}>
              <option value="hero">Home Hero</option>
              <option value="drop">Featured Drop</option>
              <option value="editorial">Editorial Strip</option>
            </SelectField>
            <Field label="Sort Order" type="number" value={form.sort_order} onChange={(sort_order) => set({ sort_order })} />
            <Field label='CTA Label (e.g. "Shop Collection")' value={form.cta_label} onChange={(cta_label) => set({ cta_label })} />
            <Field label='CTA Link (e.g. "/shop")' value={form.cta_href} onChange={(cta_href) => set({ cta_href })} />
            <CheckField label="Live on store" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
          </div>
          <div className="mt-8">
            <Button onClick={save} loading={saving}>
              {editing ? "Save Changes" : "Create Banner"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
