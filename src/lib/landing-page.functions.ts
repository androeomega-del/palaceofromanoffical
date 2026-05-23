// Public + admin server functions for dynamic landing pages.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LandingPageBlueprintSchema,
  type LandingPageBlueprint,
} from "@/lib/landing-page-schema";

export type ActiveLandingPage = {
  id: string;
  slug: string;
  signal_type: "search_spike" | "conversion_drop";
  source_term: string;
  generated_at: string;
  blueprint: LandingPageBlueprint;
} | null;

export const getLandingPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data }): Promise<ActiveLandingPage> => {
    const { data: row, error } = await supabaseAdmin
      .from("dynamic_landing_pages")
      .select("id, slug, signal_type, source_term, generated_at, blueprint_json")
      .eq("slug", data.slug)
      .eq("status", "active")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[landing-page] read failed:", error.message);
      return null;
    }
    if (!row) return null;

    const parsed = LandingPageBlueprintSchema.safeParse(row.blueprint_json);
    if (!parsed.success) {
      console.error("[landing-page] stored blueprint invalid:", parsed.error.message);
      return null;
    }

    return {
      id: row.id,
      slug: row.slug,
      signal_type: row.signal_type as "search_spike" | "conversion_drop",
      source_term: row.source_term,
      generated_at: row.generated_at,
      blueprint: parsed.data,
    };
  });

export const regenerateLandingPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Admin role required.");

    const { generateDynamicLandingPage } = await import("@/lib/landing-page-generator.server");
    return generateDynamicLandingPage();
  });
