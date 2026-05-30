/**
 * Brands of the Moment — trio of brand quick-links.
 *
 * Farfetch reference: "Brands of the moment" — three brand tiles (vendor
 * name + minimal image). Our version uses the editorial-library tile image
 * keyed off the vendor name (stable across renders) and routes to the
 * existing /brand/$vendor page. Vendors are passed as props so each surface
 * (Women dept page vs Men dept page vs trend page) can curate its own trio.
 */
import { Link } from "@tanstack/react-router";
import { vendorSlug } from "@/lib/nav-config";
import { imgForKey } from "@/lib/editorial-library";

export type BrandTile = {
  vendor: string;
  /** Optional one-line positioning note shown under the vendor name. */
  note?: string;
  /** Override the editorial-library image. Leave undefined for default. */
  imageKey?: string;
};

export function BrandsOfTheMoment({
  eyebrow = "Brands of the Moment",
  brands,
}: {
  eyebrow?: string;
  brands: BrandTile[];
}) {
  if (!brands || brands.length === 0) return null;
  return (
    <section className="py-10 md:py-16 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <header className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-2xl md:text-3xl tracking-[0.04em] text-ink">
            {eyebrow}
          </h2>
          <Link
            to="/brands"
            className="hidden md:inline text-[11px] uppercase tracking-[0.3em] text-bronze hover:text-ink transition-colors"
          >
            All maisons →
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
          {brands.map((b) => (
            <Link
              key={b.vendor}
              to="/brand/$vendor"
              params={{ vendor: vendorSlug(b.vendor) }}
              className="group relative block aspect-[4/5] overflow-hidden bg-ink/5"
            >
              <img
                src={imgForKey(b.imageKey ?? `brand-${b.vendor}`)}
                alt={b.vendor}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-serif text-canvas text-2xl md:text-3xl tracking-[0.04em] leading-tight">
                  {b.vendor}
                </p>
                {b.note && (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-canvas/80">
                    {b.note}
                  </p>
                )}
                <span className="mt-3 inline-block text-[10px] uppercase tracking-[0.3em] text-canvas border-b border-bronze pb-0.5">
                  Shop the Maison
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
