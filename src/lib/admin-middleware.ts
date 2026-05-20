import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side admin guard. Builds on `requireSupabaseAuth` (validates the
 * caller's Supabase JWT) and then checks the `user_roles` table via the
 * `has_role` SECURITY DEFINER function to confirm the caller is an admin.
 *
 * Throws 'Forbidden' if the user is signed in but not an admin.
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) {
      console.error("[admin-middleware] has_role check failed:", error.message);
      throw new Error("Forbidden");
    }
    if (!data) {
      throw new Error("Forbidden: admin role required");
    }
    return next({ context });
  });
