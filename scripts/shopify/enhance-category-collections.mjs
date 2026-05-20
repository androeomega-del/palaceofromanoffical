// Enhance category collections with curatorial titles + boutique descriptions.
// Voice: Palace of Roman — restrained, confident, Neiman-Marcus-meets-quiet-luxury.
const SHOP='mwuwqi-vy.myshopify.com', API='2025-07', TOKEN=process.env.SHOPIFY_ACCESS_TOKEN;
const DRY=process.argv.includes('--dry');
if(!TOKEN){console.error('Missing SHOPIFY_ACCESS_TOKEN');process.exit(1);}

// handle -> { title, body } (body is plain prose; we wrap in <p>)
const COPY = {
  // === Women — apparel ===
  'jackets-women':     { title: 'Women’s Jackets',           body: 'Tailored outerwear with a point of view — sculpted blazers, soft-shouldered bombers, and lightweight layers from the houses we trust. Built for the in-between hours of the day.' },
  'coats-women':       { title: 'Women’s Coats',             body: 'The coat is the first thing the world sees. A focused edit of overcoats, trenches, and statement silhouettes — fabrics that hold their line season after season.' },
  'knitwear-women':    { title: 'Women’s Knitwear',          body: 'Cashmere, fine merino, and considered cotton — knits chosen for the way they fall, the way they wear, and the way they live in a wardrobe for years.' },
  'denim-women':       { title: 'Women’s Denim',             body: 'A quiet rebellion against the disposable. Premium Italian and Japanese denim cut into shapes that flatter on day one and continue to earn their place.' },
  'shirts-women':      { title: 'Women’s Shirts & Blouses',  body: 'Crisp poplins, fluid silks, and the kind of weekend cottons you reach for first. Shirts that anchor a wardrobe without competing with it.' },
  'tshirts-women':     { title: 'Women’s T-Shirts',          body: 'The unsung hero of every well-edited closet. Heavy-gauge cottons and the quietly luxurious basics that elevate everything else you wear.' },
  'lingerie':          { title: 'Lingerie & Intimates',      body: 'The layer no one sees — and the one that matters most. A discreet selection of foundational pieces from the houses that built their reputations on fit.' },
  'swimwear-women':    { title: 'Women’s Swimwear',          body: 'For the chaise, the deck, and the long walk back from the water. Resort-ready silhouettes in fabrics engineered to hold their shape through every horizon.' },
  'shorts-women':      { title: 'Women’s Shorts',            body: 'From tailored Bermudas to relaxed weekend cuts — the warm-weather essentials, edited to the pieces we’d pack ourselves.' },
  'sportswear-women':  { title: 'Women’s Sportswear',        body: 'Performance-minded pieces with the polish to leave the gym in. Technical fabrics, considered cuts, designer pedigree.' },
  'short-dresses':     { title: 'Short Dresses',             body: 'The mini, the midi, and everything that earns a second look. Dresses for dinners that turn into nights, and for mornings that turn into something else entirely.' },
  'sleeveless-dresses':{ title: 'Sleeveless Dresses',        body: 'Bare-shoulder silhouettes for warm rooms and warmer evenings — a curated edit of slip dresses, columns, and shifts from the houses that do them best.' },

  // === Men — apparel ===
  'tshirts-men':       { title: 'Men’s T-Shirts',            body: 'The foundation of a modern wardrobe. Heavyweight Italian jerseys, archival logos, and the quietly perfect plain tees from the houses that obsess over them.' },
  'shirts-men':        { title: 'Men’s Shirts',              body: 'From hand-finished poplins to laundered linens — the shirts we’d hang in our own closet, organised from boardroom to beach club.' },
  'dress-shirts':      { title: 'Dress Shirts',              body: 'The architecture of formal dressing. Italian poplins, French cottons, and the precise collars that make a suit look like more than the sum of its parts.' },
  'sweaters-men':      { title: 'Men’s Sweaters',            body: 'Cashmere from Loro Piana mills, lambswool from Scottish weavers, and the rare cotton knits worth their weight. Layering, considered.' },
  'sweatshirts':       { title: 'Sweatshirts & Hoodies',     body: 'Elevated loopback cottons and brushed fleeces from the houses that brought luxury to streetwear — and never let go of either.' },
  'jackets-men':       { title: 'Men’s Jackets',             body: 'Bombers, blazers, biker silhouettes — the transitional layer that defines a wardrobe’s point of view. Edited tightly.' },
  'coats-men':         { title: 'Men’s Coats',               body: 'Topcoats, overcoats, and statement outerwear from the great tailoring houses. Built to outlast trend cycles by a comfortable margin.' },
  'denim-men':         { title: 'Men’s Denim',               body: 'Selvedge weights, Italian washes, Japanese cuts. Jeans worth breaking in — and worth keeping in rotation for the next decade.' },
  'skinny-jeans':      { title: 'Skinny Jeans',              body: 'The lean silhouette, done properly. Stretch denim with recovery, washes with restraint, and cuts that read modern without trying too hard.' },
  'slim-fit-jeans':    { title: 'Slim-Fit Jeans',            body: 'Not too tight, not too easy — the workhorse cut of a grown-up wardrobe. Premium denim in the washes that wear in beautifully.' },
  'suits':             { title: 'Suits',                     body: 'Tailoring with intention. Italian wools, deconstructed shoulders, and the houses that have spent a century learning how a jacket should sit.' },
  'casual-pants':      { title: 'Casual Pants',              body: 'Chinos, weekend trousers, and the soft-tailored bottoms that work with everything in your rotation. Quiet workhorses.' },
  'dress-pants':       { title: 'Dress Pants',               body: 'The trouser that finishes a look — pleated, flat-front, cropped, or full-length. From the Italian houses that treat the leg line as architecture.' },
  'athletic-pants':    { title: 'Athletic Pants',            body: 'Performance trousers cut with the polish to wear past the warm-up. Technical fabrics, designer hands.' },
  'joggers':           { title: 'Joggers',                   body: 'The off-duty staple, refined. Brushed cottons and tapered cuts from the houses that turned the jogger into a wardrobe essential.' },
  'sportswear':        { title: 'Sportswear',                body: 'Track silhouettes, performance jerseys, and the active layers that look as considered as the rest of the wardrobe.' },
  'bermuda-shorts':    { title: 'Bermuda Shorts',            body: 'The longer-cut warm-weather short — tailored, relaxed, and built for the kind of summer that ends with dinner outside.' },
  'tank-tops':         { title: 'Tank Tops',                 body: 'The base layer reconsidered — ribbed cottons, fine jerseys, and the cuts that work as outerwear when the season calls for it.' },
  'pattern-shirts':    { title: 'Pattern Shirts',            body: 'Prints, checks, and statement weaves — for the days you want the shirt to do the talking. Curated to read confident, never costume.' },
  'swimwear-men':      { title: 'Men’s Swimwear',            body: 'Quick-dry technical fabrics in cuts that move from pool to lunch without changing. Resort wardrobing, taken seriously.' },
  'underwear-men':     { title: 'Men’s Underwear',           body: 'The foundation layer. Italian cottons, modal blends, and the houses that have spent decades perfecting the fit no one else sees.' },

  // === Shoes ===
  'boots':             { title: 'Boots',                     body: 'From Chelsea silhouettes to combat soles — boots built on lasts that have lasted. Leathers that get better with mileage.' },
  'loafers':           { title: 'Loafers',                   body: 'The most versatile shoe in the wardrobe. Penny loafers, horsebit hardware, and tassels — handcrafted on the lasts the great houses guard closely.' },
  'slip-on-loafers':   { title: 'Slip-On Loafers',           body: 'The easy elegance of a shoe without laces. Soft constructions, unlined leathers, and the relaxed silhouettes that read as quiet confidence.' },
  'athletic-sneakers': { title: 'Athletic Sneakers',         body: 'Performance-minded sneakers from the designers who reimagined what a trainer could look like — and what it should be made of.' },
  'low-top-sneakers':  { title: 'Low-Top Sneakers',          body: 'The everyday luxury sneaker, edited to the silhouettes that hold up — Italian leathers, considered soles, designer-house provenance.' },

  // === Accessories ===
  'sunglasses':        { title: 'Sunglasses',                body: 'Italian acetates, hand-finished hardware, and the frames that have defined how a face is framed for the last fifty years.' },
  'eyewear':           { title: 'Eyewear',                   body: 'Optical and sun, from the houses that treat eyewear as a portrait. Precision frames, precise faces.' },
  'scarves':           { title: 'Scarves',                   body: 'Silk twills, cashmere weaves, and the printed squares that have been the finishing touch of a great look for a hundred years.' },
  'wallets':           { title: 'Wallets',                   body: 'Small leather goods from the houses that built their names on them — embossed calfskin, hand-stitched edges, hardware that ages with grace.' },
  'hats':              { title: 'Hats',                      body: 'Caps, fedoras, and the considered toppers from the houses that understand a hat is rarely about the weather.' },
  'regular-belts':     { title: 'Belts',                     body: 'Italian calfskin, signature hardware, and the finishing layer that holds a wardrobe together — quietly, properly.' },
};

const PALACE = 'The Palace of Roman edit.';

const wrap = (body) => `<p>${body}</p><p><em>${PALACE}</em></p>`;

async function shopify(path, init={}) {
  const url=`https://${SHOP}/admin/api/${API}${path}`;
  for(let a=0;a<5;a++){
    const res=await fetch(url,{...init,headers:{'X-Shopify-Access-Token':TOKEN,'Content-Type':'application/json',...(init.headers||{})}});
    if(res.status===429){await new Promise(r=>setTimeout(r,(parseFloat(res.headers.get('retry-after')||'2'))*1000));continue;}
    const t=await res.text(); let b; try{b=JSON.parse(t);}catch{b=t;}
    return {status:res.status,body:b};
  }
  throw new Error('retries');
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fetchAll(){
  const out=[]; let p='/smart_collections.json?limit=250&fields=id,handle,title,body_html';
  while(p){
    const r=await fetch(`https://${SHOP}/admin/api/${API}${p}`,{headers:{'X-Shopify-Access-Token':TOKEN}});
    const b=await r.json(); for(const c of b.smart_collections||[]) out.push(c);
    const link=r.headers.get('link')||''; const n=link.split(',').find(x=>x.includes('rel="next"'));
    if(n){const m=n.match(/<([^>]+)>/);const u=new URL(m[1]);p=u.pathname.replace(`/admin/api/${API}`,'')+u.search;}else p=null;
    await sleep(200);
  } return out;
}

const all = await fetchAll();
const byHandle = new Map(all.map(c=>[c.handle,c]));
const handles = Object.keys(COPY);
console.log(`Updating ${handles.length} collections (DRY=${DRY})`);

let ok=0,miss=0,fail=0;
for(let i=0;i<handles.length;i++){
  const h=handles[i]; const c=byHandle.get(h);
  if(!c){miss++; console.log(`[${i+1}/${handles.length}] ⌀ missing ${h}`); continue;}
  const {title,body}=COPY[h]; const body_html=wrap(body);
  if(DRY){console.log(`[${i+1}/${handles.length}] DRY ${h} → "${title}" (${body_html.length} chars)`); continue;}
  const {status,body:rb}=await shopify(`/smart_collections/${c.id}.json`,{method:'PUT',body:JSON.stringify({smart_collection:{id:c.id,title,body_html}})});
  if(status===200){ok++; console.log(`[${i+1}/${handles.length}] ✓ ${h}`);}
  else {fail++; console.log(`[${i+1}/${handles.length}] ✗ ${h} → ${status}`, typeof rb==='object'?JSON.stringify(rb.errors||rb):rb);}
  await sleep(400);
}
console.log(`\n=== Done. Updated:${ok} Missing:${miss} Failed:${fail} ===`);
