"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Field, SelectField } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrder, useInvalidateAdmin } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/utils";

const NEXT_STATUSES = [
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped (emails the customer)" },
  { value: "delivered", label: "Delivered (emails the customer)" },
  { value: "returned", label: "Returned" },
];

export default function StudioOrderDetailPage() {
  const params = useParams<{ number: string }>();
  const { data: order, isLoading } = useAdminOrder(params.number);
  const invalidate = useInvalidateAdmin();

  const [newStatus, setNewStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const updateStatus = async () => {
    if (!newStatus) {
      toast.error("Pick a status.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/manage/orders/${params.number}/set_status/`, {
        status: newStatus,
        tracking_number: tracking,
        tracking_url: trackingUrl,
      });
      invalidate();
      toast.success(`Order marked ${newStatus}.`);
      setNewStatus("");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update the order."));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-8 h-96 w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/studio/orders" className="label-caps hover:text-foreground">
        ← Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="heading text-5xl text-foreground">{order.number}</h1>
        <span className="border border-border px-3 py-1.5 font-button text-[11px] uppercase tracking-widest text-muted-foreground">
          {order.status_display}
        </span>
        <span
          className={`font-button text-[11px] uppercase tracking-widest ${
            order.payment_status === "paid" ? "text-foreground" : "text-accent"
          }`}
        >
          {order.payment_status_display}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Placed {formatDate(order.created_at)} · {order.email}
        {order.customer_note && ` · Note: "${order.customer_note}"`}
      </p>

      <div className="mt-10 grid max-w-5xl gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div>
          <ul className="divide-y divide-border border-y border-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-5 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-muted">
                  {item.image && (
                    <Image src={item.image} alt={item.product_name} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.product_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.sku} · {item.color && `${item.color} · `}Size {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <span className="self-center text-sm text-foreground">
                  {formatINR(item.line_total)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                <span className="text-accent">−{formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping {order.shipping_method && `— ${order.shipping_method}`}</span>
              <span>{formatINR(order.shipping_fee)}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-base font-medium text-foreground">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar: fulfilment + address */}
        <aside className="space-y-8">
          <div className="border border-border p-6">
            <h2 className="heading text-xl text-foreground">Update Status</h2>
            <div className="mt-5 space-y-4">
              <SelectField label="New Status" value={newStatus} onChange={setNewStatus}>
                <option value="">Choose…</option>
                {NEXT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <Field label="Tracking Number (optional)" value={tracking} onChange={setTracking} />
              <Field label="Tracking URL (optional)" value={trackingUrl} onChange={setTrackingUrl} placeholder="https://…" />
              <Button className="w-full" onClick={updateStatus} loading={saving}>
                Apply
              </Button>
            </div>
            {order.tracking_number && (
              <p className="mt-4 text-xs text-muted-foreground">
                Current tracking: <span className="text-foreground">{order.tracking_number}</span>
              </p>
            )}
          </div>

          <div className="border border-border p-6">
            <h2 className="heading text-xl text-foreground">Ship To</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <span className="text-foreground">{order.shipping_address.full_name}</span>
              <br />
              {order.shipping_address.line1}
              {order.shipping_address.line2 && <>, {order.shipping_address.line2}</>}
              <br />
              {order.shipping_address.city}, {order.shipping_address.state} —{" "}
              {order.shipping_address.pincode}
              <br />
              {order.shipping_address.phone}
            </p>
          </div>

          {order.return_reason && (
            <div className="border border-accent/40 p-6">
              <h2 className="heading text-xl text-accent">Return Reason</h2>
              <p className="mt-3 text-sm text-muted-foreground">{order.return_reason}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
