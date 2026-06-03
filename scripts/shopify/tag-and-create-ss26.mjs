// One-off: tag SS26 products and create gender-split smart collections.
//
// What it does:
//   1. Scans all products. For any product whose body_html or title contains
//      an SS26 token ("SS26", "S/S 26", "Spring/Summer 2026", etc.), adds the
//      tag "SS26" (if missing).
//   2. Creates/upserts two smart collections:
//        - women-ss26 : Tag = Women AND Tag = SS26
//        - men-ss26   : Tag = Men   AND Tag = SS26
//
// Usage: node scripts/shopify/tag-and-create-ss26.mjs [--dry]
const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// Mirror src/lib/season-badge.ts SS26 pattern (kept in sync intentionally).
const SS26_RE = /\b(SS\s?26|S\/S\s?26|Spring[-/\s]?Summer\s?(?:20)?26)\b/i;

async function shopify(path, init = {}) {
  const url = path.startsWith('http') ? path : `https://${SHOP}/admin/api/${API}${path}`;
  for (let i = 0; i < 5; i++) {
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
      await new Promise((r) => setTimeout(r, ra * 1000));
      continue;
    }
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body, headers: res.headers };
  }
  throw new Error('Too many retries');
}

// ---- 1. Fetch all products (id, title, body_html, tags) ----
console.log('Fetching products…');
const products = [];
let path = '/products.json?limit=250&fields=id,handle,title,body_html,tags';
while (path) {
  const { status, body, headers } = await shopify(path);
  if (status !== 200) { console.error('List failed', status, body); process.exit(1); }
  products.push(...body.products);
  const link = headers.get('link') || '';
  const next = link.split(',').find((p) => p.includes('rel="next"'));
  if (next) {
    const m = next.match(/<([^>]+)>/);
    path = m ? m[1] : null;
  } else path = null;
  await new Promise((r) => setTimeout(r, 200));
}
console.log(`Fetched ${products.length} products`);

// ---- 2. Tag SS26 matches ----
let matched = 0, tagged = 0, alreadyTagged = 0;
for (const p of products) {
  const haystack = `${p.title || ''}\n${p.body_html || ''}`;
  if (!SS26_RE.test(haystack)) continue;
  matched++;
  const tags = (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  if (tags.some((t) => t.toLowerCase() === 'ss26')) { alreadyTagged++; continue; }
  const newTags = [...tags, 'SS26'].join(', ');
  if (DRY) { tagged++; continue; }
  const { status, body } = await shopify(`/products/${p.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: p.id, tags: newTags } }),
  });
  if (status === 200) { tagged++; console.log(`  + tagged SS26 → ${p.handle}`); }
  else console.log(`  ✗ ${p.handle}: ${status} ${JSON.stringify(body).slice(0, 160)}`);
  await new Promise((r) => setTimeout(r, 250));
}
console.log(`SS26 matched=${matched}  tagged=${tagged}  alreadyTagged=${alreadyTagged}`);

// ---- 3. Create smart collections ----
const SPECS = [
  {
    handle: 'women-ss26',
    title: "Women SS26",
    body_html: "<p>The SS26 women's edit — Spring/Summer 2026 pieces from our curated maisons.</p>",
    rules: [
      { column: 'tag', relation: 'equals', condition: 'Women' },
      { column: 'tag', relation: 'equals', condition: 'SS26' },
    ],
  },
  {
    handle: 'men-ss26',
    title: "Men SS26",
    body_html: "<p>The SS26 men's edit — Spring/Summer 2026 pieces from our curated maisons.</p>",
    rules: [
      { column: 'tag', relation: 'equals', condition: 'Men' },
      { column: 'tag', relation: 'equals', condition: 'SS26' },
    ],
  },
];

// Look up existing by handle
async function findByHandle(handle) {
  const { body } = await shopify(`/smart_collections.json?handle=${handle}`);
  return body.smart_collections?.[0] || null;
}

for (const spec of SPECS) {
  const existing = await findByHandle(spec.handle);
  const payload = {
    smart_collection: {
      handle: spec.handle,
      title: spec.title,
      body_html: spec.body_html,
      sort_order: 'best-selling',
      published: true,
      disjunctive: false, // ALL rules must match
      rules: spec.rules,
    },
  };
  if (DRY) { console.log(`DRY ${existing ? 'update' : 'create'} ${spec.handle}`); continue; }
  if (existing) {
    const { status, body } = await shopify(`/smart_collections/${existing.id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ smart_collection: { id: existing.id, ...payload.smart_collection } }),
    });
    console.log(`${status === 200 ? '✓ updated' : '✗ update failed'} ${spec.handle}`, status === 200 ? '' : JSON.stringify(body).slice(0, 200));
  } else {
    const { status, body } = await shopify('/smart_collections.json', {
      method: 'POST', body: JSON.stringify(payload),
    });
    console.log(`${status === 201 ? '✓ created' : '✗ create failed'} ${spec.handle}`, status === 201 ? '' : JSON.stringify(body).slice(0, 200));
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log('Done.');
