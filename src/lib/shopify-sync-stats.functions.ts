import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ShopifySyncStats = {
  bgProducts: number;
  bgVariants: number;
  mappedSkus: number;
  mappedProducts: number;
  unmappedVariants: number;
  unmappedProducts: number;
  availableSkus: number;
  lastSyncedAt: string | null;
  coveragePct: number;
  topMissingBrands: Array<{ brand: string; missing: number }>;
  recentSyncs: Array<{ product_handle: string | null; synced_at: string }>;
};

async function countOf(
  q: { count: number | null; error: { message: string } | null },
  label: string,
): Promise<number> {
  if (q.error) throw new Error(`${label}: ${q.error.message}`);
  return q.count ?? 0;
}

export const getShopifySyncStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<ShopifySyncStats> => {
    const [bgProductsQ, bgVariantsQ, mappedSkusQ, availableSkusQ] = await Promise.all([
      supabaseAdmin.from("bg_products").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("bg_variants").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("shopify_variant_map").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("shopify_variant_map")
        .select("*", { count: "exact", head: true })
        .eq("available", true),
    ]);
    const bgProducts = await countOf(bgProductsQ, "bg_products");
    const bgVariants = await countOf(bgVariantsQ, "bg_variants");
    const mappedSkus = await countOf(mappedSkusQ, "shopify_variant_map");
    const availableSkus = await countOf(availableSkusQ, "available");

    const { data: distinctHandles, error: dhErr } = await supabaseAdmin
      .from("shopify_variant_map")
      .select("product_handle")
      .not("product_handle", "is", null)
      .limit(100000);
    if (dhErr) throw new Error(`distinct handles: ${dhErr.message}`);
    const mappedProducts = new Set(
      (distinctHandles ?? []).map((r) => r.product_handle as string)
    ).size;

    // Last sync time
    const { data: latest, error: latestErr } = await supabaseAdmin
      .from("shopify_variant_map")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) throw new Error(`latest: ${latestErr.message}`);

    // Recent sync activity (last 10)
    const { data: recent, error: recentErr } = await supabaseAdmin
      .from("shopify_variant_map")
      .select("product_handle, synced_at")
      .order("synced_at", { ascending: false })
      .limit(10);
    if (recentErr) throw new Error(`recent: ${recentErr.message}`);

    // Top missing brands — products that have NO variant mapped yet
    const { data: mappedHandlesAll } = await supabaseAdmin
      .from("shopify_variant_map")
      .select("product_handle")
      .not("product_handle", "is", null)
      .limit(100000);
    const mappedSet = new Set(
      (mappedHandlesAll ?? []).map((r) => r.product_handle as string)
    );

    const { data: bgRows, error: bgErr } = await supabaseAdmin
      .from("bg_products")
      .select("handle, brand")
      .limit(100000);
    if (bgErr) throw new Error(`bg list: ${bgErr.message}`);

    const missingByBrand = new Map<string, number>();
    let unmappedProducts = 0;
    for (const r of bgRows ?? []) {
      if (!mappedSet.has(r.handle)) {
        unmappedProducts++;
        const key = r.brand ?? "(unknown)";
        missingByBrand.set(key, (missingByBrand.get(key) ?? 0) + 1);
      }
    }
    const topMissingBrands = Array.from(missingByBrand.entries())
      .map(([brand, missing]) => ({ brand, missing }))
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 10);

    const unmappedVariants = Math.max(0, bgVariants - mappedSkus);
    const coveragePct = bgVariants > 0 ? (mappedSkus / bgVariants) * 100 : 0;

    return {
      bgProducts,
      bgVariants,
      mappedSkus,
      mappedProducts,
      unmappedVariants,
      unmappedProducts,
      availableSkus,
      lastSyncedAt: latest?.synced_at ?? null,
      coveragePct,
      topMissingBrands,
      recentSyncs: (recent ?? []) as ShopifySyncStats["recentSyncs"],
    };
  });
