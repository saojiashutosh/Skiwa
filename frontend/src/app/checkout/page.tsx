"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useShippingMethods } from "@/hooks/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { Address, Order, RazorpayCheckoutPayload } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

const addressSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  line1: z.string().min(5, "Address line 1 is required."),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
});

type AddressValues = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const { items, subtotal, discount, total, appliedCoupon, clearCart } = useCart();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { data: shippingMethods } = useShippingMethods(isAuthenticated);
  const router = useRouter();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [shippingCode, setShippingCode] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [placing, setPlacing] = useState(false);

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
    },
  });

  // Gate: must be signed in and have items.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<Address[]>("/profile/addresses/")
      .then(({ data }) => {
        setSavedAddresses(data);
        const preferred = data.find((address) => address.is_default) ?? data[0];
        if (preferred) setSelectedAddressId(preferred.id);
        else setUseNewAddress(true);
      })
      .catch(() => setUseNewAddress(true));
  }, [isAuthenticated]);

  useEffect(() => {
    if (shippingMethods?.length && !shippingCode) {
      setShippingCode(shippingMethods[0].code);
    }
  }, [shippingMethods, shippingCode]);

  const selectedMethod = shippingMethods?.find((method) => method.code === shippingCode);
  const shippingFee = useMemo(() => {
    if (!selectedMethod) return 0;
    const free = selectedMethod.free_above !== null && subtotal >= parseFloat(selectedMethod.free_above);
    return free ? 0 : parseFloat(selectedMethod.price);
  }, [selectedMethod, subtotal]);

  const payable = total + shippingFee;

  const placeOrder = async () => {
    if (!items.length) {
      toast.error("Your cart is empty.");
      return;
    }

    let addressPayload: Record<string, unknown>;
    if (!useNewAddress && selectedAddressId) {
      addressPayload = { address_id: selectedAddressId };
    } else {
      const valid = await form.trigger();
      if (!valid) return;
      const values = form.getValues();
      addressPayload = { shipping_address: { ...values, country: "India" } };
      if (saveAddress) {
        api.post("/profile/addresses/", { ...values, kind: "shipping", is_default: !savedAddresses.length }).catch(() => {});
      }
    }

    setPlacing(true);
    // Tracked outside the try so the catch can tell "order never created" from
    // "order created, payment step failed" — the recovery differs.
    let placedOrder: Order | null = null;
    try {
      // 1. Create the order (server recomputes totals + reserves stock).
      const { data: order } = await api.post<Order>("/orders/", {
        items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
        ...addressPayload,
        coupon_code: appliedCoupon?.coupon.code ?? "",
        shipping_method_code: shippingCode,
      });
      placedOrder = order;

      // 2. Create the Razorpay payment for it.
      const { data: payment } = await api.post<RazorpayCheckoutPayload>("/payment/razorpay/create/", {
        order_number: order.number,
      });

      // 3. Open Razorpay checkout; verify server-side on success.
      await openRazorpayCheckout(
        payment,
        async (response) => {
          try {
            await api.post("/payment/razorpay/verify/", response);
            clearCart();
            router.push(`/checkout/success?order=${order.number}`);
          } catch (error) {
            toast.error(apiErrorMessage(error, "Payment verification failed. Contact support."));
          }
        },
        () => {
          setPlacing(false);
          toast("Payment cancelled. Your order is saved — you can retry from Orders.", {
            action: { label: "View Orders", onClick: () => router.push("/account/orders") },
          });
        },
      );
    } catch (error) {
      if (placedOrder) {
        // The order exists and stock is reserved — only payment failed.
        toast.error(apiErrorMessage(error, "Could not start the payment."), {
          description: `Order ${placedOrder.number} is saved. You can retry the payment from your orders.`,
          action: { label: "View Orders", onClick: () => router.push("/account/orders") },
        });
      } else {
        toast.error(apiErrorMessage(error, "Could not place the order."));
      }
      setPlacing(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="animate-pulse font-heading text-2xl tracking-[0.4em] text-foreground/40">
          SKIWAA
        </p>
      </div>
    );
  }

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">Almost There</p>
      <h1 className="heading text-section-title text-foreground">Checkout</h1>

      {items.length === 0 ? (
        <div className="mt-16 max-w-md">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button className="mt-8" asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_400px]">
          {/* Left: address + shipping */}
          <div className="space-y-12">
            {/* Contact */}
            <section>
              <h2 className="heading text-2xl text-foreground">01 — Contact</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Order updates go to <span className="text-foreground">{user?.email}</span>
              </p>
            </section>

            {/* Address */}
            <section>
              <h2 className="heading text-2xl text-foreground">02 — Shipping Address</h2>

              {savedAddresses.length > 0 && (
                <div className="mt-6 space-y-3">
                  {savedAddresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 border p-5 transition-colors",
                        !useNewAddress && selectedAddressId === address.id
                          ? "border-foreground"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1 accent-[#C1121F]"
                        checked={!useNewAddress && selectedAddressId === address.id}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setUseNewAddress(false);
                        }}
                      />
                      <span className="text-sm">
                        <span className="font-medium text-foreground">{address.full_name}</span>
                        {address.is_default && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-accent">
                            Default
                          </span>
                        )}
                        <br />
                        <span className="text-muted-foreground">
                          {address.line1}
                          {address.line2 && `, ${address.line2}`}, {address.city}, {address.state} —{" "}
                          {address.pincode}
                          <br />
                          {address.phone}
                        </span>
                      </span>
                    </label>
                  ))}
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 border p-5 transition-colors",
                      useNewAddress ? "border-foreground" : "border-border hover:border-foreground/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="accent-[#C1121F]"
                      checked={useNewAddress}
                      onChange={() => setUseNewAddress(true)}
                    />
                    <span className="text-sm text-foreground">Ship to a new address</span>
                  </label>
                </div>
              )}

              {(useNewAddress || savedAddresses.length === 0) && (
                <form method="post" onSubmit={(event) => event.preventDefault()} className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" className="mt-2" autoComplete="name" {...form.register("full_name")} />
                    {form.formState.errors.full_name && (
                      <p className="mt-1 text-xs text-accent">{form.formState.errors.full_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input id="phone" className="mt-2" inputMode="numeric" autoComplete="tel" maxLength={10} {...form.register("phone")} />
                    {form.formState.errors.phone && (
                      <p className="mt-1 text-xs text-accent">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input id="pincode" className="mt-2" inputMode="numeric" autoComplete="postal-code" maxLength={6} {...form.register("pincode")} />
                    {form.formState.errors.pincode && (
                      <p className="mt-1 text-xs text-accent">{form.formState.errors.pincode.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input id="line1" className="mt-2" autoComplete="address-line1" {...form.register("line1")} />
                    {form.formState.errors.line1 && (
                      <p className="mt-1 text-xs text-accent">{form.formState.errors.line1.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="line2">Address Line 2 (optional)</Label>
                    <Input id="line2" className="mt-2" autoComplete="address-line2" {...form.register("line2")} />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" className="mt-2" autoComplete="address-level2" {...form.register("city")} />
                    {form.formState.errors.city && (
                      <p className="mt-1 text-xs text-accent">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" className="mt-2" autoComplete="address-level1" {...form.register("state")} />
                    {form.formState.errors.state && (
                      <p className="mt-1 text-xs text-accent">{form.formState.errors.state.message}</p>
                    )}
                  </div>
                  <label className="flex items-center gap-3 text-sm text-muted-foreground sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                      className="h-4 w-4 accent-[#C1121F]"
                    />
                    Save this address for next time
                  </label>
                </form>
              )}
            </section>

            {/* Shipping method */}
            <section>
              <h2 className="heading text-2xl text-foreground">03 — Delivery</h2>
              <div className="mt-6 space-y-3">
                {(shippingMethods ?? []).map((method) => {
                  const free =
                    method.free_above !== null && subtotal >= parseFloat(method.free_above);
                  return (
                    <label
                      key={method.code}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-4 border p-5 transition-colors",
                        shippingCode === method.code
                          ? "border-foreground"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <span className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping"
                          className="accent-[#C1121F]"
                          checked={shippingCode === method.code}
                          onChange={() => setShippingCode(method.code)}
                        />
                        <span className="text-sm">
                          <span className="font-medium text-foreground">{method.name}</span>
                          <br />
                          <span className="text-muted-foreground">
                            {method.eta_days_min}–{method.eta_days_max} business days
                          </span>
                        </span>
                      </span>
                      <span className="text-sm text-foreground">
                        {free ? <span className="text-accent">FREE</span> : formatINR(method.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="heading text-2xl text-foreground">04 — Payment</h2>
              <div className="mt-6 border border-border p-5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 text-foreground">
                  <Lock className="h-4 w-4" aria-hidden /> Razorpay Secure Checkout
                </p>
                <p className="mt-2">
                  UPI, cards, netbanking and wallets. You&apos;ll be redirected to Razorpay to
                  complete the payment.
                </p>
              </div>
            </section>
          </div>

          {/* Right: order summary */}
          <aside className="h-fit border border-border p-8 lg:sticky lg:top-28">
            <h2 className="heading text-2xl text-foreground">Order Summary</h2>
            <ul className="mt-6 max-h-72 space-y-4 overflow-y-auto">
              {items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-4">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-muted">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    )}
                    <span className="absolute right-0 top-0 bg-background/90 px-1 text-[10px] text-foreground">
                      ×{item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="text-foreground">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.color && `${item.color} · `}{item.size}
                    </p>
                  </div>
                  <span className="text-xs text-foreground">
                    {formatINR(parseFloat(item.price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-6" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Coupon ({appliedCoupon?.coupon.code})</span>
                  <span className="text-accent">−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "FREE" : formatINR(shippingFee)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-medium text-foreground">
                <span>Total</span>
                <span>{formatINR(payable)}</span>
              </div>
            </div>
            <Button
              variant="accent"
              size="lg"
              className="mt-8 w-full"
              onClick={placeOrder}
              loading={placing}
            >
              Pay {formatINR(payable)}
            </Button>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              By placing this order you agree to our{" "}
              <Link href="/return-policy" className="underline hover:text-foreground">
                return policy
              </Link>
              .
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
