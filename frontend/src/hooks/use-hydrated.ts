"use client";

import { useEffect, useState } from "react";

/**
 * True once React has hydrated on the client.
 *
 * Auth forms gate their submit buttons on this: before hydration a click
 * would trigger a NATIVE form submission (method=GET by default), which
 * would leak field values — including passwords — into the URL, browser
 * history and server logs.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
