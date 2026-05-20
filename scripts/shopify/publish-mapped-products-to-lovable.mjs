// One-off: publish products in public.shopify_variant_map to the Lovable
// Storefront publication so Shopify Storefront API cartCreate can see variants.
//
// Run: node scripts/shopify/publish-mapped-products-to-lovable.mjs --dry
//      node scripts/shopify/publish-mapped-products-to-lovable.mjs

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const skipArg = process.argv.find((a) => a.startsWith('--skip='));
const SKIP = skipArg ? parseInt(skipArg.split('=')[1], 10) : 0;
const PUBLICATION_NAME = 'Lovable';

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!SB_URL || !SB_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function adminGraphql(query, variables = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://${SHOP}/admin/api/${API}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429) {
      const wait = parseFloat(res.headers.get('retry-after') || '2') * 1000;
      console.warn(`429 — sleeping ${wait}ms`);
      await sleep(wait);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${text}`);
    const json = JSON.parse(text);
    if (json.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
    return json;
  }
  throw new Error('Too many Shopify 429s');
}

async function getPublicationId() {
  const json = await adminGraphql(`query { publications(first: 50) { edges { node { id name } } } }`);
  const pub = json.data.publications.edges.map((e) => e.node).find((p) => p.name === PUBLICATION_NAME);
  if (!pub) throw new Error(`Could not find publication named ${PUBLICATION_NAME}`);
  return pub.id;
}

async function getMappedProductGids() {
  const gids = new Set();
  const pageSize = 1000;
  for (let offset = 0; offset < 100000; offset += pageSize) {
    const url = `${SB_URL}/rest/v1/shopify_variant_map?select=product_gid&product_gid=not.is.null&order=product_gid.asc&offset=${offset}&limit=${pageSize}`;
    const res = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!res.ok) throw new Error(`Supabase read ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    for (const row of rows) gids.add(row.product_gid);
    if (rows.length < pageSize || gids.size >= LIMIT) break;
  }
  return Array.from(gids).slice(0, LIMIT);
}

async function publishProduct(productId, publicationId) {
  const mutation = `mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }`;
  const json = await adminGraphql(mutation, { id: productId, input: [{ publicationId }] });
  const errors = json.data.publishablePublish.userErrors || [];
  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

const publicationId = await getPublicationId();
const productGids = await getMappedProductGids();
console.log(`Publication: ${PUBLICATION_NAME} (${publicationId})`);
console.log(`Mapped products: ${productGids.length}`);
console.log(`Dry run: ${DRY}`);
console.log('First products:', productGids.slice(0, 3));
console.log('Last products:', productGids.slice(-3));

let published = 0;
let failed = 0;
const failures = [];
if (!DRY) {
  for (let i = 0; i < productGids.length; i++) {
    const productId = productGids[i];
    try {
      const result = await publishProduct(productId, publicationId);
      if (result.ok) published++;
      else {
        failed++;
        failures.push({ productId, errors: result.errors });
      }
    } catch (error) {
      failed++;
      failures.push({ productId, errors: String(error) });
    }
    if ((i + 1) % 100 === 0 || i + 1 === productGids.length) {
      console.log(`Progress ${i + 1}/${productGids.length} — published=${published}, failed=${failed}`);
    }
    await sleep(50);
  }
}

console.log(`\nDone. Published=${published} Failed=${failed} Dry=${DRY}`);
if (failures.length) console.log('Failures sample:', JSON.stringify(failures.slice(0, 10), null, 2));
