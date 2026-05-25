/**
 * Shared `beforeLoad` guard for admin routes.
 *
 * Fixes the login-loop bug: the prior pattern called the protected serverFn
 * `ensureAdmin()` directly and treated ANY thrown error as "not authenticated"
 * → redirect to /login. If the Supabase session wasn't fully hydrated yet, or
 * the user was signed in but lacked the admin role, this looped them straight
 * back to login forever.
 *
 * New behaviour:
 *  1. Await `supabase.auth.getUser()` first. This hydrates / refreshes the
 *     session BEFORE we call any `requireSupabaseAuth`-protected serverFn,
 *     so the bearer token is actually present.
 *  2. If no user → redirect to /login (real auth failure).
 *  3. If user is signed in but not an admin → redirect to "/" (no loop).
 *  4. If admin check succeeds → continue.
 */

import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin } from "@/lib/admin-guard.functions";

export async function adminBeforeLoad() {
  // During SSR there is no Supabase session in storage, so we can't
  // verify the user. DO NOT redirect — that would log a signed-in admin
  // out on every navigation to an admin page. Skip the check on the
  // server; the client re-runs beforeLoad after hydration and enforces
  // the real gate then. Admin page components fetch their data via
  // serverFns called client-side, so SSR rendering an empty shell is
  // safe.
  if (typeof window === "undefined") {
    return;
  }



  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/login" });
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw redirect({ to: "/login" });
  }
  try {
    await ensureAdmin({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Signed in but not an admin (or transient server error) — DO NOT loop
    // back to /login. Send them home so they aren't trapped.
    throw redirect({ to: "/" });
  }
}
