/**
 * Edition System — maps to Shopify collections. The homepage is driven by
 * up to 2 active Editions resolved from a known editorial pool, sorted by
 * `updatedAt`. Each Edition owns a palette token and a typography register
 * that takes over the page via CSS variables on <html data-edition>.
 *
 * Editions are real Shopify collections only. No fabricated data — if the
 * collection has zero products, the Edition is dropped.
 */
import {
  fetchCollection,
  type ShopifyCollection,
  type ShopifyProduct,
} from "@/lib/shopify";
import { supabase } from "@/integrations/supabase/client";
import { img } from "@/lib/editorial-library";

export type EditionPalette = "noir" | "linen" | "ivory";

export interface LookbookHotspot {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  productHandle: string;
  variantGid: string | null;
  label: string | null;
}

export interface LookbookImage {
  id: string;
  imageUrl: string;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string;
  sortOrder: number;
  hotspots: LookbookHotspot[];
}

export interface Edition {
  number: string;           // "I", "II"
  ordinal: number;          // 1, 2
  handle: string;
  title: string;
  description: string;
  cover: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  palette: EditionPalette;
  collection: ShopifyCollection;
  products: ShopifyProduct[];
  lookbook: LookbookImage[];
}

// Known editorial collection handles to pull from, in priority order.
// Sorted by Shopify `updatedAt` after fetch; the 2 most recent become I & II.
const EDITORIAL_HANDLES = [
  "resort-2026",
  "may-2026",
  "the-new-evening",
  "swimwear",
  "new-arrivals",
];

// Fallback covers (editorial library) — used only when a Shopify collection
// has no `image` field. Indices match real PNGs in src/assets/editorial/library.
const FALLBACK_COVERS = [34, 12];

const PALETTES: EditionPalette[] = ["noir", "linen"];

const ROMAN = ["I", "II", "III", "IV", "V"];

async function loadLookbookForEdition(handle: string): Promise<LookbookImage[]> {
  const { data: images, error } = await supabase
    .from("lookbook_images")
    .select("id, image_url, blur_data_url, width, height, alt_text, sort_order")
    .eq("edition_handle", handle)
    .order("sort_order", { ascending: true });
  if (error || !images || images.length === 0) return [];

  const ids = images.map((i) => i.id);
  const { data: hotspots } = await supabase
    .from("lookbook_hotspots")
    .select("id, lookbook_image_id, x, y, product_handle, variant_gid, label, sort_order")
    .in("lookbook_image_id", ids)
    .order("sort_order", { ascending: true });

  const byImage = new Map<string, LookbookHotspot[]>();
  for (const h of hotspots ?? []) {
    const arr = byImage.get(h.lookbook_image_id) ?? [];
    arr.push({
      id: h.id,
      x: Number(h.x),
      y: Number(h.y),
      productHandle: h.product_handle,
      variantGid: h.variant_gid,
      label: h.label,
    });
    byImage.set(h.lookbook_image_id, arr);
  }

  return images.map((i) => ({
    id: i.id,
    imageUrl: i.image_url,
    blurDataUrl: i.blur_data_url,
    width: i.width,
    height: i.height,
    altText: i.alt_text ?? "",
    sortOrder: i.sort_order,
    hotspots: byImage.get(i.id) ?? [],
  }));
}

/**
 * Resolve up to 2 active Editions. Returns at most 2 entries even when more
 * editorial collections exist. Falls back to the first 2 resolvable handles
 * if `updatedAt` is not exposed.
 */
export async function fetchEditions(): Promise<Edition[]> {
  // Fetch all known editorial collections in parallel, drop misses + empties.
  const resolved = await Promise.all(
    EDITORIAL_HANDLES.map((h) => fetchCollection(h, 24)),
  );
  const live = resolved
    .map((c, i) => (c ? { c, originalIndex: i } : null))
    .filter((x): x is { c: NonNullable<typeof resolved[number]>; originalIndex: number } => Boolean(x))
    .filter((x) => (x.c.products?.edges?.length ?? 0) > 0);

  // Sort by updatedAt desc when present; else preserve EDITORIAL_HANDLES order.
  live.sort((a, b) => {
    const au = a.c.updatedAt ? new Date(a.c.updatedAt).getTime() : 0;
    const bu = b.c.updatedAt ? new Date(b.c.updatedAt).getTime() : 0;
    if (au !== bu) return bu - au;
    return a.originalIndex - b.originalIndex;
  });

  const top2 = live.slice(0, 1);

  const editions: Edition[] = await Promise.all(
    top2.map(async ({ c }, idx) => {
      const lookbook = await loadLookbookForEdition(c.handle);
      const products: ShopifyProduct[] = c.products.edges.map((e) => ({ node: e.node }));
      const coverFromCollection = c.image?.url;
      const coverFallback = img(FALLBACK_COVERS[idx % FALLBACK_COVERS.length]);
      return {
        number: ROMAN[idx],
        ordinal: idx + 1,
        handle: c.handle,
        title: c.title,
        description: c.description || "",
        cover: {
          url: coverFromCollection ?? coverFallback,
          alt: c.image?.altText ?? c.title,
          width: c.image?.width ?? undefined,
          height: c.image?.height ?? undefined,
        },
        palette: PALETTES[idx % PALETTES.length],
        collection: {
          id: c.id,
          title: c.title,
          handle: c.handle,
          description: c.description ?? "",
          image: c.image,
          updatedAt: c.updatedAt,
        },
        products,
        lookbook,
      };
    }),
  );
  return editions;
}
