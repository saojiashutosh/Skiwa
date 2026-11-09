"use client";

import Link from "next/link";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAdminList, type AdminOrderRow } from "@/hooks/admin";
import type { Paginated } from "@/lib/types";
import { cn, formatDate, formatINR } from "@/lib/utils";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Returns", value: "return_requested" },
];

export default function StudioOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useAdminList<Paginated<AdminOrderRow>>("orders", {
    ...(statusFilter ? { status: statusFilter } : {}),
    page_size: "20",
  });

  return (
    <div>
      <p className="label-caps mb-2">Fulfilment</p>
      <h1 className="heading text-5xl text-foreground">Orders</h1>

      {/* Status tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "border px-3 py-1.5 font-button text-[11px] uppercase tracking-[0.15em] transition-colors",
              statusFilter === tab.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="mt-8 h-96 w-full" />
      ) : (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Order", "Customer", "Date", "Items", "Payment", "Status", "Total"].map((header) => (
                <th key={header} className="label-caps pb-3 pr-4 font-normal">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.results ?? []).map((order) => (
              <tr key={order.number} className="hover:bg-white/[0.02]">
                <td className="py-4 pr-4">
                  <Link
                    href={`/studio/orders/${order.number}`}
                    className="font-button text-xs uppercase tracking-wider text-foreground hover:text-accent"
                  >
                    {order.number}
                  </Link>
                </td>
                <td className="py-4 pr-4 text-muted-foreground">{order.email}</td>
                <td className="py-4 pr-4 text-muted-foreground">{formatDate(order.created_at)}</td>
                <td className="py-4 pr-4 text-muted-foreground">{order.item_count}</td>
                <td className="py-4 pr-4">
                  <span
                    className={cn(
                      "font-button text-[10px] uppercase tracking-widest",
                      order.payment_status === "paid" ? "text-foreground" : "text-accent",
                    )}
                  >
                    {order.payment_status}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className="border border-border px-2 py-1 font-button text-[10px] uppercase tracking-widest text-muted-foreground">
                    {order.status_display}
                  </span>
                </td>
                <td className="py-4 text-foreground">{formatINR(order.total)}</td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  No orders in this state.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
