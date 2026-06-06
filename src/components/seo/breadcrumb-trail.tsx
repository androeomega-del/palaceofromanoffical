/**
 * BreadcrumbTrail — server-rendered, schema-compliant breadcrumb navigation.
 *
 * Renders during SSR so crawlers see semantic <nav>/<ol>/<a> markup
 * alongside the JSON-LD BreadcrumbList emitted in the route's head().
 * Every non-terminal step is a real HTML <a> anchor (via TanStack <Link>)
 * carrying its full descriptive label — no truncation, no JS-required
 * hover/expand patterns, so Google sees the full long-tail keyword
 * (e.g. "Prada Re-Nylon Bags") on first paint.
 *
 * Layout-shift policy: the trail reserves its line-box (fixed line-height,
 * single-row) before children paint so font-loading or hydration cannot
 * push surrounding gallery / hero pixels.
 */

import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import { absoluteUrl } from "@/lib/seo";

export interface BreadcrumbItem {
  /** Visible label and JSON-LD `name`. Use exact long-tail phrasing. */
  name: string;
  /**
   * Site-relative path (e.g. "/brand/prada"). Omit on the terminal
   * (current page) crumb so it renders as an unlinked <span>.
   */
  href?: string;
}

/**
 * Builds the schema.org BreadcrumbList JSON-LD payload from the same
 * items array the visual component renders. Call from a route's
 * `head().scripts` so the visual trail and structured data stay in lock-step.
 *
 * The terminal item (no href) still gets a fully-qualified absolute URL
 * so the BreadcrumbList validates — Google requires `item` on every step.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], currentPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.href ?? currentPath),
    })),
  };
}

interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
  /** Optional theme override; defaults to studio editorial styling. */
  className?: string;
  /** Per-item param objects passed to TanStack <Link>, keyed by href. */
  linkParams?: Record<string, Record<string, string>>;
}

export function BreadcrumbTrail({ items, className, linkParams }: BreadcrumbTrailProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      // Reserve a single-line box so font-swap / hydration never shifts
      // adjacent content. `min-h` matches the computed line-height of the
      // 10px / 0.3em-tracking text below.
      className={
        className ??
        "flex min-h-[18px] items-center gap-2 overflow-hidden text-[10px] uppercase tracking-[0.3em] text-[var(--studio-muted)]"
      }
    >
      <ol
        className="flex min-w-0 flex-1 items-center gap-2"
        // Microdata fallback alongside the JSON-LD payload for crawlers
        // that parse the visible DOM instead of the head <script>.
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const params = item.href ? linkParams?.[item.href] : undefined;
          return (
            <Fragment key={`${item.name}-${i}`}>
              <li
                className={isLast ? "min-w-0 truncate text-[var(--studio-ink)]" : "shrink-0"}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {item.href && !isLast ? (
                  <Link
                    // Type-safe routing requires the literal route pattern.
                    // We accept any registered href here via `to as any`
                    // because the trail accepts a heterogeneous list.
                    to={item.href as never}
                    params={params as never}
                    className="transition-colors hover:text-[var(--studio-ink)]"
                    itemProp="item"
                  >
                    <span itemProp="name">{item.name}</span>
                  </Link>
                ) : (
                  <span itemProp="item">
                    <span itemProp="name">{item.name}</span>
                  </span>
                )}
                <meta itemProp="position" content={String(i + 1)} />
              </li>
              {!isLast && (
                <span aria-hidden="true" className="opacity-40">
                  /
                </span>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
