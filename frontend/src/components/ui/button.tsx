import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-button text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 ease-luxe focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-accent hover:text-white",
        accent: "bg-accent text-white hover:bg-accent-hover",
        outline: "border border-foreground/25 bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        ghost: "bg-transparent text-foreground hover:bg-white/5",
        link: "text-foreground underline-offset-4 hover:underline p-0 h-auto tracking-[0.15em]",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-7",
        lg: "h-14 px-10 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
