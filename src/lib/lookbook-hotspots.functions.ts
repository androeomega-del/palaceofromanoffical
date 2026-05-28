/**
 * Lookbook hotspot correction — server fns for the admin tool that lets us
 * audit and fix mis-tagged product placements on shoppable images.
 *
 * Backed by `lookbook_images` (one row per shoppable image, grouped by
 * `surface_kind` / `surface_slug`) and `lookbook_hotspots` (one row per pin
 * on an image, linking to a Shopify `product_handle`). All writes go through
 * `requireAdmin` so the public can never mutate placements.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-middleware";

const uuid = z.string().uuid();
const surfaceKind = z.string().min(1).max(64);
const surfaceSlug = z.string().min(1).max(255);
const handle = z.string().min(1).max(255).regex(/^[a-z0-9-]+$/);

export type LookbookImageRow = {
  id: string;
  surface_kind: string | null;
  surface_slug: string | null;
  chapter_key: string | null;
  edition_handle: string;
  image_url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  updated_at: string;
};

export type LookbookHotspotRow = {
  id: string;
  lookbook_image_id: string;
  product_handle: string;
  label: string | null;
  x: number;
  y: number;
  sort_order: number;
  surface_kind: string | null;
  surface_slug: string | null;
};

export type LookbookImageWithCount = LookbookImageRow & {
  hotspot_count: number;
};

// ─── List ──────────────────────────────────────────────────────────────
export const listLookbookImages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { surface_kind?: string; search?: string } | undefined) =>
      z
        .object({
          surface_kind: surfaceKind.optional(),
          search: z.string().max(200).optional(),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("lookbook_images")
      .select(
        "id, surface_kind, surface_slug, chapter_key, edition_handle, image_url, alt_text, width, height, sort_order, updated_at",
      )
      .order("surface_kind", { ascending: true, nullsFirst: false })
      .order("surface_slug", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .limit(500);
    if (data.surface_kind) q = q.eq("surface_kind", data.surface_kind);
    if (data.search && data.search.trim().length > 0) {
      const s = `%${data.search.trim()}%`;
      q = q.or(
        `surface_slug.ilike.${s},alt_text.ilike.${s},edition_handle.ilike.${s}`,
      );
    }
    const { data: imgs, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (imgs ?? []).map((r) => r.id);
    let counts = new Map<string, number>();
    if (ids.length) {
      const { data: spots, error: sErr } = await supabaseAdmin
        .from("lookbook_hotspots")
        .select("lookbook_image_id")
        .in("lookbook_image_id", ids);
      if (sErr) throw new Error(sErr.message);
      for (const s of spots ?? []) {
        counts.set(
          s.lookbook_image_id,
          (counts.get(s.lookbook_image_id) ?? 0) + 1,
        );
      }
    }
    return {
      items: (imgs ?? []).map(
        (r) =>
          ({
            ...r,
            hotspot_count: counts.get(r.id) ?? 0,
          }) as LookbookImageWithCount,
      ),
    };
  });

// ─── Single image + hotspots ───────────────────────────────────────────
export const getLookbookImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const { data: img, error: iErr } = await supabaseAdmin
      .from("lookbook_images")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (iErr) throw new Error(iErr.message);
    if (!img) throw new Error("Image not found");

    const { data: spots, error: sErr } = await supabaseAdmin
      .from("lookbook_hotspots")
      .select(
        "id, lookbook_image_id, product_handle, label, x, y, sort_order, surface_kind, surface_slug",
      )
      .eq("lookbook_image_id", data.id)
      .order("sort_order", { ascending: true });
    if (sErr) throw new Error(sErr.message);

    return {
      image: img as LookbookImageRow,
      hotspots: (spots ?? []) as LookbookHotspotRow[],
    };
  });

// ─── Create image ──────────────────────────────────────────────────────
export const createLookbookImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: {
      surface_kind: string;
      surface_slug: string;
      edition_handle?: string;
      chapter_key?: string;
      image_url: string;
      alt_text?: string;
      sort_order?: number;
    }) =>
      z
        .object({
          surface_kind: surfaceKind,
          surface_slug: surfaceSlug,
          edition_handle: z.string().min(1).max(255).optional(),
          chapter_key: z.string().min(1).max(255).optional(),
          image_url: z.string().url().max(2048),
          alt_text: z.string().max(500).optional(),
          sort_order: z.number().int().min(0).max(9999).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("lookbook_images")
      .insert({
        surface_kind: data.surface_kind,
        surface_slug: data.surface_slug,
        edition_handle: data.edition_handle ?? data.surface_slug,
        chapter_key: data.chapter_key ?? null,
        image_url: data.image_url,
        alt_text: data.alt_text ?? null,
        sort_order: data.sort_order ?? 0,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { image: row as LookbookImageRow };
  });

// ─── Hotspot mutations ────────────────────────────────────────────────
export const createHotspot = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: {
      lookbook_image_id: string;
      x: number;
      y: number;
      product_handle: string;
      label?: string;
    }) =>
      z
        .object({
          lookbook_image_id: uuid,
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
          product_handle: handle,
          label: z.string().max(120).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: img } = await supabaseAdmin
      .from("lookbook_images")
      .select("surface_kind, surface_slug")
      .eq("id", data.lookbook_image_id)
      .maybeSingle();
    const { data: row, error } = await supabaseAdmin
      .from("lookbook_hotspots")
      .insert({
        lookbook_image_id: data.lookbook_image_id,
        x: data.x,
        y: data.y,
        product_handle: data.product_handle,
        label: data.label ?? null,
        surface_kind: img?.surface_kind ?? null,
        surface_slug: img?.surface_slug ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("homepage_layout_audit").insert({
      action: "hotspot_create",
      actor: context.userId ?? "admin",
      details: {
        hotspot_id: row.id,
        lookbook_image_id: data.lookbook_image_id,
        surface_kind: img?.surface_kind ?? null,
        surface_slug: img?.surface_slug ?? null,
        product_handle: data.product_handle,
        label: data.label ?? null,
        x: data.x,
        y: data.y,
      },
    });
    return { hotspot: row as LookbookHotspotRow };
  });


export const updateHotspot = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: {
      id: string;
      product_handle?: string;
      label?: string | null;
      x?: number;
      y?: number;
    }) =>
      z
        .object({
          id: uuid,
          product_handle: handle.optional(),
          label: z.string().max(120).nullable().optional(),
          x: z.number().min(0).max(100).optional(),
          y: z.number().min(0).max(100).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {

    const patch: {
      product_handle?: string;
      label?: string | null;
      x?: number;
      y?: number;
    } = {};
    if (data.product_handle !== undefined)
      patch.product_handle = data.product_handle;
    if (data.label !== undefined) patch.label = data.label;
    if (data.x !== undefined) patch.x = data.x;
    if (data.y !== undefined) patch.y = data.y;
    if (Object.keys(patch).length === 0) return { ok: true as const };

    // Audit: record before/after for the hotspot
    const { data: before } = await supabaseAdmin
      .from("lookbook_hotspots")
      .select("id, product_handle, label, surface_kind, surface_slug")
      .eq("id", data.id)
      .maybeSingle();

    const { data: row, error } = await supabaseAdmin
      .from("lookbook_hotspots")
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (before) {
      await supabaseAdmin.from("homepage_layout_audit").insert({
        action: "hotspot_update",
        actor: context.userId ?? "admin",

        details: {
          hotspot_id: data.id,
          surface_kind: before.surface_kind,
          surface_slug: before.surface_slug,
          before: {
            product_handle: before.product_handle,
            label: before.label,
          },
          after: { product_handle: row.product_handle, label: row.label },
        },
      });
    }
    return { hotspot: row as LookbookHotspotRow };
  });

export const deleteHotspot = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {

    const { data: before } = await supabaseAdmin
      .from("lookbook_hotspots")
      .select("id, product_handle, label, surface_kind, surface_slug")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("lookbook_hotspots")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (before) {
      await supabaseAdmin.from("homepage_layout_audit").insert({
        action: "hotspot_delete",
        actor: context.userId ?? "admin",

        details: {
          hotspot_id: data.id,
          surface_kind: before.surface_kind,
          surface_slug: before.surface_slug,
          removed: {
            product_handle: before.product_handle,
            label: before.label,
          },
        },
      });
    }
    return { ok: true as const };
  });

// ─── Bulk update: reassign many hotspots to a single product handle ────
export const bulkUpdateHotspots = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { ids: string[]; product_handle: string; label?: string | null }) =>
      z
        .object({
          ids: z.array(uuid).min(1).max(200),
          product_handle: handle,
          label: z.string().max(120).nullable().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {

    const { data: before } = await supabaseAdmin
      .from("lookbook_hotspots")
      .select("id, product_handle, label, surface_kind, surface_slug")
      .in("id", data.ids);

    const patch: { product_handle: string; label?: string | null } = {
      product_handle: data.product_handle,
    };
    if (data.label !== undefined) patch.label = data.label;

    const { error } = await supabaseAdmin
      .from("lookbook_hotspots")
      .update(patch)
      .in("id", data.ids);
    if (error) throw new Error(error.message);

    if (before && before.length) {
      await supabaseAdmin.from("homepage_layout_audit").insert({
        action: "hotspot_bulk_update",
        actor: context.userId ?? "admin",
        details: {
          count: before.length,
          after: { product_handle: data.product_handle, label: data.label ?? null },
          before: before.map((b) => ({
            hotspot_id: b.id,
            product_handle: b.product_handle,
            label: b.label,
            surface_kind: b.surface_kind,
            surface_slug: b.surface_slug,
          })),
        },
      });
    }
    return { updated: before?.length ?? 0 };
  });

// ─── Catalog search (for picking replacement product) ──────────────────
export type CatalogSearchResult = {
  sku: string;
  handle: string;
  name: string | null;
  brand: string | null;
  color: string | null;
  category: string | null;
  subcategory: string | null;
  main_picture: string | null;
  in_stock: boolean;
};

export const searchCatalogForHotspot = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { q: string; limit?: number }) =>
    z
      .object({
        q: z.string().min(1).max(120),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim();
    const term = `%${q}%`;
    const { data: rows, error } = await supabaseAdmin
      .from("bg_products")
      .select(
        "group_sku, handle, name, brand, color, category, subcategory, main_picture, in_stock",
      )
      .or(
        [
          `handle.ilike.${term}`,
          `name.ilike.${term}`,
          `brand.ilike.${term}`,
          `color.ilike.${term}`,
          `category.ilike.${term}`,
          `subcategory.ilike.${term}`,
          `group_sku.ilike.${term}`,
        ].join(","),
      )
      .order("in_stock", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return {
      items: (rows ?? []).map(
        (r) =>
          ({
            sku: r.group_sku,
            handle: r.handle,
            name: r.name,
            brand: r.brand,
            color: r.color,
            category: r.category,
            subcategory: r.subcategory,
            main_picture: r.main_picture,
            in_stock: !!r.in_stock,
          }) as CatalogSearchResult,
      ),
    };
  });

// ─── Lookup a product by handle (to show "currently linked" details) ───
export const getCatalogProductByHandle = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { handle: string }) =>
    z.object({ handle: handle }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("bg_products")
      .select(
        "group_sku, handle, name, brand, color, category, subcategory, main_picture, in_stock",
      )
      .eq("handle", data.handle)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { product: null };
    return {
      product: {
        sku: row.group_sku,
        handle: row.handle,
        name: row.name,
        brand: row.brand,
        color: row.color,
        category: row.category,
        subcategory: row.subcategory,
        main_picture: row.main_picture,
        in_stock: !!row.in_stock,
      } as CatalogSearchResult,
    };
  });

// ─── Public reader: get hotspots for a (surface_kind, surface_slug) ────
// Public — used by the storefront to render shoppable overlays from DB.
// Returns null when nothing has been seeded for that surface yet, so the
// caller can fall back to its inline hotspot array.
export const getLookbookForSurface = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { surface_kind: string; surface_slug: string; chapter_key?: string }) =>
      z
        .object({
          surface_kind: surfaceKind,
          surface_slug: surfaceSlug,
          chapter_key: z.string().min(1).max(255).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("lookbook_images")
      .select(
        "id, surface_kind, surface_slug, chapter_key, image_url, alt_text, sort_order",
      )
      .eq("surface_kind", data.surface_kind)
      .eq("surface_slug", data.surface_slug)
      .order("sort_order", { ascending: true })
      .limit(1);
    if (data.chapter_key) q = q.eq("chapter_key", data.chapter_key);
    const { data: imgs, error } = await q;
    if (error) throw new Error(error.message);
    const img = imgs?.[0];
    if (!img) return { image: null, hotspots: [] as LookbookHotspotRow[] };
    const { data: spots, error: sErr } = await supabaseAdmin
      .from("lookbook_hotspots")
      .select(
        "id, lookbook_image_id, product_handle, label, x, y, sort_order, surface_kind, surface_slug",
      )
      .eq("lookbook_image_id", img.id)
      .order("sort_order", { ascending: true });
    if (sErr) throw new Error(sErr.message);
    return {
      image: img as Pick<
        LookbookImageRow,
        | "id"
        | "surface_kind"
        | "surface_slug"
        | "chapter_key"
        | "image_url"
        | "alt_text"
        | "sort_order"
      >,
      hotspots: (spots ?? []) as LookbookHotspotRow[],
    };
  });

// ─── Seed homepage layout hotspots into the lookbook tables ────────────
// Walks the active homepage_daily_layout.layout_json and inserts every
// editorial_banner block that has at least one hotspot. Idempotent on
// (surface_kind='homepage', surface_slug=block.id): skips blocks whose
// image+hotspots are already present.
export const seedLookbookFromHomepage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data: layoutRow, error: lErr } = await supabaseAdmin
      .from("homepage_daily_layout")
      .select("id, layout_json")
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lErr) throw new Error(lErr.message);
    if (!layoutRow) return { inserted_images: 0, inserted_hotspots: 0, skipped: 0 };

    const blocks = ((layoutRow.layout_json as { blocks?: unknown[] })?.blocks ?? []) as Array<{
      id?: string;
      type?: string;
      image?: string;
      alt?: string;
      hotspots?: Array<{
        x: number;
        y: number;
        handle: string;
        label?: string;
        sublabel?: string;
      }>;
    }>;

    let insertedImages = 0;
    let insertedHotspots = 0;
    let skipped = 0;

    for (const b of blocks) {
      if (b.type !== "editorial_banner" || !b.id || !b.image) continue;
      if (!b.hotspots || b.hotspots.length === 0) continue;

      const slug = b.id.slice(0, 200);

      // Skip if already seeded
      const { data: existing } = await supabaseAdmin
        .from("lookbook_images")
        .select("id")
        .eq("surface_kind", "homepage")
        .eq("surface_slug", slug)
        .limit(1)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      const { data: imgRow, error: iErr } = await supabaseAdmin
        .from("lookbook_images")
        .insert({
          surface_kind: "homepage",
          surface_slug: slug,
          edition_handle: "homepage",
          chapter_key: null,
          image_url: b.image,
          alt_text: b.alt ?? null,
          sort_order: 0,
          external_id: b.id,
        })
        .select("id")
        .single();
      if (iErr) throw new Error(iErr.message);
      insertedImages++;

      const rows = b.hotspots.map((h, i) => ({
        lookbook_image_id: imgRow!.id,
        x: h.x,
        y: h.y,
        product_handle: h.handle,
        label: h.label ?? null,
        sort_order: i,
        surface_kind: "homepage",
        surface_slug: slug,
      }));
      const { error: sErr } = await supabaseAdmin
        .from("lookbook_hotspots")
        .insert(rows);
      if (sErr) throw new Error(sErr.message);
      insertedHotspots += rows.length;
    }

    return { inserted_images: insertedImages, inserted_hotspots: insertedHotspots, skipped };
  });

// ─── Validate hotspot handles against catalog ─────────────────────────
// Returns every hotspot whose product_handle is not present in bg_products,
// grouped by image so the admin can jump in and fix each one. Also flags
// handles that exist but are out of stock (warning, not invalid).
export type InvalidHotspot = {
  hotspot_id: string;
  product_handle: string;
  label: string | null;
  surface_kind: string | null;
  surface_slug: string | null;
  lookbook_image_id: string;
  image_url: string;
  alt_text: string | null;
  reason: "missing" | "out_of_stock";
};

export const validateLookbookHotspots = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data: spots, error } = await supabaseAdmin
      .from("lookbook_hotspots")
      .select(
        "id, product_handle, label, surface_kind, surface_slug, lookbook_image_id",
      )
      .limit(5000);
    if (error) throw new Error(error.message);
    const all = spots ?? [];
    const handles = Array.from(new Set(all.map((s) => s.product_handle)));
    if (handles.length === 0) {
      return { total: 0, checked: 0, invalid: [] as InvalidHotspot[] };
    }

    // Chunk to avoid PostgREST URL limits
    const chunks: string[][] = [];
    for (let i = 0; i < handles.length; i += 200) chunks.push(handles.slice(i, i + 200));
    const stockByHandle = new Map<string, boolean>();
    for (const c of chunks) {
      const { data: rows, error: pErr } = await supabaseAdmin
        .from("bg_products")
        .select("handle, in_stock")
        .in("handle", c);
      if (pErr) throw new Error(pErr.message);
      for (const r of rows ?? []) stockByHandle.set(r.handle, !!r.in_stock);
    }

    const imageIds = Array.from(new Set(all.map((s) => s.lookbook_image_id)));
    const imageMap = new Map<
      string,
      { image_url: string; alt_text: string | null }
    >();
    for (let i = 0; i < imageIds.length; i += 200) {
      const c = imageIds.slice(i, i + 200);
      const { data: imgs, error: iErr } = await supabaseAdmin
        .from("lookbook_images")
        .select("id, image_url, alt_text")
        .in("id", c);
      if (iErr) throw new Error(iErr.message);
      for (const r of imgs ?? [])
        imageMap.set(r.id, { image_url: r.image_url, alt_text: r.alt_text });
    }

    const invalid: InvalidHotspot[] = [];
    for (const s of all) {
      const has = stockByHandle.has(s.product_handle);
      if (!has) {
        const img = imageMap.get(s.lookbook_image_id);
        invalid.push({
          hotspot_id: s.id,
          product_handle: s.product_handle,
          label: s.label,
          surface_kind: s.surface_kind,
          surface_slug: s.surface_slug,
          lookbook_image_id: s.lookbook_image_id,
          image_url: img?.image_url ?? "",
          alt_text: img?.alt_text ?? null,
          reason: "missing",
        });
        continue;
      }
      if (stockByHandle.get(s.product_handle) === false) {
        const img = imageMap.get(s.lookbook_image_id);
        invalid.push({
          hotspot_id: s.id,
          product_handle: s.product_handle,
          label: s.label,
          surface_kind: s.surface_kind,
          surface_slug: s.surface_slug,
          lookbook_image_id: s.lookbook_image_id,
          image_url: img?.image_url ?? "",
          alt_text: img?.alt_text ?? null,
          reason: "out_of_stock",
        });
      }
    }
    return { total: all.length, checked: handles.length, invalid };
  });

