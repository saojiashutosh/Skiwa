"use client";

import Link from "next/link";

import { useStats } from "@/hooks/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatINR } from "@/lib/utils";

export default function StudioDashboard() {
  const { data: stats, isLoading } = useStats();

  const cards = stats
    ? [
        { label: "Revenue (paid)", value: formatINR(stats.revenue_total) },
        { label: "Orders", value: String(stats.orders_total) },
        { label: "Open Orders", value: String(stats.orders_open) },
        { label: "Customers", value: String(stats.customers_total) },
        { label: "Products", value: String(stats.products_total) },
        { label: "Low Stock", value: String(stats.low_stock_count), alert: stats.low_stock_count > 0 },
      ]
    : [];

  return (
    <div>
      <p className="label-caps mb-2">Overview</p>
      <h1 className="heading text-5xl text-foreground">Dashboard</h1>

      {/* Stat cards */}
      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-background p-6">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-8 w-24" />
              </div>
            ))
          : cards.map((card) => (
              <div key={card.label} className="bg-background p-6">
                <p className="label-caps">{card.label}</p>
                <p
                  className={`mt-2 font-heading text-3xl ${card.alert ? "text-accent" : "text-foreground"}`}
                >
                  {card.value}
                </p>
              </div>
            ))}
      </div>

      <div className="mt-12 grid gap-10 xl:grid-cols-2">
        {/* Recent orders */}
        <section>
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="heading text-2xl text-foreground">Recent Orders</h2>
            <Link href="/studio/orders" className="label-caps hover:text-foreground">
              View all →
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-48 w-full" />
          ) : (
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-border">
                {(stats?.recent_orders ?? []).map((order) => (
                  <tr key={order.number}>
                    <td className="py-3">
                      <Link
                        href={`/studio/orders/${order.number}`}
                        className="font-button text-xs uppercase tracking-wider text-foreground hover:text-accent"
                      >
                        {order.number}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{order.email}</p>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3">
                      <span className="border border-border px-2 py-1 font-button text-[10px] uppercase tracking-widest text-muted-foreground">
                        {order.status_display}
                      </span>
                    </td>
                    <td className="py-3 text-right text-foreground">{formatINR(order.total)}</td>
                  </tr>
                ))}
                {stats && stats.recent_orders.length === 0 && (
                  <tr>
                    <td className="py-6 text-muted-foreground">No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>

        {/* Low stock */}
        <section>
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="heading text-2xl text-foreground">Low Stock</h2>
            <Link href="/studio/products" className="label-caps hover:text-foreground">
              Manage →
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-48 w-full" />
          ) : (
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-border">
                {(stats?.low_stock ?? []).map((entry) => (
                  <tr key={entry.variant_id}>
                    <td className="py-3">
                      <Link
                        href={`/studio/products/${entry.product_id}`}
                        className="text-foreground hover:text-accent"
                      >
                        {entry.product}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.sku}</p>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-heading text-xl ${entry.quantity === 0 ? "text-accent" : "text-foreground"}`}
                      >
                        {entry.quantity}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">left</span>
                    </td>
                  </tr>
                ))}
                {stats && stats.low_stock.length === 0 && (
                  <tr>
                    <td className="py-6 text-muted-foreground">All variants healthy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
