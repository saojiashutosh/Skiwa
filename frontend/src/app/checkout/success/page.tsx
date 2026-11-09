"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <div className="container flex min-h-svh flex-col items-center justify-center py-32 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <CheckCircle2 className="mx-auto h-16 w-16 text-accent" aria-hidden />
      </motion.div>
      <h1 className="heading mt-8 text-section-title text-foreground">Order Confirmed</h1>
      {orderNumber && (
        <p className="mt-4 font-button text-sm uppercase tracking-[0.25em] text-muted-foreground">
          Order <span className="text-foreground">{orderNumber}</span>
        </p>
      )}
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Your energy is being packed. A confirmation email with your invoice is on its way —
        track everything from your account.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {orderNumber && (
          <Button size="lg" asChild>
            <Link href={`/account/orders/${orderNumber}`}>Track Order</Link>
          </Button>
        )}
        <Button size="lg" variant="outline" asChild>
          <Link href="/shop">Keep Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
