/**
 * Homepage route — obsidian editorial shell.
 *
 * Renders <HomeStudioLayout/> (embedded variant) inside the real
 * <SiteHeader/> + <SiteFooter/> chrome so search, cart, account, and nav
 * stay fully functional. All SEO (meta-AB, OG, canonical, BreadcrumbList)
 * is preserved from the prior EditionLayout implementation.
 *
 * Legacy <EditionLayout/> is intentionally left in src/components/editors-edition/
 * (archived by unlinking — preserve-legacy rule).
 */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { HomeStudioLayout } from "@/components/home-studio/home-studio-layout";
import heroImage from "@/assets/home-hero.jpg";
import { readMetaAbBucket } from "@/lib/meta-ab.functions";
import { seoMetaForBucket, type MetaBucket } from "@/lib/meta-ab";
import { collectionRailQueryOptions } from "@/lib/rails/queries";

const HOME_TITLE = "Palace of Roman | Designer Evening & Resort Fashion";
const HOME_DESC =
  "Luxury fashion for after dark — silk, evening tailoring, swim, and resort pieces from Dolce & Gabbana, Saint Laurent, Versace and more. New, current-season, shipped worldwide from Europe.";


export const Route = createFileRoute("/")({
  loader: async ({ context }): Promise<{ abBucket: MetaBucket }> => {
    const { bucket } = await readMetaAbBucket();
    // Prime homepage collection rails + editorial-split lead images so the
    // first paint shows real product imagery instead of empty containers.
    // Fire-and-forget — never block SSR on Shopify latency.
    for (const handle of [
      "the-riviera-edit",
      "coastal-essentials",
      "womens-dresses",
      "new-arrivals",
      "suits",
      "mens-shirts",
    ]) {
      void context.queryClient.prefetchQuery(collectionRailQueryOptions(handle, 8));
    }

    return { abBucket: bucket };
  },
  head: ({ loaderData }) => {
    const bucket = (loaderData?.abBucket ?? 0) as MetaBucket;
    const pageUrl = "https://palaceofromanofficial.com/";
    const { canonical, robots } = seoMetaForBucket(bucket, pageUrl);
    const meta: Array<Record<string, string>> = [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:url", content: pageUrl },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `https://palaceofromanofficial.com${heroImage}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESC },
      { name: "twitter:image", content: `https://palaceofromanofficial.com${heroImage}` },
    ];
    if (robots) meta.push({ name: "robots", content: robots });
    const links: Array<Record<string, string>> = [
      { rel: "canonical", href: canonical },
      { rel: "preload", as: "image", href: heroImage, fetchpriority: "high" },
    ];
    return {
      meta,
      links: links as any,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://palaceofromanofficial.com/" },
            ],
          }),
        },
      ],
    };
  },
  component: HomePage,
  errorComponent: HomeErrorComponent,
});


function HomePage() {
  // Meta A/B intentionally bypassed on `/` — title/description are locked
  // to the niche-repositioning copy. Bucket still loaded for parity with
  // other surfaces (canonical/robots resolution).
  return <HomeStudioLayout variant="embedded" />;
}


function HomeErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[home] runtime error:", error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
          Something interrupted the boutique
        </p>
        <h2 className="text-4xl font-serif mb-6">We couldn't load the homepage</h2>
        <p className="text-sm text-muted-foreground mb-10">
          A passing glitch — please try again, or browse the boutique while we tidy up.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Try Again
          </button>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:text-ink transition-colors"
          >
            Browse the Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
