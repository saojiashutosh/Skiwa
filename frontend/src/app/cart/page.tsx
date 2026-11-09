"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { formatINR } from "@/lib/utils";

export default function CartPage() {
  const { items, count, subtotal, discount, total, updateQuantity, removeItem, appliedCoupon } =
    useCart();

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">Your Selection</p>
      <h1 className="heading text-section-title text-foreground">
        Cart {count > 0 && <span className="text-accent">({count})</span>}
      </h1>

      {items.length === 0 ? (
        <div className="mt-16 max-w-md">
          <p className="text-sm text-muted-foreground">
            Your cart is empty. The energy is waiting.
          </p>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/shop">Shop the Drop</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_380px]">
          {/* Lines */}
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-6 py-6">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-36 w-28 shrink-0 overflow-hidden bg-muted"
                >
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-body text-base font-medium text-foreground hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.color && `${item.color} · `}Size {item.size}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatINR(item.price)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-muted-foreground transition-colors hover:text-accent"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        className="px-3 py-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-3 py-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= Math.min(10, item.maxStock)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <span className="text-base text-foreground">
                      {formatINR(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <aside className="h-fit border border-border p-8">
            <h2 className="heading text-2xl text-foreground">Summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Coupon ({appliedCoupon.coupon.code})</span>
                  <span className="text-accent">−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-medium text-foreground">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
            <Button variant="accent" size="lg" className="mt-8 w-full" asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button variant="ghost" className="mt-3 w-full" asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
