"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHydrated } from "@/hooks/use-hydrated";
import { api, apiErrorMessage } from "@/lib/api";

const schema = z.object({ email: z.string().email("Enter a valid email.") });
type ForgotValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const hydrated = useHydrated();
  const form = useForm<ForgotValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (values: ForgotValues) => {
    try {
      await api.post("/auth/password/forgot/", values);
      setSent(true);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <AuthShell eyebrow="Account Recovery" title={<>Reset <span className="text-accent">Password</span></>}>
      {sent ? (
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If that email exists, a reset link is on its way. Check your inbox (and spam folder).
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      ) : (
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" className="mt-2" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-accent">{form.formState.errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!hydrated}
            loading={form.formState.isSubmitting}
          >
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
