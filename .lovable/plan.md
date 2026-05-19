## Goal

Whenever a new Shopify collection appears, `collectionImage({ handle })` should automatically resolve to a correct, on-topic hero image — no manual code edits, no missing or duplicated images.

## How it will work

```text
┌────────────────────┐   nightly cron   ┌──────────────────────────┐
│  Shopify Storefront│ ───────────────► │  /api/public/hooks/      │
│  collections(100)  │                  │  sync-collection-images  │
└────────────────────┘                  └──────────┬───────────────┘
                                                   │
                          ┌────────────────────────┼─────────────────────────┐
                          ▼                        ▼                         ▼
                  Shopify image exists?      No image + handle      Already in DB
                  → use it (CDN URL)         not in DB → generate    & fresh → skip
                                             via Lovable AI Gateway
                                             (gemini-3-pro-image)
                                             → upload to Supabase
                                             Storage `collection-images`
                                             → store public URL
                                                   │
                                                   ▼
                                       upsert collection_images
                                       (handle, title, image_url,
                                        source, updated_at)
```

At render time, `collectionImage({ handle })` looks up the DB-backed map (loaded once per request via a server fn + React Query cache). The existing hand-curated `BY_HANDLE` map becomes the **seed / fallback** so nothing regresses if sync hasn't run yet or the network is down.

## What gets built

### 1. Database (migration)

- `collection_images` table
  - `handle text primary key`
  - `title text`
  - `image_url text not null`
  - `source text` — `'shopify' | 'ai' | 'manual'`
  - `prompt text` (for AI rows, so we can regenerate)
  - `updated_at timestamptz default now()`
- Public read RLS (`select` to `anon`), writes only via service role.
- Storage bucket `collection-images` (public).

### 2. Sync server route — `src/routes/api/public/hooks/sync-collection-images.ts`

Public hook (apikey-protected via `pg_cron`). Flow:
1. Fetch all Shopify collections (handle, title, description, image).
2. For each handle:
   - If Shopify has its own `image.url` → upsert with `source='shopify'`.
   - Else if row already exists with `source in ('ai','manual')` → skip.
   - Else → call Lovable AI Gateway `google/gemini-3-pro-image-preview` with a prompt derived from title + description ("editorial studio photograph of {title}, luxury fashion, neutral background, 4:5"), download bytes, upload to `collection-images/{handle}.jpg`, upsert with `source='ai'`.
3. Return `{ added, updated, skipped, errors }`.

### 3. Nightly cron

`pg_cron` → POSTs to the route once a day at 03:00 UTC with `apikey: <anon>` header. New Shopify collections get images within 24h with no code change.

### 4. Read path — `src/lib/collection-image.ts`

- New server fn `getCollectionImageMap()` returns `Record<handle, url>` from the DB.
- `collectionImage({ handle, title })` resolution order:
  1. DB map (if loaded for this request)
  2. Existing `BY_HANDLE` static map (current 34 handles)
  3. Existing regex `FALLBACK_RULES`
  4. `all-products` default
- Caller sites (`collections.index.tsx`, `megamenu.tsx`) get the map via a TanStack Query that calls the server fn; while loading they render the static fallback so there's no flash.

### 5. Manual override

Admins can later insert a row with `source='manual'` and any image URL — sync will leave manual rows alone.

## Technical details

- **AI image generation**: `process.env.LOVABLE_API_KEY` + `https://ai.gateway.lovable.dev/v1/images/generations` with `model: google/gemini-3-pro-image-preview`, `size: 1024x1280`, returns base64 → uploaded via `supabaseAdmin.storage.from('collection-images').upload(...)`.
- **Auth**: route lives under `/api/public/*`, validated with the Supabase anon key in `apikey` header (matches our cron convention). No new secret needed; `LOVABLE_API_KEY` is already managed.
- **Idempotent**: re-runs are safe — Shopify-sourced URLs overwrite; AI/manual rows are preserved unless explicitly cleared.
- **No client bundle bloat**: existing static images stay as the offline fallback; new ones are served from Supabase Storage CDN (URLs only, no bundling).
- **Type generation**: Supabase types regenerate after the migration.

## Out of scope (call out)

- Backfilling: the existing 34 handles already have curated images — sync will fill `collection_images` from Shopify-supplied images where present, otherwise leave the static fallback in charge for those handles. We can re-run sync with a `force=true` query param later if you ever want every row regenerated.
- No admin UI for overrides in this pass — overrides happen via a direct DB row (or a future settings page).
