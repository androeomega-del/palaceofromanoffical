// Create missing category smart collections in Shopify.
// All rules use tag EQUALS <tag> (and combine with disjunctive=false → AND).
// Usage: node scripts/shopify/create-category-collections.mjs [--dry]

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry');

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// Each entry: handle, title, gender ('Men'|'Women'|null), category keyword.
// Rules: tag EQUALS <gender>  AND  tag CONTAINS <keyword>
// Using CONTAINS handles BrandsGateway's hierarchical tags
// (e.g. "Belts - Accessories", "Sneakers - Shoes", "Coats - Coats - Clothing").
const DEFS = [
  // Women
  { handle: 'womens-bags',        title: "Women's Bags",        gender: 'Women', keyword: 'Bags' },
  { handle: 'womens-accessories', title: "Women's Accessories", gender: 'Women', keyword: 'Accessories' },
  { handle: 'womens-jewelry',     title: "Women's Jewelry",     gender: 'Women', keyword: 'Jewelry' },
  { handle: 'womens-watches',     title: "Women's Watches",     gender: 'Women', keyword: 'Watches' },
  { handle: 'womens-scarves',     title: "Women's Scarves",     gender: 'Women', keyword: 'Scarves' },
  { handle: 'womens-hats',        title: "Women's Hats",        gender: 'Women', keyword: 'Hats' },
  { handle: 'womens-belts',       title: "Women's Belts",       gender: 'Women', keyword: 'Belts' },
  { handle: 'womens-wallets',     title: "Women's Wallets",     gender: 'Women', keyword: 'Wallets' },
  { handle: 'womens-dresses',     title: "Women's Dresses",     gender: 'Women', keyword: 'Dresses' },
  { handle: 'womens-skirts',      title: "Women's Skirts",      gender: 'Women', keyword: 'Skirts' },

  // Men
  { handle: 'mens-bags-wallets',         title: "Men's Bags & Wallets",         gender: 'Men', keyword: 'Bags' },
  { handle: 'mens-accessories',          title: "Men's Accessories",            gender: 'Men', keyword: 'Accessories' },
  { handle: 'mens-suits',                title: "Men's Suits",                  gender: 'Men', keyword: 'Suits' },
  { handle: 'mens-jackets-coats',        title: "Men's Jackets & Coats",        gender: 'Men', keyword: 'Coats' },
  { handle: 'mens-shirts',               title: "Men's Shirts",                 gender: 'Men', keyword: 'Shirts' },
  { handle: 'mens-tshirts-polos',        title: "Men's T-Shirts & Polos",       gender: 'Men', keyword: 'T-Shirts' },
  { handle: 'mens-sweaters-knitwear',    title: "Men's Sweaters & Knitwear",    gender: 'Men', keyword: 'Sweaters' },
  { handle: 'mens-hoodies-sweatshirts',  title: "Men's Hoodies & Sweatshirts",  gender: 'Men', keyword: 'Sweatshirts' },
  { handle: 'mens-pants-trousers',       title: "Men's Pants & Trousers",       gender: 'Men', keyword: 'Pants' },
  { handle: 'mens-shorts',               title: "Men's Shorts",                 gender: 'Men', keyword: 'Shorts' },
  { handle: 'mens-activewear',           title: "Men's Activewear",             gender: 'Men', keyword: 'Sportswear' },
  { handle: 'mens-swimwear',             title: "Men's Swimwear",               gender: 'Men', keyword: 'Swimwear' },
  { handle: 'mens-underwear-loungewear', title: "Men's Underwear & Loungewear", gender: 'Men', keyword: 'Underwear' },
  { handle: 'mens-sneakers',             title: "Men's Sneakers",               gender: 'Men', keyword: 'Sneakers' },
  { handle: 'mens-boots',                title: "Men's Boots",                  gender: 'Men', keyword: 'Boots' },
  { handle: 'mens-sandals-slides',       title: "Men's Sandals & Slides",       gender: 'Men', keyword: 'Sandals' },
  { handle: 'mens-watches-jewelry',      title: "Men's Watches & Jewelry",      gender: 'Men', keyword: 'Watches' },

  // Generic (no gender filter)
  { handle: 'dresses',    title: 'Dresses',    gender: null, keyword: 'Dresses' },
  { handle: 'loafers',    title: 'Loafers',    gender: null, keyword: 'Loafers' },
  { handle: 'belts',      title: 'Belts',      gender: null, keyword: 'Belts' },
  { handle: 'wallets',    title: 'Wallets',    gender: null, keyword: 'Wallets' },
  { handle: 'jewelry',    title: 'Jewelry',    gender: null, keyword: 'Jewelry' },
  { handle: 'scarves',    title: 'Scarves',    gender: null, keyword: 'Scarves' },
  { handle: 'sunglasses', title: 'Sunglasses', gender: null, keyword: 'Sunglasses' },
];

const collections = DEFS.map(d => {
  const rules = [];
  if (d.gender) rules.push({ column: 'tag', relation: 'equals',   condition: d.gender });
  rules.push({ column: 'tag', relation: 'contains', condition: d.keyword });
  return {
    handle: d.handle,
    title: d.title,
    body_html: `<p>${d.title} — curated selection.</p>`,
    sort_order: 'best-selling',
    published: true,
    disjunctive: false, // ALL rules must match
    rules,
  };
});

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
