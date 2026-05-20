import { test, expect, type Page } from "@playwright/test";

/**
 * Stabilize a page before snapshotting:
 *  - inject CSS that kills transitions/animations
 *  - wait for fonts to be ready
 *  - wait for all <img> elements to finish loading (or fail)
 */
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
  // Give layout one more frame to settle after font swap.
  await page.waitForTimeout(150);
}

/** Re-export to keep test files concise. */
export { test, expect };
