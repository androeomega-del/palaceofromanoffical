// One-off: create BG products that aren't in Shopify yet, then refresh shopify_variant_map.
//
// Skips any bg_products.handle that already exists in shopify_variant_map (idempotent / resumable).
// Throttled at 2 req/sec, retries on 429. Each product is one POST that includes all variants.
//
// Run:
//   node scripts/shopify/import-missing-products.mjs --dry              (preview first 3 payloads, no writes)
//   node scripts/shopify/import-missing-products.mjs --limit=50         (cap to N products)
//   node scripts/shopify/import-missing-products.mjs                    (full run — ~7-8 hours for 55k)
//   node scripts/shopify/import-missing-products.mjs --offset=10000     (resume — skip first N pending)

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DRY = process.argv.includes('--dry');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const offsetArg = process.argv.find((a) => a.startsWith('--offset='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const OFFSET = offsetArg ? parseInt(offsetArg.split('=')[1], 10) : 0;

// EUR -> USD conversion (keep in sync with src/lib/shopify.ts EUR_TO_USD).
const EUR_TO_USD = 1.08;

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!SB_URL || !SB_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sb(path, init = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${await res.text()}`);
  return res;
}

async function adminPost(url, body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const wait = parseFloat(res.headers.get('retry-after') || '2') * 1000;
      console.warn(`429 — sleeping ${wait}ms (attempt ${attempt + 1})`);
      await sleep(wait);
      continue;
    }
    const text = await res.text();
    if (!res.ok) {
      // 422 "handle has already been taken" → treat as soft-skip
      if (res.status === 422 && /has already been taken/i.test(text)) {
        return { skipped: true, reason: 'handle exists' };
      }
      throw new Error(`Shopify ${res.status}: ${text}`);
    }
    return { json: JSON.parse(text) };
  }
  throw new Error('Too many 429s');
}

// Fetch the set of handles already in shopify_variant_map (so we can skip them).
async function fetchMappedHandles() {
  console.log('Loading already-mapped handles from shopify_variant_map…');
  const handles = new Set();
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const res = await sb(`shopify_variant_map?select=product_handle&product_handle=not.is.null`, {
      headers: { Range: `${from}-${from + pageSize - 1}`, Prefer: 'count=exact' },
    });
    const rows = await res.json();
    for (const r of rows) if (r.product_handle) handles.add(r.product_handle);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  console.log(`  → ${handles.size} handles already mapped.`);
  return handles;
}

// Fetch all bg_products + their variants. Streams in pages.
async function fetchAllProducts() {
  console.log('Loading bg_products…');
  const products = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const res = await sb(`bg_products?select=handle,group_sku,brand,name,description,description_plain,gender,category,subcategory,color,material,retail_price,currency,main_picture,pictures&order=handle.asc`, {
      headers: { Range: `${from}-${from + pageSize - 1}` },
    });
    const rows = await res.json();
    products.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  console.log(`  → ${products.length} bg_products.`);
  return products;
}

async function fetchVariantsForGroups(groupSkus) {
  const map = new Map(); // group_sku -> variants[]
  const chunkSize = 200;
  for (let i = 0; i < groupSkus.length; i += chunkSize) {
    const chunk = groupSkus.slice(i, i + chunkSize);
    const inList = chunk.map((s) => encodeURIComponent(`"${s}"`)).join(',');
    const res = await sb(`bg_variants?select=group_sku,product_sku,size,quantity,weight&group_sku=in.(${inList})`);
    const rows = await res.json();
    for (const r of rows) {
      if (!map.has(r.group_sku)) map.set(r.group_sku, []);
      map.get(r.group_sku).push(r);
    }
  }
  return map;
}

function eurToUsd(eur) {
  if (eur == null) return '0.00';
  return (Number(eur) * EUR_TO_USD).toFixed(2);
}

function buildProductPayload(p, variants) {
  // Build Shopify variants from bg_variants. If a product has only one variant
  // with size "One Size" / null, treat as single-variant.
  const hasRealSizes = variants.some((v) => v.size && !/^one\s*size$/i.test(v.size));
  const shopifyVariants = variants.map((v) => ({
    option1: hasRealSizes ? (v.size || 'One Size') : 'Default Title',
    price: eurToUsd(p.retail_price),
    sku: v.product_sku,
    inventory_management: 'shopify',
    inventory_quantity: v.quantity ?? 0,
    inventory_policy: 'deny',
    weight: v.weight ?? 0.5,
    weight_unit: 'kg',
    requires_shipping: true,
    taxable: true,
  }));

  const images = [];
  if (p.main_picture) images.push({ src: p.main_picture });
  if (Array.isArray(p.pictures)) {
    for (const url of p.pictures) {
      if (url && url !== p.main_picture) images.push({ src: url });
    }
  }

  const tags = [p.gender, p.category, p.subcategory, p.color, p.material]
    .filter(Boolean)
    .map(String);

  return {
    product: {
      title: p.name || p.handle,
      body_html: p.description || p.description_plain || '',
      vendor: p.brand || 'Palace of Roman',
      product_type: p.category || 'Apparel',
      handle: p.handle,
      tags: tags.join(', '),
      status: 'active',
      published: true,
      ...(hasRealSizes ? { options: [{ name: 'Size' }] } : {}),
      variants: shopifyVariants,
      images,
    },
  };
}

async function sbUpsertMap(rows) {
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

// ---------- main ----------
const [mappedHandles, allProducts] = await Promise.all([fetchMappedHandles(), fetchAllProducts()]);

const pending = allProducts.filter((p) => !mappedHandles.has(p.handle));
console.log(`Pending (not yet in Shopify): ${pending.length}`);

const slice = pending.slice(OFFSET, OFFSET + LIMIT);
console.log(`Processing ${slice.length} (offset=${OFFSET}, limit=${LIMIT === Infinity ? 'none' : LIMIT}, dry=${DRY})`);

const variantsMap = await fetchVariantsForGroups(slice.map((p) => p.group_sku));

let created = 0, skipped = 0, failed = 0, noVariants = 0;
const startTs = Date.now();

for (let i = 0; i < slice.length; i++) {
  const p = slice[i];
  const variants = variantsMap.get(p.group_sku) || [];
  if (variants.length === 0) { noVariants++; continue; }

  const payload = buildProductPayload(p, variants);

  if (DRY) {
    if (i < 3) console.log(JSON.stringify(payload, null, 2));
    continue;
  }

  try {
    const result = await adminPost(`https://${SHOP}/admin/api/${API}/products.json`, payload);
    if (result.skipped) { skipped++; }
    else {
      const sp = result.json.product;
      const rows = sp.variants.map((v) => ({
        sku: v.sku,
        variant_gid: `gid://shopify/ProductVariant/${v.id}`,
        product_gid: `gid://shopify/Product/${sp.id}`,
        product_handle: sp.handle,
        available: (v.inventory_quantity ?? 0) > 0,
        synced_at: new Date().toISOString(),
      }));
      await sbUpsertMap(rows);
      created++;
    }
  } catch (e) {
    failed++;
    console.error(`FAIL ${p.handle}: ${e.message}`);
  }

  if ((i + 1) % 25 === 0) {
    const elapsed = (Date.now() - startTs) / 1000;
    const rate = (i + 1) / elapsed;
    const remaining = (slice.length - i - 1) / rate;
    console.log(`  [${i + 1}/${slice.length}] created=${created} skipped=${skipped} failed=${failed} noVariants=${noVariants} | ${rate.toFixed(2)}/s, ~${Math.round(remaining / 60)}min left`);
  }

  await sleep(500);
}

console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed} noVariants=${noVariants} of ${slice.length} processed.`);
