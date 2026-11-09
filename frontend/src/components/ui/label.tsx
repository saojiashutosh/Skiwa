"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "font-button text-[11px] uppercase tracking-[0.25em] text-muted-foreground",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
