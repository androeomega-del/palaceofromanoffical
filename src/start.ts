import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache, no-store, must-revalidate",
      },
    });
  }
});

// Paths that MUST never be cached — they're per-user, write surfaces, or
// API endpoints whose response varies by auth/cookie state.
const PRIVATE_PATH_PREFIXES = [
  "/account",
  "/admin",
  "/api",
  "/cart",
  "/auth",
  "/authentication",
  "/checkout",
  "/_serverFn",
];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// HTML response cache policy.
//
// Public boutique surfaces (homepage, PLPs, PDPs, brand pages, editorials,
// journal, etc.) are identical for every visitor — cart and account state
// are client-side, hydrated after the shell. We serve those from the CDN
// edge with a 5-minute fresh window + 24h stale-while-revalidate so warm
// TTFB collapses from ~1.5s to <100ms while a background refresh keeps
// the catalog snapshot current.
//
// Authenticated / per-user surfaces (account, admin, cart, auth, api,
// server-function RPCs) stay no-store — caching those would leak session
// state across visitors.
const htmlCacheMiddleware = createMiddleware().server(async ({ next }) => {
  const result = (await next()) as unknown as { response?: Response } & Record<string, unknown>;
  const response = result?.response;
  if (response instanceof Response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      let pathname = "/";
      let method = "GET";
      try {
        const req = getRequest();
        method = req.method;
        pathname = new URL(req.url).pathname;
      } catch {
        // No request context (rare) → fall through to private-safe headers.
      }

      const cacheable =
        method === "GET" &&
        response.status === 200 &&
        !isPrivatePath(pathname);

      if (cacheable) {
        response.headers.set(
          "cache-control",
          "public, s-maxage=300, stale-while-revalidate=86400",
        );
        // IMPORTANT: do NOT Vary on Cookie. Shopify analytics cookies
        // (_shopify_y, _shopify_s, _y, _s, _cmp_a, etc.) are set on
        // virtually every visitor, which would make each request a
        // unique cache key and guarantee 100% cache misses at the edge.
        // Per-user surfaces are already excluded via isPrivatePath().
        response.headers.set("vary", "Accept-Encoding");
      } else {
        response.headers.set(
          "cache-control",
          "no-cache, no-store, must-revalidate",
        );
        response.headers.set("pragma", "no-cache");
        response.headers.set("expires", "0");
      }
    }
  }
  return result as never;
});


export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, htmlCacheMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
