import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';

async function shopifyFetch(path: string, init: RequestInit = {}, token: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://${SHOP}/admin/api/${API}${path}`, {
      ...init,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (res.status === 429) {
      const ra = parseFloat(res.headers.get('retry-after') || '2');
      await new Promise((r) => setTimeout(r, ra * 1000));
      continue;
    }
    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  }
  throw new Error('Too many Shopify retries');
}

export const Route = createFileRoute('/api/public/hooks/expire-shopify-tags')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: require a server-only shared secret. Without this, anyone on
        // the internet could trigger bulk Shopify tag removal and service-role
        // DB reads.
        const expected = process.env.SYNC_WEBHOOK_SECRET;
        if (!expected) {
          console.error('[expire-shopify-tags] SYNC_WEBHOOK_SECRET not configured');
          return new Response('Server not configured', { status: 500 });
        }
        const provided =
          request.headers.get('x-webhook-secret') ||
          request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
          '';
        // Constant-time comparison
        const a = new TextEncoder().encode(provided);
        const b = new TextEncoder().encode(expected);
        const okLen = a.length === b.length;
        const len = Math.max(a.length, b.length);
        let diff = a.length ^ b.length;
        for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
        if (!okLen || diff !== 0) {
          return new Response('Unauthorized', { status: 401 });
        }

        const token = process.env.SHOPIFY_ACCESS_TOKEN;
        if (!token) {
          return new Response(JSON.stringify({ error: 'SHOPIFY_ACCESS_TOKEN missing' }), { status: 500 });
        }


        const { data: expired, error } = await supabaseAdmin
          .from('shopify_tag_expirations')
          .select('id, product_id, tag')
          .lte('expires_at', new Date().toISOString())
          .limit(1000);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        if (!expired || expired.length === 0) {
          return new Response(JSON.stringify({ processed: 0 }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Group by product so we make one PUT per product even if multiple tags expire.
        const byProduct = new Map<string, { tags: Set<string>; rowIds: string[] }>();
        for (const r of expired) {
          const e = byProduct.get(r.product_id) ?? { tags: new Set<string>(), rowIds: [] };
          e.tags.add(r.tag);
          e.rowIds.push(r.id);
          byProduct.set(r.product_id, e);
        }

        let ok = 0;
        let failed = 0;
        const cleanedRowIds: string[] = [];

        for (const [productId, { tags, rowIds }] of byProduct) {
          // 1. Fetch current tags
          const get = await shopifyFetch(`/products/${productId}.json?fields=id,tags`, {}, token);
          if (get.status === 404) {
            // Product no longer exists — drop the rows to stop retrying.
            cleanedRowIds.push(...rowIds);
            continue;
          }
          if (get.status !== 200) {
            failed++;
            continue;
          }
          const product = (get.body as { product?: { tags?: string } }).product;
          const current = new Set(
            (product?.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
          );
          let changed = false;
          for (const t of tags) {
            if (current.delete(t)) changed = true;
          }
          if (changed) {
            const put = await shopifyFetch(
              `/products/${productId}.json`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  product: { id: Number(productId), tags: [...current].join(', ') },
                }),
              },
              token,
            );
            if (put.status === 200) {
              ok++;
              cleanedRowIds.push(...rowIds);
            } else {
              failed++;
              continue;
            }
          } else {
            // Tag already gone — just clear the rows.
            cleanedRowIds.push(...rowIds);
          }
          await new Promise((r) => setTimeout(r, 250));
        }

        if (cleanedRowIds.length > 0) {
          await supabaseAdmin
            .from('shopify_tag_expirations')
            .delete()
            .in('id', cleanedRowIds);
        }

        return new Response(
          JSON.stringify({
            processed: expired.length,
            products_updated: ok,
            failed,
            rows_cleared: cleanedRowIds.length,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      },
    },
  },
});
