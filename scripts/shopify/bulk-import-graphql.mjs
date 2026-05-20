// Bulk import via Shopify GraphQL bulkOperationRunMutation + productSet.
// Designed for tens of thousands of products. One bulk op at a time.
//
// Flow:
//   1. Read /tmp/latest.csv, group by Group Sku, filter to fully-new + in-stock
//   2. Build JSONL of productSet inputs (product + variants + media)
//   3. stagedUploadsCreate -> POST JSONL to staged target
//   4. bulkOperationRunMutation(productSet, stagedUploadPath)
//   5. Poll currentBulkOperation until COMPLETED
//   6. Download result JSONL -> tally created/failed
//
// Run:
//   node scripts/shopify/bulk-import-graphql.mjs --dry         (build JSONL only, no upload)
//   node scripts/shopify/bulk-import-graphql.mjs --limit=50    (smoke test, 50 products)
//   node scripts/shopify/bulk-import-graphql.mjs               (full, ~2-4 hours server-side)
//   node scripts/shopify/bulk-import-graphql.mjs --status      (check current bulk op only)
//   node scripts/shopify/bulk-import-graphql.mjs --cancel      (cancel current bulk op)
//
// Defaults: status=ACTIVE (live). --draft for DRAFT.

import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EUR_TO_USD = 1.08;

const DRY = process.argv.includes('--dry');
const STATUS_ONLY = process.argv.includes('--status');
const CANCEL = process.argv.includes('--cancel');
const DRAFT = process.argv.includes('--draft');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const CSV = process.env.CSV_PATH || '/tmp/latest.csv';

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

const GQL_URL = `https://${SHOP}/admin/api/${API}/graphql.json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables = {}) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429) { await sleep(2000); continue; }
    const json = await res.json();
    if (json.errors) throw new Error('GQL: ' + JSON.stringify(json.errors));
    return json.data;
  }
  throw new Error('gql: retries exhausted');
}

// ---- status / cancel shortcuts ----

const CURRENT_OP_QUERY = `{
  currentBulkOperation(type: MUTATION) {
    id status errorCode createdAt completedAt objectCount rootObjectCount url partialDataUrl
  }
}`;

if (STATUS_ONLY) {
  const d = await gql(CURRENT_OP_QUERY);
  console.log(JSON.stringify(d.currentBulkOperation, null, 2));
  process.exit(0);
}

if (CANCEL) {
  const current = await gql(CURRENT_OP_QUERY);
  const op = current.currentBulkOperation;
  if (!op || op.status !== 'RUNNING') { console.log('No running op to cancel.'); process.exit(0); }
  const d = await gql(
    `mutation($id: ID!) { bulkOperationCancel(id: $id) { bulkOperation { id status } userErrors { message } } }`,
    { id: op.id },
  );
  console.log(JSON.stringify(d, null, 2));
  process.exit(0);
}

// ---- guard: only one bulk op at a time ----

const existing = await gql(CURRENT_OP_QUERY);
if (existing.currentBulkOperation && ['CREATED', 'RUNNING'].includes(existing.currentBulkOperation.status)) {
  console.error('A bulk mutation is already running:');
  console.error(JSON.stringify(existing.currentBulkOperation, null, 2));
  console.error('Use --status to monitor, or --cancel to abort.');
  process.exit(1);
}

// ---- load existing SKUs ----

if (!SB_URL || !SB_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
console.log('Loading existing Shopify SKUs from shopify_variant_map…');
async function sbGetAll(path) {
  const out = []; let from = 0; const PAGE = 1000;
  while (true) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${from}-${from + PAGE - 1}` },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}
const mapRows = await sbGetAll('shopify_variant_map?select=sku');
const existingSkus = new Set(mapRows.map((r) => r.sku));
console.log(`  ${existingSkus.size} existing SKUs`);

// ---- parse CSV & filter ----

console.log(`Reading ${CSV}…`);
const records = parse(fs.readFileSync(CSV), { columns: true, skip_empty_lines: true, bom: true, relax_quotes: true, relax_column_count: true });
console.log(`  ${records.length} CSV rows`);

const groups = new Map();
for (const r of records) {
  const g = r['Group Sku']; if (!g) continue;
  if (!groups.has(g)) groups.set(g, { parent: null, children: [] });
  if (r['Product Type'] === 'PARENT') groups.get(g).parent = r;
  else groups.get(g).children.push(r);
}

const candidates = [];
for (const [g, data] of groups) {
  if (!data.parent || data.children.length === 0) continue;
  if (data.children.some((c) => existingSkus.has(c['Product Sku']))) continue;
  const totalQty = data.children.reduce((s, c) => s + (parseInt(c['Quantity'] || '0', 10) || 0), 0);
  if (totalQty <= 0) continue;
  candidates.push({ groupSku: g, ...data });
}
console.log(`Fully-new in-stock product groups: ${candidates.length}`);

const work = LIMIT === Infinity ? candidates : candidates.slice(0, LIMIT);
console.log(`Will submit: ${work.length}\n`);

// ---- build productSet input per group ----

function buildInput({ groupSku, parent, children }) {
  const title = (parent['Name'] || `${parent['Brand'] || ''} ${parent['Subcategory'] || ''}`.trim()) || groupSku;
  const vendor = parent['Brand'] || 'Palace of Roman';
  const productType = parent['Subcategory'] || parent['Category'] || '';
  const tags = [
    parent['Brand'], parent['Gender'], parent['Category'], parent['Subcategory'],
    parent['Subsubcategory'], parent['Color'], parent['Material'],
    'bg-import', `bg-group:${groupSku}`,
  ].filter(Boolean);

  // Dedupe by Size (BG CSV sometimes lists the same size twice per group).
  const bySize = new Map();
  for (const c of children) {
    const sz = c['Size'] || 'One Size';
    if (!bySize.has(sz)) bySize.set(sz, c);
  }
  const sizes = [...bySize.keys()];
  const variants = [...bySize.values()].map((c) => {
    const priceEur = parseFloat(c['Retail Price'] || parent['Retail Price'] || '0') || 0;
    return {
      optionValues: [{ optionName: 'Size', name: c['Size'] || 'One Size' }],
      price: (priceEur * EUR_TO_USD).toFixed(2),
      sku: c['Product Sku'],
      barcode: c['Upc Ean'] || null,
      inventoryPolicy: 'DENY',
      inventoryItem: {
        tracked: true,
        measurement: { weight: { value: parseFloat(c['Weight'] || parent['Weight'] || '0.5') || 0.5, unit: 'KILOGRAMS' } },
      },
    };
  });

  const fileUrls = [parent['Main Picture'], parent['Picture 1'], parent['Picture 2'], parent['Picture 3'], parent['Picture 4'], parent['Picture 5']]
    .filter((u) => u && u.startsWith('http'));
  const files = fileUrls.map((src) => ({ originalSource: src, contentType: 'IMAGE', alt: title }));

  return {
    title,
    descriptionHtml: parent['Description'] || '',
    vendor,
    productType,
    tags,
    status: DRAFT ? 'DRAFT' : 'ACTIVE',
    productOptions: [{ name: 'Size', values: sizes.map((v) => ({ name: v })) }],
    variants,
    files,
  };
}

// ---- write JSONL ----

const JSONL = '/tmp/bulk-products.jsonl';
const out = fs.createWriteStream(JSONL);
for (const g of work) {
  out.write(JSON.stringify({ product: buildInput(g) }) + '\n');
}
out.end();
await new Promise((r) => out.on('finish', r));
const sz = fs.statSync(JSONL).size;
console.log(`Wrote ${JSONL} (${(sz / 1024 / 1024).toFixed(2)} MB, ${work.length} lines)`);

if (DRY) {
  console.log('--- first line preview ---');
  console.log(fs.readFileSync(JSONL, 'utf8').split('\n')[0].slice(0, 1500));
  console.log('\nDRY run complete.');
  process.exit(0);
}

// ---- staged upload ----

console.log('\nRequesting staged upload target…');
const staged = await gql(`
  mutation($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`, {
  input: [{ resource: 'BULK_MUTATION_VARIABLES', filename: 'bulk-products.jsonl', mimeType: 'text/jsonl', httpMethod: 'POST' }],
});
if (staged.stagedUploadsCreate.userErrors.length) throw new Error(JSON.stringify(staged.stagedUploadsCreate.userErrors));
const target = staged.stagedUploadsCreate.stagedTargets[0];

console.log('Uploading JSONL to staged target…');
const form = new FormData();
for (const p of target.parameters) form.append(p.name, p.value);
form.append('file', new Blob([fs.readFileSync(JSONL)], { type: 'text/jsonl' }), 'bulk-products.jsonl');
const upRes = await fetch(target.url, { method: 'POST', body: form });
if (!upRes.ok && upRes.status !== 201 && upRes.status !== 204) {
  throw new Error(`Staged upload failed: ${upRes.status} ${await upRes.text()}`);
}
// Path key inside the staged upload (Google Cloud Storage uses the "key" parameter)
const stagedPath = target.parameters.find((p) => p.name === 'key')?.value;
console.log(`Uploaded. stagedPath=${stagedPath}`);

// ---- run bulk mutation ----

const MUTATION = `mutation call($product: ProductSetInput!) {
  productSet(input: $product, synchronous: true) {
    product { id handle }
    userErrors { field message }
  }
}`;

console.log('\nStarting bulkOperationRunMutation…');
const run = await gql(`
  mutation($mutation: String!, $stagedUploadPath: String!) {
    bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
      bulkOperation { id status }
      userErrors { field message }
    }
  }
`, { mutation: MUTATION, stagedUploadPath: stagedPath });
if (run.bulkOperationRunMutation.userErrors.length) {
  throw new Error(JSON.stringify(run.bulkOperationRunMutation.userErrors));
}
console.log('Started:', JSON.stringify(run.bulkOperationRunMutation.bulkOperation, null, 2));

console.log('\nServer-side processing started. Poll with:');
console.log('  node scripts/shopify/bulk-import-graphql.mjs --status');
console.log('When status=COMPLETED, download result url and tally errors.');
