// Nightly sync: pulls all Shopify collections, ensures every handle has a
// hero image stored in `collection_images`. Shopify-supplied images are
// preferred; otherwise an editorial image is generated via Lovable AI and
// uploaded to the `collection-images` storage bucket. Idempotent.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  SHOPIFY_STOREFRONT_URL,
  SHOPIFY_STOREFRONT_TOKEN,
} from "@/lib/shopify";

const COLLECTIONS_QUERY = /* GraphQL */ `
  query SyncCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          handle
          title
          description
          image { url }
        }
      }
    }
  }
`;

type ShopifyCollectionLite = {
  handle: string;
  title: string;
  description: string | null;
  image: { url: string } | null;
};

async function fetchAllCollections(): Promise<ShopifyCollectionLite[]> {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query: COLLECTIONS_QUERY, variables: { first: 250 } }),
  });
  if (!res.ok) throw new Error(`Shopify ${res.status}`);
  const json = (await res.json()) as {
    data?: { collections?: { edges: Array<{ node: ShopifyCollectionLite }> } };
  };
  return json.data?.collections?.edges?.map((e) => e.node) ?? [];
}

function buildPrompt(c: ShopifyCollectionLite): string {
  const desc = (c.description ?? "").slice(0, 240);
  return [
    `Editorial fashion photograph representing the "${c.title}" collection`,
    "luxury boutique catalog, 4:5 vertical composition, soft natural studio light,",
    "warm neutral background, no text, no logos, no watermark, no people facing camera,",
    desc ? `subject matter: ${desc}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

async function generateImage(prompt: string): Promise<Uint8Array> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{
      message?: { images?: Array<{ image_url?: { url?: string } }> };
    }>;
  };
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("No image returned");
  const b64 = dataUrl.includes(",") ? dataUrl.split(",", 2)[1] : dataUrl;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function uploadGenerated(handle: string, bytes: Uint8Array): Promise<string> {
  const path = `${handle}.png`;
  const { error } = await supabaseAdmin.storage
    .from("collection-images")
    .upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from("collection-images").getPublicUrl(path);
  return data.publicUrl;
}

export const Route = createFileRoute("/api/public/hooks/sync-collection-images")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: require a server-only shared secret. Never accept the public
        // anon/publishable key here — it is bundled in client JS and visible
        // to any visitor, which would let anyone trigger costly AI image
        // generation and admin DB writes.
        const expected = process.env.SYNC_WEBHOOK_SECRET;
        if (!expected) {
          console.error("[sync-collection-images] SYNC_WEBHOOK_SECRET not configured");
          return new Response("Server not configured", { status: 500 });
        }
        const provided =
          request.headers.get("x-webhook-secret") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          "";
        // Constant-time comparison
        const a = new TextEncoder().encode(provided);
        const b = new TextEncoder().encode(expected);
        let ok = a.length === b.length;
        const len = Math.max(a.length, b.length);
        let diff = a.length ^ b.length;
        for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
        if (!ok || diff !== 0) {
          return new Response("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "true";
        const handleFilter = url.searchParams.get("handle");

        let collections: ShopifyCollectionLite[];
        try {
          collections = await fetchAllCollections();
        } catch (e) {
          console.error("[sync-collection-images] Shopify fetch failed:", (e as Error).message);
          return Response.json(
            { ok: false, error: "Upstream fetch failed" },
            { status: 502 }
          );
        }

        if (handleFilter) {
          collections = collections.filter((c) => c.handle === handleFilter);
        }

        // Existing rows so we know what's manual/ai and what's stale.
        const { data: existing } = await supabaseAdmin
          .from("collection_images")
          .select("handle, source, image_url");
        const bySource = new Map<string, { source: string; image_url: string }>();
        for (const r of existing ?? []) bySource.set(r.handle, r);

        const result = {
          ok: true,
          total: collections.length,
          shopify: 0,
          generated: 0,
          skipped: 0,
          errors: [] as Array<{ handle: string; error: string }>,
        };

        for (const c of collections) {
          try {
            const current = bySource.get(c.handle);

            // 1. Shopify provides an image → always use it (refresh on each run).
            if (c.image?.url) {
              await supabaseAdmin.from("collection_images").upsert({
                handle: c.handle,
                title: c.title,
                image_url: c.image.url,
                source: "shopify",
                prompt: null,
              });
              result.shopify++;
              continue;
            }

            // 2. Already have an AI or manual image and not forcing → skip.
            if (!force && current && (current.source === "ai" || current.source === "manual")) {
              result.skipped++;
              continue;
            }

            // 3. Generate via Lovable AI, upload to Storage, upsert row.
            const prompt = buildPrompt(c);
            const bytes = await generateImage(prompt);
            const publicUrl = await uploadGenerated(c.handle, bytes);
            await supabaseAdmin.from("collection_images").upsert({
              handle: c.handle,
              title: c.title,
              image_url: publicUrl,
              source: "ai",
              prompt,
            });
            result.generated++;
          } catch (e) {
            console.error(`[sync-collection-images] failed for ${c.handle}:`, (e as Error).message);
            result.errors.push({ handle: c.handle, error: "Internal error" });
          }
        }

        return Response.json(result);
      },
    },
  },
});
