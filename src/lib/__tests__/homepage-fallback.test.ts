/**
 * Step 5 — fallback regression test.
 *
 * The cron route `/api/public/cron/refresh-homepage-layout` ships a
 * cold-start `buildFallbackLayout()` whose output MUST always pass
 * `homepageLayoutSchema`. If anyone tightens the schema (or the
 * fallback drifts) the cron will start erroring silently in prod and
 * the storefront's `<EditorsEdition />` will render nothing.
 *
 * This test mirrors the fallback skeleton produced by the cron with
 * an empty products array (worst case — Shopify unreachable) and
 * asserts the schema accepts it. We intentionally do NOT import the
 * cron route module here — it pulls in `supabaseAdmin` which requires
 * server-only env vars and would fail in the vitest jsdom runtime.
 */
import { describe, it, expect } from "vitest";
import { homepageLayoutSchema } from "@/lib/homepage-layout-schema";

function buildFallbackSkeleton(handles: string[] = []) {
  return {
    version: 1 as const,
    generated_at: new Date().toISOString(),
    source: "cold_start_fallback" as const,
    blocks: [
      {
        id: "hero",
        type: "hero" as const,
        image: "library:22",
        alt: "Palace of Roman editorial curation",
        heading: "The Current Edit",
        subheading:
          "A restrained selection of designer pieces, refreshed as live boutique signals return.",
        cta: { label: "Shop new arrivals", href: "/collections/new-arrivals" },
      },
      {
        id: "best-sellers",
        type: "product_rail" as const,
        heading: "Best sellers — restocked",
        subheading: "The pieces with the clearest demand signal in the boutique right now.",
        collectionHandle: handles.length === 0 ? "best-sellers" : undefined,
        productHandles: handles.length > 0 ? handles.slice(0, 12) : undefined,
      },
      {
        id: "editorial-feature",
        type: "editorial_banner" as const,
        image: "library:36",
        alt: "Palace of Roman seasonal editorial still",
        heading: "A quieter kind of arrival",
        subheading:
          "Evening, tailoring, resort pieces and accessories held together by proportion and restraint.",
        cta: { label: "Read the story", href: "/editorial/the-new-evening" },
        hotspots: [],
      },
      {
        id: "women-now",
        type: "product_rail" as const,
        heading: "Women’s selection",
        subheading: "Dresses, tailoring and accessories selected for the current rotation.",
        collectionHandle: "women",
      },
      {
        id: "men-now",
        type: "product_rail" as const,
        heading: "Men’s selection",
        subheading: "Tailoring, shirting and off-duty pieces with a precise finish.",
        collectionHandle: "men",
      },
    ],
  };
}

describe("homepage cold-start fallback layout", () => {
  it("passes homepageLayoutSchema with zero live products (Shopify down)", () => {
    const parsed = homepageLayoutSchema.parse(buildFallbackSkeleton([]));
    expect(parsed.source).toBe("cold_start_fallback");
    expect(parsed.blocks.length).toBeGreaterThanOrEqual(3);
    expect(parsed.blocks[0].type).toBe("hero");
  });

  it("passes homepageLayoutSchema with live best-seller handles", () => {
    const handles = Array.from({ length: 8 }, (_, i) => `product-${i + 1}`);
    const parsed = homepageLayoutSchema.parse(buildFallbackSkeleton(handles));
    const rail = parsed.blocks.find((b) => b.id === "best-sellers");
    expect(rail?.type).toBe("product_rail");
    if (rail?.type === "product_rail") {
      expect(rail.productHandles).toHaveLength(8);
      expect(rail.collectionHandle).toBeUndefined();
    }
  });

  it("always includes both gender rails so the homepage never collapses to one column", () => {
    const parsed = homepageLayoutSchema.parse(buildFallbackSkeleton());
    const ids = parsed.blocks.map((b) => b.id);
    expect(ids).toContain("women-now");
    expect(ids).toContain("men-now");
  });

  it("rejects a block with an unknown type (schema is still strict)", () => {
    const bad = {
      ...buildFallbackSkeleton(),
      blocks: [{ id: "x", type: "carousel", image: "library:1", alt: "x" }],
    };
    expect(() => homepageLayoutSchema.parse(bad)).toThrow();
  });
});
