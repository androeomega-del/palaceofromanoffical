// Stylist's Note — server-only helpers for the post-purchase AI lookbook.
//
// Two responsibilities:
//   1. generateStylistNote() — calls the Lovable AI Gateway to produce a
//      ~3-sentence editorial paragraph tying the purchased pieces together.
//   2. createStyleVibeDiscount() — provisions a unique 15% Shopify discount
//      code (prefix STYLEVIBE-) via the Admin GraphQL API, valid for the
//      next 48 hours, single-use per customer.
//
// Both are best-effort: callers should swallow failures so the order
// confirmation flow never breaks.

import { adminGraphql } from "@/lib/shopify-admin.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export interface StylistNoteLine {
  title: string;
  vendor?: string | null;
  variant?: string | null;
}

export interface StylistNoteResult {
  paragraph: string;
  model: string;
}

const FALLBACK_NOTE =
  "Your selections sit at the quiet end of luxury — pieces chosen for their cut, " +
  "their hand, and the way they wear a room. Lean into restraint: pair them with " +
  "the simplest counterpart you own and let the materials do the talking. The " +
  "next drop continues this thread of considered, season-less dressing.";

/**
 * Generate the editorial Stylist's Note paragraph. Returns a fallback string
 * on any failure so the caller can always send the email.
 */
export async function generateStylistNote(
  lines: StylistNoteLine[],
  firstName: string | null,
): Promise<StylistNoteResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || lines.length === 0) {
    return { paragraph: FALLBACK_NOTE, model: "fallback" };
  }

  const itemList = lines
    .map((l, i) => {
      const brand = l.vendor ? `${l.vendor} — ` : "";
      const variant = l.variant ? ` (${l.variant})` : "";
      return `${i + 1}. ${brand}${l.title}${variant}`;
    })
    .join("\n");

  const system =
    "You are the in-house stylist for Palace of Roman, a luxury fashion boutique. " +
    "Voice: curatorial, restrained, confident — never effusive, never salesy. " +
    "Write in third-person editorial prose, no exclamation marks, no emoji, no headings. " +
    "Reference materials, silhouette, and how the pieces speak to each other. Briefly " +
    "name one upcoming aesthetic these selections lean into (e.g. quiet luxury, " +
    "post-minimal tailoring, neo-romantic eveningwear). 3 sentences, max 80 words.";

  const userPrompt =
    `Customer first name: ${firstName ?? "(not provided)"}\n\n` +
    `Pieces purchased:\n${itemList}\n\n` +
    `Write the Stylist's Note paragraph now.`;

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });
    if (!res.ok) {
      console.error(
        `[stylist-note] AI gateway ${res.status}:`,
        (await res.text().catch(() => "")).slice(0, 240),
      );
      return { paragraph: FALLBACK_NOTE, model: "fallback" };
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) return { paragraph: FALLBACK_NOTE, model: "fallback" };
    // Hard cap to keep the email tight.
    const trimmed = raw.length > 800 ? raw.slice(0, 800) : raw;
    return { paragraph: trimmed, model: MODEL };
  } catch (err) {
    console.error("[stylist-note] generate failed:", err);
    return { paragraph: FALLBACK_NOTE, model: "fallback" };
  }
}

// ─── Discount code creation (Shopify Admin GraphQL) ──────────────────────

const DISCOUNT_CREATE = /* GraphQL */ `
  mutation StyleVibeCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field message }
    }
  }
`;

function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export interface StyleVibeDiscount {
  code: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
}

/**
 * Create a single-use 15% STYLEVIBE-XXXXXXXX discount code valid for 48
 * hours from now. Returns null on any failure (caller falls back to a
 * static "next purchase" CTA).
 */
export async function createStyleVibeDiscount(
  customerEmail: string | null,
): Promise<StyleVibeDiscount | null> {
  const code = `STYLEVIBE-${randomSuffix()}`;
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 48 * 60 * 60 * 1000);

  try {
    const data = await adminGraphql<{
      discountCodeBasicCreate: {
        codeDiscountNode: { id: string } | null;
        userErrors: Array<{ field: string[] | null; message: string }>;
      };
    }>(DISCOUNT_CREATE, {
      basicCodeDiscount: {
        title: `STYLEVIBE 48h — ${customerEmail ?? "guest"}`,
        code,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        customerSelection: { all: true },
        customerGets: {
          value: { percentage: 0.15 },
          items: { all: true },
        },
        appliesOncePerCustomer: true,
        usageLimit: 1,
        combinesWith: {
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: true,
        },
      },
    });
    const errors = data.discountCodeBasicCreate?.userErrors ?? [];
    if (errors.length > 0) {
      console.error(
        "[stylist-note] discount userErrors:",
        errors.map((e) => `${(e.field ?? []).join(".")}: ${e.message}`).join("; "),
      );
      return null;
    }
    if (!data.discountCodeBasicCreate?.codeDiscountNode?.id) return null;
    return {
      code,
      percentage: 15,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  } catch (err) {
    console.error("[stylist-note] discount create failed:", err);
    return null;
  }
}
