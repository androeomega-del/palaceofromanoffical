// Walks every product in a Shopify collection (Admin GraphQL,
// cursor-paginated) and aggregates each into one of the curated
// CATEGORY_BUCKETS. Returns the absolute counts for every bucket across
// the ENTIRE collection — not just the currently-loaded storefront
// batch — so the collection-page chips can show true totals
// (e.g. "Dresses 47", "Shoes 12").
//
// Read-only. Does not touch inventory, locations, or any write surface.
// Caching: relies on per-request in-memory cache via the Tan Query layer
// on the client (staleTime ~10 min). Each request walks the collection
// fresh on the server — for the ≤2000-product collections in this
// catalog the walk completes in ~1-2s with 250-per-page paging.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminGraphql } from "@/lib/shopify-admin.server";
import {
  bucketsForHandle,
  bucketProduct,
  type CategoryBucket,
} from "@/lib/category-buckets";

const Input = z.object({ handle: z.string().min(1).max(255) });

const PAGE_QUERY = `
  query CollectionTagWalk($handle: String!, $cursor: String) {
    collectionByHandle(handle: $handle) {
      id
      products(first: 250, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            title
            tags
          }
        }
      }
    }
  }
`;

type PageResp = {
  collectionByHandle: {
    id: string;
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: { id: string; title: string; tags: string[] } }>;
    };
  } | null;
};

export type CollectionCategoryCounts = {
  /** Absolute count per bucket label across the entire collection. */
  counts: Record<string, number>;
  /** Total products that fell into ANY bucket (not the collection total). */
  bucketedTotal: number;
  /** Total products walked (== collection productsCount equivalent). */
  walkedTotal: number;
};

function emptyCounts(buckets: ReadonlyArray<CategoryBucket>): Record<string, number> {
  return buckets.reduce(
    (acc, b) => {
      acc[b.label] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );
}

export const fetchCollectionCategoryCounts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<CollectionCategoryCounts> => {
    const buckets = bucketsForHandle(data.handle);
    const counts = emptyCounts(buckets);
    let bucketed = 0;
    let walked = 0;

    try {
      let cursor: string | null = null;
      // Safety cap — collections in this catalog top out around ~2k. 20
      // pages of 250 = 5000 products absolute ceiling.
      for (let page = 0; page < 20; page++) {
        const res: PageResp = await adminGraphql<PageResp>(PAGE_QUERY, {
          handle: data.handle,
          cursor,
        });
        const col = res.collectionByHandle;
        if (!col) break;
        for (const { node } of col.products.edges) {
          walked += 1;
          const bucket = bucketProduct(
            {
              title: node.title ?? "",
              tags: Array.isArray(node.tags) ? node.tags : [],
            },
            buckets,
          );
          if (bucket) {
            counts[bucket] += 1;
            bucketed += 1;
          }
        }
        if (!col.products.pageInfo.hasNextPage) break;
        cursor = col.products.pageInfo.endCursor;
        if (!cursor) break;
      }
    } catch (err) {
      console.error("[fetchCollectionCategoryCounts] failed:", err);
      // Fall through with whatever counts we accumulated. The UI will
      // either still show partial chips or hide the row entirely.
    }

    return { counts, bucketedTotal: bucketed, walkedTotal: walked };
  });
