// Renders the AI-generated 48h homepage edition: themed hero + three
// curated product rails. Additive — sits above the existing handcrafted
// homepage. If the layout is missing or product fetches fail, the whole
// slot renders nothing and the existing homepage carries the page.

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { getActiveHomepageLayout } from "@/lib/homepage-layout.functions";
import { fetchProductByHandle, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import type { HomepageLayout } from "@/lib/homepage-layout-schema";

const FONT_PAIRS: Record<string, { heading: string; body: string }> = {
  "cormorant-karla": {
    heading: "'Cormorant Garamond', 'Times New Roman', serif",
    body: "'Karla', system-ui, sans-serif",
  },
  "instrument-serif-work-sans": {
    heading: "'Instrument Serif', 'Times New Roman', serif",
    body: "'Work Sans', system-ui, sans-serif",
  },
  "dm-serif-display-fira-sans": {
    heading: "'DM Serif Display', 'Times New Roman', serif",
    body: "'Fira Sans', system-ui, sans-serif",
  },
  "libre-baskerville-ibm-plex": {
    heading: "'Libre Baskerville', 'Times New Roman', serif",
    body: "'IBM Plex Sans', system-ui, sans-serif",
  },
  "space-grotesk-dm-sans": {
    heading: "'Space Grotesk', system-ui, sans-serif",
    body: "'DM Sans', system-ui, sans-serif",
  },
  "syne-plus-jakarta": {
    heading: "'Syne', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
};

function useEditionProducts(handles: string[]) {
  return useQuery({
    queryKey: ["edition-products", handles.join(",")],
    queryFn: async (): Promise<ShopifyProduct[]> => {
      const results = await Promise.allSettled(handles.map((h) => fetchProductByHandle(h)));
      const out: ShopifyProduct[] = [];
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) out.push({ node: r.value });
      }
      return out;
    },
    staleTime: 5 * 60 * 1000,
    enabled: handles.length > 0,
  });
}

function EditionRail({
  title,
  blurb,
  handles,
  accent,
}: {
  title: string;
  blurb: string;
  handles: string[];
  accent: string;
}) {
  const { data: products, isLoading } = useEditionProducts(handles);
  if (!isLoading && (!products || products.length < 2)) return null;
  return (
    <section className="py-16 md:py-24 border-t border-current/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <div
              className="text-[10px] uppercase tracking-[0.35em] mb-3 opacity-80"
              style={{ color: accent }}
            >
              The Edition
            </div>
            <h3 className="text-3xl md:text-4xl font-[family-name:var(--edition-heading)] leading-tight">
              {title}
            </h3>
            <p className="text-sm mt-3 opacity-80 max-w-prose">{blurb}</p>
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-current/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products!.slice(0, 4).map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EditionInner({ layout, generatedAt }: { layout: HomepageLayout; generatedAt: string }) {
  const fonts = FONT_PAIRS[layout.accents.font_pair] ?? FONT_PAIRS["cormorant-karla"];
  const editionDate = useMemo(() => {
    try {
      return new Date(generatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [generatedAt]);

  const textureStyle: React.CSSProperties =
    layout.accents.texture === "grain"
      ? {
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }
      : layout.accents.texture === "gloss"
        ? {
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.06) 100%)",
          }
        : {};

  return (
    <div
      data-edition={layout.edition_name}
      style={
        {
          backgroundColor: layout.accents.bg,
          color: layout.accents.fg,
          fontFamily: fonts.body,
          ["--edition-heading" as string]: fonts.heading,
          ["--edition-accent" as string]: layout.accents.accent,
        } as React.CSSProperties
      }
    >
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={textureStyle} aria-hidden />
        <div className="container mx-auto px-4 md:px-8 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            <div
              className="text-[10px] uppercase tracking-[0.4em] mb-6"
              style={{ color: layout.accents.accent }}
            >
              {layout.hero.eyebrow} {editionDate ? `· ${editionDate}` : ""}
            </div>
            <h2
              className="text-5xl md:text-7xl lg:text-8xl leading-[0.95] font-normal"
              style={{ fontFamily: fonts.heading }}
            >
              {layout.hero.headline}
            </h2>
            <p className="text-base md:text-lg mt-8 opacity-90 max-w-2xl leading-relaxed">
              {layout.hero.subcopy}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center px-8 py-4 text-[11px] uppercase tracking-[0.3em] border transition-colors"
                style={{
                  borderColor: layout.accents.accent,
                  color: layout.accents.accent,
                }}
              >
                {layout.hero.cta}
              </Link>
              <span
                className="inline-flex items-center px-3 py-4 text-[10px] uppercase tracking-[0.3em] opacity-70"
              >
                Edition · {layout.edition_name}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Rails */}
      {layout.sections.map((s) =>
        s.handles.length >= 2 ? (
          <EditionRail
            key={s.id}
            title={s.title}
            blurb={s.blurb}
            handles={s.handles}
            accent={layout.accents.accent}
          />
        ) : null,
      )}
    </div>
  );
}

export function DynamicEditionSlot() {
  const { data } = useQuery({
    queryKey: ["homepage-layout"],
    queryFn: () => getActiveHomepageLayout(),
    staleTime: 5 * 60 * 1000,
  });
  if (!data) return null;
  return <EditionInner layout={data.layout} generatedAt={data.generated_at} />;
}
