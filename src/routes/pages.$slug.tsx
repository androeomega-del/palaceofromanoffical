// AI-generated dynamic landing page. Spawned by the bi-daily generator
// from one of two signals (search spike or conversion drop). Linked only
// from homepage tiles / campaigns — NEVER from the main nav.
//
// If the slug isn't an active landing page, redirect to /shop so visitors
// from a stale link still land somewhere useful (zero-downtime rule).

import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLandingPageBySlug, type ActiveLandingPage } from "@/lib/landing-page.functions";
import { fetchProductByHandle, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { routeHead } from "@/lib/seo";

const FONT_PAIRS: Record<string, { heading: string; body: string }> = {
  "cormorant-karla": { heading: "'Cormorant Garamond', serif", body: "'Karla', system-ui, sans-serif" },
  "instrument-serif-work-sans": { heading: "'Instrument Serif', serif", body: "'Work Sans', system-ui, sans-serif" },
  "dm-serif-display-fira-sans": { heading: "'DM Serif Display', serif", body: "'Fira Sans', system-ui, sans-serif" },
  "libre-baskerville-ibm-plex": { heading: "'Libre Baskerville', serif", body: "'IBM Plex Sans', system-ui, sans-serif" },
  "space-grotesk-dm-sans": { heading: "'Space Grotesk', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  "syne-plus-jakarta": { heading: "'Syne', system-ui, sans-serif", body: "'Plus Jakarta Sans', system-ui, sans-serif" },
};

export const Route = createFileRoute("/pages/$slug")({
  loader: async ({ params }) => {
    const data = await getLandingPageBySlug({ data: { slug: params.slug } });
    if (!data) {
      // No active landing page for this slug — fall back to the shop so a
      // stale email / ad link never 404s.
      throw redirect({ to: "/shop", search: {} as never });
    }
    return data;
  },
  head: ({ loaderData }) => {
    const lp = loaderData as ActiveLandingPage;
    if (!lp) return { meta: [] };
    const rh = routeHead({
      path: `/pages/${lp.slug}`,
      title: `${lp.blueprint.page_title} — Palace of Roman`,
      description: lp.blueprint.meta_description,
    });
    return {
      meta: [
        { title: `${lp.blueprint.page_title} — Palace of Roman` },
        { name: "description", content: lp.blueprint.meta_description },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: LandingPage,
  notFoundComponent: () => null,
  errorComponent: () => null,
});

function Rail({ title, blurb, handles, accent }: { title: string; blurb: string; handles: string[]; accent: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["landing-rail", handles.join(",")],
    queryFn: async (): Promise<ShopifyProduct[]> => {
      const results = await Promise.allSettled(handles.map((h) => fetchProductByHandle(h)));
      const out: ShopifyProduct[] = [];
      for (const r of results) if (r.status === "fulfilled" && r.value) out.push({ node: r.value });
      return out;
    },
    staleTime: 5 * 60 * 1000,
    enabled: handles.length > 0,
  });

  if (!isLoading && (!data || data.length < 2)) return null;

  return (
    <section className="py-16 md:py-24 border-t border-current/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-2xl mb-10">
          <div className="text-[10px] uppercase tracking-[0.35em] mb-3 opacity-80" style={{ color: accent }}>
            The Edit
          </div>
          <h3 className="text-3xl md:text-4xl font-[family-name:var(--landing-heading)] leading-tight">{title}</h3>
          <p className="text-sm mt-3 opacity-80 max-w-prose">{blurb}</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-current/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {data!.slice(0, 8).map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LandingPage() {
  const lp = Route.useLoaderData() as ActiveLandingPage;
  if (!lp) return null;
  const fonts = FONT_PAIRS[lp.blueprint.accents.font_pair] ?? FONT_PAIRS["cormorant-karla"];
  const dateStr = useMemo(() => {
    try {
      return new Date(lp.generated_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
    } catch { return ""; }
  }, [lp.generated_at]);

  return (
    <div
      style={{
        backgroundColor: lp.blueprint.accents.bg,
        color: lp.blueprint.accents.fg,
        fontFamily: fonts.body,
        ["--landing-heading" as string]: fonts.heading,
      } as React.CSSProperties}
    >
      <section className="container mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.4em] mb-6" style={{ color: lp.blueprint.accents.accent }}>
            {lp.blueprint.hero.eyebrow}{dateStr ? ` · ${dateStr}` : ""}
          </div>
          <h1
            className="text-5xl md:text-7xl lg:text-8xl leading-[0.95] font-normal"
            style={{ fontFamily: fonts.heading }}
          >
            {lp.blueprint.hero.headline}
          </h1>
          <p className="text-base md:text-lg mt-8 opacity-90 max-w-2xl leading-relaxed">
            {lp.blueprint.hero.subcopy}
          </p>
          <div className="mt-10">
            <Link
              to="/shop"
              className="inline-flex items-center px-8 py-4 text-[11px] uppercase tracking-[0.3em] border transition-colors"
              style={{ borderColor: lp.blueprint.accents.accent, color: lp.blueprint.accents.accent }}
            >
              {lp.blueprint.hero.cta}
            </Link>
          </div>
        </div>
      </section>

      {lp.blueprint.sections.map((s) => (
        <Rail key={s.id} title={s.title} blurb={s.blurb} handles={s.handles} accent={lp.blueprint.accents.accent} />
      ))}
    </div>
  );
}
