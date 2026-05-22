import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLlmJson } from "@/lib/llm.server";
import { ALL_LUXURY_BRANDS } from "@/lib/luxury-brands";

// Output shape we pass to /shop search params.
export type ParsedSearch = {
  /** Free-text Storefront query (vendor:"…" + keywords). */
  q: string;
  /** Optional gender bucket. */
  gender?: "Women" | "Men" | "Unisex";
  /** Optional collection handle (e.g. "best-sellers", "new-arrivals", "swimwear"). */
  collection?: string;
  /** Optional title hint (mirrors `title` URL param on /shop). */
  title?: string;
  /** Optional price bounds in USD. */
  min?: number;
  max?: number;
  /** Pretty narrative the UI shows the user explaining what we searched for. */
  narrative: string;
};

const ParseInput = z.object({
  query: z.string().trim().min(1).max(280),
});

const KNOWN_COLLECTIONS = [
  "new-arrivals",
  "best-sellers",
  "sale",
  "swimwear",
  "dresses",
  "bags",
  "shoes",
  "sneakers",
  "boots",
  "watches",
  "jewelry",
  "sunglasses",
  "scarves",
  "belts",
  "wallets",
  "coats",
  "knitwear",
  "denim",
  "suits",
  "shirts",
  "tshirts-women",
  "tshirts-men",
  "handbags",
  "tote-bags",
  "crossbody-bags",
];

const SYSTEM_PROMPT = `You are the Palace of Roman search concierge. Convert a shopper's natural-language query into a structured Shopify Storefront search payload.

Rules:
- "vendor" must be from this allowlist (case-sensitive, exact spelling): ${ALL_LUXURY_BRANDS
  .map((b) => b.name)
  .join(" | ")}
- "collection" must be from: ${KNOWN_COLLECTIONS.join(", ")} (or omitted).
- gender ∈ {Women, Men, Unisex} (or omitted).
- Build "q" using Shopify Storefront search syntax. If a vendor was identified, prefix with: vendor:"<Exact Brand>". Append free-text product keywords (e.g. monogram, leather, trench, espadrille) AFTER the vendor: clause, space-separated. Drop stop words.
- "title" (optional) is a short product-name hint (e.g. "Triomphe", "Speedy", "Puzzle") if the shopper named a model/icon.
- Price: parse "$" amounts, "under X", "over X", "between X and Y" → min/max in whole USD.
- "narrative" is a single short sentence the boutique shows the shopper, e.g. "Searching Loewe leather bags under $3,000."
- Output JSON ONLY with keys: q (string), gender (optional), collection (optional), title (optional), min (optional number), max (optional number), narrative (string).
- If the shopper's query mentions a brand NOT in the allowlist, omit vendor and just use product keywords.`;

export const parseAiSearch = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ParseInput.parse(i))
  .handler(async ({ data }): Promise<ParsedSearch> => {
    const fallback: ParsedSearch = {
      q: data.query,
      narrative: `Searching the boutique for "${data.query}".`,
    };

    const parsed = await callLlmJson<Partial<ParsedSearch>>(
      {
        system: SYSTEM_PROMPT,
        user: data.query,
        maxTokens: 400,
        temperature: 0.1,
      },
      fallback,
    );

    // Hard-validate the shape so a hallucinated brand never poisons results.
    const allowedBrandNames = new Set(ALL_LUXURY_BRANDS.map((b) => b.name));
    let q = (parsed.q ?? data.query).toString().trim() || data.query;
    // If model put a vendor: clause with a brand not in the allowlist, strip it.
    q = q.replace(/vendor:"([^"]+)"/g, (m, v) => (allowedBrandNames.has(v) ? m : ""))
      .replace(/\s+/g, " ")
      .trim();

    const out: ParsedSearch = {
      q: q || data.query,
      narrative: parsed.narrative?.toString().slice(0, 200) || fallback.narrative,
    };
    if (parsed.gender && ["Women", "Men", "Unisex"].includes(parsed.gender)) {
      out.gender = parsed.gender as ParsedSearch["gender"];
    }
    if (parsed.collection && KNOWN_COLLECTIONS.includes(parsed.collection)) {
      out.collection = parsed.collection;
    }
    if (parsed.title && typeof parsed.title === "string") {
      out.title = parsed.title.slice(0, 80);
    }
    if (typeof parsed.min === "number" && parsed.min > 0) out.min = Math.round(parsed.min);
    if (typeof parsed.max === "number" && parsed.max > 0) out.max = Math.round(parsed.max);
    return out;
  });
