// One-off: rewrite rules for empty/under-matching category collections.
// §A — add Title-contains OR twin to single-tag garments.
// §B — Tag(Gender) AND Title-contains for composite garments.
// Usage:
//   node scripts/shopify/patch-category-collections.mjs --dry
//   node scripts/shopify/patch-category-collections.mjs

const SHOP = (process.env.SHOPIFY_STORE_DOMAIN || 'mwuwqi-vy.myshopify.com')
  .replace(/^https?:\/\//, '').replace(/\/+$/, '');
const API = '2025-07';
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const DRY = process.argv.includes('--dry');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET');
  process.exit(1);
}

// handle -> { disjunctive, rules, title? (for create fallback) }
const PLAN = {
  // §A — Tag OR Title contains
  shirts:          { disjunctive: true,  rules: [['tag','equals','Shirts'],         ['title','contains','Shirt']] },
  suits:           { disjunctive: true,  rules: [['tag','equals','Suits'],          ['title','contains','Suit']] },
  skirts:          { disjunctive: true,  rules: [['tag','equals','Skirts'],         ['title','contains','Skirt']] },
  boots:           { disjunctive: true,  rules: [['tag','equals','Boots'],          ['title','contains','Boot']] },
  loafers:         { disjunctive: true,  rules: [['tag','equals','Loafers'],        ['title','contains','Loafer']] },
  handbags:        { disjunctive: true,  rules: [['tag','equals','Handbags'],       ['title','contains','Handbag']] },
  backpacks:       { disjunctive: true,  rules: [['tag','equals','Backpacks'],      ['title','contains','Backpack']] },
  'clutch-bags':   { disjunctive: true,  rules: [['tag','equals','Clutch Bags'],    ['title','contains','Clutch']] },
  'crossbody-bags':{ disjunctive: true,  rules: [['tag','equals','Crossbody Bags'], ['title','contains','Crossbody']] },
  'shoulder-bags': { disjunctive: true,  rules: [['tag','equals','Shoulder Bags'],  ['title','contains','Shoulder Bag']] },
  'tote-bags':     { disjunctive: true,  rules: [['tag','equals','Tote Bags'],      ['title','contains','Tote']] },
  // §B — Tag(Gender) AND Title contains <singular>  (disjunctive=false)
  dresses:               { disjunctive: false, rules: [['tag','equals','Women'], ['title','contains','Dress']] },
  blouses:               { disjunctive: false, rules: [['tag','equals','Women'], ['title','contains','Blouse']] },
  tops:                  { disjunctive: false, rules: [['tag','equals','Women'], ['title','contains','Top']] },
  'pants-women':         { disjunctive: false, rules: [['tag','equals','Women'], ['title','contains','Pants']] },
  'pants-trousers':      { disjunctive: false, rules: [['tag','equals','Men'],   ['title','contains','Pants']] },
  shorts:                { disjunctive: false, rules: [['tag','equals','Men'],   ['title','contains','Short']] },
  'hoodies-sweatshirts': { disjunctive: false, rules: [['tag','equals','Men'],   ['title','contains','Sweatshirt']] },
};

let _t = null;
async function token() {
  if (_t && _t.exp - 60_000 > Date.now()) return _t.tok;
  const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials' }),
  });
  if (!r.ok) throw new Error(`grant ${r.status}: ${await r.text()}`);
  const d = await r.json();
  _t = { tok: d.access_token, exp: Date.now() + (d.expires_in ?? 3600) * 1000 };
  return _t.tok;
}

async function api(path, init = {}) {
  const tok = await token();
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://${SHOP}/admin/api/${API}${path}`, {
      ...init, headers: { 'X-Shopify-Access-Token': tok, 'Content-Type': 'application/json', ...(init.headers||{}) },
    });
    if (r.status === 429) { await new Promise(s => setTimeout(s, (parseFloat(r.headers.get('retry-after')||'2'))*1000)); continue; }
    const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
    return { status: r.status, body: b, headers: r.headers };
  }
  throw new Error('retries exhausted');
}

// Look up each target by handle.
async function findId(handle) {
  const { status, body } = await api(`/smart_collections.json?handle=${encodeURIComponent(handle)}&fields=id,handle`);
  if (status !== 200) return null;
  const c = (body.smart_collections || [])[0];
  return c ? c.id : null;
}

async function count(id) {
  const { status, body } = await api(`/products/count.json?collection_id=${id}`);
  return status === 200 ? body.count : null;
}

const results = [];
for (const [handle, spec] of Object.entries(PLAN)) {
  const id = await findId(handle);
  if (!id) { results.push({ handle, ok: false, reason: 'not found' }); console.log(`✗ ${handle} → not found`); continue; }
  const before = await count(id);
  const payload = {
    smart_collection: {
      id,
      disjunctive: spec.disjunctive,
      rules: spec.rules.map(([column, relation, condition]) => ({ column, relation, condition })),
    },
  };
  if (DRY) {
    console.log(`DRY ${handle} (id=${id}, before=${before}) →`, JSON.stringify(payload.smart_collection.rules), 'disjunctive=', spec.disjunctive);
    continue;
  }
  const { status, body } = await api(`/smart_collections/${id}.json`, { method: 'PUT', body: JSON.stringify(payload) });
  await new Promise(s => setTimeout(s, 800)); // give Shopify a moment to re-eval
  const after = status === 200 ? await count(id) : null;
  const ok = status === 200;
  results.push({ handle, ok, status, before, after });
  console.log(`${ok?'✓':'✗'} ${handle}  ${before} → ${after}  (status ${status})${ok?'':' '+JSON.stringify(body.errors||body).slice(0,200)}`);
  await new Promise(s => setTimeout(s, 500));
}

if (!DRY) {
  console.log('\n=== SUMMARY ===');
  for (const r of results) console.log(`  ${r.handle.padEnd(22)}  ${r.before ?? '-'} → ${r.after ?? '-'}  ${r.ok?'OK':'FAIL'}`);
}
