import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author_name: string;
  verified_purchase: boolean;
  created_at: string;
};

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Tell us a little more — at least 10 characters.").max(4000),
  author_name: z.string().trim().min(1, "Your name is required.").max(100),
  author_email: z.string().trim().email("Enter a valid email.").max(320),
  // Honeypot — should always be empty.
  website: z.string().max(0, "Spam detected.").optional().or(z.literal("")),
});

/**
 * First-party, admin-moderated reviews. New submissions land as 'pending'
 * (per RLS) and only 'approved' reviews are publicly readable.
 * Compliant with Shopify's reviews policy — no fabricated content.
 */
export function ProductReviews({
  handle,
  productTitle,
}: {
  handle: string;
  productTitle: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", handle],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("public_approved_reviews" as never)
        .select("id,rating,title,body,author_name,verified_purchase,created_at")
        .eq("product_handle", handle)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
    staleTime: 60_000,
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <section
      id="reviews"
      className="max-w-5xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)] scroll-mt-28"
    >
      <div className="text-center max-w-2xl mx-auto space-y-5 mb-14">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold">
          The Word
        </p>
        <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight text-balance">
          Reviews
        </h2>
        {reviews.length > 0 ? (
          <div className="flex items-center justify-center gap-3 text-sm text-[var(--studio-muted)]">
            <StarRow value={Math.round(avg)} />
            <span className="tabular-nums">
              {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <p className="text-[15px] leading-[1.85] text-[var(--studio-muted)] font-serif italic">
            No reviews yet — be the first to share your impressions of this piece.
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--studio-muted)]" />
        </div>
      )}

      {reviews.length > 0 && (
        <ul className="max-w-3xl mx-auto divide-y divide-[var(--studio-rule)] border-y border-[var(--studio-rule)]">
          {reviews.map((r) => (
            <li key={r.id} className="py-8 space-y-3">
              <div className="flex items-center gap-3">
                <StarRow value={r.rating} />
                {r.verified_purchase && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--studio-bronze)] font-semibold">
                    Verified Purchase
                  </span>
                )}
              </div>
              {r.title && (
                <p className="font-serif text-xl leading-tight">{r.title}</p>
              )}
              <p className="text-[15px] leading-[1.85] text-[var(--studio-muted)] whitespace-pre-line">
                {r.body}
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--studio-muted)]">
                {r.author_name} ·{" "}
                {new Date(r.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center mt-12">
        {!open ? (
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="h-14 px-10 bg-[var(--studio-ink)] text-[var(--studio-bg)] hover:bg-[var(--studio-bronze)] transition-colors duration-700 text-[11px] uppercase tracking-[0.3em] font-semibold rounded-none"
          >
            Write a Review
          </Button>
        ) : (
          <ReviewForm
            handle={handle}
            productTitle={productTitle}
            onClose={() => setOpen(false)}
            onSubmitted={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["product-reviews", handle] });
            }}
          />
        )}
      </div>
    </section>
  );
}

function StarRow({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= value
              ? "fill-[var(--studio-bronze)] text-[var(--studio-bronze)]"
              : "text-[var(--studio-rule)]"
          }`}
          strokeWidth={1.4}
        />
      ))}
    </div>
  );
}

function ReviewForm({
  handle,
  productTitle,
  onClose,
  onSubmitted,
}: {
  handle: string;
  productTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = reviewSchema.safeParse({
        rating,
        title: title || undefined,
        body,
        author_name: name,
        author_email: email,
        website,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
      }
      const { error } = await supabase.from("product_reviews").insert({
        product_handle: handle,
        rating: parsed.data.rating,
        title: parsed.data.title ?? null,
        body: parsed.data.body,
        author_name: parsed.data.author_name,
        author_email: parsed.data.author_email,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you — your review is pending moderation.");
      onSubmitted();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Could not submit review.";
      toast.error(msg);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
      className="w-full max-w-2xl space-y-6 border border-[var(--studio-rule)] p-8 bg-white"
    >
      <div className="space-y-2 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold">
          Your impressions
        </p>
        <p className="font-serif text-2xl">{productTitle}</p>
      </div>

      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`Rate ${n} of 5`}
            className="p-1"
          >
            <Star
              className={`h-7 w-7 ${
                n <= rating
                  ? "fill-[var(--studio-bronze)] text-[var(--studio-bronze)]"
                  : "text-[var(--studio-rule)]"
              }`}
              strokeWidth={1.4}
            />
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Headline (optional)"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-none"
        />
        <Textarea
          placeholder="Tell us what you think — fit, fabric, finish."
          value={body}
          maxLength={4000}
          rows={5}
          onChange={(e) => setBody(e.target.value)}
          required
          className="rounded-none"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Your name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-none"
          />
          <Input
            type="email"
            placeholder="Email (kept private)"
            value={email}
            maxLength={320}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-none"
          />
        </div>

        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--studio-muted)] text-center">
        Reviews are moderated for authenticity before publishing. Your email is never shown.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-12 px-6 rounded-none text-[11px] uppercase tracking-[0.25em]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submit.isPending}
          className="h-12 px-8 bg-[var(--studio-ink)] text-[var(--studio-bg)] hover:bg-[var(--studio-bronze)] transition-colors duration-700 text-[11px] uppercase tracking-[0.3em] font-semibold rounded-none"
        >
          {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
