import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLlmJson } from "@/lib/llm.server";
import {
  fetchProductByHandle,
  fetchProductsPage,
  type ShopifyProduct,
} from "@/lib/shopify";
import { isAllowedLuxuryBrand } from "@/lib/nav-config";

// Context the client sends about what the shopper is currently looking at.
const ContextSchema = z.object({
  /** Page type the shopper is on, drives the prompt voice. */
  pageType: z
    .enum(["home", "product", "brand", "collection", "shop", "other"])
    .default("other"),
  /** Current product handle (if on a product page). */
  currentProductHandle: z.string().trim().min(1).max(120).optional(),
  /** Current brand/vendor name (product, brand, or collection page). */
  currentVendor: z.string().trim().min(1).max(80).optional(),
  /** Current collection handle (if on a collection page). */
  currentCollection: z.string().trim().min(1).max(120).optional(),
  /** Wishlist + recently-viewed handles (browser signals). */
  wishlistHandles: z.array(z.string().min(1).max(120)).max(40).default([]),
  recentHandles: z.array(z.string().min(1).max(120)).max(40).default([]),
  /** Top-scored interaction handles (hover/click/cart weighted). */
  interactionHandles: z.array(z.string().min(1).max(120)).max(40).default([]),
  /** Optional first name to address the shopper personally. */
  shopperName: z.string().trim().min(1).max(60).optional(),
});

export type ConciergePick = { handle: string; reason: string };

export type ConciergeResult = {
  ok: true;
  greeting: string;
  picks: ConciergePick[];
  products: ShopifyProduct[];
} | {
  ok: false;
  error: string;
};

/**
 * Contextual product concierge. Picks up to 4 items the shopper would likely
 * enjoy *right now*, given the page they're on and their browsing signals.
 */
export const fetchConciergePicks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ContextSchema.parse(i))
  .handler(async ({ data }): Promise<ConciergeResult> => {
    // 1. Hydrate context anchor + browsing signals.
    const anchorHandle = data.currentProductHandle ?? data.recentHandles[0];
    const anchor = anchorHandle
      ? await fetchProductByHandle(anchorHandle).catch(() => null)
      : null;

    // 2. Build the candidate pool from the most relevant Shopify slices.
    //    - Same vendor (highest signal)
    //    - Same product type
    //    - Best sellers (cross-house anchor)
    const vendorHint = data.currentVendor || anchor?.vendor || "";
    const typeHint = anchor?.productType || "";
    const pages = await Promise.all([
      vendorHint
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `vendor:"${vendorHint}"`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      typeHint
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `product_type:"${typeHint}"`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      data.currentCollection
        ? fetchProductsPage({
            first: 12,
            sortKey: "BEST_SELLING",
            query: `tag:'${data.currentCollection}'`,
          }).catch(emptyPage)
        : Promise.resolve(emptyPage()),
      fetchProductsPage({ first: 18, sortKey: "BEST_SELLING" }).catch(emptyPage),
    ]);

    // 3. Filter to curated 100, exclude already-seen handles, cap at 24.
    const seen = new Set<string>([
      ...(anchor ? [anchor.handle] : []),
      ...data.wishlistHandles,
      ...data.recentHandles,
    ]);
    const candidates: ShopifyProduct[] = [];
    for (const page of pages) {
      for (const edge of page.edges) {
        if (seen.has(edge.node.handle)) continue;
        if (!edge.node.vendor || !isAllowedLuxuryBrand(edge.node.vendor)) continue;
        seen.add(edge.node.handle);
        candidates.push(edge);
        if (candidates.length >= 24) break;
      }
      if (candidates.length >= 24) break;
    }

    if (candidates.length === 0) {
      return {
        ok: true,
        greeting: "The buyers are refreshing this section — please check back shortly.",
        picks: [],
        products: [],
      };
    }

    // 4. Compose the brief for Claude.
    const contextSummary = [
      data.pageType === "product" && anchor
        ? `Shopper is viewing the product "${anchor.title}" by ${anchor.vendor} (${anchor.productType || "—"}).`
        : null,
      data.pageType === "brand" && vendorHint
        ? `Shopper is browsing the ${vendorHint} brand page.`
        : null,
      data.pageType === "collection" && data.currentCollection
        ? `Shopper is browsing the "${data.currentCollection}" collection.`
        : null,
      data.pageType === "home"
        ? `Shopper just landed on the boutique homepage.`
        : null,
      data.recentHandles.length > 0
        ? `Recently viewed: ${data.recentHandles.slice(0, 5).join(", ")}.`
        : null,
      data.wishlistHandles.length > 0
        ? `Wishlist: ${data.wishlistHandles.slice(0, 5).join(", ")}.`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const candidateLines = candidates
      .map(
        (c) =>
          `- ${c.node.handle} :: ${c.node.vendor} · ${c.node.productType || "—"} · "${c.node.title}"`,
      )
      .join("\n");

    type LlmOut = { greeting: string; picks: ConciergePick[] };
    const fallback: LlmOut = {
      greeting:
        anchor && anchor.vendor
          ? `Pieces that pair beautifully with this ${anchor.vendor}.`
          : "Three pieces from the boutique you may not have seen.",
      picks: candidates.slice(0, 4).map((c) => ({
        handle: c.node.handle,
        reason: `Pairs with ${c.node.vendor}`,
      })),
    };

    const llmOut = await callLlmJson<LlmOut>(
      {
        system: `You are a discreet luxury concierge for Palace of Roman. You whisper recommendations while a shopper browses. Output JSON ONLY: { "greeting": string (≤120 chars, warm and editorial, no exclamation marks), "picks": [{ "handle": string, "reason": string (≤70 chars, complimentary and specific) }] } — return EXACTLY 4 picks. Each handle MUST be present verbatim in the candidate list.`,
        user: `BROWSING CONTEXT:\n${contextSummary || "(none provided)"}\n\nCANDIDATES (handle :: vendor · type · title):\n${candidateLines}\n\nNow return the JSON.`,
        maxTokens: 600,
        temperature: 0.5,
      },
      fallback,
    );

    const map = new Map(candidates.map((c) => [c.node.handle, c]));
    const products: ShopifyProduct[] = [];
    const picks: ConciergePick[] = [];
    for (const p of llmOut.picks ?? []) {
      const hit = map.get(p.handle);
      if (!hit) continue;
      if (products.some((x) => x.node.handle === hit.node.handle)) continue;
      products.push(hit);
      picks.push({ handle: p.handle, reason: (p.reason || "").slice(0, 80) });
      if (products.length >= 4) break;
    }
    // Pad if model under-delivered.
    if (products.length < 4) {
      for (const c of candidates) {
        if (products.length >= 4) break;
        if (products.some((x) => x.node.handle === c.node.handle)) continue;
        products.push(c);
        picks.push({ handle: c.node.handle, reason: `Pairs with ${c.node.vendor}` });
      }
    }

    return {
      ok: true,
      greeting: llmOut.greeting?.toString().slice(0, 140) || fallback.greeting,
      picks,
      products,
    };
  });

function emptyPage() {
  return {
    edges: [] as ShopifyProduct[],
    pageInfo: { hasNextPage: false, endCursor: null as string | null },
  };
}
