// Server-only Shopify Admin API client.
// Prefers the stored full-permission Admin API access token. Falls back to the
// Client Credentials Grant only when the direct Admin token is not configured.
//
// Usage:
//   import { adminGraphql } from "@/lib/shopify-admin.server";
//   const data = await adminGraphql<{ products: ... }>(QUERY, { first: 12 });

const API_VERSION = "2025-07";

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;

type TokenCandidate = { name: string; token: string };
type TokenAttempt = { name: string; status: number; body: string };

// Module-level log of the most recent token-probe attempts so error
// messages can report exactly which secret(s) Shopify rejected.
let lastAttempts: TokenAttempt[] = [];

export function getLastTokenAttempts(): TokenAttempt[] {
  return lastAttempts;
}

function normalizeAdminToken(raw: string | undefined): string | null {
  const token = raw?.trim().replace(/^['"]|['"]$/g, "").replace(/^Bearer\s+/i, "");
  return token || null;
}

function directAdminAccessTokens(): TokenCandidate[] {
  // Priority: user's newest full-permission token first. GRAPHQL_ID + REFRESH_TOKEN
  // are companion OAuth credentials, not values Shopify accepts in X-Shopify-Access-Token.
  const entries: Array<[string, string | undefined]> = [
    ["GraphQL_TOKEN", process.env.GraphQL_TOKEN],
    ["GRAPHQL_TOKEN", process.env.GRAPHQL_TOKEN],
    ["NEW_ADMIN", process.env.NEW_ADMIN],
    ["SHOPIFY_ACCESS_TOKEN", process.env.SHOPIFY_ACCESS_TOKEN],
    ["SHOPIFY_ADMIN_ACCESS_TOKEN", process.env.SHOPIFY_ADMIN_ACCESS_TOKEN],
    ["SHOPIFY_ADMIN_TOKEN", process.env.SHOPIFY_ADMIN_TOKEN],
  ];

  const seen = new Set<string>();
  return entries.flatMap(([name, raw]) => {
    const token = normalizeAdminToken(raw);
    if (!token || seen.has(token)) return [];
    seen.add(token);
    return [{ name, token }];
  });
}

async function verifyAdminToken(candidate: TokenCandidate): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`https://${shopDomain()}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": candidate.token,
    },
    body: JSON.stringify({ query: "query AdminTokenProbe { shop { id } }" }),
  });
  if (res.ok) return { ok: true, status: res.status, body: "" };
  const text = await res.text().catch(() => "");
  console.warn(`[shopify-admin] ${candidate.name} rejected during token probe: ${res.status} ${text.slice(0, 160)}`);
  return { ok: false, status: res.status, body: text.slice(0, 200) };
}


function shopDomain(): string {
  const d = process.env.SHOPIFY_STORE_DOMAIN;
  if (!d) throw new Error("SHOPIFY_STORE_DOMAIN missing");
  return d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function adminOAuthCredentials(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.SHOPIFY_ADMIN_API_CLIENT_ID ??
    process.env.SHOPIFY_CUSTOM_APP_CLIENT_ID ??
    process.env.SHOPIFY_CLIENT_ID;
  const clientSecret =
    process.env.SHOPIFY_ADMIN_API_SECRET ??
    process.env.SHOPIFY_CUSTOM_APP_CLIENT_SECRET ??
    process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Shopify Admin OAuth client id / client secret missing");
  }
  return { clientId, clientSecret };
}

/**
 * Fetch (or reuse) an Admin API access token via Client Credentials Grant.
 * Shopify endpoint: POST https://{shop}/admin/oauth/access_token
 *   body: { client_id, client_secret, grant_type: "client_credentials" }
 */
export async function getAdminAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) return cached.token;

  const directTokens = directAdminAccessTokens();
  for (const candidate of directTokens) {
    if (await verifyAdminToken(candidate)) {
      cached = { token: candidate.token, expiresAt: now + 55 * 60_000 };
      return cached.token;
    }
  }

  const { clientId, clientSecret } = adminOAuthCredentials();

  const url = `https://${shopDomain()}/admin/oauth/access_token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify client_credentials grant failed ${res.status}: ${text.slice(0, 240)}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  if (!data.access_token) throw new Error("Shopify grant returned no access_token");
  cached = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

/** Run an Admin REST request with the cached client-credentials token. */
export async function adminRest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminAccessToken();
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`https://${shopDomain()}/admin/api/${API_VERSION}${cleanedPath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Access-Token": token,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify Admin REST ${res.status} ${cleanedPath}: ${text.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

/** Run an Admin GraphQL query with the cached client-credentials token. */
export async function adminGraphql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await getAdminAccessToken();
  const res = await fetch(`https://${shopDomain()}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(annotateScopeError(`Shopify Admin GraphQL ${res.status}: ${text.slice(0, 240)}`));
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    const joined = json.errors.map((e) => e.message).join("; ");
    throw new Error(annotateScopeError(`Shopify Admin GraphQL errors: ${joined}`));
  }
  return json.data as T;
}

/**
 * Detect Shopify "Access denied for <field>" scope errors and append a
 * human-readable remediation hint so the admin UI surfaces the exact fix
 * (re-install the custom app with the required write scope) instead of a
 * raw GraphQL message.
 */
export function annotateScopeError(message: string): string {
  const m = /Access denied for (\w+) field.*?Required access:\s*([a-z_,\s]+?)(?:\s*access scope)?(?:["'.\s]|$)/i.exec(
    message,
  );
  if (!m) return message;
  const field = m[1];
  const scopes = m[2]
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  return (
    `${message}\n\n` +
    `→ MISSING SHOPIFY SCOPE for "${field}". The custom app token lacks: ${scopes}.\n` +
    `Fix (≈60s): Shopify Admin → Settings → Apps and sales channels → Develop apps → open this app → ` +
    `Configuration → Admin API access scopes → enable ${scopes} → Save → click "Install app" to apply. ` +
    `No code change is needed — the token cache refreshes on the next call.`
  );
}

/**
 * Fetch the freshest in-stock product handles directly from the Admin API —
 * stricter than the Storefront cache. Returns a Set of handles whose tracked
 * inventory is currently > 0 (or whose variants are explicitly available).
 */
export async function fetchInStockHandles(
  opts: {
    vendor?: string;
    productType?: string;
    first?: number;
  } = {},
): Promise<Set<string>> {
  const parts: string[] = ["status:active"];
  if (opts.vendor) parts.push(`vendor:"${opts.vendor.replace(/"/g, '\\"')}"`);
  if (opts.productType) parts.push(`product_type:"${opts.productType.replace(/"/g, '\\"')}"`);
  // Admin search uses "inventory_total:>0" to mean stocked.
  parts.push("inventory_total:>0");
  const query = parts.join(" AND ");

  const GQL = `
    query InStock($first: Int!, $query: String!) {
      products(first: $first, query: $query) {
        edges { node { handle totalInventory } }
      }
    }
  `;
  try {
    const data = await adminGraphql<{
      products: { edges: Array<{ node: { handle: string; totalInventory: number | null } }> };
    }>(GQL, { first: Math.min(opts.first ?? 100, 250), query });
    return new Set(
      data.products.edges.filter((e) => (e.node.totalInventory ?? 0) > 0).map((e) => e.node.handle),
    );
  } catch (err) {
    console.error("[shopify-admin] fetchInStockHandles failed:", err);
    return new Set();
  }
}
