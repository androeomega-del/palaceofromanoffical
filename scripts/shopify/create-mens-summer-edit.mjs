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

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

const HANDLE = 'mens-summer-shorts-resort';
const TITLE = "Men's Summer Edit — Shorts & Resort";
const BODY =
  '<p>A tight, hand-picked edit for the season away. Swim shorts, tailored ' +
  'shorts, linen shirting and slides — chosen from the houses we trust to ' +
  'get cut, weight and colour right when the temperature climbs. Every piece ' +
  'is in stock, ready to ship from our European partner network.</p>';

const TARGET_TOTAL = 36;
const PER_VENDOR_CAP = 3;

// Tag substrings (lowercased) that mark a product as resort-ready.
const RESORT_TAG_MATCHERS = [
  'swim shorts',
  'swimwear - clothing',
  'shorts - clothing',
  'bermuda',
  'linen shirts',
  'short sleeve - shirts',
  'sandals - shoes',
  'slides - shoes',
];

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
  return { data, link: r.headers.get('link') };
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

async function findCollectionIdByHandle(handle) {
  const r = await rest(`/custom_collections.json?handle=${handle}`);
  if (r.data.custom_collections?.length) return r.data.custom_collections[0].id;
  const s = await rest(`/smart_collections.json?handle=${handle}`);
  if (s.data.smart_collections?.length) return s.data.smart_collections[0].id;
  return null;
}

async function fetchCollectionProducts(collectionId) {
  let path = `/collections/${collectionId}/products.json?limit=250`;
  const out = [];
  while (path) {
    const { data, link } = await rest(path);
    out.push(...(data.products || []));
    const next = link?.split(',').find((s) => s.includes('rel="next"'));
    if (next) {
      const u = new URL(next.match(/<([^>]+)>/)[1]);
      path = u.pathname.replace(`/admin/api/${API}`, '') + u.search;
    } else {
      path = null;
    }
  }
  return out;
}

function scoreProduct(p) {
  const t = (p.tags || '').toLowerCase().split(',').map((x) => x.trim());
  let s = 0;
  if (t.some((x) => x.includes('swim shorts'))) s += 6;
  if (t.some((x) => x.includes('bermuda'))) s += 4;
  if (t.some((x) => x.includes('linen shirts'))) s += 4;
  if (t.some((x) => x === 'shorts - clothing')) s += 3;
  if (t.some((x) => x.includes('short sleeve - shirts'))) s += 2;
  if (t.some((x) => x.includes('sandals') || x.includes('slides'))) s += 2;
  if (p.image?.src || p.images?.[0]?.src) s += 2;
  return s;
}

function inStock(p) {
  return (p.variants || []).some((v) => (v.inventory_quantity ?? 0) > 0);
}

function isResort(p) {
  const tags = (p.tags || '').toLowerCase();
  return RESORT_TAG_MATCHERS.some((m) => tags.includes(m));
}

function curate(pool) {
  const eligible = pool.filter((p) => p.status === 'active' && inStock(p) && isResort(p) && (p.image?.src || p.images?.[0]?.src));
  const sorted = eligible.sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const byVendor = new Map();
  const chosen = [];
  for (const p of sorted) {
    if (chosen.length >= TARGET_TOTAL) break;
    const v = p.vendor || 'Unknown';
    const used = byVendor.get(v) || 0;
    if (used >= PER_VENDOR_CAP) continue;
    chosen.push(p);
    byVendor.set(v, used + 1);
  }
  return chosen;
}

async function ensureCollection() {
  const existingId = await findCollectionIdByHandle(HANDLE);
  if (existingId) {
    await rest(`/custom_collections/${existingId}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        custom_collection: {
          id: existingId,
          title: TITLE,
          body_html: BODY,
          sort_order: 'manual',
          published: true,
        },
      }),
    });
    return { id: existingId, created: false };
  }
  const { data } = await rest('/custom_collections.json', {
    method: 'POST',
    body: JSON.stringify({
      custom_collection: {
        handle: HANDLE,
        title: TITLE,
        body_html: BODY,
        sort_order: 'manual',
        published: true,
      },
    }),
  });
  return { id: data.custom_collection.id, created: true };
}

async function syncCollects(collectionId, productIds) {
  const { data } = await rest(`/collects.json?collection_id=${collectionId}&limit=250`);
  const existing = data.collects || [];
  const existingMap = new Map(existing.map((c) => [String(c.product_id), c.id]));
  const targetSet = new Set(productIds.map(String));
  for (const [pid, cid] of existingMap) {
    if (!targetSet.has(pid)) {
      await rest(`/collects/${cid}.json`, { method: 'DELETE' });
    }
  }
  let position = 1;
  for (const pid of productIds) {
    if (!existingMap.has(String(pid))) {
      await rest('/collects.json', {
        method: 'POST',
        body: JSON.stringify({ collect: { collection_id: collectionId, product_id: Number(pid), position } }),
      });
    } else {
      await rest(`/collects/${existingMap.get(String(pid))}.json`, {
        method: 'PUT',
        body: JSON.stringify({ collect: { id: existingMap.get(String(pid)), position } }),
      });
    }
    position += 1;
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
  const mensClothingId = await findCollectionIdByHandle('mens-clothing');
  const mensShoesId = await findCollectionIdByHandle('mens-shoes');
  if (!mensClothingId) throw new Error('mens-clothing collection not found');
  console.log(`Reading from mens-clothing #${mensClothingId}${mensShoesId ? ` + mens-shoes #${mensShoesId}` : ''}`);

  const pool = await fetchCollectionProducts(mensClothingId);
  if (mensShoesId) {
    const shoes = await fetchCollectionProducts(mensShoesId);
    pool.push(...shoes);
  }
  console.log(`Pool size: ${pool.length}`);

  const picks = curate(pool);
  console.log(`Curated picks (${picks.length}):`);
  for (const p of picks) console.log(` - ${p.vendor} :: ${p.title} (score ${scoreProduct(p)})`);

  if (DRY) process.exit(0);

  const { id, created } = await ensureCollection();
  console.log(`${created ? 'Created' : 'Updated'} collection #${id}`);

  await syncCollects(id, picks.map((p) => p.id));
  console.log('Collects synced.');

  const pub = await publishEverywhere(id);
  if (pub.errors.length) console.warn('publish errors:', pub.errors);
  else console.log(`Published to ${pub.count} publication(s).`);

  const { data: cnt } = await rest(`/collections/${id}/products/count.json`);
  console.log(`Final product count: ${cnt.count}`);
  console.log(`Handle: ${HANDLE}`);
})().catch((e) => { console.error(e); process.exit(1); });
