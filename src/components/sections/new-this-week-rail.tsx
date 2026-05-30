/**
 * New This Week — thin preset over <ProductRail/>.
 *
 * Farfetch reference: "New in: handpicked daily from the world's best brands
 * and boutiques" — four cards with a "New Season" eyebrow and a Shop Now CTA.
 * Data: newest-first Shopify products scoped to the dept (Women / Men) via
 * tag query. See newThisWeekQueryOptions in src/lib/rails/queries.ts.
 */
import { ProductRail } from "./product-rail";
import { newThisWeekQueryOptions, type Dept } from "@/lib/rails/queries";

export function NewThisWeekRail({
  dept = "Women",
  ctaTo = "/collections/new-arrivals",
}: {
  dept?: Dept;
  ctaTo?: string;
}) {
  return (
    <ProductRail
      queryOptions={newThisWeekQueryOptions(dept)}
      eyebrow="New Season"
      title="New this week — handpicked from the maisons"
      ctaTo={ctaTo}
      ctaLabel="Shop New In"
    />
  );
}
