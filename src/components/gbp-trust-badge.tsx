import { MapPin } from "lucide-react";
import { GBP_BUSINESS_URL, GBP_REVIEW_COUNT } from "@/lib/social-proof";

/**
 * Verified Google Business Profile badge.
 *
 * Surfaces real third-party validation without inventing review text,
 * ratings, or counts. Links out to the live Google Business Profile so
 * Google's reviewers (and customers) can verify.
 *
 * Per project policy: this badge intentionally does NOT render a
 * star rating — we display only the verified review count and a
 * link to the live listing.
 */
export function GbpTrustBadge({
  variant = "inline",
  className = "",
}: {
  variant?: "inline" | "stacked";
  className?: string;
}) {
  if (GBP_REVIEW_COUNT < 1) return null;

  const count: number = GBP_REVIEW_COUNT;
  const label = `${count} verified review${count === 1 ? "" : "s"} on Google`;

  if (variant === "stacked") {
    return (
      <a
        href={GBP_BUSINESS_URL}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`Read our ${label}`}
        className={`group flex flex-col items-center text-center gap-1.5 ${className}`}
      >
        <MapPin className="w-4 h-4 text-bronze-deep" strokeWidth={1.25} />
        <p className="text-cta-md uppercase text-ink">Verified on Google</p>
        <p className="text-eyebrow text-muted-foreground normal-case tracking-normal group-hover:text-ink transition-colors">
          {label}
        </p>
      </a>
    );
  }

  return (
    <a
      href={GBP_BUSINESS_URL}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`Read our ${label}`}
      className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-ink transition-colors ${className}`}
    >
      <MapPin className="w-3 h-3 text-bronze-deep" strokeWidth={1.5} />
      <span className="font-medium">Verified on Google</span>
      <span className="opacity-60 normal-case tracking-normal">· {label}</span>
    </a>
  );
}
