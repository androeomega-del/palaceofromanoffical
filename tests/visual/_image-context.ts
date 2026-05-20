import type { Page, TestInfo, Locator } from "@playwright/test";

/**
 * Capture admin-facing context (alt text + objectPosition focal point) for
 * a hero or card image and attach it to the current test. The custom
 * diff-report reporter (tests/visual/reporters/diff-report.ts) reads these
 * attachments when a snapshot fails so the human reviewer immediately sees
 * which image + crop produced the mismatch.
 */
export async function attachImageContext(
  testInfo: TestInfo,
  page: Page,
  imgLocator: Locator,
  extra: { handle?: string; label?: string } = {},
): Promise<void> {
  const info = await imgLocator.evaluate((el) => {
    const i = el as HTMLImageElement;
    const cs = window.getComputedStyle(i);
    return {
      alt: i.alt || null,
      src: i.src || null,
      currentSrc: i.currentSrc || null,
      srcset: i.getAttribute("srcset") || null,
      sizes: i.getAttribute("sizes") || null,
      naturalWidth: i.naturalWidth,
      naturalHeight: i.naturalHeight,
      displayedWidth: i.clientWidth,
      displayedHeight: i.clientHeight,
      objectPosition: cs.objectPosition || null,
      objectFit: cs.objectFit || null,
    };
  });

  await testInfo.attach("image-context.json", {
    body: Buffer.from(
      JSON.stringify(
        { ...extra, viewport: page.viewportSize(), ...info },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });
}
