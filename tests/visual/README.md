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

- **Collection cards** (`/collections`):
  - full grid snapshot per viewport
  - per-card snapshot keyed by collection handle (first 12 cards)
- **Megamenu**:
  - desktop: each top-level department panel and its feature tile
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
