import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side check for whether the current user has the `admin` role.
 * Used only for conditional UI (e.g. showing an admin link in the footer).
 * Real access is gated server-side by `requireAdmin`.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    };

    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return isAdmin;
}
