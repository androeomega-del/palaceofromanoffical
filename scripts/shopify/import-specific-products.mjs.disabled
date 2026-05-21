// Targeted: import a specific list of bg_products by handle into Shopify.
// Reuses the same payload shape as import-missing-products.mjs.
// Run: node scripts/shopify/import-specific-products.mjs handle1 handle2 ...

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EUR_TO_USD = 1.08;

const handles = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!TOKEN || !SB_URL || !SB_KEY) { console.error('Missing env'); process.exit(1); }
if (handles.length === 0) { console.error('Pass handles as args'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sb(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function adminPost(url, body) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429) { await sleep(parseFloat(res.headers.get('retry-after') || '2') * 1000); continue; }
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 422 && /has already been taken/i.test(text)) return { skipped: true };
      throw new Error(`Shopify ${res.status}: ${text}`);
    }
    return { json: JSON.parse(text) };
  }
  throw new Error('Too many 429s');
}

const eurToUsd = (eur) => eur == null ? '0.00' : (Number(eur) * EUR_TO_USD).toFixed(2);

function buildPayload(p, variants) {
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
  if (Array.isArray(p.pictures)) for (const u of p.pictures) if (u && u !== p.main_picture) images.push({ src: u });
  const tags = [p.gender, p.category, p.subcategory, p.color, p.material].filter(Boolean).map(String);
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

async function upsertMap(rows) {
  const res = await fetch(`${SB_URL}/rest/v1/shopify_variant_map?on_conflict=sku`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert ${res.status}: ${await res.text()}`);
}

// ---- main ----
const inList = handles.map((h) => encodeURIComponent(`"${h}"`)).join(',');
const products = await sb(`bg_products?select=handle,group_sku,brand,name,description,description_plain,gender,category,subcategory,color,material,retail_price,main_picture,pictures&handle=in.(${inList})`);
console.log(`Found ${products.length} of ${handles.length} bg_products.`);

const skus = products.map((p) => p.group_sku);
const skuList = skus.map((s) => encodeURIComponent(`"${s}"`)).join(',');
const variants = await sb(`bg_variants?select=group_sku,product_sku,size,quantity,weight&group_sku=in.(${skuList})`);
const vMap = new Map();
for (const v of variants) {
  if (!vMap.has(v.group_sku)) vMap.set(v.group_sku, []);
  vMap.get(v.group_sku).push(v);
}

for (const p of products) {
  const vs = vMap.get(p.group_sku) || [];
  if (vs.length === 0) { console.warn(`SKIP ${p.handle} (no variants)`); continue; }
  const payload = buildPayload(p, vs);
  try {
    const result = await adminPost(`https://${SHOP}/admin/api/${API}/products.json`, payload);
    if (result.skipped) { console.log(`SKIP ${p.handle} (already in Shopify)`); continue; }
    const sp = result.json.product;
    const rows = sp.variants.map((v) => ({
      sku: v.sku,
      variant_gid: `gid://shopify/ProductVariant/${v.id}`,
      product_gid: `gid://shopify/Product/${sp.id}`,
      product_handle: sp.handle,
      available: (v.inventory_quantity ?? 0) > 0,
      synced_at: new Date().toISOString(),
    }));
    await upsertMap(rows);
    console.log(`OK   ${p.handle} (id=${sp.id}, variants=${sp.variants.length}, stock=${sp.variants.reduce((s,v) => s + (v.inventory_quantity || 0), 0)})`);
  } catch (e) {
    console.error(`FAIL ${p.handle}: ${e.message}`);
  }
  await sleep(500);
}
