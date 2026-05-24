import { img } from "@/lib/editorial-library";
import type { HomepageLayout } from "@/lib/homepage-layout-schema";

/**
 * In-admin visual preview of a homepage layout JSON.
 *
 * Renders a stylized, structural representation of every block in the
 * edition (hero, product_rail, editorial_banner) so the curator can
 * eyeball composition, copy, image choice, hotspot count, and product
 * handle list BEFORE clicking "Re-activate" or "Force publish latest".
 *
 * It deliberately does NOT call Shopify — product rails are rendered as
 * handle tiles. This keeps the preview synchronous, deterministic, and
 * cheap, and matches what's actually stored in `layout_json`.
 */

function resolveImg(src: string | undefined): string | null {
  if (!src) return null;
  const lib = src.match(/^library:(\d+)$/);
  if (lib) return img(Number(lib[1]));
  if (/^https?:\/\//.test(src)) return src;
  const num = src.match(/^(\d+)$/);
  if (num) return img(Number(num[1]));
  return null;
}

export function HomepageLayoutPreview({ layout }: { layout: HomepageLayout | null }) {
  if (!layout || !layout.blocks?.length) {
    return (
      <div className="rounded border border-dashed border-border bg-muted/40 p-6 text-xs text-muted-foreground text-center">
        No blocks to preview.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {layout.blocks.map((block, i) => {
        if (block.type === "hero") {
          const src = resolveImg(block.image);
          return (
            <div
              key={block.id ?? i}
              className="relative overflow-hidden rounded border border-border bg-black/5"
              style={{ aspectRatio: "21/9" }}
            >
              {src ? (
                <img
                  src={src}
                  alt={block.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] uppercase tracking-[0.3em] opacity-80">
                  Hero · block {i + 1}
                </span>
                {block.heading ? (
                  <h3 className="font-serif text-xl md:text-2xl mt-1 max-w-xl">
                    {block.heading}
                  </h3>
                ) : null}
                {block.subheading ? (
                  <p className="text-xs md:text-sm opacity-90 max-w-xl mt-1">
                    {block.subheading}
                  </p>
                ) : null}
                {block.cta ? (
                  <span className="mt-3 inline-block self-start text-[11px] uppercase tracking-[0.25em] border border-white/70 px-3 py-1.5">
                    {block.cta.label} → {block.cta.href}
                  </span>
                ) : null}
              </div>
            </div>
          );
        }

        if (block.type === "editorial_banner") {
          const src = resolveImg(block.image);
          return (
            <div
              key={block.id ?? i}
              className="relative overflow-hidden rounded border border-border bg-black/5"
              style={{ aspectRatio: block.aspect?.replace("/", " / ") ?? "16/9" }}
            >
              {src ? (
                <img
                  src={src}
                  alt={block.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <span className="text-[10px] uppercase tracking-[0.3em] opacity-80 self-start">
                  Editorial · {block.hotspots?.length ?? 0} hotspot
                  {(block.hotspots?.length ?? 0) === 1 ? "" : "s"}
                </span>
                <div>
                  {block.heading ? (
                    <h3 className="font-serif text-lg md:text-xl max-w-xl">
                      {block.heading}
                    </h3>
                  ) : null}
                  {block.subheading ? (
                    <p className="text-xs opacity-90 max-w-xl mt-1">{block.subheading}</p>
                  ) : null}
                  {block.cta ? (
                    <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.25em] border border-white/70 px-3 py-1.5">
                      {block.cta.label} → {block.cta.href}
                    </span>
                  ) : null}
                </div>
              </div>
              {(block.hotspots ?? []).map((h, idx) => (
                <span
                  key={idx}
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/50 shadow"
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  title={`${h.label ?? ""} ${h.sublabel ?? ""} → /product/${h.handle}`}
                />
              ))}
            </div>
          );
        }

        // product_rail
        const handles = block.productHandles ?? [];
        return (
          <div
            key={block.id ?? i}
            className="rounded border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Product rail · {handles.length} item{handles.length === 1 ? "" : "s"}
                </span>
                {block.heading ? (
                  <h3 className="font-serif text-lg mt-0.5">{block.heading}</h3>
                ) : null}
                {block.subheading ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {block.subheading}
                  </p>
                ) : null}
              </div>
              {block.cta ? (
                <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground shrink-0">
                  {block.cta.label} → {block.cta.href}
                </span>
              ) : null}
            </div>
            {handles.length === 0 ? (
              <p className="text-xs text-amber-700">No product handles in this rail.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {handles.map((handle) => (
                  <div
                    key={handle}
                    className="aspect-[3/4] rounded bg-muted/60 border border-border flex items-end p-2"
                  >
                    <span className="text-[10px] font-mono leading-tight break-all line-clamp-3 text-foreground/80">
                      {handle}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
