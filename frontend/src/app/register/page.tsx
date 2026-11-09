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
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type RegisterValues = z.infer<typeof schema>;

function RegisterContent() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const next = searchParams.get("next") ?? "/account";

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await registerUser(values);
      toast.success("Account created. Check your inbox to verify your email.");
      router.push(next);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create your account."));
    }
  };

  return (
    <AuthShell eyebrow="Join the Movement" title={<>Create <span className="text-accent">Account</span></>}>
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" autoComplete="given-name" className="mt-2" {...form.register("first_name")} />
            {form.formState.errors.first_name && (
              <p className="mt-1 text-xs text-accent">{form.formState.errors.first_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" autoComplete="family-name" className="mt-2" {...form.register("last_name")} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="mt-2" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" className="mt-2" {...form.register("password")} />
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
          Create Account
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-accent">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
