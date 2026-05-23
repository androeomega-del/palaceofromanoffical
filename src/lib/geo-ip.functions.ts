import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";

/**
 * Best-effort IP geolocation for the "Deliver to …" auto-detect flow.
 *
 * Order of preference:
 *  1. Cloudflare request properties (`request.cf`) — set automatically when
 *     the Worker runs on Cloudflare. Free, zero-latency, no external call.
 *  2. Cloudflare `cf-*` headers, if the edge layer forwarded them.
 *  3. ipwho.is — free, no key, generous limits — as a fallback so the
 *     feature still works in dev / non-CF environments.
 *
 * Returns null fields rather than guessing. The caller is expected to fall
 * back to the manual zip input when fields are missing or the shopper is
 * outside the US.
 */
export type GeoIpResult = {
  country: string | null; // ISO 3166-1 alpha-2 (e.g. "US")
  postalCode: string | null; // 5-digit zip for US
  region: string | null;
  city: string | null;
};

const EMPTY: GeoIpResult = { country: null, postalCode: null, region: null, city: null };

function readFromCloudflare(request: Request): GeoIpResult | null {
  const cf = (request as unknown as { cf?: Record<string, unknown> }).cf;
  if (!cf || typeof cf !== "object") return null;
  const country = typeof cf.country === "string" ? cf.country : null;
  const postalCode = typeof cf.postalCode === "string" ? cf.postalCode : null;
  const region = typeof cf.region === "string" ? cf.region : null;
  const city = typeof cf.city === "string" ? cf.city : null;
  if (!country && !postalCode) return null;
  return { country, postalCode, region, city };
}

function readFromHeaders(request: Request): GeoIpResult | null {
  const h = request.headers;
  const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country");
  const postalCode = h.get("cf-postal-code") ?? h.get("x-vercel-ip-postal-code");
  const region = h.get("cf-region") ?? h.get("x-vercel-ip-country-region");
  const city = h.get("cf-ipcity") ?? h.get("x-vercel-ip-city");
  if (!country && !postalCode) return null;
  return { country, postalCode, region, city };
}

async function readFromIpwho(ip: string | null): Promise<GeoIpResult> {
  if (!ip) return EMPTY;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { accept: "application/json" },
      // Hard cap so a slow upstream never blocks the page.
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return EMPTY;
    const j = (await res.json()) as {
      success?: boolean;
      country_code?: string;
      postal?: string;
      region?: string;
      city?: string;
    };
    if (j.success === false) return EMPTY;
    return {
      country: j.country_code ?? null,
      postalCode: j.postal ?? null,
      region: j.region ?? null,
      city: j.city ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export const getGeoFromIp = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();

  const cf = readFromCloudflare(request);
  if (cf) return cf;

  const hdr = readFromHeaders(request);
  if (hdr) return hdr;

  const ip = getRequestIP({ xForwardedFor: true }) ?? null;
  return await readFromIpwho(ip);
});
