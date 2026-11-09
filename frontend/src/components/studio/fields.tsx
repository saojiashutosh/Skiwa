"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BaseProps {
  label: string;
  className?: string;
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  rows = 4,
  className,
}: BaseProps & { value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  className,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#C1121F]"
      />
      {label}
    </label>
  );
}
