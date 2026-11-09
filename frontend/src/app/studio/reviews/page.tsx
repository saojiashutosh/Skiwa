"use client";

import { BadgeCheck, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminList, useInvalidateAdmin, type AdminReview } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";
import type { Paginated } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function StudioReviewsPage() {
  const confirm = useConfirm();
  const { data, isLoading } = useAdminList<Paginated<AdminReview>>("reviews");
  const invalidate = useInvalidateAdmin();

  const toggleApproval = async (review: AdminReview) => {
    try {
      await api.patch(`/manage/reviews/${review.id}/`, { is_approved: !review.is_approved });
      invalidate();
      toast.success(review.is_approved ? "Review hidden." : "Review published.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const remove = async (review: AdminReview) => {
    const ok = await confirm({
      title: "Delete this review?",
      description: `This ${review.rating}-star review on ${review.product_name} will be removed permanently. This cannot be undone.`,
      confirmLabel: "Delete review",
    });
    if (!ok) return;
    try {
      await api.delete(`/manage/reviews/${review.id}/`);
      invalidate();
      toast.success("Review deleted.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const reviews = data?.results ?? [];

  return (
    <div>
      <p className="label-caps mb-2">Moderation</p>
      <h1 className="heading text-5xl text-foreground">Reviews</h1>

      {isLoading ? (
        <Skeleton className="mt-8 h-64 w-full" />
      ) : reviews.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="mt-8 max-w-4xl divide-y divide-border border-y border-border">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-wrap items-start gap-6 py-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex">
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
                  <span className="text-sm text-foreground">{review.product_name}</span>
                  {review.is_verified_purchase && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-accent">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
                    </span>
                  )}
                </div>
                {review.title && (
                  <p className="mt-2 font-button text-xs uppercase tracking-wider text-foreground">
                    {review.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  {review.user_email} · {formatDate(review.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleApproval(review)}
                  className={cn(
                    "border px-3 py-1.5 font-button text-[10px] uppercase tracking-widest transition-colors",
                    review.is_approved
                      ? "border-border text-foreground hover:border-accent hover:text-accent"
                      : "border-accent bg-accent text-white",
                  )}
                >
                  {review.is_approved ? "Hide" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(review)}
                  aria-label="Delete review"
                  className="text-muted-foreground transition-colors hover:text-accent"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
