"use client";

import { ArrowUpRight, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NewsletterForm } from "@/components/home/newsletter";
import { useCategories } from "@/hooks/queries";
import { INSTAGRAM_URL, SUPPORT_EMAIL } from "@/lib/constants";

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Collections", href: "/collections" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Return Policy", href: "/return-policy" },
];

export function Footer() {
  const pathname = usePathname();
  const { data: categories } = useCategories();

  if (pathname.startsWith("/studio")) return null;

  // Shop column follows the live catalog — categories added in the admin appear here.
  const shopLinks = [
    { label: "All Products", href: "/shop" },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      href: `/shop?category=${category.slug}`,
    })),
  ];

  return (
    <footer className="border-t border-border">
      {/* Newsletter band */}
      <div className="container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h2 className="heading text-section-title text-foreground">
            Join the <span className="text-accent">Energy</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            First access to drops, restocks and studio stories. No spam — only signal.
          </p>
        </div>
        <NewsletterForm />
      </div>

      {/* Link columns */}
      <div className="border-t border-border">
        <div className="container grid grid-cols-2 gap-10 py-14 md:grid-cols-4">
          <div>
            <p className="font-heading text-3xl tracking-[0.3em] text-foreground">SKIWAA</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Premium streetwear inspired by anime, typography and art.
              <br />
              Minimal · Bold · Timeless
            </p>
            <div className="mt-5 flex gap-4">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-accent"
              >
                <Instagram className="h-4 w-4" aria-hidden />
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                aria-label="Email"
                className="text-muted-foreground transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          {[
            { title: "Shop", links: shopLinks },
            { title: "Company", links: COMPANY_LINKS },
            { title: "Support", links: POLICY_LINKS },
          ].map((column) => (
            <div key={column.title}>
              <p className="label-caps mb-5">{column.title}</p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} SKIWAA. All rights reserved.</p>
          <p>
            Made in India · <span className="text-accent">Wear Your Energy</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
