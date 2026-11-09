"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Star } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useReviews } from "@/hooks/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const reviewSchema = z.object({
  rating: z.number().min(1, "Pick a rating.").max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(10, "Tell us a little more (min 10 characters)."),
});

type ReviewValues = z.infer<typeof reviewSchema>;

export function ReviewSection({ slug }: { slug: string }) {
  const { data, isLoading } = useReviews(slug);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", body: "" },
  });
  const rating = form.watch("rating");

  const onSubmit = async (values: ReviewValues) => {
    try {
      await api.post(`/products/${slug}/reviews/`, values);
      toast.success("Review published. Thank you!");
      form.reset();
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not submit your review."));
    }
  };

  const reviews = data?.results ?? [];

  return (
    <section className="container mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="label-caps mb-3">The Verdict</p>
          <h2 className="heading text-4xl text-foreground md:text-5xl">Reviews</h2>
        </div>
        {isAuthenticated ? (
          <Button variant="outline" onClick={() => setFormOpen((current) => !current)}>
            {formOpen ? "Cancel" : "Write a Review"}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Sign in to write a review.</p>
        )}
      </div>

      {/* Review form */}
      {formOpen && (
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-8 max-w-xl space-y-5 border border-border p-6"
        >
          <div>
            <Label>Rating</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => form.setValue("rating", star, { shouldValidate: true })}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      rating >= star
                        ? "fill-foreground text-foreground"
                        : "text-muted-foreground/40 hover:text-muted-foreground",
                    )}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
            {form.formState.errors.rating && (
              <p className="mt-1 text-xs text-accent">{form.formState.errors.rating.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="review-title">Title (optional)</Label>
            <Input id="review-title" className="mt-2" {...form.register("title")} />
          </div>
          <div>
            <Label htmlFor="review-body">Review</Label>
            <Textarea id="review-body" className="mt-2" {...form.register("body")} />
            {form.formState.errors.body && (
              <p className="mt-1 text-xs text-accent">{form.formState.errors.body.message}</p>
            )}
          </div>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Publish Review
          </Button>
        </form>
      )}

      {/* Reviews list */}
      <div className="mt-8">
        {isLoading && <p className="text-sm text-muted-foreground">Loading reviews…</p>}
        {!isLoading && reviews.length === 0 && (
          <p className="py-8 text-sm text-muted-foreground">
            No reviews yet. Be the first to wear it loud.
          </p>
        )}
        <ul className="divide-y divide-border">
          {reviews.map((review) => (
            <li key={review.id} className="py-8">
              <div className="flex items-center gap-3">
                <div className="flex" aria-label={`${review.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        review.rating >= star
                          ? "fill-foreground text-foreground"
                          : "text-muted-foreground/30",
                      )}
                      aria-hidden
                    />
                  ))}
                </div>
                {review.is_verified_purchase && (
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-accent">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
                  </span>
                )}
              </div>
              {review.title && (
                <p className="mt-3 font-button text-sm uppercase tracking-wider text-foreground">
                  {review.title}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
              <p className="mt-3 text-xs text-muted-foreground/70">
                {review.author} · {formatDate(review.created_at)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
