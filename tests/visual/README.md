# Visual regression tests

Pixel-based Playwright snapshots for the collection grid cards and the
megamenu feature tiles. Snapshots are stored under
`tests/visual/__snapshots__/` and are committed to the repo.

## First-time setup

```bash
bun run test:visual:install   # downloads Chromium + deps
```

## Run against the local dev server

```bash
bun run dev                   # in one terminal (defaults to :8080)
bun run test:visual           # in another
```

## Run against a deployed environment

```bash
PLAYWRIGHT_BASE_URL=https://palaceofroman.lovable.app bun run test:visual
```

## Update snapshots after intentional UI changes

```bash
bun run test:visual:update
```

Always review the diff in `playwright-report/` before committing new
baselines.

## What is covered

The set of asserted collections and megamenu departments is **derived at
test-setup time** by `tests/visual/global-setup.ts`, which calls
`fetchCollections()` and `buildDepartments()` from `src/lib/` and writes
`tests/visual/.fixtures.json`. Specs read that JSON and parameterise their
tests, so adding/removing a collection or editing `src/lib/nav-config.ts`
automatically updates the suite — no spec edits required.

- **Collection cards** (`/collections`):
  - full grid snapshot per viewport
  - per-card snapshot for each handle returned by `fetchCollections()` (capped at 12)
- **Megamenu**:
  - desktop: one test per department from `buildDepartments()`, snapshotting
    both the panel and the feature tile (asserts the rendered `data-handle`
    matches `nav-config.ts`)
  - mobile: the open nav drawer

## Viewports

| project              | size           |
| -------------------- | -------------- |
| `desktop-chromium`   | 1440 x 900     |
| `mobile-chromium`    | Pixel 7 preset |

## Stabilization

All snapshots are taken after:
- disabling transitions/animations via injected CSS
- waiting for `document.fonts.ready`
- waiting for every `<img>` to fire `load` or `error`
- a final 150 ms layout-settle delay

Tolerances (`playwright.config.ts`):
- `maxDiffPixelRatio: 0.01`
- `threshold: 0.2`

Bump these if hosted-font or CDN-image jitter produces false positives.
