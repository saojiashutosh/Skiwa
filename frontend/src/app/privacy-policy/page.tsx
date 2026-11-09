import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="July 2026"
      sections={[
        {
          heading: "What we collect",
          body: [
            "When you create an account or place an order, we collect your name, email address, phone number, and shipping address. When you browse, we collect standard technical data such as device type and pages visited to keep the site fast and secure.",
            "Payment details are processed entirely by Razorpay — SKIWAA never sees or stores your card numbers, UPI IDs or banking credentials.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "We use your information to fulfil orders, send transactional emails (order confirmations, shipping updates, password resets), provide customer support, and — only if you opt in — send newsletter updates about drops and restocks.",
            "We never sell your personal data to third parties. Ever.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Only the partners required to run the store: our payment gateway (Razorpay), delivery partners (for shipping labels), and infrastructure providers (hosting, email delivery). Each receives only the minimum data needed to do their job.",
          ],
        },
        {
          heading: "Cookies & storage",
          body: [
            "We use browser storage to keep you signed in, remember your cart and wishlist, and understand aggregate site usage. You can clear this at any time from your browser settings — you'll just be signed out.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can update your profile from your account at any time. To request a copy of your data or complete deletion of your account, email support@skiwaa.in — we respond within 7 working days.",
          ],
        },
      ]}
    />
  );
}
