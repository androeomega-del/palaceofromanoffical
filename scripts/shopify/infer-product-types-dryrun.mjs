#!/usr/bin/env node
// Dry-run: fetch all products, infer product_type from tags+title, write a CSV mapping preview.
// No writes. Run: node scripts/shopify/infer-product-types-dryrun.mjs
import fs from 'node:fs';

const SHOP = 'mwuwqi-vy.myshopify.com';
const API = '2025-07';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// Ordered rules — first match wins. Keyword → [product_type, shopify_standard_category]
// Shopify standard product taxonomy (gid for productCategory) is set via Admin GraphQL separately;
// here we focus on product_type (Shopify "Type" column), which is what powers the smart collections.
const RULES = [
  // Footwear
  [/\b(sneaker|trainer|running shoe|low-top|high-top)\b/i, 'Sneakers'],
  [/\b(loafer|moccasin|slip-on|driver)\b/i, 'Loafers'],
  [/\b(boot|ankle boot|chelsea|combat)\b/i, 'Boots'],
  [/\b(sandal|slide|flip[- ]?flop|thong)\b/i, 'Sandals'],
  [/\b(pump|heel|stiletto|court shoe)\b/i, 'Heels'],
  [/\b(espadrille)\b/i, 'Espadrilles'],
  [/\b(oxford|derby|brogue|lace[- ]?up shoe|dress shoe)\b/i, 'Dress Shoes'],
  [/\b(ballerina|flat|ballet)\b/i, 'Flats'],

  // Bags & SLG
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
  [/\b(wallet|cardholder|card holder|card case|coin purse)\b/i, 'Wallets'],
  [/\b(keyring|key holder|key chain|keychain)\b/i, 'Keyrings'],

  // Eyewear
  [/\b(sunglass|sunglasses|shades)\b/i, 'Sunglasses'],
  [/\b(eyeglass|optical frame|reading glasses)\b/i, 'Eyeglasses'],

  // Watches & jewelry
  [/\b(watch|chronograph|timepiece)\b/i, 'Watches'],
  [/\b(bracelet|cuff)\b/i, 'Bracelets'],
  [/\b(necklace|pendant|chain)\b/i, 'Necklaces'],
  [/\b(ring)\b/i, 'Rings'],
  [/\b(earring|stud|hoop)\b/i, 'Earrings'],

  // Accessories
  [/\b(belt)\b/i, 'Belts'],
  [/\b(scarf|foulard|stole|shawl)\b/i, 'Scarves'],
  [/\b(tie|necktie)\b/i, 'Ties'],
  [/\b(bow tie|bow-tie)\b/i, 'Bow Ties'],
  [/\b(pocket square)\b/i, 'Pocket Squares'],
  [/\b(glove|mitten)\b/i, 'Gloves'],
  [/\b(hat|cap|beanie|fedora|bucket hat)\b/i, 'Hats'],

  // Outerwear
  [/\b(trench)\b/i, 'Trench Coats'],
  [/\b(parka)\b/i, 'Parkas'],
  [/\b(puffer|down jacket|quilted jacket)\b/i, 'Puffer Jackets'],
  [/\b(leather jacket|biker jacket)\b/i, 'Leather Jackets'],
  [/\b(blazer|sport coat)\b/i, 'Blazers'],
  [/\b(coat|overcoat|peacoat|pea coat)\b/i, 'Coats'],
  [/\b(jacket|bomber|windbreaker|gilet|vest)\b/i, 'Jackets'],

  // Tops
  [/\b(polo)\b/i, 'Polo Shirts'],
  [/\b(t[- ]?shirt|tee)\b/i, 'T-Shirts'],
  [/\b(sweatshirt|hoodie|hooded)\b/i, 'Sweatshirts'],
  [/\b(sweater|jumper|knit|cardigan|pullover)\b/i, 'Sweaters'],
  [/\b(shirt|blouse)\b/i, 'Shirts'],
  [/\b(top|camisole|tank|crop top)\b/i, 'Tops'],

  // Bottoms
  [/\b(jeans|denim)\b/i, 'Jeans'],
  [/\b(chino|trouser|pant|pants)\b/i, 'Trousers'],
  [/\b(short|bermuda)\b/i, 'Shorts'],
  [/\b(legging)\b/i, 'Leggings'],
  [/\b(skirt)\b/i, 'Skirts'],

  // Dresses & suits
  [/\b(dress|gown|kaftan)\b/i, 'Dresses'],
  [/\b(jumpsuit|playsuit|romper)\b/i, 'Jumpsuits'],
  [/\b(suit|tuxedo)\b/i, 'Suits'],

  // Swim & underwear
  [/\b(swim|bikini|swimsuit|bathing suit|boardshort|swim short)\b/i, 'Swimwear'],
  [/\b(boxer|brief|underwear|lingerie|bra|panty|panties)\b/i, 'Underwear'],
  [/\b(sock|socks)\b/i, 'Socks'],

  // Beauty / fragrance
  [/\b(perfume|eau de|fragrance|cologne)\b/i, 'Fragrance'],
];

function infer(title, tags) {
  const hay = `${title} ${tags}`;
  for (const [re, type] of RULES) if (re.test(hay)) return type;
  return null;
}

async function gql(query, variables) {
  const r = await fetch(`https://${SHOP}/admin/api/${API}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const Q = `query($cursor: String) {
  products(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges { node { id legacyResourceId title handle vendor productType tags } }
  }
}`;

const rows = [];
let cursor = null, page = 0;
while (true) {
  page++;
  const d = await gql(Q, { cursor });
  for (const e of d.products.edges) {
    const n = e.node;
    const tagsStr = (n.tags || []).join(' ');
    const inferred = infer(n.title, tagsStr);
    rows.push({
      id: n.legacyResourceId,
      handle: n.handle,
      vendor: n.vendor || '',
      current: n.productType || '',
      inferred: inferred || '',
      title: n.title,
    });
  }
  process.stderr.write(`page ${page} (${rows.length} products)\n`);
  if (!d.products.pageInfo.hasNextPage) break;
  cursor = d.products.pageInfo.endCursor;
}

// Summary
const counts = {};
let unmatched = 0, changed = 0, same = 0;
for (const r of rows) {
  if (!r.inferred) { unmatched++; continue; }
  counts[r.inferred] = (counts[r.inferred] || 0) + 1;
  if (r.inferred === r.current) same++; else changed++;
}
const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);

console.log(`\nTotal products: ${rows.length}`);
console.log(`Would change product_type: ${changed}`);
console.log(`Already correct: ${same}`);
console.log(`Unmatched (no rule fired): ${unmatched}`);
console.log(`\nInferred product_type distribution:`);
for (const [t,c] of sorted) console.log(`  ${c.toString().padStart(5)}  ${t}`);

// Write full CSV
const csv = ['id,handle,vendor,current_type,inferred_type,title',
  ...rows.map(r => [r.id, r.handle, r.vendor, r.current, r.inferred,
    JSON.stringify(r.title)].join(','))].join('\n');
fs.writeFileSync('/mnt/documents/product-type-mapping.csv', csv);

// Sample of unmatched
const unmatchedSample = rows.filter(r => !r.inferred).slice(0, 30);
console.log(`\nSample of unmatched (first 30):`);
for (const r of unmatchedSample) console.log(`  [${r.vendor}] ${r.title}`);
