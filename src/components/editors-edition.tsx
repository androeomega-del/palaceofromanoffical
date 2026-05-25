/**
 * EditorsEdition — renders the active AI-curated homepage edition stored in
 * `homepage_daily_layout`. Additive band only; never replaces hardcoded
 * homepage content. Bails silently (returns null) on any failure so it can
 * never break the storefront.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { homepageLayoutSchema, type HomepageLayout } from "@/lib/homepage-layout-schema";
import { img } from "@/lib/editorial-library";
import { fetchProductByHandle, type ShopifyProductNode } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { EditorialHotspots } from "@/components/editorial-hotspots";

function resolveImage(src: string): string {
  if (src.startsWith("library:")) {
    const n = parseInt(src.slice("library:".length), 10);
    if (Number.isFinite(n)) return img(n);
  }
  return src;
}

async function loadActiveEdition(): Promise<HomepageLayout | null> {
  const { data, error } = await supabase
    .from("homepage_daily_layout")
    .select("layout_json")
    .eq("is_active", true)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = homepageLayoutSchema.safeParse(data.layout_json);
  if (!parsed.success) return null;
  // Never expose the AI cold-start fallback publicly — that's an admin signal.
  if (parsed.data.source === "cold_start_fallback") return null;
  return parsed.data;
}

export function EditorsEdition() {
  const editionQ = useQuery({
    queryKey: ["editors-edition-active"],
    queryFn: loadActiveEdition,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const layout = editionQ.data;
  if (!layout || layout.blocks.length === 0) return null;

  return (
    <section aria-label="Editor's Edition" className="bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <header className="mb-8 md:mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">
              The Current Edition
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
              Editor's Selection
            </h2>
          </div>
        </header>
        <div className="space-y-12 md:space-y-16">
          {layout.blocks.map((block) => {
            try {
              if (block.type === "hero") {
                return <EditionHero key={block.id} block={block} />;
              }
              if (block.type === "product_rail") {
                return <EditionRail key={block.id} block={block} />;
              }
              if (block.type === "editorial_banner") {
                return <EditionBanner key={block.id} block={block} />;
              }
              return null;
            } catch {
              return null;
            }
          })}
        </div>
      </div>
    </section>
  );
}

// ── Block: hero ────────────────────────────────────────────────────────────
function EditionHero({ block }: { block: Extract<HomepageLayout["blocks"][number], { type: "hero" }> }) {
  return (
    <div className="relative overflow-hidden border border-ink/10">
      <img
        src={resolveImage(block.image)}
        alt={block.alt}
        className="w-full h-[60vh] md:h-[70vh] object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 text-canvas">
        {block.heading && (
          <h3 className="font-serif text-3xl md:text-5xl max-w-2xl leading-tight">
            {block.heading}
          </h3>
        )}
        {block.subheading && (
          <p className="mt-3 max-w-xl text-sm md:text-base text-canvas/85">
            {block.subheading}
          </p>
        )}
        {block.cta && (
          <Link
            to={block.cta.href}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-canvas text-ink text-[11px] uppercase tracking-[0.25em] hover:bg-bronze hover:text-canvas transition-colors"
          >
            {block.cta.label} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Block: product rail ────────────────────────────────────────────────────
function EditionRail({ block }: { block: Extract<HomepageLayout["blocks"][number], { type: "product_rail" }> }) {
  const handles = block.productHandles ?? [];
  const railQ = useQuery({
    queryKey: ["editors-edition-rail", block.id, handles],
    enabled: handles.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const results = await Promise.all(
        handles.map((h) => fetchProductByHandle(h).catch(() => null)),
      );
      return results.filter((p): p is ShopifyProductNode => Boolean(p));
    },
  });

  if (handles.length === 0) return null;
  if (railQ.isLoading) {
    return (
      <div>
        <RailHeader heading={block.heading} subheading={block.subheading} />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[260px] aspect-[3/4] bg-ink/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  const products = railQ.data ?? [];
  if (products.length === 0) return null;
  return (
    <div>
      <RailHeader heading={block.heading} subheading={block.subheading} />
      <div className="flex gap-5 overflow-x-auto pb-2 -mx-6 md:-mx-10 px-6 md:px-10 snap-x snap-mandatory">
        {products.map((node) => (
          <div key={node.id} className="flex-shrink-0 w-[260px] md:w-[300px] snap-start">
            <ProductCard product={{ node }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RailHeader({ heading, subheading }: { heading?: string; subheading?: string }) {
  if (!heading && !subheading) return null;
  return (
    <div className="mb-5 md:mb-6">
      {heading && (
        <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
          {heading}
        </h3>
      )}
      {subheading && (
        <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xl">
          {subheading}
        </p>
      )}
    </div>
  );
}

// ── Block: editorial banner ────────────────────────────────────────────────
function EditionBanner({ block }: { block: Extract<HomepageLayout["blocks"][number], { type: "editorial_banner" }> }) {
  const src = resolveImage(block.image);
  const aspect = block.aspect ?? "16/9";
  const hasHotspots = (block.hotspots ?? []).length > 0;
  return (
    <div>
      {hasHotspots ? (
        <EditorialHotspots
          src={src}
          alt={block.alt}
          hotspots={block.hotspots}
          aspect={aspect}
        />
      ) : (
        <div className="relative overflow-hidden border border-ink/10" style={{ aspectRatio: aspect }}>
          <img src={src} alt={block.alt} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      {(block.heading || block.subheading || block.cta) && (
        <div className="mt-5 md:mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {block.heading && (
              <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
                {block.heading}
              </h3>
            )}
            {block.subheading && (
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xl">
                {block.subheading}
              </p>
            )}
          </div>
          {block.cta && (
            <Link
              to={block.cta.href}
              className="text-[11px] uppercase tracking-[0.25em] text-ink border-b border-bronze/40 hover:text-bronze hover:border-bronze pb-0.5 transition-colors"
            >
              {block.cta.label} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
