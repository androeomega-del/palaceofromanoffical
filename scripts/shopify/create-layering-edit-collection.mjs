// Creates the "Layering Edit" smart collection — a curated cross-category
// edit pulling together polos, hoodies, cardigans, long sleeves, turtlenecks
// and sweatshirts. Uses Shopify disjunctive smart-collection rules so a
// product matching ANY of the six tags is included.
//
// Usage:  SHOPIFY_ACCESS_TOKEN=... node scripts/shopify/create-layering-edit-collection.mjs [--dry]

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');

if (!TOKEN) {
  console.error('Missing SHOPIFY_ACCESS_TOKEN');
  process.exit(1);
}

const HANDLE = 'layering-edit';
const TITLE = 'The Layering Edit';
const BODY =
  'The pieces that do the quiet work of a wardrobe. Polos, long sleeves, ' +
  'turtlenecks, cardigans, hoodies and sweatshirts — gathered from the houses ' +
  'that take the everyday seriously, and built to be worn in concert.';

const TAGS = [
  'Polo Shirts - T-Shirts - Clothing',
  'Long Sleeve - T-Shirts - Clothing',
  'Turtlenecks - Sweaters - Clothing',
  'Cardigans - Sweaters - Clothing',
  'Hoodies - Sweaters - Clothing',
  'Sweatshirts - Sweaters - Clothing',
];

const rules = TAGS.map((t) => ({
  column: 'tag',
  relation: 'equals',
  condition: t,
}));

const payload = {
  smart_collection: {
    handle: HANDLE,
    title: TITLE,
    body_html: BODY,
    sort_order: 'best-selling',
    published: true,
    disjunctive: true, // OR across rules
    rules,
  },
};

async function rest(path, init = {}) {
  const r = await fetch(`https://${SHOP}/admin/api/${API}${path}`, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} :: ${text.slice(0, 400)}`);
  return data;
}

async function gql(query, variables) {
  const r = await fetch(`https://${SHOP}/admin/api/${API}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

if (DRY) {
  console.log('[dry] would POST smart_collection:', JSON.stringify(payload, null, 2));
  process.exit(0);
}

// Check if exists
const existing = await rest(`/smart_collections.json?handle=${HANDLE}`);
let id;
if (existing.smart_collections?.length) {
  id = existing.smart_collections[0].id;
  console.log(`Updating existing #${id}`);
  await rest(`/smart_collections/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ smart_collection: { id, ...payload.smart_collection } }),
  });
} else {
  const created = await rest('/smart_collections.json', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  id = created.smart_collection.id;
  console.log(`Created #${id}`);
}

// Publish to all publications (Online Store + Lovable headless channel)
const pubs = await gql(`{ publications(first:25){ edges { node { id name } } } }`);
const pubIds = pubs.publications.edges.map((e) => e.node.id);
const collGid = `gid://shopify/Collection/${id}`;
const m = await gql(
  `mutation($id:ID!,$input:[PublicationInput!]!){
     publishablePublish(id:$id, input:$input){ userErrors{ field message } }
   }`,
  { id: collGid, input: pubIds.map((publicationId) => ({ publicationId })) },
);
const errs = m.publishablePublish.userErrors;
if (errs.length) console.warn('publish errors:', errs);
else console.log(`Published to ${pubIds.length} publication(s).`);

// Verify product count
const cnt = await rest(`/collections/${id}/products/count.json`);
console.log(`Layering Edit now contains ${cnt.count} products.`);
