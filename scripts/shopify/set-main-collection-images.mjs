// Set collection.image on main category/merch collections using curated
// marketing assets + editorial library — every collection gets a UNIQUE image.
// Idempotent: skips already-imaged collections unless --force.
import { readFileSync, readdirSync } from 'node:fs';
import { extname, basename } from 'node:path';

const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOP = 'mwuwqi-vy.myshopify.com';
const V = '2025-07';
const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry');

// Hand-mapped marketing assets (best category fit, each used once)
const MARKETING = {
  'women':                'src/assets/marketing-women-summer.jpg',
  'men':                  'src/assets/marketing-men-summer.jpg',
  'accessories':          'src/assets/marketing-accessories-summer.jpg',
  'swimwear':             'src/assets/marketing-swim-summer.jpg',
  'best-sellers':         'src/assets/marketing-summer-sale.jpg',
  'new-arrivals':         'src/assets/home-hero.jpg',
  'unisex':               'src/assets/summer-bento-hero.jpg',
  'clothing':             'src/assets/dg-campaign-hero.jpg',
  'womens-clothing':      'src/assets/dg-campaign-portrait.jpg',
  'mens-clothing':        'src/assets/dg-campaign-detail-1.jpg',
  'other-accessories':    'src/assets/dg-campaign-detail-2.jpg',
  'swim-campaign':        null, // skip
};

// Remaining main collections — assigned unique editorial library images.
// Picked by category fit (editorial library has 99 images numbered 1-99).
const EDITORIAL = {
  'womens-shoes':   'src/assets/editorial/library/12.png',
  'women-bags':     'src/assets/editorial/library/23.png',
  'mens-shoes':     'src/assets/editorial/library/41.png',
  'men-bags':       'src/assets/editorial/library/55.png',
  'women-accessories': 'src/assets/editorial/library/28.png',
  'men-accessories':   'src/assets/editorial/library/63.png',
  'shoes':          'src/assets/editorial/library/47.png',
  'boots':          'src/assets/editorial/library/71.png',
  'loafers':        'src/assets/editorial/library/82.png',
  'hats':           'src/assets/editorial/library/35.png',
  'gloves':         'src/assets/editorial/library/89.png',
  'shirts':         'src/assets/editorial/library/19.png',
  'skirts':         'src/assets/editorial/library/7.png',
  'suits':          'src/assets/editorial/library/58.png',
  'sleepwear':      'src/assets/editorial/library/94.png',
};

const ASSIGNMENTS = { ...MARKETING, ...EDITORIAL };

// Uniqueness guard
const seen = new Set();
for (const [h, p] of Object.entries(ASSIGNMENTS)) {
  if (!p) continue;
  if (seen.has(p)) throw new Error(`Duplicate asset for ${h}: ${p}`);
  seen.add(p);
}

const h = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

async function api(path, opts = {}) {
  const url = `https://${SHOP}/admin/api/${V}${path}`;
  while (true) {
    const r = await fetch(url, { ...opts, headers: { ...h, ...(opts.headers || {}) } });
    if (r.status === 429) {
      const wait = Number(r.headers.get('retry-after') || 2) * 1000;
      await new Promise(res => setTimeout(res, wait));
      continue;
    }
    const text = await r.text();
    let j; try { j = JSON.parse(text); } catch { j = { _raw: text }; }
    if (!r.ok) throw new Error(`${r.status} ${path}: ${text.slice(0, 300)}`);
    return j;
  }
}

async function findCollection(handle) {
  const s = await api(`/smart_collections.json?handle=${handle}&fields=id,handle,title,image`);
  if (s.smart_collections?.length) return { ...s.smart_collections[0], _kind: 'smart_collections' };
  const c = await api(`/custom_collections.json?handle=${handle}&fields=id,handle,title,image`);
  if (c.custom_collections?.length) return { ...c.custom_collections[0], _kind: 'custom_collections' };
  return null;
}

function toAttachment(localPath) {
  const buf = readFileSync(localPath);
  return buf.toString('base64');
}

let set = 0, skipped = 0, missing = 0, failed = 0;
for (const [handle, localPath] of Object.entries(ASSIGNMENTS)) {
  if (!localPath) continue;
  try {
    const coll = await findCollection(handle);
    if (!coll) { console.log(`MISS  ${handle.padEnd(28)} (no collection)`); missing++; continue; }
    if (coll.image && !FORCE) { console.log(`SKIP  ${handle.padEnd(28)} (has image)`); skipped++; continue; }
    if (DRY) { console.log(`DRY   ${handle.padEnd(28)} <- ${basename(localPath)}`); continue; }
    const attachment = toAttachment(localPath);
    const filename = basename(localPath);
    const payload = {
      [coll._kind.replace(/s$/, '')]: {
        id: coll.id,
        image: { attachment, filename, alt: `${coll.title} — Palace of Roman` },
      },
    };
    await api(`/${coll._kind}/${coll.id}.json`, { method: 'PUT', body: JSON.stringify(payload) });
    console.log(`OK    ${handle.padEnd(28)} <- ${filename}`);
    set++;
  } catch (e) {
    console.log(`FAIL  ${handle.padEnd(28)} ${e.message}`);
    failed++;
  }
  await new Promise(r => setTimeout(r, 600));
}
console.log(`\nDone. set=${set} skipped=${skipped} missing=${missing} failed=${failed}`);
