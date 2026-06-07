/**
 * Regression: product card must navigate to the PDP on a single touch-pointer
 * left-click. Previously the card intercepted the first tap on touchscreen-
 * capable devices (pointerType === "touch") and required a second click, so
 * desktop users on hybrid/touch laptops could only reach the PDP via Ctrl+click.
 *
 * This spec runs in a touch-enabled Chromium context and asserts a single
 * tap on a card navigates to /product/<handle>.
 */
import { test, expect, devices } from "@playwright/test";
import { loadFixtures } from "./_helpers";

// Force a touch-enabled context regardless of the project preset so this
// spec reproduces the original bug even if invoked from desktop projects.
test.use({
  ...devices["Pixel 7"],
  hasTouch: true,
  isMobile: true,
});

test("product card navigates to PDP on a single touch-pointer click", async ({ page }) => {
  const fx = loadFixtures();
  // Pick the first live collection that's likely to render product cards.
  const handle = fx.collectionHandles[0];
  test.skip(!handle, "No collection handles in fixtures");

  await page.goto(`/collections/${handle}`);

  // Wait for at least one product card link to mount.
  const card = page.locator('a[href^="/product/"]').first();
  await card.waitFor({ state: "visible", timeout: 15_000 });

  const href = await card.getAttribute("href");
  expect(href, "card should expose a /product/<handle> href").toMatch(/^\/product\//);

  // Single touch-pointer tap — the exact gesture that previously required two
  // taps to navigate. Playwright's `tap()` issues touchstart + pointerdown
  // (pointerType="touch") + click, matching real touchscreen behaviour.
  await card.tap();

  // Assert we landed on the PDP after a single tap.
  await page.waitForURL(/\/product\/[^/]+/, { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe(href);
});
