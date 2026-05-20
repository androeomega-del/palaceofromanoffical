// Second batch — uses real BrandsGateway hierarchical tag names (e.g. "Sneakers - Shoes").
const SHOP='mwuwqi-vy.myshopify.com', API='2025-07', TOKEN=process.env.SHOPIFY_ACCESS_TOKEN;
const DRY=process.argv.includes('--dry'); const MIN=3;
if(!TOKEN){console.error('Missing SHOPIFY_ACCESS_TOKEN');process.exit(1);}

async function shopify(path, init={}) {
  const url=`https://${SHOP}/admin/api/${API}${path}`;
  for(let a=0;a<5;a++){
    const res=await fetch(url,{...init,headers:{'X-Shopify-Access-Token':TOKEN,'Content-Type':'application/json',...(init.headers||{})}});
    if(res.status===429){await new Promise(r=>setTimeout(r,(parseFloat(res.headers.get('retry-after')||'2'))*1000));continue;}
    const t=await res.text(); let b; try{b=JSON.parse(t);}catch{b=t;}
    return {status:res.status,body:b,headers:res.headers};
  }
  throw new Error('retries');
}
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const tag=(c)=>[{column:'tag',relation:'equals',condition:c}];
const gtag=(g,c)=>[{column:'tag',relation:'equals',condition:g},{column:'tag',relation:'equals',condition:c}];

const C=[];
const add=(handle,title,rules)=>C.push({handle,title,body_html:'',sort_order:'best-selling',published:true,disjunctive:false,rules});

// === Women — gendered apparel ===
add('jackets-women',      'Jackets — Women',       gtag('Women','Jackets - Clothing'));
add('coats-women',        'Coats — Women',         gtag('Women','Coats - Coats - Clothing'));
add('knitwear-women',     'Knitwear — Women',      gtag('Women','Sweaters - Clothing'));
add('denim-women',        'Denim — Women',         gtag('Women','Jeans Denim - Clothing'));
add('shirts-women',       'Shirts — Women',        gtag('Women','Shirts - Clothing'));
add('tshirts-women',      'T-Shirts — Women',      gtag('Women','T-Shirts - Clothing'));
add('lingerie',           'Lingerie & Underwear — Women', gtag('Women','Underwear - Clothing'));
add('swimwear-women',     'Swimwear — Women',      gtag('Women','Swimwear - Clothing'));
add('shorts-women',       'Shorts — Women',        gtag('Women','Shorts - Clothing'));
add('sportswear-women',   'Sportswear — Women',    gtag('Women','Sportswear - Clothing'));
add('short-dresses',      'Short Dresses',         tag('Short - Dresses - Clothing'));
add('sleeveless-dresses', 'Sleeveless Dresses',    tag('Sleeveless - Dresses - Clothing'));

// === Men — gendered apparel ===
add('tshirts-men',        'T-Shirts — Men',        gtag('Men','T-Shirts - Clothing'));
add('polo-shirts',        'Polo Shirts',           tag('Polo Shirts - T-Shirts - Clothing'));
add('shirts-men',         'Shirts — Men',          gtag('Men','Shirts - Clothing'));
add('dress-shirts',       'Dress Shirts',          tag('Dress Shirts - Shirts - Clothing'));
add('sweaters-men',       'Sweaters — Men',        gtag('Men','Sweaters - Clothing'));
add('sweatshirts',        'Sweatshirts & Hoodies', tag('Sweatshirts - Sweaters - Clothing'));
add('cardigans',          'Cardigans',             tag('Cardigans - Sweaters - Clothing'));
add('jackets-men',        'Jackets — Men',         gtag('Men','Jackets - Clothing'));
add('coats-men',          'Coats — Men',           gtag('Men','Coats - Coats - Clothing'));
add('denim-men',          'Denim — Men',           gtag('Men','Jeans Denim - Clothing'));
add('skinny-jeans',       'Skinny Jeans',          tag('Skinny Jeans - Jeans Denim - Clothing'));
add('slim-fit-jeans',     'Slim Fit Jeans',        tag('Slim Fit Jeans - Jeans Denim - Clothing'));
add('suits',              'Suits',                 tag('Suits - Clothing'));
add('casual-pants',       'Casual Pants',          tag('Casual Pants - Pants - Clothing'));
add('dress-pants',        'Dress Pants',           tag('Dress Pants - Pants - Clothing'));
add('athletic-pants',     'Athletic Pants',        tag('Athletic Pants - Pants - Clothing'));
add('joggers',            'Joggers',               tag('Joggers (workout pants) - Sportswear - Clothing'));
add('sportswear',         'Sportswear',            tag('Sportswear - Clothing'));
add('bermuda-shorts',     'Bermuda Shorts',        tag('Bermuda - Shorts - Clothing'));
add('tank-tops',          'Tank Tops',             tag('Tank Tops - T-Shirts - Clothing'));
add('pattern-shirts',     'Pattern Shirts',        tag('Pattern - Shirts - Clothing'));
add('swimwear-men',       'Swimwear — Men',        gtag('Men','Swimwear - Clothing'));
add('underwear-men',      'Underwear — Men',       gtag('Men','Underwear - Clothing'));

// === Shoes — specific (BG taxonomy) ===
add('boots',              'Boots',                 tag('Boots - Shoes'));
add('loafers',            'Loafers',               tag('Loafers - Shoes'));
add('slip-on-loafers',    'Slip-On Loafers',       tag('Slip-On Loafers - Loafers - Shoes'));
add('athletic-sneakers',  'Athletic Sneakers',     tag('Athletic - Sneakers - Shoes'));
add('low-top-sneakers',   'Low-Top Sneakers',      tag('Low Tops - Sneakers - Shoes'));

// === Accessories — BG taxonomy ===
add('sunglasses',         'Sunglasses',            tag('Sunglasses - Glasses and Sunglasses - Accessories'));
add('eyewear',            'Eyewear',               tag('Glasses and Sunglasses - Accessories'));
add('scarves',            'Scarves',               tag('Scarves - Accessories'));
add('wallets',            'Wallets',               tag('Wallets - Accessories'));
add('hats',               'Hats',                  tag('Hats - Accessories'));
add('regular-belts',      'Regular Belts',         tag('Regular Belts - Belts - Accessories'));

console.log(`Defined ${C.length} collections.`);
if(DRY){console.log('DRY'); for(const c of C) console.log(`  ${c.handle} ← ${JSON.stringify(c.rules)}`); process.exit(0);}

async function fetchHandles(endpoint, key){
  const h=new Set(); let p=`/${endpoint}.json?limit=250&fields=handle,id`;
  while(p){const {status,body,headers}=await shopify(p); if(status!==200)break;
    for(const c of body[key]||[]) h.add(c.handle);
    const link=headers.get('link')||''; const n=link.split(',').find(x=>x.includes('rel="next"'));
    if(n){const m=n.match(/<([^>]+)>/);if(m){const u=new URL(m[1]);p=u.pathname.replace(`/admin/api/${API}`,'')+u.search;}else p=null;}else p=null;
    await sleep(250);
  } return h;
}
const existing=new Set([...await fetchHandles('smart_collections','smart_collections'), ...await fetchHandles('custom_collections','custom_collections')]);
console.log(`Existing handles: ${existing.size}`);

let created=0,skippedExist=0,deletedEmpty=0,failed=0;
const kept=[],removed=[],failures=[];

for(let i=0;i<C.length;i++){
  const c=C[i];
  if(existing.has(c.handle)){skippedExist++; console.log(`[${i+1}/${C.length}] ↻ skip ${c.handle}`); continue;}
  const {status,body}=await shopify('/smart_collections.json',{method:'POST',body:JSON.stringify({smart_collection:c})});
  if(status!==201){failed++; const r=typeof body==='object'?JSON.stringify(body.errors||body):body; failures.push({h:c.handle,status,r}); console.log(`[${i+1}/${C.length}] ✗ ${c.handle} → ${status} ${r}`); await sleep(500); continue;}
  const id=body.smart_collection.id; await sleep(600);
  const {status:cs,body:cb}=await shopify(`/products/count.json?collection_id=${id}`);
  const count=cs===200?(cb.count??0):0;
  if(count<MIN){await shopify(`/smart_collections/${id}.json`,{method:'DELETE'}); deletedEmpty++; removed.push({h:c.handle,count}); console.log(`[${i+1}/${C.length}] ⌫ ${c.handle} (${count})`);}
  else{created++; kept.push({h:c.handle,count}); console.log(`[${i+1}/${C.length}] ✓ ${c.handle} (${count})`);}
  await sleep(500);
}
console.log('\n=== SUMMARY ===');
console.log(`Kept: ${created} | Skipped existed: ${skippedExist} | Deleted <${MIN}: ${deletedEmpty} | Failed: ${failed}`);
if(kept.length){console.log('\nKept:'); for(const k of kept) console.log(` ✓ ${k.h} (${k.count})`);}
if(removed.length){console.log('\nDeleted:'); for(const r of removed) console.log(` - ${r.h} (${r.count})`);}
if(failures.length){console.log('\nFailures:'); for(const f of failures) console.log(' ✗',f.h,'→',f.status,f.r);}
