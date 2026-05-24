import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { homepageLayoutSchema } from "@/lib/homepage-layout-schema";

/* =========================================================================
 * HOMEPAGE CURATION
 * =======================================================================*/

export const getHomepageCuration = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const [activeRes, recentRes] = await Promise.all([
      supabaseAdmin
        .from("homepage_daily_layout")
        .select("id, layout_json, generated_at, created_at, status, is_active")
        .eq("is_active", true)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("homepage_daily_layout")
        .select("id, generated_at, created_at, status, is_active")
        .order("generated_at", { ascending: false })
        .limit(20),
    ]);
    return {
      active: activeRes.data ?? null,
      recent: recentRes.data ?? [],
    };
  });

export const updateHomepageLayoutJson = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; layout_json: unknown }) => d)
  .handler(async ({ data }) => {
    const parsed = homepageLayoutSchema.parse(data.layout_json);
    const { error } = await supabaseAdmin
      .from("homepage_daily_layout")
      .update({ layout_json: parsed as never })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const activateHomepageLayout = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { error: deErr } = await supabaseAdmin
      .from("homepage_daily_layout")
      .update({ is_active: false, status: "archived" })
      .eq("is_active", true);
    if (deErr) throw new Error(deErr.message);
    const { error } = await supabaseAdmin
      .from("homepage_daily_layout")
      .update({
        is_active: true,
        status: "active",
        generated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const forceRefreshHomepage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    // Archive current active so the cycle-elapsed guard does not skip.
    await supabaseAdmin
      .from("homepage_daily_layout")
      .update({
        is_active: false,
        status: "archived",
        generated_at: new Date(Date.now() - 49 * 3600 * 1000).toISOString(),
      })
      .eq("is_active", true);

    // Trigger the cron route on the same host.
    const base =
      process.env.SITE_URL ||
      process.env.VITE_SITE_URL ||
      "https://palaceofroman.lovable.app";
    const res = await fetch(`${base}/api/public/cron/refresh-homepage-layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  });

/**
 * Generate a preview edition WITHOUT touching the currently active layout.
 * The new edition is inserted as `status='pending', is_active=false` so it
 * shows up in "Recent editions" and can be re-activated to preview.
 */
export const generateHomepagePreview = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const base =
      process.env.SITE_URL ||
      process.env.VITE_SITE_URL ||
      "https://palaceofroman.lovable.app";
    const res = await fetch(
      `${base}/api/public/cron/refresh-homepage-layout?preview=true`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
    );
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  });

/* =========================================================================
 * DYNAMIC LANDING PAGES
 * =======================================================================*/

export const listLandingPages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("dynamic_landing_pages")
      .select(
        "id, slug, signal_type, source_term, priority_score, status, generated_at, expires_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateLandingPageStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; status: "staged" | "active" | "expired" }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("dynamic_landing_pages")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLandingPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("dynamic_landing_pages")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* =========================================================================
 * TRENDING BRANDS
 * =======================================================================*/

const trendingBrandSchema = z.object({
  brand_name: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  trend_status: z.string().min(1).max(80),
  key_aesthetic: z.string().min(1).max(240),
});

export const listTrendingBrands = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("trending_brands")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertTrendingBrand = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: {
    id?: string;
    brand_name: string;
    category: string;
    trend_status: string;
    key_aesthetic: string;
  }) => d)
  .handler(async ({ data }) => {
    const fields = trendingBrandSchema.parse({
      brand_name: data.brand_name,
      category: data.category,
      trend_status: data.trend_status,
      key_aesthetic: data.key_aesthetic,
    });
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("trending_brands")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("trending_brands").insert(fields);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTrendingBrand = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("trending_brands")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* =========================================================================
 * PRODUCT REVIEWS MODERATION
 * =======================================================================*/

export const listReviews = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { status?: "pending" | "approved" | "rejected" | "all" }) => d ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data?.status && data.status !== "all") {
      q = q.eq("status", data.status);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "pending" }) => d)
  .handler(async ({ data, context }) => {
    const isApproved = data.status === "approved";
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .update({
        status: data.status,
        updated_at: new Date().toISOString(),
        approved_at: isApproved ? new Date().toISOString() : null,
        approved_by: isApproved ? context.userId : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* =========================================================================
 * INBOX (read-only dashboards)
 * =======================================================================*/

export const getInbox = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const [contact, newsletter, stock, carts] = await Promise.all([
      supabaseAdmin
        .from("contact_messages")
        .select("id, name, email, subject, message, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("newsletter_subscribers")
        .select("id, email, source, marketing_consent, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("stock_alert_subscriptions")
        .select(
          "id, email, product_handle, product_title, variant_title, price_usd, notified_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("abandoned_carts")
        .select(
          "id, email, customer_name, item_count, total_usd, checkout_url, recovered_at, recovery_email_count, last_activity_at, created_at",
        )
        .order("last_activity_at", { ascending: false })
        .limit(100),
    ]);
    return {
      contact_messages: contact.data ?? [],
      newsletter: newsletter.data ?? [],
      stock_alerts: stock.data ?? [],
      abandoned_carts: carts.data ?? [],
    };
  });
