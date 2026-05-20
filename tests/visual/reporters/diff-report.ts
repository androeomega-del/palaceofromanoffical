import { mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

/**
 * Admin-friendly diff report for failed visual snapshots.
 *
 * Emits playwright-report/diff-report/index.html with, for every failed
 * snapshot assertion:
 *   - expected / actual / diff PNGs side-by-side
 *   - the alt text, currentSrc, objectPosition (focal point) and viewport
 *     captured at test time via attachImageContext()
 *   - quick links to the originating test
 *
 * Designed so a non-engineer reviewer can scan the page and tell whether a
 * diff is an intentional content change (new image, new crop) or a true
 * regression.
 */
const OUT_DIR = path.resolve(process.cwd(), "playwright-report/diff-report");

type Entry = {
  testTitle: string;
  project: string;
  expected?: string;
  actual?: string;
  diff?: string;
  context?: Record<string, unknown>;
  errorMessage?: string;
};

export default class DiffReportReporter implements Reporter {
  private entries: Entry[] = [];

  onBegin(_config: FullConfig): void {
    mkdirSync(path.join(OUT_DIR, "images"), { recursive: true });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "passed" || result.status === "skipped") return;

    // Snapshot assertions create attachments named with -expected / -actual / -diff suffixes.
    const snapshotAttachments = result.attachments.filter((a) => /expected|actual|diff/.test(a.name));
    if (snapshotAttachments.length === 0) return;

    // Group by snapshot stem (e.g. "card-mens-suits-mobile-375").
    const groups = new Map<string, { expected?: string; actual?: string; diff?: string }>();
    for (const att of snapshotAttachments) {
      const m = att.name.match(/^(.*?)-(expected|actual|diff)$/);
      if (!m || !att.path) continue;
      const [, stem, kind] = m;
      const group = groups.get(stem) ?? {};
      const safe = `${test.id}-${stem}-${kind}.png`;
      const dest = path.join(OUT_DIR, "images", safe);
      try {
        copyFileSync(att.path, dest);
        (group as Record<string, string>)[kind] = path.join("images", safe);
        groups.set(stem, group);
      } catch {
        // ignore copy errors — the report just omits that frame
      }
    }

    let context: Record<string, unknown> | undefined;
    const ctxAtt = result.attachments.find((a) => a.name === "image-context.json");
    if (ctxAtt) {
      try {
        const body = ctxAtt.body ?? (ctxAtt.path ? readFileSync(ctxAtt.path) : null);
        if (body) context = JSON.parse(body.toString("utf8"));
      } catch {
        /* ignore */
      }
    }

    const errorMessage = result.errors[0]?.message?.split("\n").slice(0, 3).join("\n");

    for (const [, files] of groups) {
      this.entries.push({
        testTitle: test.titlePath().slice(1).join(" › "),
        project: test.parent.project()?.name ?? "unknown",
        ...files,
        context,
        errorMessage,
      });
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    const html = renderHtml(this.entries);
    writeFileSync(path.join(OUT_DIR, "index.html"), html);
    // eslint-disable-next-line no-console
    console.log(
      this.entries.length === 0
        ? `[diff-report] no snapshot mismatches`
        : `[diff-report] ${this.entries.length} mismatched snapshot(s) → ${path.relative(process.cwd(), path.join(OUT_DIR, "index.html"))}`,
    );
  }
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ctxRow(label: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  return `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
}

function renderEntry(e: Entry): string {
  const ctx = (e.context ?? {}) as Record<string, unknown>;
  const vp = ctx.viewport as { width?: number; height?: number } | undefined;

  const frame = (label: string, src?: string) =>
    src
      ? `<figure><figcaption>${label}</figcaption><img src="${esc(src)}" loading="lazy" /></figure>`
      : `<figure class="missing"><figcaption>${label}</figcaption><div>—</div></figure>`;

  return `<article class="entry">
    <header>
      <h2>${esc(e.testTitle)}</h2>
      <span class="project">${esc(e.project)}</span>
    </header>
    <div class="frames">
      ${frame("Expected (baseline)", e.expected)}
      ${frame("Actual (current)", e.actual)}
      ${frame("Diff", e.diff)}
    </div>
    <table class="meta">
      ${ctxRow("Handle", ctx.handle)}
      ${ctxRow("Label", ctx.label)}
      ${ctxRow("Alt text", ctx.alt)}
      ${ctxRow("Focal point (object-position)", ctx.objectPosition)}
      ${ctxRow("Object-fit", ctx.objectFit)}
      ${ctxRow("Current src", ctx.currentSrc)}
      ${ctxRow("Sizes", ctx.sizes)}
      ${ctxRow("Natural size", `${ctx.naturalWidth ?? "?"} × ${ctx.naturalHeight ?? "?"}`)}
      ${ctxRow("Displayed size", `${ctx.displayedWidth ?? "?"} × ${ctx.displayedHeight ?? "?"}`)}
      ${ctxRow("Viewport", vp ? `${vp.width} × ${vp.height}` : null)}
    </table>
    ${e.errorMessage ? `<pre class="err">${esc(e.errorMessage)}</pre>` : ""}
  </article>`;
}

function renderHtml(entries: Entry[]): string {
  const body =
    entries.length === 0
      ? `<p class="ok">No snapshot mismatches in this run.</p>`
      : entries.map(renderEntry).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Visual diff report — ${entries.length} mismatch${entries.length === 1 ? "" : "es"}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root { color-scheme: light dark; }
    body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; background: #fafaf7; color: #1a1a1a; }
    h1 { font: 600 22px/1.2 "Cormorant Garamond", Georgia, serif; margin: 0 0 24px; }
    .ok { padding: 32px; text-align: center; color: #2a7a3a; background: #eef8f1; border-radius: 6px; }
    article.entry { background: #fff; border: 1px solid #e6e2d8; border-radius: 6px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    article header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0ece3; }
    h2 { font: 500 16px/1.3 ui-monospace, "SF Mono", monospace; margin: 0; word-break: break-word; }
    .project { font: 600 11px/1 ui-monospace, monospace; letter-spacing: 0.05em; text-transform: uppercase; background: #1a1a1a; color: #fff; padding: 4px 8px; border-radius: 3px; }
    .frames { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    figure { margin: 0; background: #f7f5ef; border: 1px solid #ede9dd; border-radius: 4px; padding: 8px; }
    figure.missing div { aspect-ratio: 4/3; display: grid; place-items: center; color: #999; }
    figcaption { font: 600 10px/1 ui-monospace, monospace; letter-spacing: 0.05em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    figure img { display: block; width: 100%; height: auto; background: #fff; border: 1px solid #eee; }
    table.meta { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.meta th { text-align: left; font-weight: 500; color: #666; padding: 4px 12px 4px 0; vertical-align: top; width: 220px; white-space: nowrap; }
    table.meta td { padding: 4px 0; font-family: ui-monospace, monospace; word-break: break-all; }
    pre.err { margin-top: 12px; padding: 12px; background: #fdf2f2; color: #842029; border: 1px solid #f5c2c7; border-radius: 4px; font: 12px/1.5 ui-monospace, monospace; overflow-x: auto; }
    @media (max-width: 900px) { .frames { grid-template-columns: 1fr; } table.meta th { width: 120px; } }
  </style>
</head>
<body>
  <h1>Visual diff report — ${entries.length} mismatch${entries.length === 1 ? "" : "es"}</h1>
  ${body}
</body>
</html>`;
}
