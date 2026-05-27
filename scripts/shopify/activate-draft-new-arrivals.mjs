// One-off: find DRAFT products with inventory > 0, tag them `new-arrival`,
// flip status to ACTIVE, and publish to all sales channels (publications).
// Also records tag expiration (now + 7 days) in shopify_tag_expirations so
// the existing cleanup job can untag them.
//
// Usage:
//   node scripts/shopify/activate-draft-new-arrivals.mjs --dry
//   node scripts/shopify/activate-draft-new-arrivals.mjs
//   node scripts/shopify/activate-draft-new-arrivals.mjs --limit=50
//
// Requires: SHOPIFY_ACCESS_TOKEN, SUPABASE_DB_URL
import { execSync } from 'node:child_process';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DB_URL = process.env.SUPABASE_DB_URL;
const TAG = 'new-arrival';
const DAYS = 7;
const DRY = process.argv.includes('--dry');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }
if (!DB_URL && !DRY) { console.error('Missing SUPABASE_DB_URL'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables = {}) {
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
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${text.slice(0, 240)}`);
    const json = JSON.parse(text);
    if (json.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
    return json.data;
  }
  throw new Error('Too many Shopify 429s');
}

// ---------- 1. Fetch all DRAFT products with inventory > 0 ----------
// Search query: status:draft AND inventory_total:>0
const FETCH = `
  query DraftsWithStock($cursor: String) {
    products(
      first: 100,
      after: $cursor,
      query: "status:draft AND inventory_total:>0"
    ) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          tags
          totalInventory
          status
        }
      }
    }
  }
`;

async function fetchDraftsWithStock() {
  const all = [];
  let cursor = null;
  while (true) {
    const data = await gql(FETCH, { cursor });
    for (const e of data.products.edges) all.push(e.node);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
    await sleep(150);
  }
  return all;
}

// ---------- 2. Mutations ----------
const TAGS_ADD = `
  mutation TagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
  }
`;

const SET_ACTIVE = `
  mutation SetActive($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id status }
      userErrors { field message }
    }
  }
`;

const ALL_PUBS = `
  query Pubs { publications(first: 50) { edges { node { id name } } } }
`;

const PUBLISH = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

async function tagProduct(id) {
  const d = await gql(TAGS_ADD, { id, tags: [TAG] });
  const errs = d.tagsAdd.userErrors;
  if (errs?.length) throw new Error(`tagsAdd: ${JSON.stringify(errs)}`);
}

async function setActive(id) {
  const d = await gql(SET_ACTIVE, { input: { id, status: 'ACTIVE' } });
  const errs = d.productUpdate.userErrors;
  if (errs?.length) throw new Error(`productUpdate: ${JSON.stringify(errs)}`);
}

async function publishAll(id, pubIds) {
  const input = pubIds.map((publicationId) => ({ publicationId }));
  const d = await gql(PUBLISH, { id, input });
  const errs = d.publishablePublish.userErrors;
  if (errs?.length) throw new Error(`publishablePublish: ${JSON.stringify(errs)}`);
}

// ---------- 3. Run ----------
console.log('Fetching DRAFT products with inventory > 0…');
const drafts = await fetchDraftsWithStock();
console.log(`Found ${drafts.length} candidate(s).`);

const targets = drafts.slice(0, LIMIT === Infinity ? drafts.length : LIMIT);
if (targets.length === 0) { console.log('Nothing to do.'); process.exit(0); }

if (DRY) {
  console.log('DRY RUN — first 10:');
  for (const p of targets.slice(0, 10)) {
    console.log(' -', p.id, p.handle, '| inv:', p.totalInventory, '| tags:', p.tags.join(','));
  }
  console.log(`Would activate + tag + publish ${targets.length} product(s).`);
  process.exit(0);
}

console.log('Resolving publications…');
const pubData = await gql(ALL_PUBS);
const pubIds = pubData.publications.edges.map((e) => e.node.id);
const pubNames = pubData.publications.edges.map((e) => e.node.name).join(', ');
console.log(`Publishing to ${pubIds.length} channels: ${pubNames}`);

const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000).toISOString();
const succeeded = [];
let failed = 0;

for (let i = 0; i < targets.length; i++) {
  const p = targets[i];
  try {
    if (!p.tags.includes(TAG)) await tagProduct(p.id);
    await setActive(p.id);
    await publishAll(p.id, pubIds);
    succeeded.push(p.id);
    if ((i + 1) % 25 === 0 || i + 1 === targets.length) {
      console.log(`[${i + 1}/${targets.length}] ok=${succeeded.length} fail=${failed}`);
    }
  } catch (e) {
    failed++;
    console.error(`✗ ${p.id} ${p.handle}: ${e.message}`);
  }
  await sleep(200); // ~5 req/sec
}

console.log(`\nActivated+tagged+published: ${succeeded.length}, failed: ${failed}`);

// ---------- 4. Record tag expirations ----------
if (succeeded.length && DB_URL) {
  // shopify_tag_expirations stores numeric REST id; convert gid → numeric.
  const numericIds = succeeded.map((gid) => gid.split('/').pop());
  const values = numericIds
    .map((id) => `('${id}', '${TAG}', '${expiresAt}')`)
    .join(',\n  ');
  const sql = `insert into public.shopify_tag_expirations (product_id, tag, expires_at)
values
  ${values}
on conflict (product_id, tag) do update set expires_at = excluded.expires_at;`;
  console.log(`Recording ${numericIds.length} tag expiration rows (expires ${expiresAt})…`);
  try {
    execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -q -f -`, {
      input: sql,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    console.log('✓ Expirations recorded.');
  } catch (e) {
    console.error('Expiration insert failed:', e.message);
  }
}
