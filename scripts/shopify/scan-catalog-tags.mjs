// Aggregate every tag across all products to find the real category taxonomy.
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
    edges { node { tags } }
  }
}`;

const tagCount = new Map();
let cursor = null, total = 0;
while (true) {
  const d = await gql(Q, { cursor });
  for (const e of d.products.edges) {
    total++;
    for (const tag of e.node.tags || []) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
  }
  if (!d.products.pageInfo.hasNextPage) break;
  cursor = d.products.pageInfo.endCursor;
}

const sorted = [...tagCount.entries()].sort((a, b) => b[1] - a[1]);
fs.writeFileSync('/tmp/all-tags.json', JSON.stringify(sorted.map(([t, c]) => ({ tag: t, count: c })), null, 2));

console.log(`Scanned ${total} products, ${sorted.length} unique tags`);
console.log('\nTop 80 tags:');
for (const [tag, count] of sorted.slice(0, 80)) {
  console.log(`  ${String(count).padStart(5)}  ${tag}`);
}

// Find breadcrumb-style "X - Y" tags
const breadcrumbs = sorted.filter(([t]) => t.includes(' - '));
console.log(`\nBreadcrumb-style tags ("X - Y"): ${breadcrumbs.length}`);
for (const [tag, count] of breadcrumbs.slice(0, 60)) {
  console.log(`  ${String(count).padStart(5)}  ${tag}`);
}
