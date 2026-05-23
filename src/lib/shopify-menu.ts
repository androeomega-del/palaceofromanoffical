// Hybrid Shopify menu layer (Phase 1 — Sprint 2, Safe Path).
//
// Fetches the curated `main-menu` from the Storefront API (3 levels deep)
// and normalises every leaf into a typed route descriptor that points at an
// existing TanStack route. If the response is empty, scope-denied, or shaped
// in a way that can't be mapped to our women/men department structure, the
// caller falls back to the existing live-built tree in `nav-config.ts`.
//
// Read-only. Does NOT touch inventory, locations, customers, or write paths.

import {
  SHOPIFY_STOREFRONT_URL,
  SHOPIFY_STOREFRONT_TOKEN,
  SHOPIFY_STORE_PERMANENT_DOMAIN,
} from "@/lib/shopify";

// ── Public types ────────────────────────────────────────────────────────────

/** Where a menu leaf points after normalisation. Only routes that actually
 *  exist in the app are emitted — Shopify pages, articles, and blogs are
 *  dropped because we don't render them. */
export type ShopifyMenuLink =
  | { kind: "collection"; handle: string }
  | { kind: "product"; handle: string }
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string };

export type ShopifyMenuItem = {
  id: string;
  title: string;
  /** Normalised destination; `null` when the leaf points at an unsupported
   *  resource (page/article/blog/external host) and should be dropped. */
  link: ShopifyMenuLink | null;
  items: ShopifyMenuItem[];
};

export type ShopifyMenuTree = {
  id: string;
  handle: string;
  items: ShopifyMenuItem[];
};

// ── GraphQL ────────────────────────────────────────────────────────────────

const MENU_QUERY = /* GraphQL */ `
  query ShopifyMainMenu($handle: String!) {
    menu(handle: $handle) {
      id
      handle
      items {
        id
        title
        url
        resourceId
        type
        items {
          id
          title
          url
          resourceId
          type
          items {
            id
            title
            url
            resourceId
            type
          }
        }
      }
    }
  }
`;

type RawMenuItem = {
  id: string;
  title: string;
  url: string;
  resourceId: string | null;
  type: string;
  items?: RawMenuItem[];
};

type RawMenuResp = {
  menu: {
    id: string;
    handle: string;
    items: RawMenuItem[];
  } | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extracts the handle from a Storefront URL like
 *  `https://shop.myshopify.com/collections/dresses?foo=1`. */
function handleFromUrl(url: string, kind: "collections" | "products"): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf(kind);
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

function normaliseLink(raw: RawMenuItem): ShopifyMenuLink | null {
  const type = (raw.type || "").toUpperCase();
  switch (type) {
    case "COLLECTION":
    case "COLLECTIONS": {
      const handle = handleFromUrl(raw.url, "collections");
      return handle ? { kind: "collection", handle } : null;
    }
    case "PRODUCT": {
      const handle = handleFromUrl(raw.url, "products");
      return handle ? { kind: "product", handle } : null;
    }
    case "PAGE":
    case "ARTICLE":
    case "BLOG":
    case "CATALOG":
      // No matching routes in this app — drop rather than render `#`.
      return null;
    case "HTTP":
    default: {
      try {
        const u = new URL(raw.url);
        const ownHosts = new Set<string>([
          SHOPIFY_STORE_PERMANENT_DOMAIN,
          "palaceofroman.com",
          "palaceofromanofficial.com",
          "palaceofroman.lovable.app",
        ]);
        if (ownHosts.has(u.hostname)) {
          // Internal link — strip the origin so TanStack handles it.
          return { kind: "internal", href: u.pathname + u.search + u.hash };
        }
        return { kind: "external", href: u.toString() };
      } catch {
        return null;
      }
    }
  }
}

function normaliseItem(raw: RawMenuItem): ShopifyMenuItem {
  const children = (raw.items ?? []).map(normaliseItem);
  return {
    id: raw.id,
    title: raw.title,
    link: normaliseLink(raw),
    items: children,
  };
}

// ── Public fetcher ─────────────────────────────────────────────────────────

/**
 * Fetch the curated `main-menu` from the Storefront API and normalise it.
 *
 * Returns `null` (caller falls back to the live-built tree) when:
 *   - the Storefront API responds with ACCESS_DENIED (scope missing)
 *   - the network call throws
 *   - `menu` is null (handle doesn't exist in Shopify Admin)
 *   - the menu exists but has zero items
 */
export async function fetchShopifyMenuRaw(
  handle = "main-menu",
): Promise<ShopifyMenuTree | null> {
  try {
    const res = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: MENU_QUERY, variables: { handle } }),
    });

    if (!res.ok) {
      console.warn(
        `[shopify-menu] HTTP ${res.status} fetching main-menu — falling back`,
      );
      return null;
    }

    const json = (await res.json()) as {
      data?: RawMenuResp;
      errors?: Array<{ message: string; extensions?: { code?: string } }>;
    };

    if (json.errors && json.errors.length > 0) {
      const code = json.errors[0]?.extensions?.code ?? "";
      console.warn(
        `[shopify-menu] GraphQL error (${code || "unknown"}): ${json.errors[0]?.message} — falling back`,
      );
      return null;
    }

    const menu = json.data?.menu;
    if (!menu || !Array.isArray(menu.items) || menu.items.length === 0) {
      return null;
    }

    return {
      id: menu.id,
      handle: menu.handle,
      items: menu.items.map(normaliseItem),
    };
  } catch (err) {
    console.warn("[shopify-menu] fetch failed — falling back:", err);
    return null;
  }
}
