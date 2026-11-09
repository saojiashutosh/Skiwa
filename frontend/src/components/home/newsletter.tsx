"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, apiErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type NewsletterValues = z.infer<typeof schema>;

export function NewsletterForm() {
  const form = useForm<NewsletterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: NewsletterValues) => {
    try {
      const { data } = await api.post("/newsletter/subscribe/", values);
      toast.success(data.detail ?? "You are on the list.");
      form.reset();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not subscribe. Try again."));
    }
  };

  return (
    <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="w-full md:max-w-md md:justify-self-end">
      <div className="flex border-b border-foreground/30 pb-2 transition-colors focus-within:border-foreground">
        <Input
          type="email"
          placeholder="your@email.com"
          className="h-12 border-0 px-0 text-base focus-visible:border-0"
          autoComplete="email"
          {...form.register("email")}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-12 w-12"
          loading={form.formState.isSubmitting}
          aria-label="Subscribe to the newsletter"
        >
          {!form.formState.isSubmitting && <ArrowRight className="h-5 w-5" aria-hidden />}
        </Button>
      </div>
      {form.formState.errors.email && (
        <p className="mt-2 text-xs text-accent">{form.formState.errors.email.message}</p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        By subscribing you agree to our privacy policy. Unsubscribe anytime.
      </p>
    </form>
  );
}
