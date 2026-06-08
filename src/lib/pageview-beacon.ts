import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "por-pv-session";
const BOT_RE = /bot|crawler|spider|crawling|facebookexternalhit|preview|monitor|axios|curl|wget|headless/i;

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 64);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/**
 * Logs one row into `public.pageviews` per client-side route change.
 * Skips admin/auth/api routes and bots. Fire-and-forget; never blocks UX.
 */
export function usePageviewBeacon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname || pathname === lastPath.current) return;
    if (/^\/(admin|api|login|auth)(\/|$)/.test(pathname)) return;
    const ua = navigator.userAgent || "";
    if (BOT_RE.test(ua)) return;
    lastPath.current = pathname;

    const row = {
      session_id: getSessionId(),
      path: pathname.slice(0, 500),
      referrer: (document.referrer || "").slice(0, 500) || null,
      user_agent: ua.slice(0, 500),
      country: null as string | null,
      is_bot: false,
    };

    try {
      Promise.resolve(supabase.from("pageviews").insert(row))
        .then(({ error }) => {
          if (error) console.debug("[pageview-beacon]", error.message);
        })
        .catch((err) => console.debug("[pageview-beacon]", err));
    } catch (err) {
      console.debug("[pageview-beacon]", err);
    }
  }, [pathname]);
}
