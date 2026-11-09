"use client";

import {
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  LogOut,
  Package,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/studio", icon: LayoutDashboard, exact: true },
  { label: "Products", href: "/studio/products", icon: Package },
  { label: "Collections", href: "/studio/collections", icon: Layers },
  { label: "Categories", href: "/studio/categories", icon: Tags },
  { label: "Orders", href: "/studio/orders", icon: ShoppingBag },
  { label: "Coupons", href: "/studio/coupons", icon: TicketPercent },
  { label: "Reviews", href: "/studio/reviews", icon: Star },
  { label: "Content", href: "/studio/content", icon: ImageIcon },
];

export default function StudioLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // UX guard only — every /api/manage/ endpoint enforces staff server-side.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?next=/studio");
    } else if (!user?.is_staff) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user?.is_staff) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="animate-pulse font-heading text-2xl tracking-[0.4em] text-foreground/40">
          SKIWAA STUDIO
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-background">
        <Link href="/studio" className="border-b border-border px-6 py-6">
          <span className="font-heading text-xl tracking-[0.3em] text-foreground">SKIWAA</span>
          <span className="mt-1 block font-button text-[10px] uppercase tracking-[0.35em] text-accent">
            Studio
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-6 py-3 font-button text-[11px] uppercase tracking-[0.2em] transition-colors",
                  active
                    ? "border-accent bg-white/[0.04] text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="truncate px-2 text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 border border-border py-2 font-button text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <Store className="h-3.5 w-3.5" aria-hidden /> Store
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex flex-1 items-center justify-center gap-2 border border-border py-2 font-button text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8 lg:p-12">{children}</main>
    </div>
  );
}
