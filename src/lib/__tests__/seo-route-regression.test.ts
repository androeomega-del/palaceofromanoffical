/**
 * SEO regression check (fails the build).
 *
 * Scans every public, indexable route file under src/routes/ and asserts each one
 * still ships the four signals search engines rely on:
 *   1. a <title> (via meta entry or routeHead())
 *   2. a meta description
 *   3. a canonical link (explicit rel:"canonical" or routeHead(), which adds one)
 *   4. an <h1> in the rendered JSX
 *
 * A route is exempt only when:
 *   - it's an admin / account / auth / internal preview route, OR
 *   - it's a layout/wrapper file (passthrough <Outlet />) with no rendered page, OR
 *   - it sets robots noindex (intentionally hidden from search).
 *
 * If you add a new public route, this test will tell you immediately when one
 * of the four SEO signals is missing — before Google's slow re-crawl finds out.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROUTES_DIR = join(process.cwd(), "src", "routes");

// Routes that are intentionally non-indexable or not "pages":
// - admin/* and account/* are app surfaces, not marketing pages
// - api/* are server routes (no UI)
// - $-prefixed and not-found are handled by their own SEO
// - sitemap/llms/robots are non-HTML
// - login/authentication are auth flows (noindex)
// - preview/* and *.section-samples.* are internal previews (noindex)
// - assets is an internal devtool
// - order-confirmed only renders post-checkout (noindex)
// - wishlist is a per-user surface (noindex semantics)
const EXEMPT_PREFIXES = [
  "admin.",
  "account.",
  "api.",
  "__root",
  "not-found",
  "sitemap",
  "llms",
  "robots",
  "authentication",
  "login",
  "logout",
  "preview.",
  "assets.tsx",
  "order-confirmed",
  "wishlist",
  "links.tsx", // bio-style passthrough
];

// Route files that exist only to render <Outlet /> for nested routes —
// they have no own UI and no SEO obligations.
const PASSTHROUGH_LAYOUTS = new Set([
  "edits.yacht-edit.tsx",
  "account.tsx",
  "swim.tsx", // verify if becomes a real page
]);

function isExempt(filename: string): boolean {
  if (PASSTHROUGH_LAYOUTS.has(filename)) return true;
  return EXEMPT_PREFIXES.some((p) => filename.startsWith(p) || filename === p);
}

function listRouteFiles(): string[] {
  return readdirSync(ROUTES_DIR).filter(
    (f) => f.endsWith(".tsx") && !f.includes(".test.") && !isExempt(f),
  );
}

function looksLikePassthrough(src: string): boolean {
  // Heuristic: component is just `() => <Outlet />` and no <h1> anywhere.
  return /component:\s*\(\)\s*=>\s*<Outlet\s*\/>/.test(src) && !/<h1[\s>]/.test(src);
}

function isNoIndex(src: string): boolean {
  return /name:\s*["']robots["']\s*,\s*content:\s*["']\s*noindex/i.test(src);
}

function hasTitle(src: string): boolean {
  // routeHead() always emits a title; explicit meta entry { title: "..." } also counts.
  return /\brouteHead\s*\(/.test(src) || /\{\s*title\s*:\s*["'`]/.test(src);
}

function hasDescription(src: string): boolean {
  return (
    /\brouteHead\s*\(/.test(src) ||
    /name:\s*["']description["']/.test(src)
  );
}

function hasCanonical(src: string): boolean {
  return (
    /\brouteHead\s*\(/.test(src) ||
    /rel:\s*["']canonical["']/.test(src)
  );
}

function hasH1(src: string): boolean {
  return /<h1[\s>]/.test(src);
}

describe("SEO regression — every public route ships title/description/canonical/H1", () => {
  const files = listRouteFiles();

  it("scans a non-trivial set of routes (sanity)", () => {
    // If this drops sharply, the exempt list or routes dir has shifted.
    expect(files.length).toBeGreaterThan(40);
  });

  it.each(files)("%s has title, description, canonical, and <h1>", (filename) => {
    const src = readFileSync(join(ROUTES_DIR, filename), "utf8");

    // Passthrough layouts and explicitly noindex'd routes are exempt at the per-file level.
    if (looksLikePassthrough(src) || isNoIndex(src)) return;

    const missing: string[] = [];
    if (!hasTitle(src)) missing.push("title");
    if (!hasDescription(src)) missing.push("meta description");
    if (!hasCanonical(src)) missing.push("canonical link");
    if (!hasH1(src)) missing.push("<h1>");

    expect(
      missing,
      `${filename} is missing: ${missing.join(", ")}. ` +
        `Use routeHead() from @/lib/seo and render an <h1> in the component.`,
    ).toEqual([]);
  });
});
