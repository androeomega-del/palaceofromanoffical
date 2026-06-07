/**
 * Shared `beforeLoad` guard for admin routes.
 *
 * Two-stage gate (both required):
 *   1. The caller must have a live Supabase session (otherwise → /login).
 *   2. The caller must hold the `admin` role in `public.user_roles`,
 *      verified via the `has_role` SECURITY DEFINER RPC. Non-admin signed-in
 *      users are redirected to "/" so the admin UI is never exposed.
 *
 * Routes that use this guard MUST also set `ssr: false` so the admin shell
 * is not pre-rendered into public HTML before the client-side role check
 * has a chance to run.
 *
 * The serverFns each admin page calls are independently gated by
 * `requireAdmin` on the server — this client guard is purely to keep the
 * UI shell invisible to non-admins.
 */
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function adminBeforeLoad() {
  // SSR / prerender: no localStorage, no session to check. Render nothing
  // server-side (these routes are `ssr: false`); the client re-runs
  // beforeLoad after hydration and performs the real check there.
  if (typeof window === "undefined") return;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    throw redirect({ to: "/login" });
  }

  // Re-validate the user with the Auth server, then check the admin role.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw redirect({ to: "/login" });
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) {
    // Signed in but not an admin → bounce to the public site, never the
    // admin shell.
    throw redirect({ to: "/" });
  }
}
