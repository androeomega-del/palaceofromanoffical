// Per-variant shipping-origin lookup. Read-only Admin GraphQL query against
// the SELECTED variant's inventoryItem.inventoryLevels — surfaces the
// fulfillment hub that actually holds the unit the shopper is about to buy.
//
// Strictly read-only:
//   - No inventoryActivate / inventoryBulkToggleActivation / inventoryLevelSet
//   - No location reassignment, no threshold writes
//   - Pure information-gathering (mem://constraints/fulfillment-locations)
//
// Resolution rule (matches the product-origins V1 contract):
//   1. Filter inventoryLevels where `available > 0`.
//   2. If exactly one positive location → return it.
//   3. If multiple → prefer our primary hub priority IT > DE > SE; ties
//      broken by lex-smallest location id (deterministic).
//   4. If none have positive stock → return null (caller falls back to
//      the product-level cache / vendor map; UI never flashes "undefined").

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminGraphql } from "@/lib/shopify-admin.server";

export type VariantOrigin = {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  locationName: string | null;
  locationId: string;
  available: number;
};

const VARIANT_ORIGIN_QUERY = /* GraphQL */ `
  query VariantOrigin($id: ID!) {
    productVariant(id: $id) {
      id
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
`;

type GqlResp = {
  productVariant: {
    id: string;
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
    } | null;
  } | null;
};

const COUNTRY_PRIORITY: Record<string, number> = { IT: 0, DE: 1, SE: 2 };
const priorityOf = (cc: string | null) =>
  COUNTRY_PRIORITY[(cc ?? "").toUpperCase()] ?? 99;

export const getVariantShippingOrigin = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        variantId: z
          .string()
          .min(1)
          .max(200)
          .regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ origin: VariantOrigin | null }> => {
    try {
      const resp = await adminGraphql<GqlResp>(VARIANT_ORIGIN_QUERY, {
        id: data.variantId,
      });
      const edges = resp.productVariant?.inventoryItem?.inventoryLevels?.edges ?? [];
      const positives: VariantOrigin[] = [];
      for (const e of edges) {
        const qty =
          e.node.quantities.find((q) => q.name === "available")?.quantity ?? 0;
        if (qty <= 0) continue;
        positives.push({
          country: e.node.location.address?.country ?? null,
          countryCode: e.node.location.address?.countryCode ?? null,
          city: e.node.location.address?.city ?? null,
          locationName: e.node.location.name,
          locationId: e.node.location.id,
          available: qty,
        });
      }
      if (positives.length === 0) return { origin: null };
      positives.sort((a, b) => {
        const pa = priorityOf(a.countryCode);
        const pb = priorityOf(b.countryCode);
        if (pa !== pb) return pa - pb;
        return a.locationId.localeCompare(b.locationId);
      });
      return { origin: positives[0] };
    } catch (err) {
      console.error("[variant-origin] lookup failed:", (err as Error).message);
      return { origin: null };
    }
  });
