// One-off: create category smart collections in Shopify via Admin REST.
// Tag-based rules. Auto-deletes collections that end up with < MIN_PRODUCTS matches.
// Usage:
//   node scripts/shopify/create-category-smart-collections.mjs --dry   # preview payloads
//   node scripts/shopify/create-category-smart-collections.mjs         # execute

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');
const MIN_PRODUCTS = 3;

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// --- Helpers ---
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- Rule builders ---
// Single-tag rule (unisex / catch-all)
const tag = (condition) => [{ column: 'tag', relation: 'equals', condition }];
// Gender + category (all rules must match -> disjunctive: false)
const gtag = (gender, category) => [
  { column: 'tag', relation: 'equals', condition: gender },
  { column: 'tag', relation: 'equals', condition: category },
];

// --- Collection definitions ---
// Each: { handle, title, body_html, disjunctive, rules }
const C = [];
const add = (handle, title, rules, opts = {}) => C.push({
  handle,
  title,
  body_html: opts.body_html || '',
  sort_order: 'best-selling',
  published: true,
  disjunctive: !!opts.disjunctive,
  rules,
});

// === Women — Apparel ===
add('dresses',            'Dresses',            gtag('Women', 'Dresses'));
add('tops',               'Tops',               gtag('Women', 'Tops'));
add('blouses',            'Blouses',            gtag('Women', 'Blouses'));
add('jackets-coats-women','Jackets & Coats — Women', gtag('Women', 'Jackets & Coats'));
add('knitwear-women',     'Knitwear — Women',   gtag('Women', 'Knitwear'));
add('denim-women',        'Denim — Women',      gtag('Women', 'Jeans'));
add('pants-women',        'Pants — Women',      gtag('Women', 'Pants'));
add('jumpsuits',          'Jumpsuits',          gtag('Women', 'Jumpsuits'));
add('lingerie',           'Lingerie',           gtag('Women', 'Lingerie'));
add('activewear-women',   'Activewear — Women', gtag('Women', 'Activewear'));

// === Men — Apparel ===
add('tshirts-polos',         'T-Shirts & Polos',       gtag('Men', 'T-shirts & Polos'));
add('sweaters-knitwear',     'Sweaters & Knitwear',    gtag('Men', 'Knitwear'));
add('hoodies-sweatshirts',   'Hoodies & Sweatshirts',  gtag('Men', 'Sweatshirts'));
add('jackets-coats',         'Jackets & Coats — Men',  gtag('Men', 'Jackets & Coats'));
add('pants-trousers',        'Pants & Trousers',       gtag('Men', 'Pants'));
add('shorts',                'Shorts',                 gtag('Men', 'Shorts'));
add('activewear',            'Activewear — Men',       gtag('Men', 'Activewear'));
add('underwear-loungewear',  'Underwear & Loungewear', gtag('Men', 'Underwear'));
add('denim-men',             'Denim — Men',            gtag('Men', 'Jeans'));
add('blazers',               'Blazers',                gtag('Men', 'Blazers'));

// === Shoes — specific ===
add('sneakers',        'Sneakers',        tag('Sneakers'));
add('sandals-slides',  'Sandals & Slides',tag('Sandals'));
add('heels',           'Heels',           tag('Heels'));
add('flats',           'Flats',           tag('Flats'));
add('mules',           'Mules',           tag('Mules'));
add('espadrilles',     'Espadrilles',     tag('Espadrilles'));

// === Bags — specific ===
add('mini-bags',         'Mini Bags',          tag('Mini Bags'));
add('bucket-bags',       'Bucket Bags',        tag('Bucket Bags'));
add('belt-bags',         'Belt Bags',          tag('Belt Bags'));
add('laptop-bags',       'Laptop Bags',        tag('Laptop Bags'));
add('weekenders-luggage','Weekenders & Luggage',tag('Luggage'));

// === Fine Accessories ===
add('jewelry',             'Jewelry',             tag('Jewelry'));
add('fine-jewelry',        'Fine Jewelry',        tag('Fine Jewelry'));
add('sunglasses',          'Sunglasses',          tag('Sunglasses'));
add('eyewear',             'Eyewear',             tag('Eyewear'));
add('scarves',             'Scarves',             tag('Scarves'));
add('belts',               'Belts',               tag('Belts'));
add('wallets',             'Wallets',             tag('Wallets'));
add('ties-pocket-squares', 'Ties & Pocket Squares',tag('Ties'));

// === Seasonal / editorial ===
add('resort',        'Resort',        tag('Resort'));
add('evening',       'Evening',       tag('Evening'));
add('outerwear',     'Outerwear',     tag('Outerwear'));
add('cashmere',      'Cashmere',      tag('Cashmere'));
add('leather-goods', 'Leather Goods', tag('Leather'));

console.log(`Defined ${C.length} collections.`);
console.log('First 2:', JSON.stringify(C.slice(0, 2), null, 2));
console.log('Last 2:',  JSON.stringify(C.slice(-2), null, 2));

if (DRY) { console.log('\nDRY RUN — exiting.'); process.exit(0); }

// --- Fetch existing handles ---
async function fetchExistingHandles() {
  const handles = new Set();
  let path = '/smart_collections.json?limit=250&fields=handle,id';
  while (path) {
    const { status, body, headers } = await shopify(path);
    if (status !== 200) { console.error('list failed', status, body); break; }
    for (const c of body.smart_collections || []) handles.add(c.handle);
    const link = headers.get('link') || '';
    const next = link.split(',').find(p => p.includes('rel="next"'));
    if (next) {
      const m = next.match(/<([^>]+)>/);
      if (m) { const u = new URL(m[1]); path = u.pathname.replace(`/admin/api/${API}`, '') + u.search; }
      else path = null;
    } else path = null;
    await sleep(250);
  }
  console.log(`Existing smart collections: ${handles.size}`);
  return handles;
}

// Also need to skip custom collection handles
async function fetchExistingCustomHandles() {
  const handles = new Set();
  let path = '/custom_collections.json?limit=250&fields=handle,id';
  while (path) {
    const { status, body, headers } = await shopify(path);
    if (status !== 200) break;
    for (const c of body.custom_collections || []) handles.add(c.handle);
    const link = headers.get('link') || '';
    const next = link.split(',').find(p => p.includes('rel="next"'));
    if (next) {
      const m = next.match(/<([^>]+)>/);
      if (m) { const u = new URL(m[1]); path = u.pathname.replace(`/admin/api/${API}`, '') + u.search; }
      else path = null;
    } else path = null;
    await sleep(250);
  }
  console.log(`Existing custom collections: ${handles.size}`);
  return handles;
}

const existingSmart = await fetchExistingHandles();
const existingCustom = await fetchExistingCustomHandles();
const existing = new Set([...existingSmart, ...existingCustom]);

let created = 0, skippedExist = 0, deletedEmpty = 0, failed = 0;
const failures = [];
const kept = [];
const removed = [];

for (let i = 0; i < C.length; i++) {
  const c = C[i];
  if (existing.has(c.handle)) {
    skippedExist++;
    console.log(`[${i+1}/${C.length}] ↻ skip ${c.handle} (exists)`);
    continue;
  }
  const { status, body } = await shopify('/smart_collections.json', {
    method: 'POST',
    body: JSON.stringify({ smart_collection: c }),
  });
  if (status !== 201) {
    failed++;
    const reason = typeof body === 'object' ? JSON.stringify(body.errors || body) : body;
    failures.push({ handle: c.handle, status, reason });
    console.log(`[${i+1}/${C.length}] ✗ ${c.handle} → ${status} ${reason}`);
    await sleep(500);
    continue;
  }
  const id = body.smart_collection.id;
  await sleep(600);

  // Check product count
  const { status: cs, body: cb } = await shopify(`/products/count.json?collection_id=${id}`);
  const count = cs === 200 ? (cb.count ?? 0) : 0;

  if (count < MIN_PRODUCTS) {
    // delete it
    await shopify(`/smart_collections/${id}.json`, { method: 'DELETE' });
    deletedEmpty++;
    removed.push({ handle: c.handle, count });
    console.log(`[${i+1}/${C.length}] ⌫ ${c.handle} created then deleted (count=${count} < ${MIN_PRODUCTS})`);
  } else {
    created++;
    kept.push({ handle: c.handle, count });
    console.log(`[${i+1}/${C.length}] ✓ ${c.handle} (count=${count})`);
  }
  await sleep(500);
}

console.log('\n=== SUMMARY ===');
console.log(`Kept (created): ${created}`);
console.log(`Skipped (already existed): ${skippedExist}`);
console.log(`Deleted (count < ${MIN_PRODUCTS}): ${deletedEmpty}`);
console.log(`Failed: ${failed}`);

if (kept.length) {
  console.log('\nKept:');
  for (const k of kept) console.log(` ✓ ${k.handle} (${k.count})`);
}
if (removed.length) {
  console.log('\nDeleted (insufficient products):');
  for (const r of removed) console.log(` - ${r.handle} (${r.count})`);
}
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(' ✗', f.handle, '→', f.status, f.reason);
}
