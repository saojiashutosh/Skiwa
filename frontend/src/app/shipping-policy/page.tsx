import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Shipping Policy"
      updated="July 2026"
      sections={[
        {
          heading: "Dispatch",
          body: [
            "Every order is picked, packed and dispatched from our studio within 24–48 hours of payment confirmation (business days). You'll receive a confirmation email with your invoice as soon as your order is placed, and a tracking link as soon as it ships.",
          ],
        },
        {
          heading: "Delivery timelines",
          body: [
            "Standard Shipping: 5–7 business days, ₹99 — free on orders above ₹1,999.",
            "Express Shipping: 2–3 business days, ₹249 — free on orders above ₹4,999.",
            "Timelines are estimates from dispatch and may stretch during sale periods, extreme weather, or for remote PIN codes.",
          ],
        },
        {
          heading: "Coverage",
          body: [
            "We currently ship across India to all serviceable PIN codes. International shipping is on the roadmap — join the newsletter to hear when it launches.",
          ],
        },
        {
          heading: "Tracking",
          body: [
            "Track any order from Account → Orders. The tracking number and courier link appear as soon as your parcel is scanned by our delivery partner.",
          ],
        },
        {
          heading: "Wrong or incomplete address",
          body: [
            "If you spot an address error after ordering, contact us within 12 hours at support@skiwaa.in and we'll correct it before dispatch. Once shipped, address changes depend on the courier and can't be guaranteed.",
          ],
        },
      ]}
    />
  );
}
