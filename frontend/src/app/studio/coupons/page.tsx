"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { toast } from "sonner";

import { CheckField, Field, SelectField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminList, useInvalidateAdmin, type AdminCoupon } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";
import { formatINR } from "@/lib/utils";

const EMPTY = {
  code: "",
  description: "",
  discount_type: "percent",
  value: "",
  min_subtotal: "0",
  max_discount: "",
  usage_limit: "",
  is_active: true,
};
type FormState = typeof EMPTY;

export default function StudioCouponsPage() {
  const confirm = useConfirm();
  const { data: coupons, isLoading } = useAdminList<AdminCoupon[]>("coupons");
  const invalidate = useInvalidateAdmin();

  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const open = (coupon?: AdminCoupon) => {
    setEditing(coupon ?? null);
    setForm(
      coupon
        ? {
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            value: coupon.value,
            min_subtotal: coupon.min_subtotal,
            max_discount: coupon.max_discount ?? "",
            usage_limit: coupon.usage_limit !== null ? String(coupon.usage_limit) : "",
            is_active: coupon.is_active,
          }
        : EMPTY,
    );
    setDialogOpen(true);
  };

  const set = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (!form.code || !form.value) {
      toast.error("Code and value are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        max_discount: form.max_discount || null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      };
      if (editing) {
        await api.patch(`/manage/coupons/${editing.id}/`, payload);
      } else {
        await api.post("/manage/coupons/", payload);
      }
      invalidate();
      toast.success(editing ? "Coupon updated." : "Coupon created.");
      setDialogOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the coupon."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (coupon: AdminCoupon) => {
    const ok = await confirm({
      title: `Delete coupon ${coupon.code}?`,
      description: "This coupon will stop working immediately for anyone trying to redeem it.",
      confirmLabel: "Delete coupon",
    });
    if (!ok) return;
    try {
      await api.delete(`/manage/coupons/${coupon.id}/`);
      invalidate();
      toast.success("Coupon deleted.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Marketing</p>
          <h1 className="heading text-5xl text-foreground">Coupons</h1>
        </div>
        <Button onClick={() => open()}>
          <Plus className="h-4 w-4" aria-hidden /> New Coupon
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="mt-8 h-64 w-full" />
      ) : (
        <table className="mt-8 w-full max-w-4xl text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Code", "Discount", "Min Order", "Used", "Status", ""].map((header, index) => (
                <th key={index} className="label-caps pb-3 pr-4 font-normal">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(coupons ?? []).map((coupon) => (
              <tr key={coupon.id} className="hover:bg-white/[0.02]">
                <td className="py-4 pr-4">
                  <span className="font-button text-xs uppercase tracking-widest text-foreground">
                    {coupon.code}
                  </span>
                  {coupon.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{coupon.description}</p>
                  )}
                </td>
                <td className="py-4 pr-4 text-foreground">
                  {coupon.discount_type === "percent"
                    ? `${parseFloat(coupon.value)}%`
                    : formatINR(coupon.value)}
                  {coupon.max_discount && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (cap {formatINR(coupon.max_discount)})
                    </span>
                  )}
                </td>
                <td className="py-4 pr-4 text-muted-foreground">{formatINR(coupon.min_subtotal)}</td>
                <td className="py-4 pr-4 text-muted-foreground">
                  {coupon.used_count}
                  {coupon.usage_limit !== null && ` / ${coupon.usage_limit}`}
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={`border px-2 py-1 font-button text-[10px] uppercase tracking-widest ${
                      coupon.is_active ? "border-border text-foreground" : "border-accent/40 text-accent"
                    }`}
                  >
                    {coupon.is_active ? "Active" : "Off"}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => open(coupon)}
                      aria-label={`Edit ${coupon.code}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(coupon)}
                      aria-label={`Delete ${coupon.code}`}
                      className="text-muted-foreground transition-colors hover:text-accent"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="heading text-3xl text-foreground">
            {editing ? `Edit ${editing.code}` : "New Coupon"}
          </DialogTitle>
          <DialogDescription className="sr-only">Coupon editor</DialogDescription>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Code" value={form.code} onChange={(code) => set({ code: code.toUpperCase() })} />
            <Field label="Description" value={form.description} onChange={(description) => set({ description })} />
            <SelectField label="Type" value={form.discount_type} onChange={(discount_type) => set({ discount_type })}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </SelectField>
            <Field
              label={form.discount_type === "percent" ? "Value (%)" : "Value (₹)"}
              type="number"
              value={form.value}
              onChange={(value) => set({ value })}
            />
            <Field label="Min Order (₹)" type="number" value={form.min_subtotal} onChange={(min_subtotal) => set({ min_subtotal })} />
            <Field
              label="Max Discount ₹ (percent cap, optional)"
              type="number"
              value={form.max_discount}
              onChange={(max_discount) => set({ max_discount })}
            />
            <Field
              label="Usage Limit (blank = unlimited)"
              type="number"
              value={form.usage_limit}
              onChange={(usage_limit) => set({ usage_limit })}
            />
            <div className="self-end">
              <CheckField label="Active" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
            </div>
          </div>
          <div className="mt-8">
            <Button onClick={save} loading={saving}>
              {editing ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
