/**
 * Best-Sellers — thin preset over <ProductRail/>.
 *
 * Dept-scoped (Women / Men) via `tag:${dept}` + Storefront `BEST_SELLING`
 * sort. Store-wide best-sellers on a dept-anchored surface would be
 * incoherent; scoping keeps both rails behaving the same under the global
 * dept toggle. Hides itself when the dept has no qualifying products.
 * See bestSellersQueryOptions in src/lib/rails/queries.ts.
 */
import { ProductRail } from "./product-rail";
import { bestSellersQueryOptions, type Dept } from "@/lib/rails/queries";

export function BestSellersRail({
  dept = "Women",
  ctaTo = "/collections/best-sellers",
}: {
  dept?: Dept;
  ctaTo?: string;
}) {
  return (
    <ProductRail
      queryOptions={bestSellersQueryOptions(dept)}
      eyebrow="Most Wanted"
      title="Best-sellers — the pieces our clients return for"
      ctaTo={ctaTo}
      ctaLabel="Shop Best-Sellers"
      surface="rail:best-sellers"
    />
  );
}
