"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useOrder } from "@/hooks/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ number: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order, isLoading, isError } = useOrder(params.number, isAuthenticated);

  const [actionDialog, setActionDialog] = useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?next=/account/orders/${params.number}`);
    }
  }, [authLoading, isAuthenticated, router, params.number]);

  const performAction = async () => {
    if (!order || !actionDialog) return;
    if (actionDialog === "return" && reason.trim().length < 5) {
      toast.error("Please describe the reason for your return.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/orders/${order.number}/${actionDialog}/`, { reason });
      toast.success(
        actionDialog === "cancel" ? "Order cancelled." : "Return request submitted.",
      );
      queryClient.invalidateQueries({ queryKey: ["order", order.number] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setActionDialog(null);
      setReason("");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (isError) {
    return (
      <div className="container pb-24 pt-36">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <Link href="/account/orders" className="label-caps hover:text-foreground">
        ← All Orders
      </Link>

      {isLoading || !order ? (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full max-w-2xl" />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <h1 className="heading text-4xl text-foreground md:text-5xl">{order.number}</h1>
            <Badge variant={order.status === "shipped" ? "accent" : "default"}>
              {order.status_display}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Placed {formatDate(order.created_at)} · Payment: {order.payment_status_display}
            {order.tracking_number && (
              <>
                {" · Tracking: "}
                {order.tracking_url ? (
                  <a href={order.tracking_url} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                    {order.tracking_number}
                  </a>
                ) : (
                  order.tracking_number
                )}
              </>
            )}
          </p>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
            {/* Items */}
            <ul className="divide-y divide-border border-y border-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-5 py-5">
                  <Link
                    href={`/products/${item.product_slug}`}
                    className="relative h-28 w-22 shrink-0 overflow-hidden bg-muted"
                    style={{ width: "5.5rem" }}
                  >
                    {item.image && (
                      <Image src={item.image} alt={item.product_name} fill sizes="88px" className="object-cover" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col justify-center">
                    <Link
                      href={`/products/${item.product_slug}`}
                      className="text-sm font-medium text-foreground hover:text-accent"
                    >
                      {item.product_name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.color && `${item.color} · `}Size {item.size} · Qty {item.quantity}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">SKU {item.sku}</p>
                  </div>
                  <span className="self-center text-sm text-foreground">
                    {formatINR(item.line_total)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Summary + actions */}
            <aside className="h-fit space-y-8">
              <div className="border border-border p-6">
                <h2 className="heading text-xl text-foreground">Payment</h2>
                <div className="mt-4 space-y-2 text-sm">
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
                    <span>
                      {parseFloat(order.shipping_fee) === 0 ? "FREE" : formatINR(order.shipping_fee)}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-base font-medium text-foreground">
                    <span>Total</span>
                    <span>{formatINR(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="border border-border p-6">
                <h2 className="heading text-xl text-foreground">Shipping To</h2>
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

              {(order.can_cancel || order.can_return) && (
                <div className="flex gap-3">
                  {order.can_cancel && (
                    <Button variant="outline" className="flex-1" onClick={() => setActionDialog("cancel")}>
                      Cancel Order
                    </Button>
                  )}
                  {order.can_return && (
                    <Button variant="outline" className="flex-1" onClick={() => setActionDialog("return")}>
                      Request Return
                    </Button>
                  )}
                </div>
              )}
            </aside>
          </div>

          {/* Cancel / return dialog */}
          <Dialog open={actionDialog !== null} onOpenChange={(open) => !open && setActionDialog(null)}>
            <DialogContent>
              <DialogTitle className="heading text-2xl text-foreground">
                {actionDialog === "cancel" ? "Cancel this order?" : "Request a return"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                {actionDialog === "cancel"
                  ? "If you've already paid, your refund will be initiated immediately and lands back in 5–7 business days."
                  : "Returns are accepted within 7 days of delivery — unworn, unwashed, tags on."}
              </DialogDescription>
              <Textarea
                className="mt-6"
                placeholder={actionDialog === "cancel" ? "Reason (optional)" : "Tell us why you're returning this order"}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <div className="mt-6 flex gap-3">
                <Button variant="accent" className="flex-1" onClick={performAction} loading={submitting}>
                  Confirm
                </Button>
                <Button variant="outline" onClick={() => setActionDialog(null)}>
                  Keep Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
