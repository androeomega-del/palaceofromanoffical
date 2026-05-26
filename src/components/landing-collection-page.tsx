import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

export type LandingFAQ = { q: string; a: string };
export type LandingRelatedGuide = { to: string; label: string };

export function LandingCollectionPage({
  eyebrow,
  h1,
  intro,
  body,
  shopifyQuery,
  faqs,
  relatedGuides,
}: {
  eyebrow: string;
  h1: string;
  intro: string;
  body: React.ReactNode;
  shopifyQuery: string;
  faqs: LandingFAQ[];
  relatedGuides: LandingRelatedGuide[];
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["landing", shopifyQuery],
    queryFn: async () =>
      (await fetchProducts({ first: 12, query: shopifyQuery, sortKey: "BEST_SELLING" })) as ShopifyProduct[],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <main className="bg-canvas text-ink">
      {/* Hero / H1 */}
      <section className="px-6 pt-16 md:pt-24 pb-12 text-center max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">{eyebrow}</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05]">{h1}</h1>
        <p className="mt-6 text-base md:text-lg text-ink/70 leading-relaxed">{intro}</p>
      </section>

      {/* Editorial body */}
      <section className="px-6 pb-16 max-w-3xl mx-auto font-serif text-[17px] leading-[1.8] [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:mb-5 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-bronze">
        {body}
      </section>

      {/* Product grid */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="border-t border-ink/10 pt-10 mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl md:text-3xl">The Edit</h2>
          <Link
            to="/shop"
            className="text-[10px] uppercase tracking-[0.3em] border-b border-ink/30 pb-1 hover:border-ink"
          >
            View all →
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-ink/5 animate-pulse" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-ink/60">
            No pieces from this edit are in stock right now. Browse the{" "}
            <Link to="/shop" className="underline underline-offset-4">
              full atelier
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(data ?? []).map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <div className="border-t border-ink/10 pt-10 mb-8">
          <h2 className="font-serif text-2xl md:text-3xl">Frequently Asked</h2>
        </div>
        <dl className="space-y-6">
          {faqs.map((f) => (
            <div key={f.q} className="border-b border-ink/10 pb-6">
              <dt className="font-serif text-lg mb-2">{f.q}</dt>
              <dd className="text-sm text-ink/75 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related guides */}
      {relatedGuides.length > 0 ? (
        <section className="px-6 pb-24 max-w-3xl mx-auto">
          <div className="border-t border-ink/10 pt-10 mb-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">From the Journal</p>
            <h2 className="font-serif text-2xl md:text-3xl">Related reading</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {relatedGuides.map((g) => (
              <li key={g.to}>
                <Link
                  to={g.to}
                  className="block border border-ink/15 px-4 py-4 text-sm hover:border-ink hover:bg-ink/5 transition-colors"
                >
                  <span className="font-serif">{g.label}</span>
                  <span className="ml-2 text-bronze">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

// JSON-LD helpers shared by the four landing routes.
export function faqJsonLd(faqs: LandingFAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(siteUrl: string, path: string, label: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${siteUrl}/collections` },
      { "@type": "ListItem", position: 3, name: label, item: `${siteUrl}${path}` },
    ],
  };
}
