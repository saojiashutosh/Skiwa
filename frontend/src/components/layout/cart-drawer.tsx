"use client";

import { Minus, Plus, ShoppingBag, Tag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";
import { FREE_SHIPPING_ABOVE } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

export function CartDrawer() {
  const {
    items, count, subtotal, discount, total, appliedCoupon,
    isOpen, closeCart, updateQuantity, removeItem, applyCoupon, removeCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const router = useRouter();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    setCouponError("");
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode("");
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Invalid coupon.");
    } finally {
      setApplying(false);
    }
  };

  const goToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const freeShippingGap = FREE_SHIPPING_ABOVE - subtotal;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="w-full max-w-md">
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-6">
            <SheetTitle className="heading text-2xl text-foreground">
              Cart {count > 0 && <span className="text-accent">({count})</span>}
            </SheetTitle>
            <SheetDescription className="sr-only">Your shopping cart</SheetDescription>
            {count > 0 && freeShippingGap > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Add {formatINR(freeShippingGap)} more for free standard shipping.
              </p>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Button variant="outline" onClick={closeCart} asChild>
                <Link href="/shop">Shop the Drop</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Lines */}
              <div className="flex-1 overflow-y-auto p-6">
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li key={item.variantId} className="flex gap-4">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="relative h-24 w-20 shrink-0 overflow-hidden bg-muted"
                      >
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={closeCart}
                              className="text-sm font-medium text-foreground hover:text-accent"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.color && `${item.color} · `}Size {item.size}
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
                              className="px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" aria-hidden />
                            </button>
                            <span className="w-8 text-center text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              className="px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={item.quantity >= Math.min(10, item.maxStock)}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                          <span className="text-sm text-foreground">
                            {formatINR(parseFloat(item.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary */}
              <div className="border-t border-border p-6">
                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="mb-4 flex items-center justify-between border border-border bg-muted px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-accent" aria-hidden />
                      <span className="font-medium text-foreground">{appliedCoupon.coupon.code}</span>
                      <span className="text-xs text-muted-foreground">−{formatINR(discount)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                        placeholder="COUPON CODE"
                        className="h-10 text-xs tracking-widest"
                        onKeyDown={(event) => event.key === "Enter" && handleApplyCoupon()}
                      />
                      <Button variant="outline" size="sm" className="h-10" onClick={handleApplyCoupon} loading={applying}>
                        Apply
                      </Button>
                    </div>
                    {couponError && <p className="mt-2 text-xs text-accent">{couponError}</p>}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Discount</span>
                      <span className="text-accent">−{formatINR(discount)}</span>
                    </div>
                  )}
                  <Separator className="my-3" />
                  <div className="flex justify-between text-base font-medium text-foreground">
                    <span>Total</span>
                    <span>{formatINR(total)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Shipping calculated at checkout.
                  </p>
                </div>

                <Button variant="accent" size="lg" className="mt-5 w-full" onClick={goToCheckout}>
                  Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
