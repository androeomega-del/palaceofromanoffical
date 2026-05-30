/**
 * Homepage route — thin shell.
 *
 * All page content is owned by <EditionLayout/>: it renders the site
 * header, the AI-curated edition body (or <DefaultEditionBody/> as
 * fallback), and the site footer. The root layout's default chrome is
 * suppressed on `/` so there are never duplicate headers/footers.
 */
import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { EditionLayout } from "@/components/editors-edition";
import heroImage from "@/assets/home-hero.jpg";
import summerHero from "@/assets/summer-bento-hero.jpg";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/men" });
  },
  head: () => ({
    meta: [
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "Shop curated luxury fashion from Gucci, Prada, Saint Laurent, Versace and 500+ designer houses. 100% authentic. Worldwide shipping." },
      { property: "og:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { property: "og:description", content: "Shop curated luxury fashion from 500+ designer houses. 100% authentic. Worldwide shipping." },
      { property: "og:url", content: "https://palaceofromanofficial.com/" },
      { property: "og:image", content: `https://palaceofromanofficial.com${heroImage}` },
      { name: "twitter:image", content: `https://palaceofromanofficial.com${heroImage}` },
    ],
    links: [
      { rel: "canonical", href: "https://palaceofromanofficial.com/men" },
      { rel: "preload", as: "image", href: summerHero, fetchPriority: "high" } as any,
    ],
  }),
  component: HomePage,
  errorComponent: HomeErrorComponent,
});


function HomePage() {
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
