import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import type { VisualFixture } from "./global-setup";

const FIXTURE_PATH = path.resolve(process.cwd(), "tests/visual/.fixtures.json");

let cached: VisualFixture | null = null;

/**
 * Load the fixtures produced by `tests/visual/global-setup.ts`.
 * Throws clearly if globalSetup did not run (e.g. running a spec in isolation).
 */
export function loadFixtures(): VisualFixture {
  if (cached) return cached;
  try {
    const raw = readFileSync(FIXTURE_PATH, "utf8");
    cached = JSON.parse(raw) as VisualFixture;
    return cached;
  } catch (err) {
    throw new Error(
      `Visual fixtures missing at ${FIXTURE_PATH}. Run via \`bun run test:visual\` (which triggers globalSetup) or delete --no-globals.`,
    );
  }
}

export async function stabilize(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    );
  });
  await page.waitForTimeout(150);
}

export { test, expect };
