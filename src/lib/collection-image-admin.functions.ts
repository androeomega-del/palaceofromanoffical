// Admin-only server functions for remapping collection hero images.
// These use the admin client (bypasses RLS), so they are gated by the
// `requireAdmin` middleware which validates the caller's Supabase JWT and
// confirms an `admin` row in `user_roles` before any DB write runs.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-middleware";
import { fetchCollections } from "@/lib/shopify";

const handleSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, "Invalid handle");

const urlSchema = z.string().url().max(2048);

export const upsertCollectionImageOverride = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        handle: handleSchema,
        title: z.string().max(255).nullable().optional(),
        imageUrl: urlSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("collection_images").upsert({
      handle: data.handle.toLowerCase(),
      title: data.title ?? null,
      image_url: data.imageUrl,
      source: "manual",
      prompt: null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteCollectionImageOverride = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ handle: handleSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("collection_images")
      .delete()
      .eq("handle", data.handle.toLowerCase());
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ───────────────────────────────────────────────────────────────────────
// Focal point overrides (per-handle object-position editor)
// ───────────────────────────────────────────────────────────────────────

const percentSchema = z.number().min(0).max(100);

/**
 * Save or update a focal point for a handle. The handle row must already
 * exist in `collection_images` (sync first if needed). We only touch the
 * focal columns so we don't clobber `image_url` / `source` / `title`.
 */
export const upsertCollectionFocal = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        handle: handleSchema,
        focalX: percentSchema,
        focalY: percentSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const handle = data.handle.toLowerCase();
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("collection_images")
      .select("handle")
      .eq("handle", handle)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    if (!existing) {
      throw new Error(
        `No collection_images row for "${handle}". Sync from Shopify or add an image override first.`,
      );
    }

    const { error } = await supabaseAdmin
      .from("collection_images")
      .update({
        focal_x: Math.round(data.focalX * 10) / 10,
        focal_y: Math.round(data.focalY * 10) / 10,
      })
      .eq("handle", handle);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const clearCollectionFocal = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ handle: handleSchema }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("collection_images")
      .update({ focal_x: null, focal_y: null })
      .eq("handle", data.handle.toLowerCase());
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listCollectionImageOverrides = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("collection_images")
      .select("handle, title, image_url, source, updated_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Initial / on-demand sync of every Shopify collection's hero image into
 * `collection_images`. Skips collections without an image and preserves any
 * existing `manual` overrides (they win over Shopify's image).
 */
export const syncCollectionImagesFromShopify = createServerFn({ method: "POST" })
  .handler(async () => {
    const collections = await fetchCollections(250);

    // Load existing manual overrides so we don't clobber them.
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("collection_images")
      .select("handle, source");
    if (readErr) throw new Error(readErr.message);
    const manualHandles = new Set(
      (existing ?? [])
        .filter((r) => r.source === "manual")
        .map((r) => r.handle),
    );

    let synced = 0;
    let skippedNoImage = 0;
    let skippedManual = 0;
    const rows: Array<{
      handle: string;
      title: string | null;
      image_url: string;
      source: string;
      prompt: null;
      width: number | null;
      height: number | null;
    }> = [];

    for (const c of collections) {
      const handle = c.handle?.toLowerCase();
      if (!handle) continue;
      if (manualHandles.has(handle)) {
        skippedManual++;
        continue;
      }
      const url = c.image?.url;
      if (!url) {
        skippedNoImage++;
        continue;
      }
      rows.push({
        handle,
        title: c.title ?? null,
        image_url: url,
        source: "shopify",
        prompt: null,
        width: c.image?.width ?? null,
        height: c.image?.height ?? null,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from("collection_images")
        .upsert(rows, { onConflict: "handle" });
      if (error) throw new Error(error.message);
      synced = rows.length;
    }

    return {
      ok: true as const,
      total: collections.length,
      synced,
      skippedNoImage,
      skippedManual,
    };
  });
