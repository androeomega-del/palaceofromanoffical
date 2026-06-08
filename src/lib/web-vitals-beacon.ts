import { useEffect } from "react";
import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from "web-vitals";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "por-pv-session";
const BOT_RE = /bot|crawler|spider|crawling|facebookexternalhit|preview|monitor|axios|curl|wget|headless/i;

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 64);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function deviceClass(): string {
  if (typeof navigator === "undefined") return "unknown";
  const w = window.innerWidth || 0;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function send(metric: Metric) {
  if (typeof window === "undefined") return;
  if (/^\/(admin|api|login|auth)(\/|$)/.test(window.location.pathname)) return;
  const ua = navigator.userAgent || "";
  if (BOT_RE.test(ua)) return;

  const row = {
    session_id: sessionId(),
    path: window.location.pathname.slice(0, 500),
    metric: metric.name as "LCP" | "INP" | "CLS" | "FCP" | "TTFB",
    // CLS is unitless (0..1 typical); others are ms. Clamp generously.
    value: Math.max(0, Math.min(600000, Number(metric.value) || 0)),
    rating: metric.rating ?? null,
    device: deviceClass(),
    user_agent: ua.slice(0, 500),
  };

  try {
    Promise.resolve(supabase.from("web_vitals").insert(row))
      .then(({ error }) => {
        if (error) console.debug("[web-vitals]", error.message);
      })
      .catch((err) => console.debug("[web-vitals]", err));
  } catch (err) {
    console.debug("[web-vitals]", err);
  }
}

/**
 * Registers Core Web Vitals listeners once per app load.
 * web-vitals fires each metric exactly once per page visit (LCP/INP fire on
 * unload/visibility change). Safe to call from the root layout.
 */
export function useWebVitalsBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    onLCP(send);
    onINP(send);
    onCLS(send);
    onFCP(send);
    onTTFB(send);
  }, []);
}
