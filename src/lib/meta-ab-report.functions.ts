/**
 * Meta A/B dashboard data — admin-only aggregation server fn.
 *
 * Returns per-page-type × per-variant exposure and conversion totals,
 * with conversion rate, lift vs the default variant, and a basic
 * two-proportion z-test significance label.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export type EventType =
  | "add_to_cart"
  | "checkout_started"
  | "reached_checkout"
  | "purchase";

export interface VariantStats {
  variant: "A" | "B";
  bucket: 0 | 1;
  exposures: number;
  conversions: Record<EventType, number>;
  primaryConversions: number; // event chosen via `eventType` param
  conversionRate: number; // 0..1
}

export interface PageTypeReport {
  page_type: "home" | "collection";
  variants: VariantStats[];
  lift: number | null; // (B − A) / A on primary event
  significance: {
    z: number | null;
    p: number | null;
    label:
      | "Not enough data"
      | "Trending"
      | "Significant @ 95%"
      | "Significant @ 99%";
  };
}

export interface MetaAbReport {
  windowDays: number;
  eventType: EventType;
  generatedAt: string;
  pages: PageTypeReport[];
}

const inputSchema = z.object({
  days: z.number().int().min(1).max(180).optional(),
  eventType: z
    .enum(["add_to_cart", "checkout_started", "reached_checkout", "purchase"])
    .optional(),
});

const EVENT_TYPES: EventType[] = [
  "add_to_cart",
  "checkout_started",
  "reached_checkout",
  "purchase",
];

export const getMetaAbReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<MetaAbReport> => {
    const days = data.days ?? 30;
    const eventType = data.eventType ?? "add_to_cart";
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const [{ data: exposures }, { data: conversions }] = await Promise.all([
      supabaseAdmin
        .from("meta_ab_exposures")
        .select("page_type, variant")
        .gte("created_at", since)
        .eq("is_bot", false),
      supabaseAdmin
        .from("meta_ab_conversions")
        .select("page_type, variant, event_type")
        .gte("created_at", since),
    ]);

    const pageTypes: Array<"home" | "collection"> = ["home", "collection"];
    const pages: PageTypeReport[] = pageTypes.map((pt) => {
      const variantsArr: VariantStats[] = (["A", "B"] as const).map((v) => {
        const exp =
          exposures?.filter(
            (r: any) => r.page_type === pt && r.variant === v,
          ).length ?? 0;
        const convByType: Record<EventType, number> = {
          add_to_cart: 0,
          checkout_started: 0,
          reached_checkout: 0,
          purchase: 0,
        };
        for (const c of conversions ?? []) {
          if (
            (c as any).page_type === pt &&
            (c as any).variant === v &&
            EVENT_TYPES.includes((c as any).event_type)
          ) {
            convByType[(c as any).event_type as EventType] += 1;
          }
        }
        const primary = convByType[eventType];
        return {
          variant: v,
          bucket: v === "A" ? 0 : 1,
          exposures: exp,
          conversions: convByType,
          primaryConversions: primary,
          conversionRate: exp > 0 ? primary / exp : 0,
        };
      });

      const [a, b] = variantsArr;
      const lift =
        a.conversionRate > 0
          ? (b.conversionRate - a.conversionRate) / a.conversionRate
          : null;
      const significance = twoProportionZ(
        a.primaryConversions,
        a.exposures,
        b.primaryConversions,
        b.exposures,
      );

      return { page_type: pt, variants: variantsArr, lift, significance };
    });

    return {
      windowDays: days,
      eventType,
      generatedAt: new Date().toISOString(),
      pages,
    };
  });

/** Two-proportion z-test. Returns null fields when sample too small. */
function twoProportionZ(
  xA: number,
  nA: number,
  xB: number,
  nB: number,
): PageTypeReport["significance"] {
  if (nA < 100 || nB < 100) {
    return { z: null, p: null, label: "Not enough data" };
  }
  const pA = xA / nA;
  const pB = xB / nB;
  const pPool = (xA + xB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  if (se === 0) return { z: 0, p: 1, label: "Not enough data" };
  const z = (pB - pA) / se;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  let label: PageTypeReport["significance"]["label"] = "Trending";
  if (p < 0.01) label = "Significant @ 99%";
  else if (p < 0.05) label = "Significant @ 95%";
  return { z, p, label };
}

/** Abramowitz & Stegun 26.2.17 approximation. */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const probability =
    d *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - probability : probability;
}
