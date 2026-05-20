// Create missing category smart collections in Shopify.
// All rules use tag EQUALS <tag> (and combine with disjunctive=false → AND).
// Usage: node scripts/shopify/create-category-collections.mjs [--dry]

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry');

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// Each entry: handle, title, body_html, and an array of tags that must ALL match.
// Tag values must match real product tags exactly (case-sensitive in Shopify rules).
const DEFS = [
  // Women — top-level
  { handle: 'womens-bags',         title: "Women's Bags",            tags: ['Women', 'Bags'] },
  { handle: 'womens-accessories',  title: "Women's Accessories",     tags: ['Women', 'Accessories'] },
  { handle: 'womens-jewelry',      title: "Women's Jewelry",         tags: ['Women', 'Jewelry'] },
  { handle: 'womens-watches',      title: "Women's Watches",         tags: ['Women', 'Watches'] },
  { handle: 'womens-scarves',      title: "Women's Scarves",         tags: ['Women', 'Scarves'] },
  { handle: 'womens-hats',         title: "Women's Hats",            tags: ['Women', 'Hats'] },
  { handle: 'womens-belts',        title: "Women's Belts",           tags: ['Women', 'Belts'] },
  { handle: 'womens-wallets',      title: "Women's Wallets",         tags: ['Women', 'Wallets'] },
  { handle: 'womens-dresses',      title: "Women's Dresses",         tags: ['Women', 'Dresses'] },
  { handle: 'womens-skirts',       title: "Women's Skirts",          tags: ['Women', 'Skirts'] },

  // Men — top-level
  { handle: 'mens-bags-wallets',          title: "Men's Bags & Wallets",         tags: ['Men', 'Bags'] },
  { handle: 'mens-accessories',           title: "Men's Accessories",            tags: ['Men', 'Accessories'] },
  { handle: 'mens-suits',                 title: "Men's Suits",                  tags: ['Men', 'Suits'] },
  { handle: 'mens-jackets-coats',         title: "Men's Jackets & Coats",        tags: ['Men', 'Coats'] },
  { handle: 'mens-shirts',                title: "Men's Shirts",                 tags: ['Men', 'Shirts'] },
  { handle: 'mens-tshirts-polos',         title: "Men's T-Shirts & Polos",       tags: ['Men', 'T-Shirts'] },
  { handle: 'mens-sweaters-knitwear',     title: "Men's Sweaters & Knitwear",    tags: ['Men', 'Sweaters'] },
  { handle: 'mens-hoodies-sweatshirts',   title: "Men's Hoodies & Sweatshirts",  tags: ['Men', 'Sweatshirts'] },
  { handle: 'mens-pants-trousers',        title: "Men's Pants & Trousers",       tags: ['Men', 'Pants'] },
  { handle: 'mens-shorts',                title: "Men's Shorts",                 tags: ['Men', 'Shorts'] },
  { handle: 'mens-activewear',            title: "Men's Activewear",             tags: ['Men', 'Activewear'] },
  { handle: 'mens-swimwear',              title: "Men's Swimwear",               tags: ['Men', 'Swimwear'] },
  { handle: 'mens-underwear-loungewear',  title: "Men's Underwear & Loungewear", tags: ['Men', 'Underwear'] },
  { handle: 'mens-sneakers',              title: "Men's Sneakers",               tags: ['Men', 'Sneakers'] },
  { handle: 'mens-boots',                 title: "Men's Boots",                  tags: ['Men', 'Boots'] },
  { handle: 'mens-sandals-slides',        title: "Men's Sandals & Slides",       tags: ['Men', 'Sandals'] },
  { handle: 'mens-watches-jewelry',       title: "Men's Watches & Jewelry",      tags: ['Men', 'Watches'] },

  // Generic (single-tag) categories
  { handle: 'dresses',    title: 'Dresses',    tags: ['Dresses'] },
  { handle: 'loafers',    title: 'Loafers',    tags: ['Loafers'] },
  { handle: 'belts',      title: 'Belts',      tags: ['Belts'] },
  { handle: 'wallets',    title: 'Wallets',    tags: ['Wallets'] },
  { handle: 'jewelry',    title: 'Jewelry',    tags: ['Jewelry'] },
  { handle: 'scarves',    title: 'Scarves',    tags: ['Scarves'] },
  { handle: 'sunglasses', title: 'Sunglasses', tags: ['Sunglasses'] },
];

const collections = DEFS.map(d => ({
  handle: d.handle,
  title: d.title,
  body_html: d.body_html || `<p>${d.title} — curated selection.</p>`,
  sort_order: 'best-selling',
  published: true,
  disjunctive: false, // ALL rules must match
  rules: d.tags.map(t => ({ column: 'tag', relation: 'equals', condition: t })),
}));

console.log(`Prepared ${collections.length} collections`);
console.log('Sample:', JSON.stringify(collections.slice(0, 3), null, 2));

if (DRY_RUN) { console.log('DRY RUN — exiting.'); process.exit(0); }

async function shopify(path, init = {}) {
  const url = `https://${SHOP}/admin/api/${API}${path}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (res.status === 429) {
      const ra = parseFloat(res.headers.get('retry-after') || '2');
      await new Promise(r => setTimeout(r, ra * 1000));
      continue;
    }
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body, headers: res.headers };
  }
  throw new Error('Too many retries');
}

async function fetchExistingHandles() {
  const handles = new Set();
  let path = '/smart_collections.json?limit=250&fields=handle,id';
  while (path) {
    const { status, body, headers } = await shopify(path);
    if (status !== 200) { console.error('list failed:', status, body); break; }
    for (const c of body.smart_collections || []) handles.add(c.handle);
    const link = headers.get('link') || '';
    const next = link.split(',').find(p => p.includes('rel="next"'));
    if (next) {
      const m = next.match(/<([^>]+)>/);
      if (m) { const u = new URL(m[1]); path = u.pathname.replace(`/admin/api/${API}`, '') + u.search; }
      else path = null;
    } else path = null;
    await new Promise(r => setTimeout(r, 250));
  }
  return handles;
}

const existing = await fetchExistingHandles();
console.log(`Existing smart collections: ${existing.size}`);

let created = 0, skipped = 0, failed = 0;
const failures = [];

for (let i = 0; i < collections.length; i++) {
  const c = collections[i];
  if (existing.has(c.handle)) {
    skipped++;
    console.log(`[${i + 1}/${collections.length}] ↻ skip ${c.handle}`);
    continue;
  }
  const { status, body } = await shopify('/smart_collections.json', {
    method: 'POST',
    body: JSON.stringify({ smart_collection: c }),
  });
  if (status === 201) {
    created++;
    console.log(`[${i + 1}/${collections.length}] ✓ ${c.handle}`);
  } else {
    failed++;
    const reason = typeof body === 'object' ? JSON.stringify(body.errors || body) : body;
    failures.push({ handle: c.handle, status, reason });
    console.log(`[${i + 1}/${collections.length}] ✗ ${c.handle} → ${status} ${reason}`);
  }
  await new Promise(r => setTimeout(r, 500));
}

console.log('\n=== SUMMARY ===');
console.log(`Created: ${created}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed:  ${failed}`);
if (failures.length) {
  for (const f of failures.slice(0, 20)) console.log(' -', f.handle, '→', f.status, f.reason);
}
