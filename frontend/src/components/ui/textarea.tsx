import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full border border-border bg-transparent px-4 py-3 text-sm text-foreground",
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
Textarea.displayName = "Textarea";

export { Textarea };
