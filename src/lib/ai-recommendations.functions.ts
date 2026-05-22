import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLlmJson } from "@/lib/llm.server";
import {
  fetchProductByHandle,
  fetchProductsPage,
  type ShopifyProduct,
} from "@/lib/shopify";
import { isAllowedLuxuryBrand } from "@/lib/nav-config";

const Input = z.object({
  wishlistHandles: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  recentHandles: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  interactionHandles: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
});

export type Recommendation = {
  handle: string;
  reason: string;
};

export type RecommendationsResult = {
  ok: true;
  narrative: string;
  recommendations: Recommendation[];
  products: ShopifyProduct[];
} | {
  ok: false;
  error: string;
};

/**
 * Build a personalized "For You" feed:
 *   1. Hydrate the shopper's seed products (wishlist + recently viewed).
 *   2. Pull a candidate pool of best-sellers + new arrivals from the same
 *      vendors / product types as those seeds.
 *   3. Ask Claude to rank ~6 candidates with a one-line reason each.
 *   4. Return the ranked product nodes + narrative.
 */
export const fetchPersonalizedFeed = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<RecommendationsResult> => {
    const seedHandles = Array.from(
      new Set([...data.wishlistHandles, ...data.recentHandles]),
    ).slice(0, 12);

    if (seedHandles.length === 0) {
      // Cold-start fallback: return best sellers from the curated 100.
      const cold = await fetchProductsPage({
        first: 24,
        sortKey: "BEST_SELLING",
      });
      const products = cold.edges
        .filter((e) => e.node.vendor && isAllowedLuxuryBrand(e.node.vendor))
        .slice(0, 6);
      return {
        ok: true,
        narrative:
          "Start a wishlist or browse a few pieces — your edit will personalise as you go.",
        recommendations: products.map((p) => ({
          handle: p.node.handle,
          reason: "A boutique best-seller",
        })),
        products,
      };
    }

    // Hydrate seeds (best-effort; ignore misses).
    const seeds = (
      await Promise.all(
        seedHandles.map((h) => fetchProductByHandle(h).catch(() => null)),
      )
    ).filter((p): p is NonNullable<typeof p> => Boolean(p));

    if (seeds.length === 0) {
      return { ok: false, error: "Could not load your saved pieces." };
    }

    const seedVendors = Array.from(
      new Set(seeds.map((s) => s.vendor).filter(Boolean)),
    ).slice(0, 5);
    const seedTypes = Array.from(
      new Set(seeds.map((s) => s.productType).filter(Boolean)),
    ).slice(0, 4);

    // Pull candidates: best sellers + new arrivals across the seed vendors.
    const candidatePages = await Promise.all([
      ...seedVendors.map((v) =>
        fetchProductsPage({
          first: 12,
          sortKey: "BEST_SELLING",
          query: `vendor:"${v}"`,
        }).catch(() => ({ edges: [], pageInfo: { hasNextPage: false, endCursor: null } })),
      ),
      fetchProductsPage({ first: 24, sortKey: "BEST_SELLING" }).catch(() => ({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      })),
    ]);

    const seenHandles = new Set(seedHandles);
    const candidates: ShopifyProduct[] = [];
    for (const page of candidatePages) {
      for (const edge of page.edges) {
        if (seenHandles.has(edge.node.handle)) continue;
        if (!edge.node.vendor || !isAllowedLuxuryBrand(edge.node.vendor)) continue;
        seenHandles.add(edge.node.handle);
        candidates.push(edge);
      }
    }

    if (candidates.length === 0) {
      return {
        ok: true,
        narrative: "We're refreshing your edit — please check back shortly.",
        recommendations: [],
        products: [],
      };
    }

    // Trim to 30 candidates so the prompt stays small.
    const trimmed = candidates.slice(0, 30);

    const seedSummary = seeds
      .map(
        (s) =>
          `- ${s.vendor} · ${s.productType || "—"} · "${s.title}" (${s.handle})`,
      )
      .join("\n");
    const candidateSummary = trimmed
      .map(
        (c) =>
          `- ${c.node.handle} :: ${c.node.vendor} · ${c.node.productType || "—"} · "${c.node.title}"`,
      )
      .join("\n");

    type LlmOut = { narrative: string; picks: Recommendation[] };
    const fallback: LlmOut = {
      narrative: `Curated picks across ${seedVendors.slice(0, 3).join(", ")}.`,
      picks: trimmed.slice(0, 6).map((c) => ({
        handle: c.node.handle,
        reason: `Pairs with your interest in ${c.node.vendor}`,
      })),
    };

    const llmOut = await callLlmJson<LlmOut>(
      {
        system: `You are a luxury fashion stylist for Palace of Roman. Given a shopper's saved/viewed pieces and a candidate pool, rank exactly 6 candidates that pair best — across complementary brands, silhouettes, and price tiers. Output JSON: { "narrative": string (one sentence, ≤140 chars), "picks": [{ "handle": string, "reason": string (≤80 chars) }] }. The handle MUST appear verbatim in the candidate list.`,
        user: `SHOPPER SIGNALS — interests:\nVendors: ${seedVendors.join(", ") || "—"}\nProduct types: ${seedTypes.join(", ") || "—"}\n\nSEED PIECES:\n${seedSummary}\n\nCANDIDATES:\n${candidateSummary}\n\nReturn the JSON now.`,
        maxTokens: 700,
        temperature: 0.4,
      },
      fallback,
    );

    const candidateMap = new Map(trimmed.map((c) => [c.node.handle, c]));
    const orderedProducts: ShopifyProduct[] = [];
    const orderedRecs: Recommendation[] = [];
    for (const pick of llmOut.picks ?? []) {
      const hit = candidateMap.get(pick.handle);
      if (!hit) continue;
      if (orderedProducts.some((p) => p.node.handle === hit.node.handle)) continue;
      orderedProducts.push(hit);
      orderedRecs.push({
        handle: pick.handle,
        reason: (pick.reason || "").toString().slice(0, 90),
      });
      if (orderedProducts.length >= 6) break;
    }
    // Pad with leftover candidates if Claude under-delivered.
    if (orderedProducts.length < 6) {
      for (const c of trimmed) {
        if (orderedProducts.length >= 6) break;
        if (orderedProducts.some((p) => p.node.handle === c.node.handle)) continue;
        orderedProducts.push(c);
        orderedRecs.push({
          handle: c.node.handle,
          reason: `Pairs with ${c.node.vendor}`,
        });
      }
    }

    return {
      ok: true,
      narrative: llmOut.narrative || fallback.narrative,
      recommendations: orderedRecs,
      products: orderedProducts,
    };
  });
