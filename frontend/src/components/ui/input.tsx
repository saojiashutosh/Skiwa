import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full border border-border bg-transparent px-4 text-sm text-foreground",
        "placeholder:text-muted-foreground/60",
        "transition-colors duration-300 focus-visible:border-foreground/40 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
