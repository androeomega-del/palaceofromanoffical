import { Truck, RotateCcw, Headset } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { YelpTrustBadge } from "@/components/yelp-trust-badge";

/**
 * Above-the-fold transparency bar (homepage).
 *
 * Surfaces — in one glance, before the hero scrolls — the four
 * trust signals Google Merchant Center reviewers look for when
 * evaluating a luxury store for the Misrepresentation policy:
 *
 *   1. A clear shipping cutoff (when does my order ship?)
 *   2. The carriers used (DHL Express / FedEx / UPS)
 *   3. The returns window, stated verbatim to match Merchant Center
 *   4. A direct support email + response window
 *   5. A real third-party validation link (Yelp, 3 verified reviews)
 *
 * Copy here MUST match the Merchant Center business-info fields and
 * the /shipping-returns page verbatim — any drift re-triggers the
 * misrepresentation review.
 */
export function HomepageShippingTrustBar() {
  return (
    <section
      aria-label="Shipping, returns and customer support"
      className="bg-canvas-raised border-b border-ink/10"
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-4 md:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 text-[12px] md:text-[11px]">
          {/* Shipping — actual policy */}
          <div className="flex items-start md:items-center gap-2.5 text-ink/80">
            <Truck className="w-4 h-4 text-bronze-deep shrink-0 mt-0.5 md:mt-0" strokeWidth={1.5} />
            <p className="leading-snug">
              <span className="font-medium text-ink">Dispatched in 24–48h</span>{" "}
              <span className="text-muted-foreground">— 3 business days within the EU, 5–7 business days worldwide via</span>{" "}
              <span className="font-medium text-ink">DHL Express · FedEx · UPS</span>
            </p>
          </div>

          {/* Returns */}
          <Link
            to="/shipping-returns"
            className="flex items-start md:items-center gap-2.5 text-ink/80 hover:text-ink transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-bronze-deep shrink-0 mt-0.5 md:mt-0" strokeWidth={1.5} />
            <p className="leading-snug">
              <span className="font-medium">14-day returns</span>{" "}
              <span className="text-muted-foreground">on unworn items with original tags</span>
            </p>
          </Link>

          {/* Support */}
          <a
            href="mailto:support@palaceofromanofficial.com"
            className="flex items-start md:items-center gap-2.5 text-ink/80 hover:text-ink transition-colors"
          >
            <Headset className="w-4 h-4 text-bronze-deep shrink-0 mt-0.5 md:mt-0" strokeWidth={1.5} />
            <p className="leading-snug">
              <span className="font-medium">support@palaceofromanofficial.com</span>{" "}
              <span className="text-muted-foreground">— replies within 24h, Mon–Sat</span>
            </p>
          </a>

          {/* Yelp validation */}
          <div className="md:border-l md:border-ink/10 md:pl-6">
            <YelpTrustBadge />
          </div>
        </div>
      </div>
    </section>
  );
}
