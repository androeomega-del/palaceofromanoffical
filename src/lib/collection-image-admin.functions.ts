// Admin-only server functions for remapping collection hero images.
// These use the admin client (bypasses RLS) — keep this route behind the
// `/admin` prefix and rotate the table to require auth before shipping
// publicly. For now they match the existing `/admin/collection-image-qa`
// pattern (noindex, unlinked, internal use).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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
