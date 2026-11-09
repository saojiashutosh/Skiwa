"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHydrated } from "@/hooks/use-hydrated";
import { api, apiErrorMessage } from "@/lib/api";

const schema = z
  .object({
    new_password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((values) => values.new_password === values.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

type ResetValues = z.infer<typeof schema>;

function ResetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const form = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: "", confirm: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    try {
      await api.post("/auth/password/reset/", { uid, token, new_password: values.new_password });
      toast.success("Password updated. Sign in with your new password.");
      router.push("/login");
    } catch (error) {
      toast.error(apiErrorMessage(error, "This link is invalid or has expired."));
    }
  };

  if (!uid || !token) {
    return (
      <AuthShell eyebrow="Account Recovery" title="Invalid Link">
        <p className="text-sm text-muted-foreground">
          This reset link is malformed. Request a new one from the forgot-password page.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account Recovery" title={<>New <span className="text-accent">Password</span></>}>
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="new_password">New Password</Label>
          <Input id="new_password" type="password" autoComplete="new-password" className="mt-2" {...form.register("new_password")} />
          {form.formState.errors.new_password && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.new_password.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" className="mt-2" {...form.register("confirm")} />
          {form.formState.errors.confirm && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.confirm.message}</p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!hydrated}
          loading={form.formState.isSubmitting}
        >
          Update Password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}
