/**
 * Global SEO metadata helper for TanStack Start routes.
 *
 * Usage in any route file:
 *
 *   import { buildSeoHead } from "@/lib/seo-meta";
 *
 *   export const Route = createFileRoute("/about")({
 *     head: () => buildSeoHead({
 *       title: "About — Palace of Roman",
 *       description: "...",
 *       image: "/assets/og-about.jpg",
 *       path: "/about",
 *       keywords: ["luxury", "multi-brand"],
 *     }),
 *     component: AboutPage,
 *   });
 *
 * - Title / description fall back to brand defaults if omitted.
 * - Canonical defaults to the current `path` (self-referencing) so duplicate
 *   content penalties are avoided. On the client, `useDynamicCanonical()`
 *   patches canonical + og:url to `window.location.pathname` when the user
 *   navigates through a route whose path was unknown at SSR time.
 * - Emits og:* + twitter:* via the shared `routeHead()` builder for parity
 *   with the rest of the codebase (`src/lib/seo.ts`).
 */
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { absoluteUrl, metaDescription, pageTitle, routeHead } from "@/lib/seo";

export const DEFAULT_SEO_TITLE =
  "Palace of Roman | Luxury Multi-Brand Fashion Store";
export const DEFAULT_SEO_DESCRIPTION =
  "Curating the world's most significant designers through a singular, architectural lens.";

export interface SeoMetaInput {
  /** Final page title. Falls back to the brand default. */
  title?: string | null;
  /** Final meta description. Falls back to the brand default. */
  description?: string | null;
  /** Hero/share image — absolute or site-relative. */
  image?: string | null;
  /** Canonical path or absolute URL. Defaults to `path`, then to "/". */
  canonicalUrl?: string | null;
  /** Site-relative route path used to build canonical + og:url. */
  path?: string | null;
  /** Optional keyword array — emitted as <meta name="keywords">. */
  keywords?: string[] | null;
  /** og:type — defaults to "website". */
  type?: "website" | "article" | "product";
  /** Auto-format the title with the brand suffix. Default: false. */
  formatTitle?: boolean;
}

export interface SeoHead {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
}

/**
 * Build the `{ meta, links }` object expected by a TanStack Start
 * `head()` return. Merge extra entries into the result if a route needs
 * additional tags (JSON-LD scripts, robots, etc.).
 */
export function buildSeoHead(input: SeoMetaInput = {}): SeoHead {
  const rawTitle = (input.title ?? "").trim();
  const title = rawTitle
    ? input.formatTitle
      ? pageTitle(rawTitle)
      : rawTitle
    : DEFAULT_SEO_TITLE;

  const rawDescription = (input.description ?? "").trim();
  const description = rawDescription
    ? metaDescription(rawDescription)
    : DEFAULT_SEO_DESCRIPTION;

  const path = input.path ?? "/";
  const canonical = absoluteUrl(input.canonicalUrl ?? path);

  const base = routeHead({
    path: input.canonicalUrl ?? path,
    title,
    description,
    image: input.image ?? null,
    type: input.type ?? "website",
  });

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    ...base.meta,
  ];

  const keywords = (input.keywords ?? [])
    .map((k) => k.trim())
    .filter(Boolean);
  if (keywords.length > 0) {
    meta.push({ name: "keywords", content: keywords.join(", ") });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: canonical }],
  };
}

/**
 * Client-side safety net for routes whose canonical path can't be known
 * at SSR time (e.g. fully-dynamic surfaces). Patches the existing
 * canonical link + og:url meta in place to `window.location.origin +
 * pathname`, preventing duplicate-content drift from query strings.
 *
 * No-op during SSR. Idempotent on every navigation.
 */
export function useDynamicCanonical(enabled = true) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}${pathname}`;

    let link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);

    let og = document.head.querySelector<HTMLMetaElement>(
      'meta[property="og:url"]',
    );
    if (!og) {
      og = document.createElement("meta");
      og.setAttribute("property", "og:url");
      document.head.appendChild(og);
    }
    og.setAttribute("content", url);
  }, [pathname, enabled]);
}
