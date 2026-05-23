// Server functions for the dynamic homepage edition.
// - getActiveHomepageLayout: public read of the active blueprint
// - regenerateHomepageLayout: admin-only manual trigger ("Run now")

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { HomepageLayoutSchema, type HomepageLayout } from "@/lib/homepage-layout-schema";

export type ActiveHomepageLayout = {
  id: string;
  generated_at: string;
  layout: HomepageLayout;
} | null;

export const getActiveHomepageLayout = createServerFn({ method: "GET" }).handler(
  async (): Promise<ActiveHomepageLayout> => {
    const { data, error } = await supabaseAdmin
      .from("homepage_daily_layout")
      .select("id, generated_at, layout_json")
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[homepage-layout] read failed:", error.message);
      return null;
    }
    if (!data) return null;

    const parsed = HomepageLayoutSchema.safeParse(data.layout_json);
    if (!parsed.success) {
      console.error("[homepage-layout] stored layout invalid:", parsed.error.message);
      return null;
    }
    return { id: data.id, generated_at: data.generated_at, layout: parsed.data };
  },
);

export const regenerateHomepageLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) {
      throw new Error("Admin role required.");
    }
    const { generateHomepageLayout } = await import("@/lib/homepage-layout-generator.server");
    return generateHomepageLayout();
  });
