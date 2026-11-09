"use client";

import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { INSTAGRAM_URL, NAV_LINKS } from "@/lib/constants";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { isAuthenticated, user } = useAuth();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-8">
        <SheetTitle className="font-heading text-2xl tracking-[0.35em] text-foreground">
          SKIWAA
        </SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>

        <nav className="mt-12 flex flex-col gap-6">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="font-heading text-4xl uppercase tracking-wider text-foreground transition-colors hover:text-accent"
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4">
          <Link href="/wishlist" onClick={close} className="label-caps hover:text-foreground">
            Wishlist
          </Link>
          <Link
            href={isAuthenticated ? "/account" : "/login"}
            onClick={close}
            className="label-caps hover:text-foreground"
          >
            {isAuthenticated ? "Account" : "Sign In"}
          </Link>
          {user?.is_staff && (
            <Link href="/studio" onClick={close} className="label-caps text-accent hover:text-foreground">
              Studio — Manage Store
            </Link>
          )}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="label-caps hover:text-foreground"
          >
            Instagram
          </a>
        </div>

        <p className="absolute bottom-8 left-8 font-button text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Wear Your Energy
        </p>
      </SheetContent>
    </Sheet>
  );
}
