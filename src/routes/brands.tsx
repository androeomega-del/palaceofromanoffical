import { createFileRoute, Link } from "@tanstack/react-router";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { img } from "@/lib/editorial-library";
import { VERIFIED_LIVE_BRANDS, vendorSlug } from "@/lib/nav-config";

const BRANDS_TITLE = "Brands — Palace of Roman";
const BRANDS_DESC =
  "Browse the luxury houses we carry — verified live collections, worldwide express shipping.";

export const Route = createFileRoute("/brands")({
  head: () => {
    const rh = routeHead({
      path: "/brands",
      title: BRANDS_TITLE,
      description: BRANDS_DESC,
      image: img(11),
    });
    return {
      meta: [{ title: BRANDS_TITLE }, { name: "description", content: BRANDS_DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: BRANDS_TITLE,
            description: BRANDS_DESC,
            url: absoluteUrl("/brands"),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Designer brands at Palace of Roman",
            numberOfItems: VERIFIED_LIVE_BRANDS.length,
            itemListElement: VERIFIED_LIVE_BRANDS.map((name, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Brand",
                name,
                url: absoluteUrl(`/collections/${vendorSlug(name)}`),
              },
            })),
          }),
        },
      ],
    };
  },
  component: BrandsPage,
});

function BrandsPage() {
  const brands = [...VERIFIED_LIVE_BRANDS].sort((a, b) => a.localeCompare(b));

  return (
    <div className="px-6 py-16">
      <div className="max-w-screen-2xl mx-auto">
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.25em] text-bronze-deep hover:text-ink"
        >
          ← Boutique
        </Link>
        <div className="mt-8 mb-20 max-w-[60ch]">
          <span className="text-xs uppercase tracking-[0.25em] text-bronze mb-4 block">
            Index
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-balance mb-6">
            The Houses
          </h1>
          <p className="text-sm text-bronze-deep leading-relaxed">
            The luxury houses we currently carry — each piece sourced through our
            network of authorised boutiques and distributors, shipped worldwide
            with tracked express delivery.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-1 border-t border-ink/10 pt-8">
          {brands.map((name) => (
            <li key={name}>
              <Link
                to="/collections/$handle"
                params={{ handle: vendorSlug(name) }}
                className="block border-b border-ink/5 py-3 text-sm text-ink hover:text-bronze transition-colors"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
