import { Link } from "@tanstack/react-router";

/**
 * Shared loading / error / empty states for "Shop the Edit" product grids.
 * Keeps the editorial pages visually consistent and ensures every grid
 * gracefully handles a failed Shopify request (not just an empty result).
 */

export function ShopTheEditSkeleton({
  count = 8,
  columns = "md:grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div
      className={`flex gap-x-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none md:grid ${columns} md:gap-x-6 md:gap-y-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 basis-[72%] snap-start md:basis-auto md:shrink">
          <div className="w-full aspect-[3/4] por-shimmer mb-5" />
          <div className="h-2 w-16 por-shimmer mb-2" />
          <div className="h-3 w-3/4 por-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function ShopTheEditError({
  onRetry,
  isRetrying = false,
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="py-14 text-center border border-ink/10 bg-canvas">
      <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
        The edit is momentarily unavailable
      </p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
        We couldn't reach our atelier's stock service. Please try again in a moment.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="px-7 py-3 bg-ink text-canvas text-[10px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors disabled:opacity-60"
          >
            {isRetrying ? "Reconnecting…" : "Try again"}
          </button>
        )}
        <Link
          to="/collections/$handle"
          params={{ handle: "all" }}
          className="px-7 py-3 border border-ink text-[10px] uppercase tracking-[0.3em] hover:bg-ink hover:text-canvas transition-colors"
        >
          Browse the boutique
        </Link>
      </div>
    </div>
  );
}

export function ShopTheEditEmpty({
  message = "This edit is currently being restocked from our authorised distributors.",
  ctaLabel = "Browse the boutique",
  ctaHandle = "all",
}: {
  message?: string;
  ctaLabel?: string;
  ctaHandle?: string;
}) {
  return (
    <div className="py-14 text-center border border-ink/10 bg-canvas">
      <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
        Between deliveries
      </p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">{message}</p>
      <Link
        to="/collections/$handle"
        params={{ handle: ctaHandle }}
        className="text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}
