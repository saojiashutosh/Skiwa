"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/hooks/queries";
import { formatDate, formatINR } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "accent" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  processing: "default",
  shipped: "accent",
  delivered: "default",
  cancelled: "outline",
  return_requested: "outline",
  returned: "outline",
};

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading: ordersLoading } = useOrders(isAuthenticated);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?next=/account/orders");
  }, [isLoading, isAuthenticated, router]);

  const orders = data?.results ?? [];

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">History</p>
      <h1 className="heading text-section-title text-foreground">Orders</h1>

      <div className="mt-12 max-w-3xl">
        {(isLoading || ordersLoading) && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        )}

        {!ordersLoading && isAuthenticated && orders.length === 0 && (
          <div>
            <p className="text-sm text-muted-foreground">No orders yet. Your first drop awaits.</p>
            <Button className="mt-8" asChild>
              <Link href="/shop">Shop Now</Link>
            </Button>
          </div>
        )}

        <ul className="divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <li key={order.number}>
              <Link
                href={`/account/orders/${order.number}`}
                className="flex items-center gap-6 py-6 transition-colors hover:bg-white/[0.03]"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-muted">
                  {order.preview_image && (
                    <Image
                      src={order.preview_image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-button text-sm uppercase tracking-[0.15em] text-foreground">
                    {order.number}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(order.created_at)} · {order.item_count}{" "}
                    {order.item_count === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                    {order.status_display}
                  </Badge>
                  <p className="mt-2 text-sm text-foreground">{formatINR(order.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
