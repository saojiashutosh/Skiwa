import type { RazorpayCheckoutPayload } from "./types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(
  payload: RazorpayCheckoutPayload,
  onSuccess: (response: RazorpaySuccess) => void,
  onDismiss: () => void,
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Could not load the payment gateway. Check your connection.");
  }
  const razorpay = new window.Razorpay({
    key: payload.key,
    order_id: payload.razorpay_order_id,
    amount: payload.amount,
    currency: payload.currency,
    name: payload.name,
    description: payload.description,
    prefill: payload.prefill,
    theme: payload.theme,
    handler: onSuccess,
    modal: { ondismiss: onDismiss },
  });
  razorpay.open();
}
