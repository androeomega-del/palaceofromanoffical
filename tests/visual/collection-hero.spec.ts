import { stabilize, test, expect, loadFixtures } from "./_helpers";

/**
 * Hero image fingerprinting + cropping at multiple breakpoints.
 *
 * For each viewport project (mobile-375 / tablet-768 / desktop-1200 / etc.)
 * this spec, for the first N collections returned by fetchCollections():
 *   1. Loads /collections/$handle
 *   2. Snapshots the hero <section> pixel-by-pixel (catches mis-crops)
 *   3. Asserts the browser-picked currentSrc is one of the candidates from
 *      the Shopify `?width=` ladder (catches srcset/sizes regressions where
 *      mobile downloads a 1920px asset or desktop downloads a 480px asset)
 */
const fixture = loadFixtures();

// Keep wall-time bounded; hero pipeline is shared so a small sample catches regressions.
const MAX_HEROES = 4;
const HERO_WIDTH_LADDER = [480, 768, 1024, 1440, 1920];

// Per-project DPR-adjusted upper bound for what currentSrc may resolve to.
// We allow some slack (next ladder rung up) since browsers can pick higher
// densities. The strict invariant we care about: mobile must never pick the
// 1920 rung, and desktop must never pick the 480 rung.
const MAX_REASONABLE_RUNG: Record<string, number> = {
  "mobile-375": 1024,
  "tablet-768": 1440,
  "desktop-1200": 1920,
  "desktop-chromium": 1920,
  "mobile-chromium": 1440,
};
const MIN_REASONABLE_RUNG: Record<string, number> = {
  "mobile-375": 480,
  "tablet-768": 480,
  "desktop-1200": 768,
  "desktop-chromium": 768,
  "mobile-chromium": 480,
};

function widthFromUrl(url: string): number | null {
  const m = url.match(/[?&]width=(\d+)/);
  return m ? Number(m[1]) : null;
}

const heroHandles = fixture.collectionHandles.slice(0, MAX_HEROES);

test.describe("collection hero — breakpoint matrix", () => {
  for (const handle of heroHandles) {
    test(`hero: ${handle}`, async ({ page }, testInfo) => {
      await page.goto(`/collections/${handle}`);
      const hero = page.locator(`[data-testid="collection-hero"][data-handle="${handle}"]`);
      await hero.waitFor({ state: "visible" });
      await stabilize(page);

      // 1. Pixel snapshot of the cropped hero region
      await expect(hero).toHaveScreenshot(`hero-${handle}-${testInfo.project.name}.png`);

      // 2. Fingerprint: which ladder rung did the browser actually fetch?
      const img = hero.locator('[data-testid="collection-hero-img"]');
      const { currentSrc, naturalWidth } = await img.evaluate((el) => {
        const i = el as HTMLImageElement;
        return { currentSrc: i.currentSrc, naturalWidth: i.naturalWidth };
      });

      // Local bundled assets (non-Shopify) have no srcset — only enforce the
      // ladder check when the URL came through the Shopify CDN pipeline.
      const pickedWidth = widthFromUrl(currentSrc);
      if (pickedWidth !== null) {
        expect(
          HERO_WIDTH_LADDER,
          `picked width ${pickedWidth} must come from HERO_RESPONSIVE_WIDTHS`,
        ).toContain(pickedWidth);

        const min = MIN_REASONABLE_RUNG[testInfo.project.name] ?? 480;
        const max = MAX_REASONABLE_RUNG[testInfo.project.name] ?? 1920;
        expect(
          pickedWidth,
          `${testInfo.project.name} hero must pick a rung in [${min}, ${max}], got ${pickedWidth} (${currentSrc})`,
        ).toBeGreaterThanOrEqual(min);
        expect(pickedWidth).toBeLessThanOrEqual(max);
      }

      // 3. Sanity: image actually decoded.
      expect(naturalWidth, "hero image must decode").toBeGreaterThan(0);
    });
  }
});
