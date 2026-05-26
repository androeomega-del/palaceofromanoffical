// Creates the curated "Men's Summer Edit — Shorts & Resort" custom collection.
// Highly curated: hand-filtered men's swim shorts, casual shorts, linen shirts
// and resort-ready pieces. In-stock only, vendor-diverse, capped at ~36 SKUs
// to keep the page focused for ATC.
//
// Usage:  SHOPIFY_ACCESS_TOKEN=... node scripts/shopify/create-mens-summer-edit.mjs [--dry]

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');

if (!TOKEN) {
  console.error('Missing SHOPIFY_ACCESS_TOKEN');
  process.exit(1);
}

const HANDLE = 'mens-summer-shorts-resort';
const TITLE = "Men's Summer Edit — Shorts & Resort";
const BODY =
  '<p>A tight, hand-picked edit for the season away. Swim shorts, tailored ' +
  'shorts, linen shirting and slides — chosen from the houses we trust to ' +
  'get cut, weight and colour right when the temperature climbs. Every piece ' +
  'is in stock, ready to ship from our European partner network.</p>';

// Tag combos we treat as "resort-ready" for men.
const MEN_TAGS_OR = [
  'Swim Shorts - Swimwear - Clothing',
  'Swimwear - Clothing',
  'Shorts - Clothing',
  'Bermuda - Shorts - Clothing',
  'Bermuda Shorts - Shorts - Clothing',
  'Linen Shirts - Shirts - Clothing',
  'Short Sleeve - Shirts - Clothing',
  'Sandals - Shoes',
  'Slides - Shoes',
];

const TARGET_TOTAL = 36;
const PER_VENDOR_CAP = 3;

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

// Pull men's resort-ready products via Admin GraphQL search.
async function fetchPool() {
  const tagQuery = MEN_TAGS_OR.map((t) => `tag:"${t}"`).join(' OR ');
  const query = `tag:Men AND (${tagQuery}) AND status:active AND inventory_total:>0`;
  const out = [];
  let cursor = null;
  for (let page = 0; page < 8; page++) {
    const data = await gql(
      `query($q:String!,$c:String){
         products(first:100, query:$q, after:$c, sortKey:BEST_SELLING){
           pageInfo{ hasNextPage endCursor }
           edges{ node{
             id legacyResourceId title vendor productType totalInventory tags
             featuredImage{ url }
           } }
         }
       }`,
      { q: query, c: cursor },
    );
    for (const e of data.products.edges) out.push(e.node);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  return out;
}

function scoreProduct(p) {
  const t = (p.tags || []).map((x) => x.toLowerCase());
  let s = 0;
  if (t.some((x) => x.includes('swim shorts'))) s += 5;
  if (t.some((x) => x.includes('bermuda'))) s += 4;
  if (t.some((x) => x.includes('linen'))) s += 4;
  if (t.some((x) => x === 'shorts - clothing')) s += 3;
  if (t.some((x) => x.includes('sandals') || x.includes('slides'))) s += 2;
  if (p.featuredImage?.url) s += 2;
  if ((p.totalInventory ?? 0) >= 3) s += 1;
  return s;
}

function curate(pool) {
  // Sort by score desc, then keep vendor diversity.
  const sorted = [...pool].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const byVendor = new Map();
  const chosen = [];
  for (const p of sorted) {
    if (chosen.length >= TARGET_TOTAL) break;
    const v = p.vendor || 'Unknown';
    const used = byVendor.get(v) || 0;
    if (used >= PER_VENDOR_CAP) continue;
    if (!p.featuredImage?.url) continue; // ATC needs a hero image
    chosen.push(p);
    byVendor.set(v, used + 1);
  }
  return chosen;
}

async function ensureCollection() {
  const existing = await rest(`/custom_collections.json?handle=${HANDLE}`);
  if (existing.custom_collections?.length) {
    const id = existing.custom_collections[0].id;
    await rest(`/custom_collections/${id}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        custom_collection: {
          id,
          title: TITLE,
          body_html: BODY,
          sort_order: 'best-selling',
          published: true,
        },
      }),
    });
    return { id, created: false };
  }
  const created = await rest('/custom_collections.json', {
    method: 'POST',
    body: JSON.stringify({
      custom_collection: {
        handle: HANDLE,
        title: TITLE,
        body_html: BODY,
        sort_order: 'best-selling',
        published: true,
      },
    }),
  });
  return { id: created.custom_collection.id, created: true };
}

async function syncCollects(collectionId, productIds) {
  // Fetch current collects
  const existing = [];
  let pageInfo = `/collects.json?collection_id=${collectionId}&limit=250`;
  while (pageInfo) {
    const r = await rest(pageInfo);
    existing.push(...(r.collects || []));
    pageInfo = null; // single page is enough at this scale
  }
  const existingMap = new Map(existing.map((c) => [String(c.product_id), c.id]));
  const targetSet = new Set(productIds.map(String));

  // Remove ones not in target
  for (const [pid, cid] of existingMap) {
    if (!targetSet.has(pid)) {
      await rest(`/collects/${cid}.json`, { method: 'DELETE' });
    }
  }
  // Add new ones in target order (Shopify keeps insertion order for manual sort)
  for (const pid of productIds) {
    if (existingMap.has(String(pid))) continue;
    await rest('/collects.json', {
      method: 'POST',
      body: JSON.stringify({ collect: { collection_id: collectionId, product_id: Number(pid) } }),
    });
  }
}

async function publishEverywhere(legacyId) {
  const pubs = await gql(`{ publications(first:25){ edges{ node{ id name } } } }`);
  const pubIds = pubs.publications.edges.map((e) => e.node.id);
  const collGid = `gid://shopify/Collection/${legacyId}`;
  const m = await gql(
    `mutation($id:ID!,$input:[PublicationInput!]!){
       publishablePublish(id:$id, input:$input){ userErrors{ field message } }
     }`,
    { id: collGid, input: pubIds.map((publicationId) => ({ publicationId })) },
  );
  return { count: pubIds.length, errors: m.publishablePublish.userErrors };
}

(async () => {
  console.log('Fetching candidate pool…');
  const pool = await fetchPool();
  console.log(`Pool size: ${pool.length}`);
  const picks = curate(pool);
  console.log(`Curated picks: ${picks.length}`);
  console.log(picks.map((p) => ` - ${p.vendor} :: ${p.title}`).join('\n'));

  if (DRY) {
    process.exit(0);
  }

  const { id, created } = await ensureCollection();
  console.log(`${created ? 'Created' : 'Updated'} collection #${id}`);

  await syncCollects(id, picks.map((p) => p.legacyResourceId));
  console.log('Collects synced.');

  const pub = await publishEverywhere(id);
  if (pub.errors.length) console.warn('publish errors:', pub.errors);
  else console.log(`Published to ${pub.count} publication(s).`);

  const cnt = await rest(`/collections/${id}/products/count.json`);
  console.log(`Final product count: ${cnt.count}`);
  console.log(`Handle: ${HANDLE}`);
})().catch((e) => { console.error(e); process.exit(1); });
