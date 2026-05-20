// Normalize BrandsGateway compound tags into clean top-level category tags.
// Reads every product, detects category from existing compound tags
// (e.g. "Sneakers - Shoes" → adds "Sneakers"), and PUTs back the updated tags.
//
// Usage:
//   node scripts/shopify/normalize-category-tags.mjs --dry      (preview only)
//   node scripts/shopify/normalize-category-tags.mjs            (apply)
//   node scripts/shopify/normalize-category-tags.mjs --limit 50 (first N updates)

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry');
const LIMIT_ARG = process.argv.indexOf('--limit');
const LIMIT = LIMIT_ARG >= 0 ? parseInt(process.argv[LIMIT_ARG + 1], 10) : Infinity;

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// keyword (matched case-insensitively against any " - "-split segment) → clean tag to add.
// Order matters: more specific first (T-Shirts before Shirts).
const RULES = [
  ['T-Shirts', 'T-Shirts'],
  ['Polo Shirts', 'T-Shirts'],
  ['Polo', 'T-Shirts'],
  ['Sweatshirts', 'Sweatshirts'],
  ['Hoodies', 'Sweatshirts'],
  ['Sweaters', 'Sweaters'],
  ['Cardigans', 'Sweaters'],
  ['Knitwear', 'Sweaters'],
  ['Coats', 'Coats'],
  ['Jackets', 'Coats'],
  ['Suits', 'Suits'],
  ['Dress Shirts', 'Shirts'],
  ['Blouses', 'Shirts'],
  ['Shirts', 'Shirts'],
  ['Dress Pants', 'Pants'],
  ['Casual Pants', 'Pants'],
  ['Jeans Denim', 'Pants'],
  ['Skinny Jeans', 'Pants'],
  ['Joggers (workout pants)', 'Activewear'],
  ['Sportswear', 'Activewear'],
  ['Trousers', 'Pants'],
  ['Pants', 'Pants'],
  ['Bermuda', 'Shorts'],
  ['Shorts', 'Shorts'],
  ['Swim Shorts', 'Swimwear'],
  ['Swimwear', 'Swimwear'],
  ['Loungewear', 'Underwear'],
  ['Underwear', 'Underwear'],
  ['Dresses', 'Dresses'],
  ['Skirts', 'Skirts'],

  // Shoes
  ['Sneakers', 'Sneakers'],
  ['Low Tops', 'Sneakers'],
  ['Athletic', 'Sneakers'],
  ['Boots', 'Boots'],
  ['Sandals', 'Sandals'],
  ['Slides', 'Sandals'],
  ['Slip-On Loafers', 'Loafers'],
  ['Loafers', 'Loafers'],
  ['Flats', 'Flats'],

  // Bags
  ['Handbags', 'Bags'],
  ['Shoulder Bags', 'Bags'],
  ['Tote Bags', 'Bags'],
  ['Clutch Bags', 'Bags'],
  ['Crossbody Bags', 'Bags'],
  ['Backpacks', 'Bags'],

  // Accessories
  ['Regular Belts', 'Belts'],
  ['Belts', 'Belts'],
  ['Wallets', 'Wallets'],
  ['Scarves', 'Scarves'],
  ['Hats', 'Hats'],
  ['Sunglasses', 'Sunglasses'],
  ['Glasses (Frames)', 'Sunglasses'],
  ['Glasses and Sunglasses', 'Sunglasses'],
  ['Jewelry', 'Jewelry'],
  ['Watches', 'Watches'],
];

function detectAddedTags(existing) {
  const segments = new Set();
  for (const t of existing) {
    for (const seg of t.split(' - ')) segments.add(seg.trim().toLowerCase());
  }
  const existingLower = new Set(existing.map(t => t.toLowerCase()));
  const additions = new Set();
  for (const [kw, clean] of RULES) {
    if (segments.has(kw.toLowerCase()) && !existingLower.has(clean.toLowerCase())) {
      additions.add(clean);
    }
  }
  return [...additions];
}

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

// --- Pass 1: scan all products ---
const planned = []; // { id, title, before, add, after }
let path = '/products.json?limit=250&fields=id,title,tags';
let pages = 0, scanned = 0;
while (path) {
  const { status, body, headers } = await shopify(path);
  if (status !== 200) { console.error('list failed:', status, body); process.exit(1); }
  for (const p of body.products || []) {
    scanned++;
    const existing = (p.tags || '').split(',').map(s => s.trim()).filter(Boolean);
    const add = detectAddedTags(existing);
    if (add.length) {
      planned.push({ id: p.id, title: p.title, before: existing, add, after: [...existing, ...add] });
    }
  }
  pages++;
  const link = headers.get('link') || '';
  const next = link.split(',').find(s => s.includes('rel="next"'));
  if (next) {
    const m = next.match(/<([^>]+)>/);
    if (m) { const u = new URL(m[1]); path = u.pathname.replace(`/admin/api/${API}`, '') + u.search; }
    else path = null;
  } else path = null;
  await new Promise(r => setTimeout(r, 250));
  if (pages % 4 === 0) console.log(`  scanned ${scanned} products, ${planned.length} need updates...`);
}

console.log(`\nScan complete: ${scanned} products, ${planned.length} need new category tags.`);

// Tag-addition distribution
const dist = {};
for (const p of planned) for (const t of p.add) dist[t] = (dist[t] || 0) + 1;
console.log('\nTags that will be added (count of products):');
for (const [t, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(5)}  +${t}`);
}

console.log('\nSample of planned updates (first 5):');
for (const p of planned.slice(0, 5)) {
  console.log(`  ${p.id}  ${p.title.slice(0, 60)}  → add: ${p.add.join(', ')}`);
}

if (DRY_RUN) { console.log('\nDRY RUN — exiting.'); process.exit(0); }

// --- Pass 2: apply updates ---
const todo = planned.slice(0, LIMIT);
console.log(`\nApplying ${todo.length} updates (rate ~2/s)...`);
let ok = 0, fail = 0;
const failures = [];
for (let i = 0; i < todo.length; i++) {
  const p = todo[i];
  const { status, body } = await shopify(`/products/${p.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: p.id, tags: p.after.join(', ') } }),
  });
  if (status === 200) {
    ok++;
    if ((i + 1) % 25 === 0 || i + 1 === todo.length) console.log(`  [${i + 1}/${todo.length}] ok=${ok} fail=${fail}`);
  } else {
    fail++;
    const reason = typeof body === 'object' ? JSON.stringify(body.errors || body).slice(0, 200) : String(body).slice(0, 200);
    failures.push({ id: p.id, status, reason });
    console.log(`  [${i + 1}/${todo.length}] ✗ ${p.id} → ${status} ${reason}`);
  }
  await new Promise(r => setTimeout(r, 500));
}

console.log('\n=== SUMMARY ===');
console.log(`Updated: ${ok}`);
console.log(`Failed:  ${fail}`);
if (failures.length) for (const f of failures.slice(0, 20)) console.log(' -', f.id, '→', f.status, f.reason);
