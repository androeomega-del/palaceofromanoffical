// One-off: create all smart collections in Shopify via Admin REST API
import fs from 'node:fs';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const CSV = '/dev-server/public/imports/smart-collections-matrixify-fixed.csv';
const DRY_RUN = process.argv.includes('--dry');

if (!TOKEN) { console.error('Missing SHOPIFY_ADMIN_TOKEN'); process.exit(1); }

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

const raw = fs.readFileSync(CSV, 'utf8');
const rows = parseCSV(raw);
const header = rows.shift();
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

// --- Mapping ---
const COLUMN_MAP = {
  'Vendor': 'vendor',
  'Tag': 'tag',
  'Type': 'type',
  'Variant Inventory': 'variant_inventory',
  'Title': 'title',
  'Variant Price': 'variant_price',
  'Variant Compare At Price': 'variant_compare_at_price',
  'Variant Weight': 'variant_weight',
};
const RELATION_MAP = {
  'Equals': 'equals',
  'Not Equals': 'not_equals',
  'Greater Than': 'greater_than',
  'Less Than': 'less_than',
  'Starts With': 'starts_with',
  'Ends With': 'ends_with',
  'Contains': 'contains',
  'Not Contains': 'not_contains',
};

const collections = rows.map(r => ({
  handle: r[idx['Handle']],
  title: r[idx['Title']],
  body_html: r[idx['Body HTML']],
  sort_order: r[idx['Sort Order']] || 'best-selling',
  published: (r[idx['Published']] || 'TRUE').toUpperCase() === 'TRUE',
  disjunctive: (r[idx['Match Column']] || 'all').toLowerCase() === 'any',
  rules: [{
    column: COLUMN_MAP[r[idx['Rule: Product Column']]] || r[idx['Rule: Product Column']].toLowerCase(),
    relation: RELATION_MAP[r[idx['Rule: Relation']]] || r[idx['Rule: Relation']].toLowerCase().replace(/ /g, '_'),
    condition: r[idx['Rule: Condition']],
  }],
}));

console.log(`Parsed ${collections.length} collections from CSV`);
console.log('First 2 payloads:', JSON.stringify(collections.slice(0, 2), null, 2));
console.log('Last 2 payloads:', JSON.stringify(collections.slice(-2), null, 2));

if (DRY_RUN) { console.log('DRY RUN — exiting.'); process.exit(0); }

// --- Shopify helpers ---
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

// --- Fetch existing smart collections (paginated via Link header) ---
async function fetchExistingHandles() {
  const handles = new Set();
  let path = '/smart_collections.json?limit=250&fields=handle,id';
  let pages = 0;
  while (path) {
    const { status, body, headers } = await shopify(path);
    if (status !== 200) {
      console.error('Failed to list existing:', status, body);
      break;
    }
    for (const c of body.smart_collections || []) handles.add(c.handle);
    pages++;
    // parse Link header for next
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
  console.log(`Fetched ${handles.size} existing smart collections across ${pages} page(s)`);
  return handles;
}

const existing = await fetchExistingHandles();

let created = 0, skipped = 0, failed = 0;
const failures = [];

for (let i = 0; i < collections.length; i++) {
  const c = collections[i];
  if (existing.has(c.handle)) {
    skipped++;
    console.log(`[${i + 1}/${collections.length}] ↻ skip ${c.handle} (exists)`);
    continue;
  }
  const payload = { smart_collection: c };
  const { status, body } = await shopify('/smart_collections.json', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (status === 201) {
    created++;
    console.log(`[${i + 1}/${collections.length}] ✓ ${c.handle}`);
  } else {
    failed++;
    const reason = typeof body === 'object' ? JSON.stringify(body.errors || body) : body;
    failures.push({ handle: c.handle, status, reason });
    console.log(`[${i + 1}/${collections.length}] ✗ ${c.handle} → ${status} ${reason}`);
  }
  await new Promise(r => setTimeout(r, 500)); // 2 req/sec
}

console.log('\n=== SUMMARY ===');
console.log(`Created: ${created}`);
console.log(`Skipped (already existed): ${skipped}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures.slice(0, 20)) console.log(' -', f.handle, '→', f.status, f.reason);
  if (failures.length > 20) console.log(` ... and ${failures.length - 20} more`);
}
