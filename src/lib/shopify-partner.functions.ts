import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TOKEN_URL = "https://api.shopify.com/auth/access_token";

let cached: { token: string; expiresAt: number } | null = null;

async function fetchAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const clientId = process.env.SHOPIFY_PARTNER_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_PARTNER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Shopify partner credentials are not configured");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("No access_token in response");

  cached = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

/**
 * Proxies a Shopify Discover API call server-side.
 * The access token never leaves the server.
 */
export const shopifyDiscoverSearch = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      searchId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
      limit: z.number().int().min(1).max(50).default(10),
    }).parse,
  )
  .handler(async ({ data }) => {
    const token = await fetchAccessToken();
    const url = `https://discover.shopifyapps.com/global/v2/search/${encodeURIComponent(
      data.searchId,
    )}?limit=${data.limit}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return { ok: false as const, status: res.status, error: res.statusText };
    }

    return { ok: true as const, status: 200, data: await res.json() };
  });
