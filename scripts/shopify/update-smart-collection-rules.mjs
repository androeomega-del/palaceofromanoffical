// One-off: rewrite every smart-collection ruleset in Shopify so brand
// collections match Vendor=Equals OR Title=Contains, and every collection
// uses disjunctive=true (Match any condition).
//
// Reads the consolidated source CSV (public/imports/smart-collections-matrixify-fixed.csv),
// derives the new rule shape, and PUTs each collection by handle. Creates
// missing ones with POST.
//
// Usage:
//   node scripts/shopify/update-smart-collection-rules.mjs --dry
//   node scripts/shopify/update-smart-collection-rules.mjs

import fs from 'node:fs';

const SHOP = (process.env.SHOPIFY_STORE_DOMAIN || 'mwuwqi-vy.myshopify.com')
  .replace(/^https?:\/\//, '').replace(/\/+$/, '');
const API = '2025-07';
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const CSV = '/dev-server/public/imports/smart-collections-matrixify-fixed.csv';
const DRY_RUN = process.argv.includes('--dry');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET');
  process.exit(1);
}

// Client Credentials Grant — exchange app credentials for an Admin API token.
let _tokenCache = null;
async function getAccessToken() {
  if (_tokenCache && _tokenCache.expiresAt - 60_000 > Date.now()) return _tokenCache.token;
  const res = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`client_credentials grant failed ${res.status}: ${t.slice(0, 240)}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error('grant returned no access_token');
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  console.log(`Obtained Admin API token (expires in ${data.expires_in ?? 3600}s)`);
  return _tokenCache.token;
}

// --- Minimal RFC4180 CSV parser ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { field += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim()));
}

const COLUMN_MAP = {
  Vendor: 'vendor',
  Tag: 'tag',
  Type: 'type',
  'Variant Inventory': 'variant_inventory',
  Title: 'title',
  'Variant Price': 'variant_price',
  'Variant Compare At Price': 'variant_compare_at_price',
  'Variant Weight': 'variant_weight',
};
const RELATION_MAP = {
  Equals: 'equals',
  'Not Equals': 'not_equals',
  'Greater Than': 'greater_than',
  'Less Than': 'less_than',
  'Starts With': 'starts_with',
  'Ends With': 'ends_with',
  Contains: 'contains',
  'Not Contains': 'not_contains',
};

// --- Parse + group ---
const raw = fs.readFileSync(CSV, 'utf8');
const rows = parseCSV(raw);
const header = rows.shift();
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

const byHandle = new Map();
for (const r of rows) {
  const handle = r[idx['Handle']];
  if (!handle) continue;
  const ruleColRaw = r[idx['Rule: Product Column']];
  const ruleRelRaw = r[idx['Rule: Relation']];
  const ruleCondRaw = r[idx['Rule: Condition']];
  if (!ruleColRaw) continue;
  const rule = {
    column: COLUMN_MAP[ruleColRaw] || ruleColRaw.toLowerCase(),
    relation: RELATION_MAP[ruleRelRaw] || (ruleRelRaw || '').toLowerCase().replace(/ /g, '_'),
    condition: ruleCondRaw,
  };
  if (!byHandle.has(handle)) {
    byHandle.set(handle, {
      handle,
      title: r[idx['Title']],
      body_html: r[idx['Body HTML']],
      sort_order: r[idx['Sort Order']] || 'best-selling',
      published: (r[idx['Published']] || 'TRUE').toUpperCase() === 'TRUE',
      matchColumn: (r[idx['Match Column']] || 'any').toLowerCase(),
      rules: [],
    });
  }
  byHandle.get(handle).rules.push(rule);
}

// --- Apply transformations ---
//  1. Brand collections (single Vendor=equals rule) → add Title=contains twin rule.
//  2. Special collections (variant_inventory, in-stock, new-arrivals) → unchanged rules, single rule anyway.
//  3. Everything else (Tag/Type single or multi-rule) → unchanged rules.
//  4. disjunctive=true on every collection.
const collections = [];
for (const c of byHandle.values()) {
  const isPureVendor =
    c.rules.length === 1 &&
    c.rules[0].column === 'vendor' &&
    c.rules[0].relation === 'equals';
  if (isPureVendor) {
    const brand = c.rules[0].condition;
    c.rules = [
      { column: 'vendor', relation: 'equals', condition: brand },
      { column: 'title', relation: 'contains', condition: brand },
    ];
  }
  // Honor per-collection Match Column: "all" → disjunctive=false (AND), else true (OR).
  c.disjunctive = c.matchColumn !== 'all';
  collections.push(c);
}

console.log(`Parsed ${collections.length} unique collections from CSV`);
const brandCount = collections.filter(c => c.rules.some(r => r.column === 'title')).length;
const multiRuleCount = collections.filter(c => c.rules.length > 1 && !c.rules.some(r => r.column === 'title')).length;
console.log(`  - ${brandCount} brand collections (now Vendor OR Title)`);
console.log(`  - ${multiRuleCount} other multi-rule collections (now ANY)`);
console.log('First 2 payloads:', JSON.stringify(collections.slice(0, 2), null, 2));
console.log('Sample composite (women-bags):', JSON.stringify(collections.find(c => c.handle === 'women-bags'), null, 2));

if (DRY_RUN) { console.log('\nDRY RUN — exiting before any API writes.'); process.exit(0); }

// --- Shopify helpers ---
async function shopify(path, init = {}) {
  const token = await getAccessToken();
  const url = `https://${SHOP}/admin/api/${API}${path}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (res.status === 429) {
      const ra = parseFloat(res.headers.get('retry-after') || '2');
      console.log(`  rate-limited, sleeping ${ra}s`);
      await new Promise(r => setTimeout(r, ra * 1000));
      continue;
    }
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body, headers: res.headers };
  }
  throw new Error('Too many retries');
}

// Build handle→id map by paginating existing smart_collections.
async function fetchExistingMap() {
  const map = new Map();
  let path = '/smart_collections.json?limit=250&fields=handle,id';
  let pages = 0;
  while (path) {
    const { status, body, headers } = await shopify(path);
    if (status !== 200) {
      console.error('Failed to list existing:', status, body);
      break;
    }
    for (const c of body.smart_collections || []) map.set(c.handle, c.id);
    pages++;
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
  console.log(`Fetched ${map.size} existing smart collections across ${pages} page(s)`);
  return map;
}

const existing = await fetchExistingMap();

let updated = 0, created = 0, failed = 0;
const failures = [];

for (let i = 0; i < collections.length; i++) {
  const c = collections[i];
  const tag = `[${i + 1}/${collections.length}]`;
  const existingId = existing.get(c.handle);

  if (existingId) {
    const payload = {
      smart_collection: {
        id: existingId,
        disjunctive: c.disjunctive,
        rules: c.rules,
      },
    };
    const { status, body } = await shopify(`/smart_collections/${existingId}.json`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (status === 200) {
      updated++;
      console.log(`${tag} ✓ updated ${c.handle} (${c.rules.length} rule${c.rules.length > 1 ? 's' : ''})`);
    } else {
      failed++;
      const reason = typeof body === 'object' ? JSON.stringify(body.errors || body) : body;
      failures.push({ handle: c.handle, status, reason });
      console.log(`${tag} ✗ update ${c.handle} → ${status} ${reason}`);
    }
  } else {
    const payload = {
      smart_collection: {
        handle: c.handle,
        title: c.title,
        body_html: c.body_html,
        sort_order: c.sort_order,
        published: c.published,
        disjunctive: c.disjunctive,
        rules: c.rules,
      },
    };
    const { status, body } = await shopify('/smart_collections.json', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (status === 201) {
      created++;
      console.log(`${tag} + created ${c.handle}`);
    } else {
      failed++;
      const reason = typeof body === 'object' ? JSON.stringify(body.errors || body) : body;
      failures.push({ handle: c.handle, status, reason });
      console.log(`${tag} ✗ create ${c.handle} → ${status} ${reason}`);
    }
  }

  await new Promise(r => setTimeout(r, 500)); // 2 req/sec
}

console.log('\n=== SUMMARY ===');
console.log(`Updated: ${updated}`);
console.log(`Created: ${created}`);
console.log(`Failed:  ${failed}`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures.slice(0, 25)) console.log(' -', f.handle, '→', f.status, f.reason);
  if (failures.length > 25) console.log(` ... and ${failures.length - 25} more`);
}
