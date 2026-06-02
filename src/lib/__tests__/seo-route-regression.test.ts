/**
 * SEO regression check (fails the build).
 *
 * Scans every public, indexable route file under src/routes/ and asserts each one
 * still ships the four signals search engines rely on:
 *   1. a title (via meta entry or routeHead())
 *   2. a meta description (via meta entry or routeHead())
 *   3. a canonical link (explicit rel:"canonical" or routeHead(), which adds one)
 *   4. an <h1> in the rendered JSX
 *
 * A route is exempt only when:
 *   - it's an admin / account / auth / internal preview / api / sitemap route, OR
 *   - it's a layout/wrapper file (passthrough <Outlet />) with no rendered page, OR
 *   - it sets robots noindex (intentionally hidden from search).
 *
 * H1 baseline: a number of legacy editorial/collection pages were authored
 * without a literal <h1> and instead lead with <h2>. They are listed in
 * H1_BASELINE_DEBT below — they are tracked debt, not new regressions.
 *
 *   New rule:
 *     - Any NEW route file must include an <h1>.
 *     - Removing an <h1> from a route NOT in the baseline = build failure.
 *     - Fixing one of the listed pages = remove it from the baseline.
 *
 * If you add a new public route, this test will tell you immediately when one
 * of the four SEO signals is missing — before Google's slow re-crawl finds out.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROUTES_DIR = join(process.cwd(), "src", "routes");

// Routes that are intentionally non-indexable or not "pages".
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
  "links.tsx",
];

// Route files that exist only to render <Outlet /> for nested routes.
const PASSTHROUGH_LAYOUTS = new Set<string>([
  "edits.yacht-edit.tsx",
  "account.tsx",
  "swim.tsx",
]);

// Pre-existing pages authored without an <h1>. Tracked as debt — do not extend.
// To remove an entry: add a proper <h1> to that route, then delete the line.
const H1_BASELINE_DEBT = new Set<string>([
  "about.tsx",
  "collections.cashmere-sweaters.tsx",
  "collections.designer-belts.tsx",
  "collections.designer-crossbody-bags.tsx",
  "collections.designer-mens-shirts.tsx",
  "collections.designer-sunglasses.tsx",
  "collections.italian-leather-handbags.tsx",
  "collections.italian-leather-loafers.tsx",
  "collections.italian-leather-wallets.tsx",
  "collections.luxury-sneakers.tsx",
  "collections.silk-scarves.tsx",
  "editorial.accessories.tsx",
  "editorial.mens-edit.tsx",
  "editorial.resort-2026.tsx",
  "editorial.shoreline-perspective.tsx",
  "editorial.summer-edit.tsx",
  "editorial.the-new-evening.tsx",
  "editorial.versace-now.tsx",
  "editorial.versace.tsx",
  "editorial.womens-edit.tsx",
  "edits.dolce-romana.tsx",
  "edits.the-bag-vault.tsx",
  "edits.the-cucinelli-edit.tsx",
  "edits.the-prada-effect.tsx",
  "faq.tsx",
  "journal.craftsmanship.caring-for-fine-leather.tsx",
  "journal.craftsmanship.made-in-italy-vs-designed-in-italy.tsx",
  "journal.craftsmanship.spot-real-italian-leather.tsx",
  "journal.style.luxury-sneakers-as-modern-tailoring.tsx",
  "journal.style.the-cashmere-field-guide.tsx",
  "journal.style.the-investment-sunglasses-edit.tsx",
  "legal-notice.tsx",
  "privacy.tsx",
  "shipping-returns.tsx",
  "terms.tsx",
  "trends.dolce-gabbana-icons.tsx",
  "trends.pucci-eyewear.tsx",
  "trends.tom-ford-essentials.tsx",
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
  return /component:\s*\(\)\s*=>\s*<Outlet\s*\/>/.test(src) && !/<h1[\s>]/.test(src);
}

function isNoIndex(src: string): boolean {
  return /name:\s*["']robots["']\s*,\s*content:\s*["']\s*noindex/i.test(src);
}

// title can be a literal or a variable: { title: "..." } or { title: v.title }
function hasTitle(src: string): boolean {
  return /\brouteHead\s*\(/.test(src) || /\{\s*title\s*:/.test(src);
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

describe("SEO regression — title / meta description / canonical", () => {
  const files = listRouteFiles();

  it("scans a non-trivial set of routes (sanity)", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it.each(files)("%s — title, description, canonical", (filename) => {
    const src = readFileSync(join(ROUTES_DIR, filename), "utf8");
    if (looksLikePassthrough(src) || isNoIndex(src)) return;

    const missing: string[] = [];
    if (!hasTitle(src)) missing.push("title");
    if (!hasDescription(src)) missing.push("meta description");
    if (!hasCanonical(src)) missing.push("canonical link");

    expect(
      missing,
      `${filename} is missing: ${missing.join(", ")}. ` +
        `Use routeHead() from @/lib/seo in the route's head() return.`,
    ).toEqual([]);
  });
});

describe("SEO regression — <h1> presence (with baseline debt list)", () => {
  const files = listRouteFiles();

  it.each(files)("%s — has <h1> (or is in baseline debt)", (filename) => {
    const src = readFileSync(join(ROUTES_DIR, filename), "utf8");
    if (looksLikePassthrough(src) || isNoIndex(src)) return;

    const h1 = hasH1(src);
    const allowedToMissH1 = H1_BASELINE_DEBT.has(filename);

    if (!h1 && !allowedToMissH1) {
      throw new Error(
        `${filename} is missing an <h1>. New routes must render exactly one <h1> ` +
          `as the page's primary heading. (If this is a legacy file, do not extend ` +
          `H1_BASELINE_DEBT — fix the page instead.)`,
      );
    }
    if (h1 && allowedToMissH1) {
      throw new Error(
        `${filename} now has an <h1> — please remove it from H1_BASELINE_DEBT ` +
          `in src/lib/__tests__/seo-route-regression.test.ts.`,
      );
    }
  });
});
