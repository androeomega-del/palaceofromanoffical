// Bulk-import BG catalog CSV → Shopify Admin REST.
//
// - Reads /tmp/latest.csv (BG schema: PARENT + CHILD rows keyed by Group Sku).
// - Skips groups where ANY child SKU already exists in shopify_variant_map
//   (i.e. only fully-new products; partial-variant repair is a separate job).
// - Creates products as DRAFT, with all variants embedded + main image by URL.
// - Throttles to ~2 req/sec, retries 429s, prints summary.
//
// Run:
//   node scripts/shopify/bulk-import-from-csv.mjs --dry --limit=3
//   node scripts/shopify/bulk-import-from-csv.mjs --limit=10        (smoke)
//   node scripts/shopify/bulk-import-from-csv.mjs                   (full, ~5h)
//
// Defaults: status=active, published=true. Out-of-stock groups (sum(qty)==0) are skipped.
//   --draft   create as draft instead of active

import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EUR_TO_USD = 1.08;

const DRY = process.argv.includes('--dry');
const PUBLISH = process.argv.includes('--publish');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const CSV = process.env.CSV_PATH || '/tmp/latest.csv';

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!SB_URL || !SB_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sbGetAll(path) {
  const out = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${from}-${from + PAGE - 1}` },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function adminPost(path, body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://${SHOP}/admin/api/${API}/${path}`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const wait = parseFloat(res.headers.get('retry-after') || '2') * 1000;
      await sleep(wait); continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${text.slice(0, 400)}`);
    return JSON.parse(text);
  }
  throw new Error('adminPost: retries exhausted');
}

// ---- Load existing SKUs ----------------------------------------------------

console.log('Loading existing Shopify SKUs from shopify_variant_map…');
const mapRows = await sbGetAll('shopify_variant_map?select=sku');
const existing = new Set(mapRows.map((r) => r.sku));
console.log(`  ${existing.size} existing SKUs`);

// ---- Parse CSV --------------------------------------------------------------

console.log(`Reading ${CSV}…`);
const raw = fs.readFileSync(CSV);
const records = parse(raw, { columns: true, skip_empty_lines: true, bom: true, relax_quotes: true, relax_column_count: true });
console.log(`  ${records.length} CSV rows`);

const groups = new Map();
for (const r of records) {
  const g = r['Group Sku'];
  if (!g) continue;
  if (!groups.has(g)) groups.set(g, { parent: null, children: [] });
  if (r['Product Type'] === 'PARENT') groups.get(g).parent = r;
  else groups.get(g).children.push(r);
}

// ---- Filter to fully-new products ------------------------------------------

const candidates = [];
for (const [g, data] of groups) {
  if (!data.parent || data.children.length === 0) continue;
  const hits = data.children.filter((c) => existing.has(c['Product Sku'])).length;
  if (hits === 0) candidates.push({ groupSku: g, ...data });
}
console.log(`Fully-new product groups: ${candidates.length}`);

const work = candidates.slice(0, LIMIT === Infinity ? undefined : LIMIT);
console.log(`Will process: ${work.length}\n`);

// ---- Build Shopify payload from a group ------------------------------------

function buildPayload({ groupSku, parent, children }) {
  // Title: prefer parent Name, fall back to brand + category
  const title = (parent['Name'] || `${parent['Brand'] || ''} ${parent['Subcategory'] || ''}`.trim()) || groupSku;
  const vendor = parent['Brand'] || 'Palace of Roman';
  const productType = parent['Subcategory'] || parent['Category'] || '';
  const tags = [
    parent['Brand'],
    parent['Gender'],
    parent['Category'],
    parent['Subcategory'],
    parent['Subsubcategory'],
    parent['Color'],
    parent['Material'],
    'bg-import',
    `bg-group:${groupSku}`,
  ].filter(Boolean).join(', ');

  // Variants — one per child. Use Size as option1.
  const variants = children.map((c) => {
    const priceEur = parseFloat(c['Retail Price'] || parent['Retail Price'] || '0') || 0;
    const wholesaleEur = parseFloat(c['Wholesale Price'] || parent['Wholesale Price'] || '0') || 0;
    const priceUsd = (priceEur * EUR_TO_USD).toFixed(2);
    const compareUsd = wholesaleEur > 0 ? (priceEur * EUR_TO_USD).toFixed(2) : undefined;
    return {
      option1: c['Size'] || 'One Size',
      sku: c['Product Sku'],
      price: priceUsd,
      barcode: c['Upc Ean'] || undefined,
      weight: parseFloat(c['Weight'] || parent['Weight'] || '0.5') || 0.5,
      weight_unit: 'kg',
      inventory_management: 'shopify',
      inventory_policy: 'deny',
      inventory_quantity: parseInt(c['Quantity'] || '0', 10) || 0,
    };
  });

  const options = [{ name: 'Size', values: [...new Set(variants.map((v) => v.option1))] }];

  // Images — main + up to 5 pictures, by URL
  const imgs = [parent['Main Picture'], parent['Picture 1'], parent['Picture 2'], parent['Picture 3'], parent['Picture 4'], parent['Picture 5']]
    .filter((u) => u && u.startsWith('http'))
    .map((src) => ({ src, alt: title }));

  return {
    product: {
      title,
      body_html: parent['Description'] || '',
      vendor,
      product_type: productType,
      tags,
      status: PUBLISH ? 'active' : 'draft',
      published: false,
      options,
      variants,
      images: imgs,
    },
  };
}

// ---- Dry run ----------------------------------------------------------------

if (DRY) {
  for (const g of work.slice(0, 3)) {
    console.log('--- sample payload ---');
    console.log(JSON.stringify(buildPayload(g), null, 2).slice(0, 3000));
  }
  console.log(`\nDRY run complete. Would create ${work.length} products.`);
  process.exit(0);
}

// ---- Execute ---------------------------------------------------------------

let created = 0, failed = 0;
const failures = [];
const startedAt = Date.now();

for (let i = 0; i < work.length; i++) {
  const g = work[i];
  try {
    const payload = buildPayload(g);
    const out = await adminPost('products.json', payload);
    created += 1;
    if (i < 3 || i % 100 === 0) {
      const pid = out.product?.id;
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`[${i + 1}/${work.length}] +${g.groupSku} → product ${pid} (created=${created} failed=${failed}, ${elapsed}s)`);
    }
  } catch (e) {
    failed += 1;
    failures.push({ groupSku: g.groupSku, error: e.message });
    if (failed <= 10) console.warn(`[${i + 1}] FAIL ${g.groupSku}: ${e.message}`);
  }
  await sleep(550); // ~1.8 req/sec
}

console.log(`\nDone. created=${created} failed=${failed} in ${((Date.now()-startedAt)/1000/60).toFixed(1)}min`);
if (failures.length) {
  fs.writeFileSync('/tmp/import-failures.json', JSON.stringify(failures, null, 2));
  console.log(`Failures written to /tmp/import-failures.json`);
}
