"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

/**
 * Thin progress bar across the top of the viewport, shown while a navigation
 * is in flight.
 *
 * The App Router has no router event stream, so we start the bar optimistically
 * on any click that will navigate, and finish it when the pathname actually
 * changes. The bar creeps toward 90% while waiting — it never reaches 100%
 * until the new route is really on screen, so a slow route reads as "still
 * working" rather than "finished but blank".
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const creep = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (creep.current) {
      clearInterval(creep.current);
      creep.current = null;
    }
  }, []);

  const start = React.useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(8);
    // Ease toward 90% and hold there until the route resolves.
    creep.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.12)));
    }, 120);
  }, [clearTimers]);

  const finish = React.useCallback(() => {
    clearTimers();
    setProgress(100);
    timers.current.push(
      setTimeout(() => setVisible(false), 220),
      setTimeout(() => setProgress(0), 500),
    );
  }, [clearTimers]);

  // Start on any click that is going to navigate within the app.
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or just a hash change) — nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [start]);

  // Back/forward navigations.
  React.useEffect(() => {
    window.addEventListener("popstate", start);
    return () => window.removeEventListener("popstate", start);
  }, [start]);

  // The route actually changed — close the bar out.
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    finish();
  }, [pathname, finish]);

  React.useEffect(() => clearTimers, [clearTimers]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease-out" }}
    >
      <div
        className="h-full bg-accent"
        style={{
          width: `${progress}%`,
          transition: "width 200ms ease-out",
          boxShadow: "0 0 10px rgba(193,18,31,0.8), 0 0 4px rgba(193,18,31,0.6)",
        }}
      />
    </div>
  );
}
