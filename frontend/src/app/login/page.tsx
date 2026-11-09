"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";
import { apiErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof schema>;

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const next = searchParams.get("next") ?? "/account";

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back.");
      router.push(next);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Invalid email or password."));
    }
  };

  return (
    <AuthShell eyebrow="Welcome Back" title={<>Sign <span className="text-accent">In</span></>}>
      {/* method=post: a pre-hydration native submit must never leak fields into the URL */}
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="mt-2" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" className="mt-2" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!hydrated}
          loading={form.formState.isSubmitting}
        >
          Sign In
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted-foreground">
        New here?{" "}
        <Link href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground underline underline-offset-4 hover:text-accent">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
