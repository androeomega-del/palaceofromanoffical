import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@tanstack/react-start-server";
import { timingSafeEqual } from "crypto";

/**
 * Founder admin bootstrap — gated by a server-only shared secret.
 *
 * Security: A bare `requireSupabaseAuth` gate is NOT sufficient here. Any
 * visitor can create a Supabase account and would otherwise be promoted to
 * admin if no admin row exists. The caller must additionally present
 * `x-bootstrap-secret` matching the `BOOTSTRAP_ADMIN_SECRET` env var.
 *
 * Always a no-op once any admin row exists.
 */
export const bootstrapAdminIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const secret = process.env.BOOTSTRAP_ADMIN_SECRET;
    if (!secret) return { granted: false as const };

    const provided = getRequestHeader("x-bootstrap-secret") ?? "";
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { granted: false as const };
    }

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error(countError.message);

    if ((count ?? 0) > 0) return { granted: false as const };

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (insertError) throw new Error(insertError.message);

    return { granted: true as const };
  });
