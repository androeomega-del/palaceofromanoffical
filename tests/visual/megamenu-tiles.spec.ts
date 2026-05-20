import { stabilize, test, expect } from "./_helpers";

/**
 * Pixel-based visual regression for the megamenu feature tiles.
 *
 * Desktop: hover each top-level dept trigger to open its panel and snapshot
 *          both the full panel and the feature tile.
 * Mobile:  the megamenu collapses into the mobile drawer; we snapshot the
 *          drawer in its open state.
 */
test.describe("megamenu tiles", () => {
  test("desktop: each dept panel + feature tile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop-only layout");
    await page.goto("/");
    await stabilize(page);

    const triggers = page.locator('header button[aria-haspopup="true"]');
    const count = await triggers.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      const label = (await trigger.textContent())?.trim().toLowerCase().replace(/\s+/g, "-") ?? `dept-${i}`;
      await trigger.hover();
      const panel = page.locator('[data-testid="megamenu-panel"]:not([hidden])');
      await panel.waitFor({ state: "visible" });
      await stabilize(page);

      await expect(panel).toHaveScreenshot(`megamenu-panel-${label}.png`);

      const tile = panel.getByTestId("megamenu-feature-tile");
      if (await tile.count()) {
        await expect(tile.first()).toHaveScreenshot(`megamenu-feature-${label}.png`);
      }

      // close before moving on
      await page.mouse.move(0, 0);
      await page.locator("body").click({ position: { x: 5, y: 500 } });
    }
  });

  test("mobile: drawer open snapshot", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only layout");
    await page.goto("/");
    await stabilize(page);

    // Open the mobile nav. Header exposes a button with aria-label including "menu".
    const burger = page.locator('header button[aria-label*="menu" i], header button[aria-label*="navigation" i]').first();
    await burger.waitFor({ state: "visible" });
    await burger.click();
    await stabilize(page);

    // Snapshot the visible nav surface. We use the <header> root because the
    // mobile drawer is rendered inside it via a Sheet/Dialog portal anchored
    // to the header.
    await expect(page).toHaveScreenshot("mobile-nav-open.png", {
      fullPage: false,
    });
  });
});
