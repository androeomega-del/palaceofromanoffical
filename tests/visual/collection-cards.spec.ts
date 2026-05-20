import { stabilize, test, expect, loadFixtures } from "./_helpers";
import { attachImageContext } from "./_image-context";

/**
 * Pixel-based visual regression for the /collections grid.
 *
 * The set of asserted collections is derived from Shopify at test-setup time
 * (see tests/visual/global-setup.ts) so this file never has to be edited when
 * collections are added or removed.
 */
const fixture = loadFixtures();

// Cap to keep wall-time bounded; first N stable handles is enough to catch
// regressions (cards share layout + image pipeline).
const MAX_CARDS = 12;
const cardHandles = fixture.collectionHandles.slice(0, MAX_CARDS);

test.describe("collection cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections");
    await page.waitForSelector('[data-testid="collection-grid"]');
    await stabilize(page);
  });

  test("grid snapshot", async ({ page }, testInfo) => {
    const grid = page.getByTestId("collection-grid");
    await expect(grid).toHaveScreenshot(`grid-${testInfo.project.name}.png`);
  });

  for (const handle of cardHandles) {
    test(`card: ${handle}`, async ({ page }, testInfo) => {
      const card = page.locator(`[data-testid="collection-card"][data-handle="${handle}"]`);
      await expect(card, `collection-card[${handle}] should exist on /collections`).toHaveCount(1);
      await card.scrollIntoViewIfNeeded();
      await stabilize(page);
      await attachImageContext(testInfo, page, card.locator("img").first(), {
        handle,
        label: `card/${handle}`,
      });
      await expect(card).toHaveScreenshot(`card-${handle}-${testInfo.project.name}.png`);
    });
  }
});
