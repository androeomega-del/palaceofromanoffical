/**
 * Homepage route — thin shell.
 *
 * All page content is owned by <EditionLayout/>: it renders the site
 * header, the AI-curated edition body (or <DefaultEditionBody/> as
 * fallback), and the site footer. The root layout's default chrome is
 * suppressed on `/` so there are never duplicate headers/footers.
 */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { EditionLayout } from "@/components/editors-edition";
import heroImage from "@/assets/home-hero.jpg";
import summerHero from "@/assets/summer-bento-hero.jpg";
import { readMetaAbBucket } from "@/lib/meta-ab.functions";
import { pickHomeMeta, seoMetaForBucket, type MetaBucket } from "@/lib/meta-ab";
import { useMetaAb } from "@/hooks/use-meta-ab";

export const Route = createFileRoute("/")({
  loader: async (): Promise<{ abBucket: MetaBucket }> => {
    const { bucket } = await readMetaAbBucket();
    return { abBucket: bucket };
  },
  head: ({ loaderData }) => {
    const bucket = (loaderData?.abBucket ?? 0) as MetaBucket;
    const v = pickHomeMeta(bucket);
    const pageUrl = "https://palaceofromanofficial.com/";
    const { canonical, robots } = seoMetaForBucket(bucket, pageUrl);
    const meta: Array<Record<string, string>> = [
      { title: v.title },
      { name: "description", content: v.description },
      { property: "og:title", content: v.title },
      { property: "og:description", content: v.description },
      { property: "og:url", content: pageUrl },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `https://palaceofromanofficial.com${heroImage}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `https://palaceofromanofficial.com${heroImage}` },
    ];
    if (robots) meta.push({ name: "robots", content: robots });
    return {
      meta,
      links: [
        { rel: "canonical", href: canonical },
        { rel: "preload", as: "image", href: summerHero, fetchPriority: "high" } as any,
      ],
    };
  },
  component: HomePage,
  errorComponent: HomeErrorComponent,
});


function HomePage() {
  const { abBucket } = Route.useLoaderData();
  useMetaAb("home", abBucket, { a: pickHomeMeta(0), b: pickHomeMeta(1) });
  return <EditionLayout />;
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
        <h1 className="text-4xl font-serif mb-6">We couldn't load the homepage</h1>
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
