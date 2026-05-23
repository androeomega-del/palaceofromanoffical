// Per-product shipping-origin cache, sourced from Shopify Admin
// `inventoryItem.inventoryLevels.location.address`.
//
// V1 rule (approved): MOST-STOCK-WINS — if a product carries stock at
// multiple BG warehouses (e.g. Napoli + Jönköping), we surface the
// location with the highest summed quantity across all of its variants.
// Ties are broken by the location id (deterministic).
//
// The frontend reads via `getProductOriginsMap()` (public, anon-readable
// via RLS) so the "Ships from …" badge is identical on every card and PDP.
// The cron pipeline is intentionally deferred — `refreshProductOrigins`
// is only callable from the admin shopify-sync screen for now.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminGraphql } from "@/lib/shopify-admin.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-middleware";

export type ProductOriginRow = {
  handle: string;
  country_code: string | null;
  country: string | null;
  city: string | null;
  location_id: string | null;
  total_stock: number;
  updated_at: string;
};

// ─── Public read ─────────────────────────────────────────────────────────────

/** Fetch the full origins map (one row per handle). The table is small
 *  (~one row per Shopify product), so a single SELECT * is fine. */
export const getProductOriginsMap = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, ProductOriginRow>> => {
    const { data, error } = await supabaseAdmin
      .from("product_origins")
      .select("*");
    if (error) {
      console.error("[product-origins] read failed:", error.message);
      return {};
    }
    const map: Record<string, ProductOriginRow> = {};
    for (const row of (data ?? []) as ProductOriginRow[]) {
      map[row.handle] = row;
    }
    return map;
  },
);

// ─── Admin refresh ───────────────────────────────────────────────────────────

const PRODUCTS_QUERY = /* GraphQL */ `
  query ProductOrigins($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active") {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          handle
          variants(first: 100) {
            edges {
              node {
                inventoryItem {
                  inventoryLevels(first: 10) {
                    edges {
                      node {
                        quantities(names: ["available"]) { name quantity }
                        location {
                          id
                          name
                          address { country countryCode city }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

type GqlResp = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{
      node: {
        handle: string;
        variants: {
          edges: Array<{
            node: {
              inventoryItem: {
                inventoryLevels: {
                  edges: Array<{
                    node: {
                      quantities: Array<{ name: string; quantity: number }>;
                      location: {
                        id: string;
                        name: string | null;
                        address: {
                          country: string | null;
                          countryCode: string | null;
                          city: string | null;
                        } | null;
                      };
                    };
                  }>;
                };
              };
            };
          }>;
        };
      };
    }>;
  };
};

type Tally = {
  total: number;
  location_id: string;
  country: string | null;
  country_code: string | null;
  city: string | null;
};

function pickWinner(byLocation: Map<string, Tally>): Tally | null {
  let winner: Tally | null = null;
  for (const t of byLocation.values()) {
    if (
      !winner ||
      t.total > winner.total ||
      // deterministic tie-break: lexicographically smallest location id
      (t.total === winner.total && t.location_id < winner.location_id)
    ) {
      winner = t;
    }
  }
  return winner;
}

export const refreshProductOrigins = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z.object({ maxPages: z.number().int().min(1).max(50).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const rows: Array<{
      handle: string;
      country: string | null;
      country_code: string | null;
      city: string | null;
      location_id: string | null;
      total_stock: number;
    }> = [];

    let cursor: string | null = null;
    let pages = 0;
    const maxPages = data.maxPages ?? 30;

    while (pages < maxPages) {
      pages++;
      const resp: GqlResp = await adminGraphql<GqlResp>(PRODUCTS_QUERY, {
        first: 50,
        after: cursor,
      });

      for (const pe of resp.products.edges) {
        const handle = pe.node.handle;
        const byLocation = new Map<string, Tally>();

        for (const ve of pe.node.variants.edges) {
          for (const le of ve.node.inventoryItem?.inventoryLevels?.edges ?? []) {
            const loc = le.node.location;
            const qty =
              le.node.quantities.find((q) => q.name === "available")?.quantity ?? 0;
            if (qty <= 0) continue;
            const existing = byLocation.get(loc.id);
            if (existing) {
              existing.total += qty;
            } else {
              byLocation.set(loc.id, {
                total: qty,
                location_id: loc.id,
                country: loc.address?.country ?? null,
                country_code: loc.address?.countryCode ?? null,
                city: loc.address?.city ?? null,
              });
            }
          }
        }

        const winner = pickWinner(byLocation);
        rows.push({
          handle,
          country: winner?.country ?? null,
          country_code: winner?.country_code ?? null,
          city: winner?.city ?? null,
          location_id: winner?.location_id ?? null,
          total_stock: winner?.total ?? 0,
        });
      }

      if (!resp.products.pageInfo.hasNextPage) break;
      cursor = resp.products.pageInfo.endCursor;
    }

    // Upsert in batches of 500.
    let written = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500).map((r) => ({
        ...r,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabaseAdmin
        .from("product_origins")
        .upsert(batch, { onConflict: "handle" });
      if (error) {
        console.error("[product-origins] upsert failed:", error.message);
        throw new Error(`Upsert failed: ${error.message}`);
      }
      written += batch.length;
    }

    return {
      ok: true,
      pages,
      products: rows.length,
      written,
    };
  });
