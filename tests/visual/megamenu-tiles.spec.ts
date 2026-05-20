import { stabilize, test, expect, loadFixtures } from "./_helpers";

/**
 * Pixel-based visual regression for the megamenu feature tiles.
 *
 * Departments + feature handles are derived from `buildDepartments()` against
 * live Shopify collections at setup time, so adding a new dept to nav-config
 * automatically extends this suite — no spec edits required.
 */
const fixture = loadFixtures();

test.describe("megamenu — desktop", () => {
  test.skip(({}, testInfo) => !testInfo.project.name.startsWith("desktop"), "Desktop-only layout");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await stabilize(page);
  });

  for (const dept of fixture.departments) {
    test(`${dept.label} panel + feature tile`, async ({ page }) => {
      const trigger = page
        .locator(`header button[aria-haspopup="true"]`, { hasText: new RegExp(`^\\s*${escapeRegex(dept.label)}\\s*$`) })
        .first();
      await expect(trigger, `nav trigger for "${dept.label}" should exist`).toBeVisible();
      await trigger.hover();

      const panel = page.locator(`[data-testid="megamenu-panel"][data-dept="${dept.label}"]`);
      await panel.waitFor({ state: "visible" });
      await stabilize(page);

      // Panel snapshot
      await expect(panel).toHaveScreenshot(`megamenu-panel-${dept.key}.png`);

      // Feature tile snapshot — verify the handle matches nav-config
      const tile = panel.locator(
        `[data-testid="megamenu-feature-tile"][data-handle="${dept.featureHandle}"]`,
      );
      await expect(
        tile,
        `feature tile for ${dept.label} should be wired to handle "${dept.featureHandle}"`,
      ).toHaveCount(1);
      await expect(tile).toHaveScreenshot(`megamenu-feature-${dept.key}.png`);
    });
  }
});

test.describe("megamenu — mobile", () => {
  test.skip(({}, testInfo) => !testInfo.project.name.startsWith("mobile"), "Mobile-only layout");

  test("drawer open snapshot", async ({ page }) => {
    await page.goto("/");
    await stabilize(page);

    const burger = page
      .locator('header button[aria-label*="menu" i], header button[aria-label*="navigation" i]')
      .first();
    await burger.waitFor({ state: "visible" });
    await burger.click();
    await stabilize(page);

    await expect(page).toHaveScreenshot("mobile-nav-open.png", { fullPage: false });
  });
});

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
