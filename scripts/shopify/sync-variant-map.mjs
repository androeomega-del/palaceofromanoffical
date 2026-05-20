// One-off: paginate Shopify Admin REST to build SKU → Shopify variant GID map,
// then upsert into public.shopify_variant_map (Lovable Cloud / Supabase).
//
// Run:  node scripts/shopify/sync-variant-map.mjs           (full run)
//       node scripts/shopify/sync-variant-map.mjs --dry     (first page, no DB writes)
//       node scripts/shopify/sync-variant-map.mjs --limit=5 (only N pages)

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DRY = process.argv.includes('--dry');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const PAGE_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!DRY && (!SB_URL || !SB_KEY)) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function adminGet(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' } });
    if (res.status === 429) {
      const wait = parseFloat(res.headers.get('retry-after') || '2') * 1000;
      console.warn(`429 — sleeping ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
    const link = res.headers.get('link') || '';
    const json = await res.json();
    const next = /<([^>]+)>;\s*rel="next"/.exec(link);
    return { json, nextUrl: next ? next[1] : null };
  }
  throw new Error('Too many 429s');
}

async function sbUpsert(rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SB_URL}/rest/v1/shopify_variant_map?on_conflict=sku`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert ${res.status}: ${await res.text()}`);
}

let pages = 0, totalProducts = 0, totalVariants = 0, mapped = 0, skipped = 0;
let url = `https://${SHOP}/admin/api/${API}/products.json?limit=250&fields=id,handle,variants`;

console.log(`Starting variant-map sync (dry=${DRY}, pageLimit=${PAGE_LIMIT})`);

while (url && pages < PAGE_LIMIT) {
  const { json, nextUrl } = await adminGet(url);
  const products = json.products || [];
  totalProducts += products.length;

  const rows = [];
  for (const p of products) {
    const productGid = `gid://shopify/Product/${p.id}`;
    for (const v of p.variants || []) {
      totalVariants++;
      if (!v.sku) { skipped++; continue; }
      rows.push({
        sku: v.sku,
        variant_gid: `gid://shopify/ProductVariant/${v.id}`,
        product_gid: productGid,
        product_handle: p.handle,
        available: (v.inventory_quantity ?? 0) > 0 || v.inventory_policy === 'continue',
        synced_at: new Date().toISOString(),
      });
      mapped++;
    }
  }

  pages++;
  console.log(`Page ${pages}: ${products.length} products, ${rows.length} variants → upsert`);
  if (!DRY) await sbUpsert(rows);
  if (DRY && pages === 1) {
    console.log('Sample rows:', JSON.stringify(rows.slice(0, 2), null, 2));
  }

  url = nextUrl;
  await sleep(500); // ~2 req/sec
}

console.log(`\nDone. Pages=${pages} Products=${totalProducts} Variants=${totalVariants} Mapped=${mapped} Skipped(no SKU)=${skipped}`);
