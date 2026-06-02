import { Star } from "lucide-react";
import { YELP_BUSINESS_URL, YELP_REVIEW_COUNT } from "@/lib/social-proof";

/**
 * Verified-on-Yelp badge.
 *
 * Surfaces a single piece of real third-party validation without
 * inventing review text, ratings, or counts. Links out to the live
 * Yelp listing so Google's reviewers (and customers) can verify.
 *
 * Per project policy: this badge intentionally does NOT render a
 * star rating — we display only the verified review count and a
 * link to the live listing. Stars are decorative-only here.
 */
export function YelpTrustBadge({
  variant = "inline",
  className = "",
}: {
  variant?: "inline" | "stacked";
  className?: string;
}) {
  if (YELP_REVIEW_COUNT < 1) return null;

  const label = `${YELP_REVIEW_COUNT} verified review${YELP_REVIEW_COUNT === 1 ? "" : "s"} on Yelp`;

  if (variant === "stacked") {
    return (
      <a
        href={YELP_BUSINESS_URL}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`Read our ${label}`}
        className={`group flex flex-col items-center text-center gap-1.5 ${className}`}
      >
        <Star className="w-4 h-4 text-bronze-deep" strokeWidth={1.25} fill="currentColor" />
        <p className="text-cta-md uppercase text-ink">Verified on Yelp</p>
        <p className="text-eyebrow text-muted-foreground normal-case tracking-normal group-hover:text-ink transition-colors">
          {label}
        </p>
      </a>
    );
  }

  return (
    <a
      href={YELP_BUSINESS_URL}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`Read our ${label}`}
      className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-ink transition-colors ${className}`}
    >
      <Star className="w-3 h-3 text-bronze-deep" strokeWidth={1.5} fill="currentColor" />
      <span className="font-medium">Verified on Yelp</span>
      <span className="opacity-60 normal-case tracking-normal">· {label}</span>
    </a>
  );
}
