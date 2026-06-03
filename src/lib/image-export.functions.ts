/**
 * Admin image export — collects every image asset used across the live
 * site so an operator can pick high-resolution shots for Google Business
 * Profile (which requires >=720px on the short side).
 *
 * Read-only. Pulls from:
 *   - homepage_daily_layout.layout_json (hero + editorial banners)
 *   - lookbook_images                    (editorial / lookbook surfaces)
 *   - collection_images                  (collection heroes — w/h known)
 *   - bg_products.main_picture + .pictures (product photography)
 *
 * Dimensions and file size are best-effort: collection_images has w/h, the
 * rest is measured client-side via naturalWidth/Height after load.
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-middleware";

export type ImageGroup = "Hero" | "Lookbook" | "Banners" | "Collections" | "Products";

export type SiteImage = {
  url: string;
  group: ImageGroup;
  label: string;            // human surface label, e.g. "homepage / hero-1"
  context?: string;         // extra detail (alt text, brand, handle)
  width?: number | null;
  height?: number | null;
};

export const listSiteImages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ images: SiteImage[]; counts: Record<ImageGroup, number> }> => {
    const images: SiteImage[] = [];

    // ── Homepage layout: hero + editorial banners ─────────────────────
    const { data: layoutRow } = await supabaseAdmin
      .from("homepage_daily_layout")
      .select("layout_json")
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const blocks = ((layoutRow?.layout_json as { blocks?: unknown[] })?.blocks ?? []) as Array<{
      id?: string;
      type?: string;
      image?: string;
      video?: string;
      poster?: string;
      alt?: string;
      heading?: string;
    }>;

    for (const b of blocks) {
      const id = b.id ?? b.type ?? "block";
      if (b.type === "hero") {
        if (b.image) {
          images.push({
            url: b.image,
            group: "Hero",
            label: `homepage / ${id}`,
            context: b.alt ?? b.heading ?? undefined,
          });
        }
        if (b.poster && b.poster !== b.image) {
          images.push({
            url: b.poster,
            group: "Hero",
            label: `homepage / ${id} (poster)`,
            context: b.alt ?? b.heading ?? undefined,
          });
        }
      } else if (b.type === "editorial_banner" && b.image) {
        images.push({
          url: b.image,
          group: "Banners",
          label: `homepage / ${id}`,
          context: b.alt ?? b.heading ?? undefined,
        });
      }
    }

    // ── Lookbook images ───────────────────────────────────────────────
    const { data: lookbook } = await supabaseAdmin
      .from("lookbook_images")
      .select("image_url, surface_kind, surface_slug, edition_handle, chapter_key, alt_text")
      .limit(2000);
    for (const row of lookbook ?? []) {
      if (!row.image_url) continue;
      const kind = row.surface_kind ?? row.edition_handle ?? "lookbook";
      const slug = row.surface_slug ?? row.chapter_key ?? "";
      images.push({
        url: row.image_url,
        group: "Lookbook",
        label: slug ? `${kind} / ${slug}` : kind,
        context: row.alt_text ?? undefined,
      });
    }

    // ── Collection hero images (w/h available) ────────────────────────
    const { data: collections } = await supabaseAdmin
      .from("collection_images")
      .select("handle, title, image_url, width, height")
      .limit(2000);
    for (const row of collections ?? []) {
      if (!row.image_url) continue;
      images.push({
        url: row.image_url,
        group: "Collections",
        label: `collection / ${row.handle}`,
        context: row.title ?? undefined,
        width: row.width,
        height: row.height,
      });
    }

    // ── Product photography ───────────────────────────────────────────
    const { data: products } = await supabaseAdmin
      .from("bg_products")
      .select("handle, brand, name, main_picture, pictures")
      .eq("in_stock", true)
      .limit(4000);
    for (const row of products ?? []) {
      const pics = new Set<string>();
      if (row.main_picture) pics.add(row.main_picture);
      for (const p of row.pictures ?? []) if (p) pics.add(p);
      let i = 0;
      for (const url of pics) {
        i++;
        images.push({
          url,
          group: "Products",
          label: `product / ${row.handle}${i > 1 ? ` (#${i})` : ""}`,
          context: [row.brand, row.name].filter(Boolean).join(" — ") || undefined,
        });
      }
    }

    // Dedupe by URL, prefer the first (richer metadata) occurrence.
    const seen = new Set<string>();
    const deduped: SiteImage[] = [];
    for (const img of images) {
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      deduped.push(img);
    }

    const counts: Record<ImageGroup, number> = {
      Hero: 0,
      Lookbook: 0,
      Banners: 0,
      Collections: 0,
      Products: 0,
    };
    for (const img of deduped) counts[img.group]++;

    return { images: deduped, counts };
  });
