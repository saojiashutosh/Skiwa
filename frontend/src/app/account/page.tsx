"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, LogOut, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { api, apiErrorMessage } from "@/lib/api";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.")
    .optional()
    .or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: user
      ? { first_name: user.first_name, last_name: user.last_name, phone: user.phone }
      : undefined,
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?next=/account");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) return <div className="min-h-svh" />;

  const onSubmit = async (values: ProfileValues) => {
    try {
      await api.patch("/profile/", values);
      await refreshUser();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const resendVerification = async () => {
    try {
      const { data } = await api.post("/auth/email/resend/");
      toast.success(data.detail);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">Your Space</p>
      <h1 className="heading text-section-title text-foreground">
        Hey, <span className="text-accent">{user.first_name || "You"}</span>
      </h1>

      <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_320px]">
        {/* Profile form */}
        <section>
          <h2 className="heading text-2xl text-foreground">Profile</h2>
          {!user.is_email_verified && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-accent/40 bg-accent/10 px-5 py-4 text-sm">
              <span className="text-foreground">Your email is not verified yet.</span>
              <Button variant="link" onClick={resendVerification} className="text-accent">
                Resend verification email
              </Button>
            </div>
          )}
          <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="mt-8 grid max-w-xl gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" className="mt-2" {...form.register("first_name")} />
              {form.formState.errors.first_name && (
                <p className="mt-1 text-xs text-accent">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" className="mt-2" {...form.register("last_name")} />
            </div>
            <div>
              <Label htmlFor="phone">Mobile Number</Label>
              <Input id="phone" inputMode="numeric" maxLength={10} className="mt-2" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="mt-1 text-xs text-accent">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled className="mt-2" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={form.formState.isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </section>

        {/* Quick links */}
        <aside className="h-fit border border-border">
          {user.is_staff && (
            <>
              <Link
                href="/studio"
                className="flex items-center gap-4 bg-accent/10 p-6 transition-colors hover:bg-accent/20"
              >
                <LayoutDashboard className="h-5 w-5 text-accent" aria-hidden />
                <div>
                  <p className="font-button text-xs uppercase tracking-[0.2em] text-accent">Studio</p>
                  <p className="mt-1 text-xs text-muted-foreground">Manage products, orders & content</p>
                </div>
              </Link>
              <Separator />
            </>
          )}
          <Link
            href="/account/orders"
            className="flex items-center gap-4 p-6 transition-colors hover:bg-white/5"
          >
            <Package className="h-5 w-5 text-accent" aria-hidden />
            <div>
              <p className="font-button text-xs uppercase tracking-[0.2em] text-foreground">Orders</p>
              <p className="mt-1 text-xs text-muted-foreground">Track, cancel or return</p>
            </div>
          </Link>
          <Separator />
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-4 p-6 text-left transition-colors hover:bg-white/5"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-button text-xs uppercase tracking-[0.2em] text-foreground">Sign Out</p>
              <p className="mt-1 text-xs text-muted-foreground">See you soon</p>
            </div>
          </button>
        </aside>
      </div>
    </div>
  );
}
