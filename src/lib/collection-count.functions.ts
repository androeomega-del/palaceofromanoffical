// Returns the true total product count for a Shopify collection (by handle)
// via the Admin GraphQL API. Used to display "Showing X of N" without having
// to wait for every cursor page to resolve.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminGraphql } from "@/lib/shopify-admin.server";

const Input = z.object({ handle: z.string().min(1).max(255) });

const GQL = `
  query CollectionCount($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      productsCount { count precision }
    }
  }
`;

export const fetchCollectionTotal = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await adminGraphql<{
        collectionByHandle: {
          id: string;
          productsCount: { count: number; precision: string } | null;
        } | null;
      }>(GQL, { handle: data.handle });
      const c = res.collectionByHandle;
      if (!c) return { total: null as number | null };
      return { total: c.productsCount?.count ?? null };
    } catch (err) {
      console.error("[fetchCollectionTotal] failed:", err);
      return { total: null as number | null };
    }
  });
