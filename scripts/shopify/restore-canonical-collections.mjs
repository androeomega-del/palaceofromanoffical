// Restore the 34 canonical Shopify smart collections that the storefront ships with.
// Source of truth: src/lib/__tests__/collection-visual-regression.test.ts (COLLECTION_HANDLES).
// Usage: node scripts/shopify/restore-canonical-collections.mjs [--dry]

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');
if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// Shopify smart-collection rules no longer accept `tag contains` —
// only `tag equals` works. Tags follow BrandsGateway hierarchy
// "<subcategory> - <category>" (e.g. "Sneakers - Shoes", "Jackets - Clothing").
const tagEq = (c) => ({ column: 'tag', relation: 'equals', condition: c });

// Gender + specific tag (AND)
const gt = (g, tag) => [tagEq(g), tagEq(tag)];

const DEFS = [
  // Special — already created in prior pass
  { handle: 'all-products',              title: 'All Products',                 rules: [{ column: 'title', relation: 'not_equals', condition: '___never___' }] },
  { handle: 'new-arrivals',              title: 'New Arrivals',                 rules: [tagEq('new-arrivals')] },
  { handle: 'best-selling-brands',       title: 'Best-Selling Brands',          rules: [tagEq('best-seller')] },
  { handle: 'high-discounts',            title: 'High Discounts',               rules: [{ column: 'variant_compare_at_price', relation: 'greater_than', condition: '0' }] },

  // Women — tops use bare top-level tag (e.g. "Accessories")
  { handle: 'womens-accessories',        title: "Women's Accessories",          rules: gt('Women', 'Accessories') },
  { handle: 'womens-accessories-1',      title: "Women's Accessories — Edit",   rules: gt('Women', 'Accessories') },
  { handle: 'womens-clothing',           title: "Women's Clothing",             rules: gt('Women', 'Clothing') },
  { handle: 'womens-shoes',              title: "Women's Shoes",                rules: gt('Women', 'Shoes') },
  { handle: 'womens-bags',               title: "Women's Bags",                 rules: gt('Women', 'Bags') },
  { handle: 'womens-wallets',            title: "Women's Wallets",              rules: gt('Women', 'Wallets - Accessories') },
  { handle: 'womens-belts',              title: "Women's Belts",                rules: gt('Women', 'Belts - Accessories') },
  { handle: 'womens-jewelry',            title: "Women's Jewelry",              rules: gt('Women', 'Jewellery - Accessories') },
  { handle: 'womens-watches',            title: "Women's Watches",              rules: gt('Women', 'Watches - Accessories') },
  { handle: 'womens-scarves',            title: "Women's Scarves",              rules: gt('Women', 'Scarves - Accessories') },
  { handle: 'womens-hats',               title: "Women's Hats",                 rules: gt('Women', 'Hats - Accessories') },

  // Men
  { handle: 'mens-accessories',          title: "Men's Accessories",            rules: gt('Men', 'Accessories') },
  { handle: 'mens-clothing',             title: "Men's Clothing",               rules: gt('Men', 'Clothing') },
  { handle: 'mens-shoes',                title: "Men's Shoes",                  rules: gt('Men', 'Shoes') },
  { handle: 'mens-jackets-coats',        title: "Men's Jackets & Coats",        rules: gt('Men', 'Jackets - Clothing') },
  { handle: 'mens-suits',                title: "Men's Suits",                  rules: gt('Men', 'Suits - Clothing') },
  { handle: 'mens-shirts',               title: "Men's Shirts",                 rules: gt('Men', 'Shirts - Clothing') },
  { handle: 'mens-tshirts-polos',        title: "Men's T-Shirts & Polos",       rules: gt('Men', 'T-Shirts - Clothing') },
  { handle: 'mens-sweaters-knitwear',    title: "Men's Sweaters & Knitwear",    rules: gt('Men', 'Sweaters - Clothing') },
  { handle: 'mens-hoodies-sweatshirts',  title: "Men's Hoodies & Sweatshirts",  rules: gt('Men', 'Sweatshirts - Sweaters - Clothing') },
  { handle: 'mens-pants-trousers',       title: "Men's Pants & Trousers",       rules: gt('Men', 'Pants - Clothing') },
  { handle: 'mens-shorts',               title: "Men's Shorts",                 rules: gt('Men', 'Shorts - Clothing') },
  { handle: 'mens-activewear',           title: "Men's Activewear",             rules: gt('Men', 'Sportswear - Clothing') },
  { handle: 'mens-swimwear',             title: "Men's Swimwear",               rules: gt('Men', 'Swimwear - Clothing') },
  { handle: 'mens-underwear-loungewear', title: "Men's Underwear & Loungewear", rules: gt('Men', 'Underwear - Clothing') },
  { handle: 'mens-sneakers',             title: "Men's Sneakers",               rules: gt('Men', 'Sneakers - Shoes') },
  { handle: 'mens-boots',                title: "Men's Boots",                  rules: gt('Men', 'Boots - Shoes') },
  { handle: 'mens-sandals-slides',       title: "Men's Sandals & Slides",       rules: gt('Men', 'Sandals - Shoes') },
  { handle: 'mens-bags-wallets',         title: "Men's Bags & Wallets",         rules: gt('Men', 'Bags') },
  { handle: 'mens-belts',                title: "Men's Belts",                  rules: gt('Men', 'Belts - Accessories') },
  { handle: 'mens-watches-jewelry',      title: "Men's Watches & Jewelry",      rules: gt('Men', 'Watches - Accessories') },
];

const collections = DEFS.map(d => ({
  handle: d.handle,
  title: d.title,
  body_html: `<p>${d.title} — curated at Palace of Roman.</p>`,
  sort_order: 'best-selling',
  published: true,
  disjunctive: d.disjunctive ?? false,
  rules: d.rules,
}));

console.log(`Defined ${collections.length} canonical collections.`);
if (DRY) { for (const c of collections) console.log('  ', c.handle, '←', JSON.stringify(c.rules)); process.exit(0); }

async function shopify(path, init = {}) {
  const url = `https://${SHOP}/admin/api/${API}${path}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json', ...(init.headers || {}) } });
    if (res.status === 429) { await new Promise(r => setTimeout(r, (parseFloat(res.headers.get('retry-after') || '2')) * 1000)); continue; }
    const t = await res.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
    return { status: res.status, body: b, headers: res.headers };
  }
  throw new Error('retries');
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchHandles(endpoint, key) {
  const h = new Set();
  let p = `/${endpoint}.json?limit=250&fields=handle,id`;
  while (p) {
    const { status, body, headers } = await shopify(p);
    if (status !== 200) break;
    for (const c of body[key] || []) h.add(c.handle);
    const link = headers.get('link') || '';
    const n = link.split(',').find(x => x.includes('rel="next"'));
    if (n) { const m = n.match(/<([^>]+)>/); if (m) { const u = new URL(m[1]); p = u.pathname.replace(`/admin/api/${API}`, '') + u.search; } else p = null; } else p = null;
    await sleep(250);
  }
  return h;
}

const existing = new Set([
  ...await fetchHandles('smart_collections', 'smart_collections'),
  ...await fetchHandles('custom_collections', 'custom_collections'),
]);
console.log(`Existing handles in store: ${existing.size}`);

let created = 0, skipped = 0, failed = 0;
const failures = [];

for (let i = 0; i < collections.length; i++) {
  const c = collections[i];
  if (existing.has(c.handle)) { skipped++; console.log(`[${i + 1}/${collections.length}] ↻ skip ${c.handle}`); continue; }
  const { status, body } = await shopify('/smart_collections.json', { method: 'POST', body: JSON.stringify({ smart_collection: c }) });
  if (status === 201) { created++; console.log(`[${i + 1}/${collections.length}] ✓ ${c.handle}`); }
  else { failed++; const r = typeof body === 'object' ? JSON.stringify(body.errors || body) : body; failures.push({ h: c.handle, status, r }); console.log(`[${i + 1}/${collections.length}] ✗ ${c.handle} → ${status} ${r}`); }
  await sleep(500);
}

console.log('\n=== SUMMARY ===');
console.log(`Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);
if (failures.length) for (const f of failures) console.log(' ✗', f.h, '→', f.status, f.r);
