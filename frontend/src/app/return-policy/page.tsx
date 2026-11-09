import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Return Policy" };

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Return Policy"
      updated="July 2026"
      sections={[
        {
          heading: "The 7-day window",
          body: [
            "Not feeling it? You can request a return within 7 days of delivery, straight from Account → Orders. Items must be unworn, unwashed, undamaged, and have all original tags attached.",
          ],
        },
        {
          heading: "How it works",
          body: [
            "1. Open the order in your account and tap Request Return, telling us the reason.",
            "2. Our team confirms the pickup within 24–48 hours.",
            "3. Once the piece passes a quality check, your refund is initiated to the original payment method.",
          ],
        },
        {
          heading: "Refund timelines",
          body: [
            "Refunds are initiated immediately after the quality check and typically land in 5–7 business days depending on your bank. Prepaid orders are refunded to the original payment method via Razorpay.",
          ],
        },
        {
          heading: "Cancellations",
          body: [
            "You can cancel an order any time before it ships — instantly, from your account. If you already paid, the refund is initiated the same moment.",
          ],
        },
        {
          heading: "What can't be returned",
          body: [
            "Accessories (caps, totes) are final sale for hygiene reasons unless they arrive damaged. Items that arrive damaged or incorrect are always replaced or refunded in full — email support@skiwaa.in with photos within 48 hours of delivery.",
          ],
        },
      ]}
    />
  );
}
