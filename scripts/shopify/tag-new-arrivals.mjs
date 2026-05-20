// One-off: tag the last 1000 updated products with "new-arrival" and record
// expiration rows (now + 7 days) in shopify_tag_expirations.
//
// Usage: node scripts/shopify/tag-new-arrivals.mjs [--dry]
import { execSync } from 'node:child_process';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DB_URL = process.env.SUPABASE_DB_URL;
const TAG = 'new-arrival';
const COUNT = 1000;
const DAYS = 7;
const DRY = process.argv.includes('--dry');

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!DB_URL && !DRY) { console.error('Missing SUPABASE_DB_URL'); process.exit(1); }

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
      console.log(`  rate-limited, sleeping ${ra}s`);
      await new Promise((r) => setTimeout(r, ra * 1000));
      continue;
    }
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body, headers: res.headers };
  }
  throw new Error('Too many retries');
}

// --- Fetch latest updated products ---
console.log(`Fetching latest ${COUNT} updated products…`);
const products = [];
let path = `/products.json?limit=250&order=updated_at+desc&fields=id,handle,tags,updated_at`;
let page = 0;
while (path && products.length < COUNT) {
  const { status, body, headers } = await shopify(path);
  if (status !== 200) {
    console.error('List failed:', status, body);
    process.exit(1);
  }
  for (const p of body.products) {
    if (products.length >= COUNT) break;
    products.push(p);
  }
  page++;
  const link = headers.get('link') || '';
  const next = link.split(',').find((p) => p.includes('rel="next"'));
  if (next) {
    const m = next.match(/<([^>]+)>/);
    path = m ? m[1] : null;
  } else path = null;
  await new Promise((r) => setTimeout(r, 250));
}
console.log(`Got ${products.length} products across ${page} page(s).`);

const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000).toISOString();
console.log(`Expires at: ${expiresAt}`);

if (DRY) {
  console.log('DRY RUN — sample first 5:');
  for (const p of products.slice(0, 5)) {
    console.log(' -', p.id, p.handle, '|', p.updated_at, '| tags:', p.tags);
  }
  process.exit(0);
}

// --- Tag each product ---
let tagged = 0, alreadyTagged = 0, failed = 0;
const taggedIds = [];

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const existing = new Set(
    (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
  );
  if (existing.has(TAG)) {
    alreadyTagged++;
    taggedIds.push(p.id);
    if ((i + 1) % 50 === 0) console.log(`[${i + 1}/${products.length}] ↻ already tagged`);
    continue;
  }
  existing.add(TAG);
  const { status, body } = await shopify(`/products/${p.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: p.id, tags: [...existing].join(', ') } }),
  });
  if (status === 200) {
    tagged++;
    taggedIds.push(p.id);
    if ((i + 1) % 25 === 0) console.log(`[${i + 1}/${products.length}] ✓ tagged`);
  } else {
    failed++;
    console.log(`[${i + 1}/${products.length}] ✗ ${p.id} → ${status} ${typeof body === 'object' ? JSON.stringify(body.errors || body) : body}`);
  }
  await new Promise((r) => setTimeout(r, 500)); // 2 req/sec
}

console.log(`\nTagged: ${tagged}, already-tagged: ${alreadyTagged}, failed: ${failed}`);

// --- Insert expiration rows into Supabase via psql ---
if (taggedIds.length === 0) {
  console.log('No rows to insert.');
  process.exit(0);
}

const values = taggedIds
  .map((id) => `('${String(id)}', '${TAG}', '${expiresAt}')`)
  .join(',\n  ');

const sql = `insert into public.shopify_tag_expirations (product_id, tag, expires_at)
values
  ${values}
on conflict (product_id, tag) do update set expires_at = excluded.expires_at;`;

// Pipe SQL into psql to avoid argv length limits.
console.log(`Inserting ${taggedIds.length} expiration rows…`);
try {
  execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -q -f -`, {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  console.log('✓ Expiration rows inserted.');
} catch (e) {
  console.error('Insert failed:', e.message);
  process.exit(1);
}
