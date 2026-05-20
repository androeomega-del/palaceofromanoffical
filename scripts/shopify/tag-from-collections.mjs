// Tag products based on the collections they belong to.
// - Derives tags from each smart collection's own rules (tag=X, type=X).
// - Supplements with a handle map for known gender×category combos whose
//   second rule was dropped during the original Matrixify import.
// - Skips pure-vendor collections (vendor is already on the product).
// - Aggregates per product, fetches existing tags, unions, PUTs back.
//
// Usage:
//   node scripts/shopify/tag-from-collections.mjs --dry
//   node scripts/shopify/tag-from-collections.mjs
import process from 'node:process';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');
const LIMIT_COLLECTIONS = (() => {
  const i = process.argv.indexOf('--limit-collections');
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : 0;
})();

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// Handles whose rules don't fully express the intent (intersection collections
// where the 2nd rule was dropped at import). Tags listed here are added in
// addition to whatever the rules already imply.
const HANDLE_TAG_SUPPLEMENT = {
  'women-bags': ['Bags'],
  'women-shoes': ['Shoes'],
  'women-clothing': ['Clothing'],
  'women-accessories': ['Accessories'],
  'men-bags': ['Bags'],
  'men-shoes': ['Shoes'],
  'men-clothing': ['Clothing'],
  'men-accessories': ['Accessories'],
};

async function shopify(path, init = {}) {
  const url = `https://${SHOP}/admin/api/${API}${path}`;
  for (let attempt = 0; attempt < 6; attempt++) {
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
  throw new Error('Too many retries: ' + path);
}

async function paginate(initialPath, key) {
  const out = [];
  let path = initialPath;
  while (path) {
    const { status, body, headers } = await shopify(path);
    if (status !== 200) {
      console.error('Failed', path, status, body);
      break;
    }
    for (const r of body[key] || []) out.push(r);
    const link = headers.get('link') || '';
    const next = link.split(',').find(p => p.includes('rel="next"'));
    if (next) {
      const m = next.match(/<([^>]+)>/);
      if (m) {
        const u = new URL(m[1]);
        path = u.pathname.replace(`/admin/api/${API}`, '') + u.search;
      } else path = null;
    } else path = null;
    await new Promise(r => setTimeout(r, 250));
  }
  return out;
}

console.log('Fetching smart collections...');
const smart = await paginate('/smart_collections.json?limit=250', 'smart_collections');
console.log(`  ${smart.length} smart collections`);

console.log('Fetching custom collections...');
const custom = await paginate('/custom_collections.json?limit=250', 'custom_collections');
console.log(`  ${custom.length} custom collections`);

const collections = [...smart.map(c => ({ ...c, _type: 'smart' })), ...custom.map(c => ({ ...c, _type: 'custom' }))];

// Decide tags-to-add per collection
function tagsForCollection(c) {
  const tags = new Set();
  // Skip pure vendor collections (no useful tag beyond brand)
  if (c._type === 'smart' && Array.isArray(c.rules)) {
    const cols = new Set(c.rules.map(r => r.column));
    if (cols.size === 1 && cols.has('vendor')) return [];
    for (const r of c.rules) {
      if (r.column === 'tag' || r.column === 'type') {
        if (r.relation === 'equals' && r.condition) tags.add(r.condition);
      }
    }
  }
  // Supplement
  for (const t of HANDLE_TAG_SUPPLEMENT[c.handle] || []) tags.add(t);
  return [...tags];
}

let toProcess = collections
  .map(c => ({ id: c.id, handle: c.handle, title: c.title, type: c._type, tags: tagsForCollection(c) }))
  .filter(c => c.tags.length > 0);

if (LIMIT_COLLECTIONS) toProcess = toProcess.slice(0, LIMIT_COLLECTIONS);

console.log(`\n${toProcess.length} collections will contribute tags. Skipped ${collections.length - toProcess.length} (vendor-only or no derivable tags).`);
console.log('\nSample plan (first 15):');
for (const c of toProcess.slice(0, 15)) {
  console.log(`  ${c.handle.padEnd(30)} → [${c.tags.join(', ')}]`);
}

// Aggregate: productId → Set<tag>
console.log('\nFetching product IDs per collection...');
const productTags = new Map(); // id -> Set<string>
let ci = 0;
for (const c of toProcess) {
  ci++;
  const products = await paginate(`/collections/${c.id}/products.json?limit=250&fields=id`, 'products');
  for (const p of products) {
    if (!productTags.has(p.id)) productTags.set(p.id, new Set());
    for (const t of c.tags) productTags.get(p.id).add(t);
  }
  if (ci % 25 === 0 || ci === toProcess.length) {
    console.log(`  [${ci}/${toProcess.length}] ${c.handle} (+${products.length}) | unique products so far: ${productTags.size}`);
  }
}

console.log(`\n${productTags.size} unique products would be updated.`);

if (DRY) {
  // Show a few examples
  const samples = [...productTags.entries()].slice(0, 5);
  console.log('\nSample product tag additions:');
  for (const [id, tags] of samples) console.log(`  product ${id} += [${[...tags].join(', ')}]`);
  console.log('\nDRY RUN — exiting. Re-run without --dry to apply.');
  process.exit(0);
}

// Apply: for each product, GET current tags, union, PUT
console.log('\nApplying tags...');
let done = 0, updated = 0, unchanged = 0, failed = 0;
const failures = [];
const start = Date.now();
for (const [id, addSet] of productTags) {
  done++;
  try {
    const { status, body } = await shopify(`/products/${id}.json?fields=id,tags`);
    if (status !== 200) { failed++; failures.push({ id, status, body }); continue; }
    const current = (body.product.tags || '').split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set(current);
    let changed = false;
    for (const t of addSet) {
      if (!set.has(t)) { set.add(t); changed = true; }
    }
    if (!changed) { unchanged++; }
    else {
      const newTags = [...set].join(', ');
      const put = await shopify(`/products/${id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: { id, tags: newTags } }),
      });
      if (put.status === 200) updated++;
      else { failed++; failures.push({ id, status: put.status, body: put.body }); }
    }
  } catch (e) {
    failed++; failures.push({ id, error: e.message });
  }
  if (done % 50 === 0 || done === productTags.size) {
    const elapsed = (Date.now() - start) / 1000;
    const rate = done / elapsed;
    const eta = ((productTags.size - done) / rate).toFixed(0);
    console.log(`  [${done}/${productTags.size}] updated=${updated} unchanged=${unchanged} failed=${failed} | ${rate.toFixed(1)}/s ETA ${eta}s`);
  }
  await new Promise(r => setTimeout(r, 250)); // ~4 req/s (well under Shopify limits)
}

console.log('\n=== SUMMARY ===');
console.log(`Products processed: ${done}`);
console.log(`Updated:   ${updated}`);
console.log(`Unchanged: ${unchanged}`);
console.log(`Failed:    ${failed}`);
if (failures.length) {
  console.log('First failures:');
  for (const f of failures.slice(0, 10)) console.log(' ', JSON.stringify(f));
}
