// Set collection.image on main category/merch collections to the first product's primary image.
// Idempotent: skips collections that already have an image (unless --force).
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOP = 'mwuwqi-vy.myshopify.com';
const V = '2025-07';
const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry');

// Mirrors MAIN_HANDLE_ALLOWLIST in src/routes/collections.index.tsx
const HANDLES = [
  'women','men','unisex',
  'women-clothing','womens-clothing',
  'women-shoes','womens-shoes',
  'women-bags','womens-bags',
  'women-accessories','womens-accessories','womens-accessories-1',
  'men-clothing','mens-clothing',
  'men-shoes','mens-shoes',
  'men-bags','mens-bags-wallets',
  'men-accessories','mens-accessories',
  'accessories','bags','clothing','shoes',
  'handbags','backpacks','boots','loafers',
  'clutch-bags','crossbody-bags','shoulder-bags','tote-bags',
  'hats','gloves','scarves','belts','wallets',
  'watches','jewelry','jewellery','sunglasses','necklaces',
  'shirts','skirts','suits','swimwear','sleepwear','dresses',
  'other-accessories',
  'new-arrivals','best-sellers','best-selling-brands','high-discounts','sale','on-sale',
];

const h = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

async function api(path, opts = {}) {
  const url = `https://${SHOP}/admin/api/${V}${path}`;
  while (true) {
    const r = await fetch(url, { ...opts, headers: { ...h, ...(opts.headers || {}) } });
    if (r.status === 429) {
      const wait = Number(r.headers.get('retry-after') || 2) * 1000;
      await new Promise(res => setTimeout(res, wait));
      continue;
    }
    const text = await r.text();
    let j; try { j = JSON.parse(text); } catch { j = { _raw: text }; }
    if (!r.ok) throw new Error(`${r.status} ${path}: ${text.slice(0, 300)}`);
    return j;
  }
}

async function findCollection(handle) {
  const s = await api(`/smart_collections.json?handle=${handle}&fields=id,handle,title,image`);
  if (s.smart_collections?.length) return { ...s.smart_collections[0], _kind: 'smart_collections' };
  const c = await api(`/custom_collections.json?handle=${handle}&fields=id,handle,title,image`);
  if (c.custom_collections?.length) return { ...c.custom_collections[0], _kind: 'custom_collections' };
  return null;
}

async function firstProductImage(collectionId) {
  // products.json?collection_id= returns products in the collection
  const j = await api(`/products.json?collection_id=${collectionId}&limit=10&fields=id,title,images`);
  for (const p of j.products || []) {
    const img = p.images?.[0]?.src;
    if (img) return { src: img, alt: p.title };
  }
  return null;
}

let set = 0, skipped = 0, missing = 0, failed = 0;
for (const handle of HANDLES) {
  try {
    const coll = await findCollection(handle);
    if (!coll) { console.log(`MISS  ${handle.padEnd(32)} (no collection)`); missing++; continue; }
    if (coll.image && !FORCE) { console.log(`SKIP  ${handle.padEnd(32)} (image already set)`); skipped++; continue; }
    const img = await firstProductImage(coll.id);
    if (!img) { console.log(`MISS  ${handle.padEnd(32)} (no products with image)`); missing++; continue; }
    if (DRY) { console.log(`DRY   ${handle.padEnd(32)} -> ${img.src.slice(0, 80)}`); continue; }
    const payload = { [coll._kind.replace(/s$/, '')]: { id: coll.id, image: { src: img.src, alt: coll.title } } };
    await api(`/${coll._kind}/${coll.id}.json`, { method: 'PUT', body: JSON.stringify(payload) });
    console.log(`OK    ${handle.padEnd(32)} -> ${img.src.slice(0, 80)}`);
    set++;
  } catch (e) {
    console.log(`FAIL  ${handle.padEnd(32)} ${e.message}`);
    failed++;
  }
  await new Promise(r => setTimeout(r, 500));
}
console.log(`\nDone. set=${set} skipped=${skipped} missing=${missing} failed=${failed}`);
