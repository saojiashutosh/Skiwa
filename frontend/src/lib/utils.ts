import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a decimal string/number as Indian Rupees: 1499 → ₹1,499 */
export function formatINR(value: string | number): string {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Sums a list of decimal strings safely (paise-precision). */
export function sumDecimals(values: (string | number)[]): number {
  const paise = values.reduce<number>(
    (total, v) => total + Math.round(parseFloat(String(v)) * 100),
    0,
  );
  return paise / 100;
}
