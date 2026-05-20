import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression for collection cards + megamenu tiles.
 *
 * Run:
 *   bun run test:visual              # run against running dev server
 *   bun run test:visual:update       # update snapshots
 *
 * Set PLAYWRIGHT_BASE_URL to point at a non-local environment, e.g. the
 * deployed preview: PLAYWRIGHT_BASE_URL=https://palaceofroman.lovable.app
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__snapshots__",
  globalSetup: "./tests/visual/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    // Stabilize: lock animations, reduce non-determinism
    reducedMotion: "reduce",
    timezoneId: "UTC",
    locale: "en-US",
  },
  expect: {
    toHaveScreenshot: {
      // small tolerance to absorb font/anti-alias jitter across machines
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
