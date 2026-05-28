/**
 * Shared `beforeLoad` guard for admin routes.
 *
 * Root cause of the prior "stuck loading / kicked back to /" behaviour:
 * the previous guard awaited `supabase.auth.getUser()` (a network call) and
 * `ensureAdmin()` (another network call) INSIDE `beforeLoad`. Any transient
 * network blip, cold-worker spin-up, or token-refresh race would either
 *   (a) hang the route navigation (infinite "loading…"), or
 *   (b) be caught and redirect the user to "/" so login appeared to fail.
 *
 * Fix: do only a synchronous, in-memory session check here using
 * `getSession()` (reads from localStorage, no network). The serverFns the
 * page calls are already protected by `requireAdmin` on the server — they
 * are the real gate. If there's no local session at all, send to /login.
 * That's it. No network in beforeLoad → no hang, no flapping redirects.
 */
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function adminBeforeLoad() {
  // SSR / prerender: no localStorage, no session to check. Render the
  // shell; the client re-runs beforeLoad after hydration.
  if (typeof window === "undefined") return;

  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) {
    throw redirect({ to: "/login" });
  }
  // Signed-in callers proceed. requireAdmin on each serverFn enforces the
  // actual admin role server-side; non-admins will see a clear error in
  // the dashboard rather than a silent redirect loop.
}

