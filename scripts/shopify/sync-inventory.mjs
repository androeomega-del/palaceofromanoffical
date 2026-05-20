// Sync Shopify variant inventory to match bg_variants.quantity.
//
// Strategy:
//   1. Pull (sku -> variant_gid) from shopify_variant_map.
//   2. Pull (product_sku -> quantity) from bg_variants.
//   3. Resolve inventoryItem.id for each variant_gid via GraphQL `nodes(ids:[...])`,
//      batches of 100.
//   4. Set on-hand quantities via GraphQL `inventorySetQuantities`
//      (ignoreCompareQuantity: true, reason: "correction", name: "available"),
//      batches of 100.
//   5. Update `shopify_variant_map.available` to reflect the new quantity > 0.
//
// Single fulfillment location is hard-coded after probing it from a sample
// variant (this store has exactly one).
//
// Run:
//   node scripts/shopify/sync-inventory.mjs --dry           (no writes; prints first batch + summary)
//   node scripts/shopify/sync-inventory.mjs --limit=500     (cap the variant count)
//   node scripts/shopify/sync-inventory.mjs                 (full sync, ~3-5 min for 17k)

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOCATION_GID = 'gid://shopify/Location/88084676757';

const DRY = process.argv.includes('--dry');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!SB_URL || !SB_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GRAPHQL_URL = `https://${SHOP}/admin/api/${API}/graphql.json`;

async function sb(path, init = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${await res.text()}`);
  return res;
}

async function gql(query, variables) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429) {
      const wait = parseFloat(res.headers.get('retry-after') || '2') * 1000;
      console.warn(`429 — sleeping ${wait}ms`);
      await sleep(wait);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`GraphQL ${res.status}: ${text}`);
    const j = JSON.parse(text);
    if (j.errors) {
      const throttled = j.errors.some((e) => /throttle/i.test(e.message || ''));
      if (throttled) { await sleep(2000); continue; }
      throw new Error(`GraphQL errors: ${JSON.stringify(j.errors)}`);
    }
    return j.data;
  }
  throw new Error('gql: retries exhausted');
}

// ---- Load mappings ----------------------------------------------------------

async function loadAll(table, select) {
  const out = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const r = await sb(`${table}?select=${select}`, {
      headers: { Range: `${from}-${from + pageSize - 1}` },
    });
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

console.log('Loading shopify_variant_map…');
const mapRows = await loadAll('shopify_variant_map', 'sku,variant_gid,available');
console.log(`  ${mapRows.length} mapped variants`);

console.log('Loading bg_variants…');
const bgRows = await loadAll('bg_variants', 'product_sku,quantity');
const qtyBySku = new Map(bgRows.map((r) => [r.product_sku, r.quantity ?? 0]));
console.log(`  ${bgRows.length} bg variants`);

// Build work list: (variant_gid, desired quantity, currently-recorded available)
const work = mapRows
  .filter((m) => qtyBySku.has(m.sku))
  .map((m) => ({
    sku: m.sku,
    variantGid: m.variant_gid,
    desired: qtyBySku.get(m.sku) ?? 0,
    prevAvailable: m.available,
  }))
  .slice(0, LIMIT === Infinity ? undefined : LIMIT);

console.log(`Work: ${work.length} variants to reconcile`);

// ---- Resolve inventoryItem.id for each variant_gid -------------------------

console.log('Resolving inventoryItem.id (batches of 100)…');
const itemByGid = new Map();
const NODES_QUERY = `query($ids:[ID!]!){ nodes(ids:$ids){ ... on ProductVariant { id inventoryItem { id } } } }`;

for (let i = 0; i < work.length; i += 100) {
  const slice = work.slice(i, i + 100);
  const data = await gql(NODES_QUERY, { ids: slice.map((w) => w.variantGid) });
  for (const node of data.nodes) {
    if (node && node.inventoryItem) itemByGid.set(node.id, node.inventoryItem.id);
  }
  if (i === 0 || (i / 100) % 20 === 0) console.log(`  resolved ${Math.min(i + 100, work.length)}/${work.length}`);
  await sleep(150);
}

const resolved = work.filter((w) => itemByGid.has(w.variantGid));
console.log(`Resolved ${resolved.length}/${work.length} inventoryItem IDs`);

// ---- Set inventory quantities ----------------------------------------------

const SET_MUTATION = `
mutation($input: InventorySetQuantitiesInput!){
  inventorySetQuantities(input:$input){
    inventoryAdjustmentGroup{ id }
    userErrors{ field message }
  }
}`;

let updated = 0;
let failed = 0;
const skuFlipped = []; // {sku, newAvailable}

for (let i = 0; i < resolved.length; i += 100) {
  const slice = resolved.slice(i, i + 100);
  const input = {
    reason: 'correction',
    name: 'available',
    ignoreCompareQuantity: true,
    quantities: slice.map((w) => ({
      inventoryItemId: itemByGid.get(w.variantGid),
      locationId: LOCATION_GID,
      quantity: Math.max(0, w.desired | 0),
    })),
  };

  if (DRY && i === 0) {
    console.log('--dry first batch input (truncated):');
    console.log(JSON.stringify({ ...input, quantities: input.quantities.slice(0, 3) }, null, 2));
  }

  if (!DRY) {
    try {
      const data = await gql(SET_MUTATION, { input });
      const errs = data.inventorySetQuantities.userErrors || [];
      if (errs.length) {
        console.warn(`batch ${i / 100}: userErrors`, errs.slice(0, 3));
        failed += errs.length;
        updated += slice.length - errs.length;
      } else {
        updated += slice.length;
      }
    } catch (e) {
      console.error(`batch ${i / 100} failed:`, e.message);
      failed += slice.length;
    }
  }

  for (const w of slice) {
    const newAvail = w.desired > 0;
    if (newAvail !== w.prevAvailable) skuFlipped.push({ sku: w.sku, available: newAvail });
  }

  if ((i / 100) % 10 === 0) console.log(`  ${Math.min(i + 100, resolved.length)}/${resolved.length} synced`);
  await sleep(200);
}

console.log(`\nShopify inventory updated: ${updated} variants (failed: ${failed})`);
console.log(`Availability changes to mirror in shopify_variant_map: ${skuFlipped.length}`);

// ---- Mirror `available` into shopify_variant_map ---------------------------

if (!DRY && skuFlipped.length) {
  console.log('Updating shopify_variant_map.available (batches of 500)…');
  for (let i = 0; i < skuFlipped.length; i += 500) {
    const slice = skuFlipped.slice(i, i + 500);
    // PATCH per-sku is the simplest given the unique-sku invariant.
    for (const row of slice) {
      await sb(`shopify_variant_map?sku=eq.${encodeURIComponent(row.sku)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ available: row.available, synced_at: new Date().toISOString() }),
      });
    }
    console.log(`  ${Math.min(i + 500, skuFlipped.length)}/${skuFlipped.length}`);
  }
}

console.log('Done.');
