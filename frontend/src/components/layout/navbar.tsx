"use client";

import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CartDrawer } from "@/components/layout/cart-drawer";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchDialog } from "@/components/layout/search-dialog";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The Studio admin panel brings its own chrome.
  if (pathname.startsWith("/studio")) return null;

  // Transparent over the home hero until scroll; solid elsewhere.
  const transparent = pathname === "/" && !scrolled;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-luxe",
          transparent
            ? "border-b border-transparent bg-transparent"
            : "border-b border-border bg-background/80 backdrop-blur-xl",
        )}
      >
        <nav className="container flex h-16 items-center justify-between md:h-20">
          {/* Left: mobile menu + desktop links */}
          <div className="flex flex-1 items-center gap-6">
            <button
              type="button"
              className="text-foreground md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="hidden items-center gap-8 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "link-underline font-button text-[11px] uppercase tracking-[0.25em] transition-colors",
                    pathname.startsWith(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user?.is_staff && (
                <Link
                  href="/studio"
                  className="border border-accent/60 px-3 py-1.5 font-button text-[11px] uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  Studio
                </Link>
              )}
            </div>
          </div>

          {/* Center: wordmark */}
          <Link
            href="/"
            className="font-heading text-2xl tracking-[0.35em] text-foreground md:text-3xl"
            aria-label="SKIWAA home"
          >
            SKIWAA
          </Link>

          {/* Right: actions */}
          <div className="flex flex-1 items-center justify-end gap-4 md:gap-5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="text-foreground transition-colors hover:text-accent"
            >
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative hidden text-foreground transition-colors hover:text-accent sm:block"
            >
              <Heart className="h-[18px] w-[18px]" aria-hidden />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              aria-label="Account"
              className="hidden text-foreground transition-colors hover:text-accent sm:block"
            >
              <User className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label="Open cart"
              className="relative text-foreground transition-colors hover:text-accent"
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={mobileOpen} onOpenChange={setMobileOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CartDrawer />
    </>
  );
}
