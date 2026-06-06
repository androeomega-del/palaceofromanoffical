/**
 * PDP cross-linking matrix — server fn.
 *
 * Given a product's department/type, tags and vendor, returns up to 3
 * destination matches from `vacation_destinations` plus a canonical vendor
 * collection link. Used by the PDP "Curated Styling Context" SSR module.
 *
 * Matching is a simple, deterministic token-overlap against `style_tags`.
 * Cached for 60s per signature via the shared server-cache.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  productType: z.string().max(120).optional().default(""),
  vendor: z.string().max(120).optional().default(""),
  tags: z.array(z.string().max(80)).max(40).optional().default([]),
  title: z.string().max(240).optional().default(""),
});

export type PdpContextLinks = {
  destinations: Array<{
    slug: string;
    name: string;
    styleTags: string[];
  }>;
  vendor: {
    name: string;
    slug: string;
    href: string;
  } | null;
};

function vendorSlug(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 3);
}

export const getPdpContextLinks = createServerFn({ method: "GET" })
  .inputValidator((data: z.input<typeof Input>) => Input.parse(data))
  .handler(async ({ data }): Promise<PdpContextLinks> => {
    const { fetchActiveDestinations } = await import(
      "./vacation-destinations.server"
    );
    const { cached } = await import("./server-cache");

    const sig = [
      data.productType,
      data.vendor,
      [...data.tags].sort().join("|"),
      data.title,
    ].join("::");

    return cached(
      `pdp-context-links:${sig}`,
      async () => {
        const all = await fetchActiveDestinations().catch(() => []);
        const needles = new Set<string>([
          ...tokens(data.productType),
          ...tokens(data.title),
          ...data.tags.flatMap(tokens),
        ]);

        const scored = all
          .map((d) => {
            const score = d.styleTags.reduce((acc, tag) => {
              const tt = tokens(tag);
              const hit = tt.some((t) => needles.has(t));
              return acc + (hit ? 1 : 0);
            }, 0);
            return { d, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((x) => ({
            slug: x.d.slug,
            name: x.d.name,
            styleTags: x.d.styleTags,
          }));

        const v = data.vendor.trim();
        const vendor = v
          ? {
              name: v,
              slug: vendorSlug(v),
              href: `/collections/${vendorSlug(v)}`,
            }
          : null;

        return { destinations: scored, vendor };
      },
      60_000,
    );
  });
