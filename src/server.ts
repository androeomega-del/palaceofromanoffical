import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// Strip legacy /fr (French) URL prefix left over from a previous storefront.
// Redirect /fr, /fr/, /fr/anything → / or /anything with a permanent 301.
function legacyLocaleRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  const { pathname } = url;
  if (pathname !== "/fr" && !pathname.startsWith("/fr/")) return null;

  const stripped = pathname === "/fr" ? "/" : pathname.slice(3) || "/";
  const target = new URL(stripped + url.search + url.hash, url.origin);
  return Response.redirect(target.toString(), 301);
}

// Map dead Shopify-style /blogs/* URLs (leftover from a prior storefront) to
// our editorial hub at /journal. Bounce-rate fix — these account for ~5% of
// recent inbound traffic and currently 404.
function legacyBlogRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/blogs/") && url.pathname !== "/blogs") return null;
  const target = new URL("/journal" + url.search, url.origin);
  return Response.redirect(target.toString(), 301);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const redirect = legacyLocaleRedirect(request) ?? legacyBlogRedirect(request);
      if (redirect) return redirect;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
