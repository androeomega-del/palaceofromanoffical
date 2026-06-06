// Admin image-proxy: fetches an image server-side and streams it back as an
// attachment so the admin Image Export page can download cross-origin CDN
// images (Shopify, Supabase storage) that don't send CORS headers.
//
// Security:
//  - Requires a valid Supabase JWT (Bearer token) belonging to an admin user.
//  - Hostname allowlist — refuses any host not in ALLOWED_HOSTS to prevent
//    using this endpoint as an open proxy / SSRF vector.
//  - Only follows http(s) URLs. No file://, data:, etc.
//  - Returns the upstream Content-Type; forces Content-Disposition: attachment.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const ALLOWED_HOSTS = [
  "cdn.shopify.com",
  "dofmsxihjlohiouvxjsy.supabase.co",
  "palaceofromanofficial.com",
  "palaceofroman.com",
  "palaceofroman.lovable.app",
];

function isAllowed(hostname: string): boolean {
  return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

async function requireAdminFromRequest(request: Request): Promise<Response | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

export const Route = createFileRoute("/api/admin/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authFailure = await requireAdminFromRequest(request);
        if (authFailure) return authFailure;

        const url = new URL(request.url);
        const target = url.searchParams.get("url");
        if (!target) return new Response("Missing url", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return new Response("Invalid protocol", { status: 400 });
        }
        if (!isAllowed(parsed.hostname)) {
          return new Response(`Host not allowed: ${parsed.hostname}`, { status: 403 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(parsed.toString());
        } catch (e) {
          return new Response(`Upstream fetch failed: ${(e as Error).message}`, { status: 502 });
        }
        if (!upstream.ok || !upstream.body) {
          return new Response(`Upstream ${upstream.status}`, { status: 502 });
        }

        const filenameFromQuery = url.searchParams.get("filename");
        const filenameFromPath = parsed.pathname.split("/").pop() || "image";
        const filename = (filenameFromQuery || filenameFromPath).replace(/[^\w.\-]/g, "_");

        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        const headers = new Headers({
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=300",
        });
        const cl = upstream.headers.get("content-length");
        if (cl) headers.set("Content-Length", cl);

        return new Response(upstream.body, { status: 200, headers });
      },
    },
  },
});
