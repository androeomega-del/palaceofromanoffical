import { stabilize, test, expect } from "./_helpers";

/**
 * Pixel-based visual regression for the /collections grid.
 *
 * Snapshots each visible collection card individually (so a single
 * mis-cropped tile fails its own assertion instead of polluting a full-grid
 * diff) and also captures a full-grid snapshot per viewport.
 */
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

  test("per-card snapshots", async ({ page }, testInfo) => {
    const cards = page.getByTestId("collection-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Cap to keep runtime sane on large catalogs; first N is enough to catch regressions.
    const max = Math.min(count, 12);
    for (let i = 0; i < max; i++) {
      const card = cards.nth(i);
      const handle = (await card.getAttribute("data-handle")) ?? `idx-${i}`;
      await card.scrollIntoViewIfNeeded();
      await stabilize(page);
      await expect(card).toHaveScreenshot(`card-${handle}-${testInfo.project.name}.png`);
    }
  });
});
