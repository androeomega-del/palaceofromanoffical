import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchProducts } from "@/lib/shopify";
import {
  homepageLayoutSchema,
  type HomepageLayout,
} from "@/lib/homepage-layout-schema";

/**
 * /api/public/cron/refresh-homepage-layout
 *
 * Called every ~48 hours by pg_cron. Atomic swap of `homepage_daily_layout`.
 *
 * GUARDRAIL: before wiping the current edition, check its conversion
 * performance against a rolling 7-day baseline. If it is >= 30% above
 * baseline (a "viral" edition), extend it by an additional 24 hours
 * rather than swapping. Underperforming or normal editions roll over
 * on schedule.
 *
 * Cold-start: if no signal data exists yet, fall back to Shopify
 * best sellers so the homepage always has something to render.
 */

const CYCLE_MS = 48 * 60 * 60 * 1000;
const EXTENSION_MS = 24 * 60 * 60 * 1000;
const OUTPERFORM_THRESHOLD = 1.3; // 30% above baseline
const BASELINE_WINDOW_DAYS = 7;
const MIN_CURRENT_SIGNAL = 25; // need at least this many sessions before we trust the lift

type ConversionStats = {
  sessions: number;
  conversions: number;
  rate: number;
};

async function computeWindowStats(since: Date, until: Date): Promise<ConversionStats> {
  // "Sessions" = unique session_ids that fired any interaction on the home / collection surface.
  const { data: sessionsData } = await supabaseAdmin
    .from("interaction_events")
    .select("session_id")
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString())
    .not("session_id", "is", null);

  const uniqueSessions = new Set<string>();
  for (const row of sessionsData ?? []) {
    if (row.session_id) uniqueSessions.add(row.session_id);
  }

  // "Conversions" = reached_checkout events from the same window.
  // `reached_checkout` is the strongest pre-purchase signal we capture
  // client-side without depending on a delayed Shopify webhook.
  const { count: conversions } = await supabaseAdmin
    .from("cart_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString())
    .eq("event_type", "reached_checkout");

  const sessions = uniqueSessions.size;
  const c = conversions ?? 0;
  return {
    sessions,
    conversions: c,
    rate: sessions > 0 ? c / sessions : 0,
  };
}

async function buildFallbackLayout(): Promise<HomepageLayout> {
  let products: Array<{ handle: string; title: string }> = [];
  try {
    const edges = await fetchProducts({ first: 12, sortKey: "BEST_SELLING" });
    products = edges
      .map((e) => ({ handle: e.node.handle, title: e.node.title }))
      .filter((p) => p.handle && p.title);
  } catch (err) {
    console.error("[refresh-homepage-layout] best-seller fetch failed:", err);
  }

  return homepageLayoutSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    source: "cold_start_fallback",
    blocks: [
      {
        id: "best-sellers",
        type: "product_rail",
        heading: "Best sellers — restocked",
        productHandles: products.map((p) => p.handle).slice(0, 12),
      },
    ],
  } satisfies HomepageLayout);
}

export const Route = createFileRoute("/api/public/cron/refresh-homepage-layout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const now = new Date();
        const url = new URL(request.url);
        const previewMode = url.searchParams.get("preview") === "true";

        // PREVIEW MODE: build a fresh layout and insert as pending/inactive.
        // Does not touch the currently active edition.
        if (previewMode) {
          const previewLayout = await buildFallbackLayout();
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("homepage_daily_layout")
            .insert({
              layout_json: previewLayout as never,
              is_active: false,
              status: "pending",
              generated_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          if (insertErr) {
            console.error("[refresh-homepage-layout] preview insert failed:", insertErr);
            return Response.json({ error: "insert_failed" }, { status: 500 });
          }
          return Response.json({
            action: "preview_created",
            new_layout_id: inserted.id,
            block_count: previewLayout.blocks.length,
          });
        }

        // 1. Load the currently active layout (if any).
        const { data: activeRow } = await supabaseAdmin
          .from("homepage_daily_layout")
          .select("id, generated_at")
          .eq("is_active", true)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 2. If we have an active layout, evaluate the guardrail before wiping.
        if (activeRow?.generated_at) {
          const activeSince = new Date(activeRow.generated_at);
          const ageMs = now.getTime() - activeSince.getTime();

          // Don't even consider swapping if the cycle hasn't elapsed.
          if (ageMs < CYCLE_MS) {
            return Response.json({
              action: "skipped",
              reason: "cycle_not_elapsed",
              age_hours: +(ageMs / 3.6e6).toFixed(2),
            });
          }

          // Conversion of the current edition vs a rolling 7-day baseline
          // ending at the start of this edition (so the two windows do not overlap).
          const baselineUntil = activeSince;
          const baselineSince = new Date(
            baselineUntil.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          );
          const [current, baseline] = await Promise.all([
            computeWindowStats(activeSince, now),
            computeWindowStats(baselineSince, baselineUntil),
          ]);

          const isOutperforming =
            baseline.rate > 0 &&
            current.sessions >= MIN_CURRENT_SIGNAL &&
            current.rate >= baseline.rate * OUTPERFORM_THRESHOLD;

          if (isOutperforming) {
            // Extend: don't swap, don't mutate the layout row.
            // The next cron tick (24h from now) will re-evaluate.
            const extendsUntil = new Date(now.getTime() + EXTENSION_MS);
            console.log(
              `[refresh-homepage-layout] extending viral edition ${activeRow.id} ` +
                `(current rate ${current.rate.toFixed(4)} vs baseline ${baseline.rate.toFixed(4)}, ` +
                `+${(((current.rate - baseline.rate) / baseline.rate) * 100).toFixed(1)}%)`,
            );
            return Response.json({
              action: "extended",
              layout_id: activeRow.id,
              extends_until: extendsUntil.toISOString(),
              current,
              baseline,
              lift_pct: ((current.rate - baseline.rate) / baseline.rate) * 100,
            });
          }
        }

        // 3. Proceed with atomic swap. (No active row, or normal/under-performing.)
        const nextLayout = await buildFallbackLayout();

        // Deactivate everything currently active first.
        const { error: deactivateErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .update({ is_active: false, status: "archived" })
          .eq("is_active", true);
        if (deactivateErr) {
          console.error("[refresh-homepage-layout] deactivate failed:", deactivateErr);
          return Response.json({ error: "deactivate_failed" }, { status: 500 });
        }

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("homepage_daily_layout")
          .insert({
            layout_json: nextLayout as never,
            is_active: true,
            status: "active",
            generated_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (insertErr) {
          console.error("[refresh-homepage-layout] insert failed:", insertErr);
          return Response.json({ error: "insert_failed" }, { status: 500 });
        }

        return Response.json({
          action: "swapped",
          previous_layout_id: activeRow?.id ?? null,
          new_layout_id: inserted.id,
          block_count: nextLayout.blocks.length,
        });
      },
    },
  },
});
