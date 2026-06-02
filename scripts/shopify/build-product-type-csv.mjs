#!/usr/bin/env node
// Enumerate all products via Storefront API and build a Matrixify CSV (Handle, Type)
// with an inferred product_type per product. No writes to Shopify.
import fs from 'node:fs';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = '3b02ce4f61d642096147b804ec7ba962';
const URL = `https://${SHOP}/api/${API}/graphql.json`;

const RULES = [
  [/\b(sneaker|trainer|running shoe|low-top|high-top)\b/i, 'Sneakers'],
  [/\b(loafer|moccasin|slip-on|driver)\b/i, 'Loafers'],
  [/\b(boot|ankle boot|chelsea|combat)\b/i, 'Boots'],
  [/\b(sandal|slide|flip[- ]?flop|thong)\b/i, 'Sandals'],
  [/\b(pump|heel|stiletto|court shoe)\b/i, 'Heels'],
  [/\b(espadrille)\b/i, 'Espadrilles'],
  [/\b(oxford|derby|brogue|lace[- ]?up shoe|dress shoe)\b/i, 'Dress Shoes'],
  [/\b(ballerina|ballet flat)\b/i, 'Flats'],
  [/\b(tote)\b/i, 'Tote Bags'],
  [/\b(crossbody|cross[- ]?body)\b/i, 'Crossbody Bags'],
  [/\b(shoulder bag|hobo)\b/i, 'Shoulder Bags'],
  [/\b(clutch|pochette|evening bag)\b/i, 'Clutches'],
  [/\b(backpack|rucksack)\b/i, 'Backpacks'],
  [/\b(bucket bag)\b/i, 'Bucket Bags'],
  [/\b(belt bag|fanny pack|waist bag)\b/i, 'Belt Bags'],
  [/\b(mini bag|micro bag)\b/i, 'Mini Bags'],
  [/\b(handbag|top[- ]?handle|satchel|baguette)\b/i, 'Handbags'],
  [/\b(duffle|duffel|weekender|travel bag)\b/i, 'Travel Bags'],
  [/\b(suitcase|luggage|trolley)\b/i, 'Luggage'],
  [/\b(briefcase|messenger)\b/i, 'Briefcases'],
  [/\b(card ?holder|card case|cardholder)\b/i, 'Card Holders'],
  [/\b(wallet|coin purse|billfold)\b/i, 'Wallets'],
  [/\b(keyring|key holder|key chain|keychain)\b/i, 'Keyrings'],
  [/\b(sunglass|sunglasses|shades)\b/i, 'Sunglasses'],
  [/\b(eyeglass|optical frame|reading glasses)\b/i, 'Eyeglasses'],
  [/\b(watch|chronograph|timepiece)\b/i, 'Watches'],
  [/\b(bracelet|cuff)\b/i, 'Bracelets'],
  [/\b(necklace|pendant|chain)\b/i, 'Necklaces'],
  [/\b(ring)\b/i, 'Rings'],
  [/\b(earring|stud|hoop)\b/i, 'Earrings'],
  [/\b(belt)\b/i, 'Belts'],
  [/\b(scarf|foulard|stole|shawl)\b/i, 'Scarves'],
  [/\b(bow[- ]?tie)\b/i, 'Bow Ties'],
  [/\b(necktie|\btie\b)\b/i, 'Ties'],
  [/\b(pocket square)\b/i, 'Pocket Squares'],
  [/\b(glove|mitten)\b/i, 'Gloves'],
  [/\b(hat|cap|beanie|fedora|bucket hat)\b/i, 'Hats'],
  [/\b(trench)\b/i, 'Trench Coats'],
  [/\b(parka)\b/i, 'Parkas'],
  [/\b(puffer|down jacket|quilted jacket)\b/i, 'Puffer Jackets'],
  [/\b(leather jacket|biker jacket)\b/i, 'Leather Jackets'],
  [/\b(blazer|sport coat)\b/i, 'Blazers'],
  [/\b(coat|overcoat|peacoat|pea coat)\b/i, 'Coats'],
  [/\b(jacket|bomber|windbreaker|gilet|vest)\b/i, 'Jackets'],
  [/\b(polo)\b/i, 'Polo Shirts'],
  [/\b(t[- ]?shirt|tee\b)\b/i, 'T-Shirts'],
  [/\b(sweatshirt|hoodie|hooded)\b/i, 'Sweatshirts'],
  [/\b(cardigan)\b/i, 'Cardigans'],
  [/\b(sweater|jumper|knit|pullover)\b/i, 'Sweaters'],
  [/\b(blouse)\b/i, 'Blouses'],
  [/\b(shirt)\b/i, 'Shirts'],
  [/\b(camisole|tank|crop top|\btop\b)\b/i, 'Tops'],
  [/\b(jeans|denim)\b/i, 'Jeans'],
  [/\b(chino|trouser|\bpant\b|pants)\b/i, 'Trousers'],
  [/\b(bermuda|\bshort\b|shorts)\b/i, 'Shorts'],
  [/\b(legging)\b/i, 'Leggings'],
  [/\b(skirt)\b/i, 'Skirts'],
  [/\b(dress|gown|kaftan)\b/i, 'Dresses'],
  [/\b(jumpsuit|playsuit|romper)\b/i, 'Jumpsuits'],
  [/\b(suit|tuxedo)\b/i, 'Suits'],
  [/\b(swim|bikini|swimsuit|bathing suit|boardshort|swim short)\b/i, 'Swimwear'],
  [/\b(boxer|brief|underwear|lingerie|\bbra\b|panty|panties)\b/i, 'Underwear'],
  [/\b(sock|socks)\b/i, 'Socks'],
  [/\b(perfume|eau de|fragrance|cologne)\b/i, 'Fragrance'],
];

function infer(title, productType, tags) {
  const hay = `${title} ${productType} ${tags}`;
  for (const [re, type] of RULES) if (re.test(hay)) return type;
  return null;
}

async function gql(query, variables) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    if (r.status === 429 || r.status >= 500) {
      await new Promise(s => setTimeout(s, 1000 * (attempt + 1)));
      continue;
    }
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
  throw new Error('retries exhausted');
}

const Q = `query($cursor: String) {
  products(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges { node { id handle title vendor productType tags } }
  }
}`;

const rows = [];
let cursor = null, page = 0;
while (true) {
  page++;
  const d = await gql(Q, { cursor });
  for (const e of d.products.edges) {
    const n = e.node;
    const inferred = infer(n.title, n.productType || '', (n.tags || []).join(' '));
    rows.push({
      handle: n.handle, vendor: n.vendor || '',
      current: n.productType || '', inferred: inferred || '', title: n.title,
    });
  }
  process.stderr.write(`page ${page}: ${d.products.edges.length} (total ${rows.length})\n`);
  if (!d.products.pageInfo.hasNextPage) break;
  cursor = d.products.pageInfo.endCursor;
  await new Promise(s => setTimeout(s, 150));
}

const counts = {};
let unmatched = 0, changed = 0, same = 0;
for (const r of rows) {
  if (!r.inferred) { unmatched++; continue; }
  counts[r.inferred] = (counts[r.inferred] || 0) + 1;
  if (r.inferred === r.current) same++; else changed++;
}
console.log(`\nTotal: ${rows.length}  Changed: ${changed}  Same: ${same}  Unmatched: ${unmatched}`);
const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
console.log('Distribution:');
for (const [t,c] of sorted) console.log(`  ${String(c).padStart(5)}  ${t}`);

// Matrixify CSV: Handle + Type (only rows where we have an inferred type and it differs)
const csvLines = ['Handle,Type'];
for (const r of rows) {
  if (!r.inferred || r.inferred === r.current) continue;
  const t = r.inferred.includes(',') ? `"${r.inferred}"` : r.inferred;
  csvLines.push(`${r.handle},${t}`);
}
fs.writeFileSync('/mnt/documents/product-types-matrixify.csv', csvLines.join('\n'));
console.log(`\nWrote /mnt/documents/product-types-matrixify.csv (${csvLines.length - 1} rows)`);

// Full audit CSV for review
const audit = ['handle,vendor,current_type,inferred_type,title',
  ...rows.map(r => [r.handle, r.vendor, r.current, r.inferred,
    JSON.stringify(r.title)].join(','))].join('\n');
fs.writeFileSync('/mnt/documents/product-type-audit.csv', audit);
console.log(`Wrote /mnt/documents/product-type-audit.csv (full audit incl. unmatched)`);
