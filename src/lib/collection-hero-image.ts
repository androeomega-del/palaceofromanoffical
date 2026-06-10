/**
 * Fetches a collection's hero image via the Storefront API with a fallback
 * to the featured image of the collection's first product. Returns null if
 * neither exists so the caller can render a token-color fallback block.
 */
import { queryOptions } from "@tanstack/react-query";
import { storefrontApiRequest } from "@/lib/shopify";
import { cached } from "@/lib/server-cache";

export type CollectionHeroImage = {
  url: string;
  altText: string | null;
} | null;

const QUERY = `
  query CollectionHero($handle: String!) {
    collection(handle: $handle) {
      image { url altText }
      products(first: 1) {
        edges {
          node {
            featuredImage { url altText }
          }
        }
      }
    }
  }
`;

export async function fetchCollectionHeroImage(handle: string): Promise<CollectionHeroImage> {
  const res = await storefrontApiRequest<{
    collection: {
      image: { url: string; altText: string | null } | null;
      products: { edges: Array<{ node: { featuredImage: { url: string; altText: string | null } | null } }> };
    } | null;
  }>(QUERY, { handle });

  const col = res?.data?.collection;
  if (!col) {
    // eslint-disable-next-line no-console
    console.warn(`[collection-hero-image] collection "${handle}" returned null`);
    return null;
  }
  if (col.image?.url) return col.image;
  const firstFeatured = col.products?.edges?.[0]?.node?.featuredImage;
  if (firstFeatured?.url) return firstFeatured;
  // eslint-disable-next-line no-console
  console.warn(`[collection-hero-image] no image for "${handle}" (collection.image + first product featuredImage both null)`);
  return null;
}

export const collectionHeroImageQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["collection-hero-image", handle] as const,
    queryFn: () =>
      typeof window === "undefined"
        ? cached(`collection-hero-image:${handle}`, () => fetchCollectionHeroImage(handle), 10 * 60_000)
        : fetchCollectionHeroImage(handle),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
