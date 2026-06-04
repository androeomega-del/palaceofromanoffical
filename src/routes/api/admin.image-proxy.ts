// Admin image-proxy: fetches an image server-side and streams it back as an
// attachment so the admin Image Export page can download cross-origin CDN
// images (Shopify, Supabase storage) that don't send CORS headers.
//
// Security:
//  - Hostname allowlist — refuses any host not in ALLOWED_HOSTS to prevent
//    using this endpoint as an open proxy / SSRF vector.
//  - Only follows http(s) URLs. No file://, data:, etc.
//  - Returns the upstream Content-Type; forces Content-Disposition: attachment.

import { createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/api/admin/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
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
