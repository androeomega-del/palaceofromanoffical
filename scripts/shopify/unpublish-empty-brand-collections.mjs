// One-off: unpublish (remove from Online Store sales channel) all brand
// smart-collections that currently have zero products.
//
// Reads /tmp/empty-brands.json (array of handles).
// Sets `published: false` via Admin REST PUT /smart_collections/{id}.json.
//
// Usage:
//   node scripts/shopify/unpublish-empty-brand-collections.mjs --dry
//   node scripts/shopify/unpublish-empty-brand-collections.mjs
import fs from 'node:fs';

const SHOP = (process.env.SHOPIFY_STORE_DOMAIN || 'mwuwqi-vy.myshopify.com')
  .replace(/^https?:\/\//, '').replace(/\/+$/, '');
const API = '2025-07';
const DRY = process.argv.includes('--dry');

const handles = JSON.parse(fs.readFileSync('/tmp/empty-brands.json', 'utf8'));
console.log(`Loaded ${handles.length} empty brand handles`);

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
  _tok = j.access_token;
  return _tok;
}

async function api(path, init = {}) {
  const t = await token();
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`https://${SHOP}/admin/api/${API}${path}`, {
      ...init,
      headers: { 'X-Shopify-Access-Token': t, 'Content-Type': 'application/json', ...(init.headers || {}) },
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
  throw new Error('retries exhausted');
}

// Build handle → id map
const map = new Map();
let path = `/smart_collections.json?limit=250&fields=handle,id,published`;
while (path) {
  const { status, body, headers } = await api(path);
  if (status !== 200) { console.error('list failed', status, body); process.exit(1); }
  for (const c of body.smart_collections) map.set(c.handle, c);
  const link = headers.get('link') || '';
  const next = link.split(',').find(p => p.includes('rel="next"'));
  const m = next && next.match(/<([^>]+)>/);
  path = m ? new URL(m[1]).pathname.replace(`/admin/api/${API}`, '') + new URL(m[1]).search : null;
}
console.log(`Fetched ${map.size} smart collections`);

const targets = handles.filter(h => map.has(h));
const missing = handles.filter(h => !map.has(h));
console.log(`Matched: ${targets.length}, missing: ${missing.length}`);
if (DRY) {
  console.log('First 5:', targets.slice(0, 5));
  console.log('DRY RUN — exiting.');
  process.exit(0);
}

let ok = 0, fail = 0;
for (let i = 0; i < targets.length; i++) {
  const h = targets[i];
  const id = map.get(h).id;
  const { status, body } = await api(`/smart_collections/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ smart_collection: { id, published: false } }),
  });
  if (status === 200) { ok++; console.log(`[${i + 1}/${targets.length}] ✓ unpublished ${h}`); }
  else { fail++; console.log(`[${i + 1}/${targets.length}] ✗ ${h} → ${status} ${JSON.stringify(body).slice(0, 160)}`); }
  await new Promise(r => setTimeout(r, 400));
}
console.log(`\nDone. Unpublished: ${ok}, failed: ${fail}`);
