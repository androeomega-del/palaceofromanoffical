// Read-only: scan every product and aggregate product_type + tags.
// Writes /tmp/catalog-types.json.
import fs from 'node:fs';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';

let _tok;
async function token() {
  if (_tok) return _tok;
  const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const j = await r.json();
  if (!j.access_token) { console.error('auth failed', j); process.exit(1); }
  _tok = j.access_token; return _tok;
}

async function gql(query, variables = {}) {
  const t = await token();
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`https://${SHOP}/admin/api/${API}/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429) { await new Promise(r => setTimeout(r, 2000)); continue; }
    const j = await res.json();
    if (j.errors) { console.error(j.errors); throw new Error('gql err'); }
    return j.data;
  }
  throw new Error('retries');
}

const Q = `query($cursor: String) {
  products(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges { node { id productType tags status } }
  }
}`;

const types = new Map(); // type -> { count, tags:Map(tag->count), gender:{men,women,none} }
let cursor = null, total = 0, pages = 0;
while (true) {
  const d = await gql(Q, { cursor });
  for (const e of d.products.edges) {
    const n = e.node;
    total++;
    const pt = (n.productType || '').trim();
    const key = pt || '__UNTYPED__';
    if (!types.has(key)) types.set(key, { count: 0, tags: new Map(), genders: { men: 0, women: 0, none: 0 }, active: 0 });
    const rec = types.get(key);
    rec.count++;
    if (n.status === 'ACTIVE') rec.active++;
    const tagsLower = (n.tags || []).map(t => t.toLowerCase());
    const hasMen = tagsLower.includes('men');
    const hasWomen = tagsLower.includes('women');
    if (hasMen) rec.genders.men++;
    if (hasWomen) rec.genders.women++;
    if (!hasMen && !hasWomen) rec.genders.none++;
    for (const tag of n.tags || []) {
      rec.tags.set(tag, (rec.tags.get(tag) || 0) + 1);
    }
  }
  pages++;
  if (pages % 5 === 0) console.error(`...${total} products, ${types.size} types`);
  if (!d.products.pageInfo.hasNextPage) break;
  cursor = d.products.pageInfo.endCursor;
}

const out = [];
for (const [type, rec] of types) {
  const topTags = [...rec.tags.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([t, c]) => ({ tag: t, count: c }));
  out.push({
    productType: type,
    count: rec.count,
    active: rec.active,
    genders: rec.genders,
    topTags,
  });
}
out.sort((a, b) => b.count - a.count);

fs.writeFileSync('/tmp/catalog-types.json', JSON.stringify({ totalProducts: total, types: out }, null, 2));
console.log(`Scanned ${total} products, ${out.length} distinct product types`);
console.log('\nTop 30 types:');
for (const t of out.slice(0, 30)) {
  console.log(`  ${(t.productType || '(none)').padEnd(40)} ${String(t.count).padStart(5)}  men:${t.genders.men} women:${t.genders.women} none:${t.genders.none}`);
}
console.log('\nFull report at /tmp/catalog-types.json');
