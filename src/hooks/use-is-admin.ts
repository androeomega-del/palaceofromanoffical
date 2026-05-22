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
      try {
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
      } catch (error) {
        console.debug("[admin] Admin status unavailable.", error);
        if (!cancelled) setIsAdmin(false);
      }
    };

    check();
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      ({ data: { subscription } } = supabase.auth.onAuthStateChange(() => check()));
    } catch (error) {
      console.debug("[admin] Auth listener unavailable.", error);
    }
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  return isAdmin;
}
