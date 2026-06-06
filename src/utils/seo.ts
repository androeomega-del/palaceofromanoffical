/**
 * Centralized SEO utility for TanStack Start `head()` configuration.
 *
 * Single entry point: `generateMeta({ title, description, image, canonicalUrl })`
 * returns `{ meta, links }` ready to spread into a route's `head()`.
 *
 * Enterprise rules enforced:
 *   - Title hard-capped at 60 chars (word-boundary truncation + ellipsis)
 *   - Description hard-capped at 160 chars
 *   - Self-referencing canonical link
 *   - Full Open Graph + Twitter Card coverage
 *   - Brand fallbacks when fields are omitted
 *
 * Usage:
 *
 *   import { generateMeta } from "@/utils/seo";
 *
 *   export const Route = createFileRoute("/about")({
 *     head: () => ({
 *       ...generateMeta({
 *         title: "About Palace of Roman",
 *         description: "Our curatorial point of view.",
 *         canonicalUrl: "/about",
 *         image: "/assets/og-about.jpg",
 *       }),
 *     }),
 *     component: AboutPage,
 *   });
 */
import { absoluteUrl, truncate, stripHtml } from "@/lib/seo";

/* ──────────────────────────────────────────────────────────────────────── */
/*  Brand defaults                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

export const SEO_DEFAULTS = {
  title: "Palace of Roman Official | Luxury Multi-Brand Fashion Store",
  description:
    "Curating the world's most significant designers through a singular, architectural lens — a global boutique network for collectors of luxury fashion.",
  image: "/assets/og-default.png",
  canonicalUrl: "/",
  siteName: "Palace of Roman",
  twitterCard: "summary_large_image" as const,
} as const;

export const SEO_LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 160,
} as const;

/* ──────────────────────────────────────────────────────────────────────── */
/*  Public API                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export interface GenerateMetaInput {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  /** Site-relative path ("/about") or absolute URL. Defaults to "/". */
  canonicalUrl?: string | null;
  /** og:type override. Defaults to "website". */
  type?: "website" | "article" | "product";
}

export interface GeneratedHead {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
}

/**
 * Build the `{ meta, links }` slice for a TanStack Start `head()` return.
 * Every field is optional; brand defaults fill in the rest.
 */
export function generateMeta(input: GenerateMetaInput = {}): GeneratedHead {
  const title = clampTitle(input.title);
  const description = clampDescription(input.description);
  const canonical = absoluteUrl(input.canonicalUrl ?? SEO_DEFAULTS.canonicalUrl);
  const image = absoluteUrl(input.image ?? SEO_DEFAULTS.image);
  const type = input.type ?? "website";

  const meta: Array<Record<string, string>> = [
    // Core
    { title },
    { name: "description", content: description },

    // Open Graph
    { property: "og:site_name", content: SEO_DEFAULTS.siteName },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:type", content: type },
    { property: "og:image", content: image },

    // Twitter
    { name: "twitter:card", content: SEO_DEFAULTS.twitterCard },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonical },
  ];

  return { meta, links };
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Internal clamp helpers                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function clampTitle(raw: string | null | undefined): string {
  const cleaned = stripHtml(raw ?? "").trim();
  const source = cleaned.length > 0 ? cleaned : SEO_DEFAULTS.title;
  return truncate(source, SEO_LIMITS.TITLE_MAX);
}

function clampDescription(raw: string | null | undefined): string {
  const cleaned = stripHtml(raw ?? "").trim();
  const source = cleaned.length > 0 ? cleaned : SEO_DEFAULTS.description;
  return truncate(source, SEO_LIMITS.DESCRIPTION_MAX);
}
