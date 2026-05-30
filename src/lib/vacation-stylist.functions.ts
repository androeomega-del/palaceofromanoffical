/**
 * Vacation Stylist — given a destination, trip dates, vibe, and optional notes,
 * assemble a 3–5 chapter capsule from the live catalog. Each chapter has a
 * theme (e.g. "Arrival & Transit", "Beach Club", "Resort Evening") with 3–4
 * real product handles drawn from a candidate pool. The LLM picks; we hydrate
 * verified ShopifyProduct nodes so untagged stories never ship.
 */
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
  destination: z.string().trim().min(2).max(120),
  startDate: z.string().trim().max(40).optional().default(""),
  endDate: z.string().trim().max(40).optional().default(""),
  vibe: z.enum([
    "beach-club",
    "yacht-marina",
    "resort-evening",
    "city-escape",
    "desert-retreat",
    "alpine-getaway",
  ]),
  notes: z.string().trim().max(500).optional().default(""),
});

export type StylistChapter = {
  title: string;
  rationale: string;
  products: ShopifyProduct[];
};

export type StylistResult =
  | {
      ok: true;
      headline: string;
      narrative: string;
      chapters: StylistChapter[];
    }
  | { ok: false; error: string };

const VIBE_QUERIES: Record<string, string[]> = {
  "beach-club": ["swim", "kaftan", "linen", "sandal", "tunic"],
  "yacht-marina": ["linen", "polo", "loafer", "navy", "blazer"],
  "resort-evening": ["dress", "silk", "heel", "clutch", "evening"],
  "city-escape": ["blazer", "trouser", "loafer", "tote", "shirt"],
  "desert-retreat": ["linen", "kaftan", "leather", "sandal", "scarf"],
  "alpine-getaway": ["wool", "cashmere", "knit", "boot", "coat"],
};

const VIBE_LABEL: Record<string, string> = {
  "beach-club": "Beach Club",
  "yacht-marina": "Yacht & Marina",
  "resort-evening": "Resort Evening",
  "city-escape": "City Escape",
  "desert-retreat": "Desert Retreat",
  "alpine-getaway": "Alpine Getaway",
};

export const buildVacationCapsule = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<StylistResult> => {
    // Build a candidate pool: best-sellers + targeted searches per vibe keyword.
    const terms = VIBE_QUERIES[data.vibe] ?? [];
    const pages = await Promise.all([
      fetchProductsPage({ first: 40, sortKey: "BEST_SELLING" }).catch(() => ({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      })),
      ...terms.slice(0, 4).map((t) =>
        fetchProductsPage({ first: 12, sortKey: "BEST_SELLING", query: t }).catch(
          () => ({ edges: [], pageInfo: { hasNextPage: false, endCursor: null } }),
        ),
      ),
    ]);

    const seen = new Set<string>();
    const candidates: ShopifyProduct[] = [];
    for (const page of pages) {
      for (const e of page.edges) {
        if (seen.has(e.node.handle)) continue;
        if (!e.node.vendor || !isAllowedLuxuryBrand(e.node.vendor)) continue;
        seen.add(e.node.handle);
        candidates.push(e);
      }
    }

    if (candidates.length === 0) {
      return { ok: false, error: "Catalogue is refreshing — please try again shortly." };
    }

    const pool = candidates.slice(0, 50);
    const candidateSummary = pool
      .map(
        (c) =>
          `- ${c.node.handle} :: ${c.node.vendor} · ${c.node.productType || "—"} · "${c.node.title}"`,
      )
      .join("\n");

    type LlmOut = {
      headline: string;
      narrative: string;
      chapters: Array<{ title: string; rationale: string; handles: string[] }>;
    };

    const fallback: LlmOut = {
      headline: `A ${VIBE_LABEL[data.vibe]} capsule for ${data.destination}`,
      narrative:
        "A restrained edit drawn from the boutique — pieces that travel well and read effortlessly on arrival.",
      chapters: [
        {
          title: "The Edit",
          rationale: "Quiet luxury staples chosen for the trip.",
          handles: pool.slice(0, 4).map((p) => p.node.handle),
        },
      ],
    };

    const dateLine =
      data.startDate || data.endDate
        ? `Travel dates: ${data.startDate || "?"} → ${data.endDate || "?"}.`
        : "Travel dates: open.";

    const llm = await callLlmJson<LlmOut>(
      {
        system: `You are a luxury fashion stylist for Palace of Roman, curating travel capsules. Given a destination, dates, vibe, and a candidate pool of real boutique products, assemble 3–4 chapters that read like an editorial packing list. Each chapter has a title (e.g. "Arrival & Transit", "Beach Club Hours", "Sunset Apéro", "Evening Reservations"), a one-sentence rationale (≤120 chars), and 3–4 handles drawn VERBATIM from the candidate list. Never invent handles. Output JSON only: { "headline": string (≤80 chars), "narrative": string (≤200 chars), "chapters": [{ "title": string, "rationale": string, "handles": string[] }] }.`,
        user: `Destination: ${data.destination}\nVibe: ${VIBE_LABEL[data.vibe]}\n${dateLine}\nNotes: ${data.notes || "—"}\n\nCANDIDATES (handle :: vendor · type · title):\n${candidateSummary}\n\nReturn the JSON now.`,
        maxTokens: 1100,
        temperature: 0.5,
      },
      fallback,
    );

    const byHandle = new Map(pool.map((p) => [p.node.handle, p]));
    const chapters: StylistChapter[] = [];
    const usedHandles = new Set<string>();
    for (const ch of llm.chapters ?? []) {
      const products: ShopifyProduct[] = [];
      for (const h of ch.handles ?? []) {
        if (usedHandles.has(h)) continue;
        const hit = byHandle.get(h);
        if (!hit) continue;
        products.push(hit);
        usedHandles.add(h);
        if (products.length >= 4) break;
      }
      // If LLM under-picked, top up from pool with unused handles.
      if (products.length < 3) {
        for (const c of pool) {
          if (products.length >= 3) break;
          if (usedHandles.has(c.node.handle)) continue;
          products.push(c);
          usedHandles.add(c.node.handle);
        }
      }
      if (products.length === 0) continue;
      chapters.push({
        title: (ch.title || "Chapter").toString().slice(0, 60),
        rationale: (ch.rationale || "").toString().slice(0, 140),
        products,
      });
    }

    // If chapters didn't form, fall back to a single chapter.
    if (chapters.length === 0) {
      chapters.push({
        title: "The Capsule",
        rationale: `A ${VIBE_LABEL[data.vibe].toLowerCase()} edit for ${data.destination}.`,
        products: pool.slice(0, 4),
      });
    }

    // Hydrate any missing fields (storefront page already returns full nodes,
    // so this is a no-op for cached handles — kept for safety).
    void fetchProductByHandle; // silence unused import lint if tree-shaken

    return {
      ok: true,
      headline: llm.headline || fallback.headline,
      narrative: llm.narrative || fallback.narrative,
      chapters,
    };
  });
