import { z } from "zod";

/**
 * Homepage daily layout JSON schema.
 *
 * Stored in `homepage_daily_layout.layout_json`. Claude (or the cold-start
 * fallback) populates this on a 48-hour cycle. The frontend reads the latest
 * `is_active = true` row and renders blocks in order.
 *
 * Schema is versioned via `version` so we can evolve safely.
 */

export const hotspotSchema = z.object({
  /** Horizontal position as a percentage of image width (0–100). */
  x: z.number().min(0).max(100),
  /** Vertical position as a percentage of image height (0–100). */
  y: z.number().min(0).max(100),
  /** Shopify product handle the pin links to. */
  handle: z.string().min(1).max(255),
  /** Short category, e.g. "Eyewear". Shown as the tooltip eyebrow. */
  label: z.string().min(1).max(60).optional(),
  /** Brand or product name shown beneath the label, e.g. "Saint Laurent". */
  sublabel: z.string().max(120).optional(),
});

export type HotspotConfig = z.infer<typeof hotspotSchema>;

const baseBlock = z.object({
  id: z.string().min(1).max(120),
  heading: z.string().max(160).optional(),
  subheading: z.string().max(280).optional(),
  cta: z
    .object({
      label: z.string().max(60),
      href: z.string().max(500),
    })
    .optional(),
});

export const heroBlockSchema = baseBlock.extend({
  type: z.literal("hero"),
  image: z.string().url().or(z.string().min(1)),
  alt: z.string().max(255),
});

export const productRailBlockSchema = baseBlock.extend({
  type: z.literal("product_rail"),
  collectionHandle: z.string().min(1).max(255).optional(),
  productHandles: z.array(z.string().min(1).max(255)).max(24).optional(),
});

/**
 * Editorial banner with optional shoppable hotspots overlaid on the image.
 * When `hotspots` is populated, the frontend renders pulsing pins that open
 * a Quick Add micro-card on hover/tap.
 */
export const editorialBannerBlockSchema = baseBlock.extend({
  type: z.literal("editorial_banner"),
  image: z.string().url().or(z.string().min(1)),
  alt: z.string().max(255),
  aspect: z
    .string()
    .regex(/^\d+\/\d+$/)
    .optional(),
  hotspots: z.array(hotspotSchema).max(12).default([]),
});

export const layoutBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  productRailBlockSchema,
  editorialBannerBlockSchema,
]);

export const homepageLayoutSchema = z.object({
  version: z.literal(1),
  generated_at: z.string().datetime().optional(),
  source: z.enum(["claude", "cold_start_fallback", "manual"]).optional(),
  blocks: z.array(layoutBlockSchema).max(24),
});

export type HomepageLayout = z.infer<typeof homepageLayoutSchema>;
export type EditorialBannerBlock = z.infer<typeof editorialBannerBlockSchema>;
