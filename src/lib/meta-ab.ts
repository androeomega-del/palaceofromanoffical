/**
 * Meta-tag A/B testing (titles + descriptions only).
 *
 * Scope
 * -----
 * Varies <title> and <meta name="description"> (plus the matching og:title /
 * og:description) on the homepage and collection PLPs. Canonical URL,
 * og:url, structured data and every other tag remain identical across
 * variants — so search engines see one canonical resource and the test
 * cannot produce duplicate-content or cloaking signals.
 *
 * Assignment model
 * ----------------
 * - Bucket 0 (variant A) is the canonical-safe default. Bots and first-time
 *   visitors (no cookie yet) always render variant A on the SSR pass, so
 *   the indexed copy is stable.
 * - Real visitors get a persistent 0/1 assignment stored in the
 *   `por_meta_ab` cookie. Subsequent visits render their assigned variant
 *   directly from SSR (`readMetaAbBucket` server fn reads the cookie).
 * - The client-side `useMetaAb` hook assigns the cookie on first visit and
 *   mutates `document.title` + the description meta to match — so even the
 *   first session sees variant B if it was rolled into bucket 1.
 *
 * Tracking
 * --------
 * Every page render that enters the test fires a Plausible custom event
 * `Meta AB Exposure` with `{ page, bucket, variant }` props, so conversion
 * data flows into the existing analytics with no extra infra.
 */

export const META_AB_COOKIE = "por_meta_ab";
export const META_AB_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export type MetaVariant = { title: string; description: string };
export type MetaBucket = 0 | 1;

/* ──────────────────────────────────────────────────────────────────────── */
/*  Variant catalogue                                                       */
/* ──────────────────────────────────────────────────────────────────────── */

/** Homepage variants. A is the existing canonical copy. */
const HOME: [MetaVariant, MetaVariant] = [
  {
    title: "Palace of Roman | The Maisons Defining the Seasons",
    description:
      "The maisons defining the seasons — curated luxury menswear and womenswear from the world's leading designer houses. Authenticated. Express delivery.",
  },
  {
    title: "The Maisons Defining the Seasons | Palace of Roman",
    description:
      "A curated edit of luxury fashion from the maisons defining the seasons. Prada, Gucci, Bottega Veneta, Saint Laurent and more. Authenticated. Worldwide shipping.",
  },
];

/** Per-collection overrides. Add a handle here to A/B that PLP specifically;
 *  otherwise the `_default` recipe applies. Use `{{title}}` and
 *  `{{description}}` to interpolate the SEO copy that the existing
 *  `collectionSeo()` helper produced. */
type Tmpl = { title: string; description: string };
type Recipe = [Tmpl, Tmpl];
const COLLECTION_RECIPES: Record<string, Recipe> = {
  _default: [
    // Variant A — matches the existing `collectionSeo()` output verbatim.
    { title: "{{title}}", description: "{{description}}" },
    // Variant B — adds a confidence cue + sharper benefit framing.
    {
      title: "{{title}} — Authenticated Designer Edit | Palace of Roman",
      description:
        "Shop {{title}} from the maisons that matter. Authenticated, expressly shipped worldwide, with 14-day returns. {{description}}",
    },
  ],
  "cashmere-sweaters": [
    {
      title: "{{title}}",
      description: "{{description}}",
    },
    {
      title: "Cashmere Sweaters — Loro Piana, Cucinelli & More | Palace of Roman",
      description:
        "The cashmere edit — investment knitwear from the houses that define the category. Grades, ply counts and fits explained in our field guide.",
    },
  ],
  "luxury-sneakers": [
    { title: "{{title}}", description: "{{description}}" },
    {
      title: "Luxury Sneakers — Designer Sneakers Edit | Palace of Roman",
      description:
        "The modern shoe, considered. Designer sneakers from the houses redefining off-duty tailoring. Authenticated, worldwide shipping.",
    },
  ],
  "italian-leather-handbags": [
    { title: "{{title}}", description: "{{description}}" },
    {
      title: "Italian Leather Handbags — The Bag Vault | Palace of Roman",
      description:
        "Investment leathers, archived. Italian-made handbags from Prada, Bottega, Gucci and the workshops that hold their shape and value.",
    },
  ],
};

/* ──────────────────────────────────────────────────────────────────────── */
/*  Pickers                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

export function pickHomeMeta(bucket: MetaBucket): MetaVariant {
  return HOME[bucket] ?? HOME[0];
}

export function pickCollectionMeta(
  handle: string,
  bucket: MetaBucket,
  base: MetaVariant,
): MetaVariant {
  const recipe = COLLECTION_RECIPES[handle] ?? COLLECTION_RECIPES._default;
  const tmpl = recipe[bucket] ?? recipe[0];
  return {
    title: interpolate(tmpl.title, base),
    description: interpolate(tmpl.description, base),
  };
}

function interpolate(s: string, v: MetaVariant): string {
  return s
    .replaceAll("{{title}}", v.title)
    .replaceAll("{{description}}", v.description);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Bucket parsing                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

export function parseBucket(raw: string | undefined | null): MetaBucket {
  return raw === "1" ? 1 : 0;
}

/** Stable variant label for analytics ("A" / "B"). */
export function variantLabel(bucket: MetaBucket): "A" | "B" {
  return bucket === 1 ? "B" : "A";
}

/** Bucket 0 is the canonical-safe, indexable default. */
export const DEFAULT_BUCKET: MetaBucket = 0;

/**
 * Returns the indexability rules for a given bucket.
 *
 * - Default variant (bucket 0): no robots tag, self-referencing canonical.
 * - Non-default variants: robots `noindex,follow`, canonical points at the
 *   default URL — so test variants never get indexed and never produce
 *   duplicate-content signals.
 *
 * `pageUrl` is the absolute URL of the page itself. The canonical and the
 * page URL are the same on the default variant.
 */
export function seoMetaForBucket(
  bucket: MetaBucket,
  pageUrl: string,
): { canonical: string; robots: string | null } {
  if (bucket === DEFAULT_BUCKET) {
    return { canonical: pageUrl, robots: null };
  }
  return { canonical: pageUrl, robots: "noindex,follow" };
}

