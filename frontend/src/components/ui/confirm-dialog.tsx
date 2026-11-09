"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  /** Supporting copy shown under the title. */
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" is the destructive red treatment; "default" is the neutral one. */
  tone?: "danger" | "default";
};

type ConfirmState = ConfirmOptions & { open: boolean };

const INITIAL: ConfirmState = { open: false, title: "" };

const ConfirmContext = React.createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(
  null,
);

/**
 * Drop-in replacement for `window.confirm` that renders inside the page.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete coupon ENERGY10?" }))) return;
 */
export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState>(INITIAL);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  // Held in a ref, not state: resolving is a side effect, and StrictMode
  // double-invokes state updaters in development.
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // If something opens a second dialog over an unanswered one, don't
        // leave the first promise dangling forever.
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setState({ ...options, open: true });
      }),
    [],
  );

  // Resolve exactly once, whichever way the dialog is dismissed
  // (button, Esc, overlay click, or the X in the corner).
  const settle = React.useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const isDanger = state.tone !== "default";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => !open && settle(false)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          />
          <DialogPrimitive.Content
            onOpenAutoFocus={(event) => {
              // Focus Cancel, not Confirm, so a stray Enter never destroys data.
              event.preventDefault();
              cancelRef.current?.focus();
            }}
            className={cn(
              "fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
              "border border-border bg-background p-8 shadow-2xl",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            )}
          >
            <div className="flex gap-4">
              <span
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  isDanger ? "bg-accent/15 text-accent" : "bg-white/5 text-foreground",
                )}
                aria-hidden
              >
                <AlertTriangle className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <DialogTitle className="heading text-2xl leading-tight text-foreground">
                  {state.title}
                </DialogTitle>

                {state.description ? (
                  <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {state.description}
                  </DialogDescription>
                ) : null}

                <div className="mt-7 flex flex-wrap justify-end gap-3">
                  <Button ref={cancelRef} variant="outline" size="sm" onClick={() => settle(false)}>
                    {state.cancelLabel ?? "Cancel"}
                  </Button>
                  <Button
                    variant={isDanger ? "accent" : "primary"}
                    size="sm"
                    onClick={() => settle(true)}
                  >
                    {state.confirmLabel ?? "Confirm"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
