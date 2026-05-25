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

/**
 * Manual override: flip the most recent edition to active without invoking
 * the cron generator. Use when automation has stalled and you just need the
 * homepage to render the latest curated content immediately. Bypasses the
 * 48-hour cool-down because it does not generate — it only republishes.
 */
export const forcePublishLatest = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data: latest, error: selErr } = await supabaseAdmin
      .from("homepage_daily_layout")
      .select("id")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!latest) {
      throw new Error(
        "No editions exist yet. Use 'Force refresh now' to generate the first one.",
      );
    }
    const { error: deErr } = await supabaseAdmin
      .from("homepage_daily_layout")
      .update({ is_active: false, status: "archived" })
      .eq("is_active", true)
      .neq("id", latest.id);
    if (deErr) throw new Error(deErr.message);
    const { error } = await supabaseAdmin
      .from("homepage_daily_layout")
      .update({
        is_active: true,
        status: "active",
        generated_at: new Date().toISOString(),
      })
      .eq("id", latest.id);
    if (error) throw new Error(error.message);
    return { ok: true, layout_id: latest.id };
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

/**
 * Troubleshooting snapshot for the homepage curation pipeline.
 * Surfaces the most common reasons the live homepage may not have changed:
 *   - no active edition (cold-start needed)
 *   - cycle guardrail still preventing a swap
 *   - AI compose failed last cycle (source = cold_start_fallback)
 *   - layout JSON fails schema validation
 *   - a pending preview was generated but never activated
 *   - frontend code changes pending a Publish (informational)
 */
export const diagnoseHomepage = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const CYCLE_MS = 48 * 60 * 60 * 1000;
    const now = Date.now();

    const { data: active } = await supabaseAdmin
      .from("homepage_daily_layout")
      .select("id, layout_json, generated_at, status, is_active")
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: pendingPreviews } = await supabaseAdmin
      .from("homepage_daily_layout")
      .select("id, generated_at, status")
      .eq("is_active", false)
      .eq("status", "staged")
      .order("generated_at", { ascending: false })
      .limit(5);

    type Issue = {
      severity: "ok" | "info" | "warning" | "error";
      code: string;
      title: string;
      detail: string;
      action?: string;
    };
    const issues: Issue[] = [];

    // 1. Active edition presence
    if (!active) {
      issues.push({
        severity: "error",
        code: "no_active_edition",
        title: "No active homepage edition",
        detail:
          "There is no row marked is_active=true in homepage_daily_layout. The live homepage is rendering its cold-start fallback layout.",
        action: "Click Force refresh now to generate and activate an edition.",
      });
    }

    // 2. Cycle guardrail
    let ageHours: number | null = null;
    let nextEligibleAt: string | null = null;
    if (active?.generated_at) {
      const generatedMs = new Date(active.generated_at).getTime();
      ageHours = (now - generatedMs) / 3.6e6;
      const elapsed = now - generatedMs;
      if (elapsed < CYCLE_MS) {
        const nextMs = generatedMs + CYCLE_MS;
        nextEligibleAt = new Date(nextMs).toISOString();
        issues.push({
          severity: "info",
          code: "cycle_not_elapsed",
          title: "Scheduled cron will skip until 48h have passed",
          detail: `Active edition is ${ageHours.toFixed(1)}h old. The pg_cron job returns "skipped: cycle_not_elapsed" until ${new Date(nextMs).toLocaleString()}.`,
          action:
            "Force refresh now bypasses this guard (archives the current edition before re-running).",
        });
      }
    }

    // 3. Source detection (cold-start fallback = AI failed)
    const layout = (active?.layout_json ?? null) as
      | { source?: string; blocks?: unknown[] }
      | null;
    const source = layout?.source ?? null;
    if (source === "cold_start_fallback") {
      issues.push({
        severity: "warning",
        code: "ai_fallback_active",
        title: "Live homepage is on the cold-start fallback",
        detail:
          "The last cron run could not reach Claude (or it returned invalid JSON), so the safety-net layout shipped instead. Check worker logs for [refresh-homepage-layout] AI compose failed.",
        action:
          "Re-run Force refresh now. If the source stays cold_start_fallback, the LLM provider is the blocker.",
      });
    } else if (source === "manual") {
      issues.push({
        severity: "info",
        code: "manual_override",
        title: "Live homepage is a hand-edited layout",
        detail:
          "Current edition's source is 'manual' — it was last saved through the JSON editor, not generated by the cron.",
      });
    }

    // 4. Schema validation
    if (active?.layout_json) {
      const parsed = homepageLayoutSchema.safeParse(active.layout_json);
      if (!parsed.success) {
        const firstErr = parsed.error.issues[0];
        issues.push({
          severity: "error",
          code: "schema_invalid",
          title: "Active layout JSON fails schema validation",
          detail: `${firstErr?.path.join(".") || "(root)"}: ${firstErr?.message || "validation error"}`,
          action:
            "Open the Layout JSON editor and correct the highlighted field, or Force refresh now to regenerate.",
        });
      }
    }

    // 5. Pending previews never activated
    if ((pendingPreviews?.length ?? 0) > 0) {
      issues.push({
        severity: "info",
        code: "pending_preview_unactivated",
        title: `${pendingPreviews!.length} preview edition${pendingPreviews!.length === 1 ? "" : "s"} not yet activated`,
        detail:
          "Generate preview creates editions with status='pending'. They do NOT appear on the live site until you Re-activate them from the Recent editions list.",
      });
    }

    // 6. Frontend vs backend (always-on reminder)
    issues.push({
      severity: "info",
      code: "publish_required_for_code",
      title: "Frontend code changes require Publish → Update",
      detail:
        "Layout swaps in this table go live instantly (visitors are pushed via realtime). But UI/component code only goes live after you click Publish → Update in the Lovable editor.",
    });

    if (issues.every((i) => i.severity === "info")) {
      issues.unshift({
        severity: "ok",
        code: "healthy",
        title: "Homepage curation pipeline looks healthy",
        detail: "Active edition is valid, fresh, and AI-composed.",
      });
    }

    return {
      active_id: active?.id ?? null,
      active_generated_at: active?.generated_at ?? null,
      active_age_hours: ageHours,
      next_cron_eligible_at: nextEligibleAt,
      source,
      block_count: Array.isArray(layout?.blocks) ? layout!.blocks!.length : 0,
      pending_preview_count: pendingPreviews?.length ?? 0,
      issues,
    };
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
