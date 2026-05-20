// Round-3 specific collections — polos, long sleeves, hoodies, and friends.
// Creates smart collections, deletes any with <MIN matches, writes boutique copy.
const SHOP='mwuwqi-vy.myshopify.com', API='2025-07', TOKEN=process.env.SHOPIFY_ACCESS_TOKEN;
const DRY=process.argv.includes('--dry'); const MIN=3;
if(!TOKEN){console.error('Missing SHOPIFY_ACCESS_TOKEN');process.exit(1);}

const tag=(c)=>[{column:'tag',relation:'equals',condition:c}];
const PALACE='The Palace of Roman edit.';
const wrap=(b)=>`<p>${b}</p><p><em>${PALACE}</em></p>`;

// handle, title, rule-tag, body
const C=[
  ['polo-shirts',        'Polo Shirts',          'Polo Shirts - T-Shirts - Clothing',  'The polo, properly considered. Piqué cottons, fine knits, and the houses that have spent decades perfecting the collar that bridges sportswear and tailoring.'],
  ['hoodies',            'Hoodies',              'Hoodies - Sweaters - Clothing',      'Brushed cottons, heavyweight loopbacks, and the kind of hoods that hold their shape. Off-duty luxury from the designers who taught the category how to behave.'],
  ['cardigans',          'Cardigans',            'Cardigans - Sweaters - Clothing',    'The layer that does the quiet work — fine-gauge knits, mother-of-pearl buttons, and the cardigans that read modern without leaning on nostalgia.'],
  ['long-sleeve-tees',   'Long Sleeve T-Shirts', 'Long Sleeve - T-Shirts - Clothing',  'The shoulder-season essential. Heavy jerseys, fine cottons, and the long-sleeve cuts that work alone or layered beneath everything else.'],
  ['turtlenecks',        'Turtlenecks',          'Turtlenecks - Sweaters - Clothing',  'The most architectural neckline in menswear and womenswear alike. Fine merinos, soft cashmeres, and the silhouettes that elevate every layer above them.'],
  ['blazers',            'Blazers',              'Blazers - Clothing',                 'Tailoring without the ceremony. Unstructured shoulders, soft canvases, and the blazers that move between boardroom and bar without changing their tone.'],
  ['blouses',            'Blouses',              'Blouses - Shirts - Clothing',        'Fluid silks, hand-finished cottons, and the blouses that anchor a wardrobe with quiet authority. From the houses that built their names on the cut.'],
  ['bombers',            'Bomber Jackets',       'Bombers - Jackets - Clothing',       'The flight jacket reimagined — technical nylons, supple leathers, and the silhouette that has refused to age for sixty years.'],
  ['parkas',             'Parkas',               'Parkas - Jackets - Clothing',        'Cold-weather outerwear engineered by the houses that take winter seriously. Down fills, technical shells, and the cuts that earn their place in a coat closet.'],
  ['trench-coats',       'Trench Coats',         'Trench Coats - Coats - Clothing',    'The most quoted silhouette in outerwear, edited to the houses that do it best. Gabardines, storm flaps, and the proportions that have aged into icon status.'],
  ['leather-jackets',    'Leather Jackets',      'Leather Jackets - Jackets - Clothing','Biker, café-racer, and clean-cut bombers in Italian leathers that pull a patina with every wear. Investment outerwear in the original sense.'],
  ['midi-dresses',       'Midi Dresses',         'Midi - Dresses - Clothing',          'The most-worn length in the modern wardrobe. Day-to-evening silhouettes from the houses that understand restraint is its own statement.'],
  ['long-sleeve-dresses','Long Sleeve Dresses',  'Longsleeve - Dresses - Clothing',    'Covered shoulders, fluid lines — dresses cut for cooler rooms, longer dinners, and the months on either side of summer.'],
  ['skirts',             'Skirts',               'Skirts - Clothing',                  'From sharp pencils to fluid silks — a focused edit of skirts that build a wardrobe rather than punctuate it.'],
  ['mini-skirts',        'Mini Skirts',          'Mini - Skirts - Clothing',           'The shortest cut, taken seriously. Tailored leathers, pleated wools, and the silhouettes from the houses that elevated the mini decades ago.'],
  ['midi-skirts',        'Midi Skirts',          'Midi - Skirts - Clothing',           'The forgiving, flattering length — pleated, A-line, and column cuts in fabrics that move with the wearer.'],
  ['jumpsuits',          'Jumpsuits',            'Jumpsuits - Jumpsuits - Clothing',   'One-piece dressing for the days you want the decision made — tailored, fluid, and resort-ready silhouettes from the houses that do them best.'],
];

async function shopify(path, init={}){
  const url=`https://${SHOP}/admin/api/${API}${path}`;
  for(let a=0;a<5;a++){
    const res=await fetch(url,{...init,headers:{'X-Shopify-Access-Token':TOKEN,'Content-Type':'application/json',...(init.headers||{})}});
    if(res.status===429){await new Promise(r=>setTimeout(r,(parseFloat(res.headers.get('retry-after')||'2'))*1000));continue;}
    const t=await res.text(); let b; try{b=JSON.parse(t);}catch{b=t;}
    return {status:res.status,body:b,headers:res.headers};
  }
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fetchHandles(ep,key){const h=new Map();let p=`/${ep}.json?limit=250&fields=id,handle`;
  while(p){const {status,body,headers}=await shopify(p);if(status!==200)break;
    for(const c of body[key]||[]) h.set(c.handle,c.id);
    const link=headers.get('link')||'';const n=link.split(',').find(x=>x.includes('rel="next"'));
    if(n){const m=n.match(/<([^>]+)>/);const u=new URL(m[1]);p=u.pathname.replace(`/admin/api/${API}`,'')+u.search;}else p=null;
    await sleep(200);
  } return h;}
const smart=await fetchHandles('smart_collections','smart_collections');
const custom=await fetchHandles('custom_collections','custom_collections');
const existing=new Set([...smart.keys(),...custom.keys()]);
console.log(`Existing: ${existing.size}`);

let created=0,reused=0,deleted=0,failed=0;
const kept=[];
for(let i=0;i<C.length;i++){
  const [handle,title,tagCond,body]=C[i];
  const body_html=wrap(body);
  if(DRY){console.log(`DRY ${handle}`);continue;}
  let id=smart.get(handle);
  if(id){
    // update existing
    const {status}=await shopify(`/smart_collections/${id}.json`,{method:'PUT',body:JSON.stringify({smart_collection:{id,title,body_html}})});
    if(status===200){reused++;kept.push(handle);console.log(`[${i+1}/${C.length}] ↻ updated ${handle}`);}
    else{failed++;console.log(`[${i+1}/${C.length}] ✗ update ${handle} ${status}`);}
    await sleep(400); continue;
  }
  if(existing.has(handle)){console.log(`[${i+1}/${C.length}] ⌀ handle taken (custom) ${handle}`); continue;}
  const payload={smart_collection:{handle,title,body_html,sort_order:'best-selling',published:true,disjunctive:false,rules:tag(tagCond)}};
  const {status,body:rb}=await shopify('/smart_collections.json',{method:'POST',body:JSON.stringify(payload)});
  if(status!==201){failed++;console.log(`[${i+1}/${C.length}] ✗ create ${handle} ${status}`,typeof rb==='object'?JSON.stringify(rb.errors||rb):rb);await sleep(400);continue;}
  id=rb.smart_collection.id; await sleep(600);
  const {status:cs,body:cb}=await shopify(`/products/count.json?collection_id=${id}`);
  const count=cs===200?(cb.count??0):0;
  if(count<MIN){await shopify(`/smart_collections/${id}.json`,{method:'DELETE'});deleted++;console.log(`[${i+1}/${C.length}] ⌫ ${handle} (${count})`);}
  else{created++;kept.push(handle);console.log(`[${i+1}/${C.length}] ✓ ${handle} (${count})`);}
  await sleep(400);
}
console.log(`\n=== Created:${created} Updated:${reused} Deleted<${MIN}:${deleted} Failed:${failed} ===`);
console.log('Kept handles:',JSON.stringify(kept));

// Publish kept ones to all publications (Lovable channel)
if(kept.length){
  console.log('\nPublishing to all publications via GraphQL...');
  const gql=async(q,v)=>{
    const r=await fetch(`https://${SHOP}/admin/api/${API}/graphql.json`,{method:'POST',headers:{'X-Shopify-Access-Token':TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query:q,variables:v})});
    return r.json();
  };
  const pubs=await gql(`{ publications(first:25){edges{node{id name}}} }`);
  const pubIds=pubs.data.publications.edges.map(e=>e.node.id);
  console.log('publications:',pubs.data.publications.edges.map(e=>e.node.name).join(', '));
  for(const h of kept){
    const cid=smart.get(h);
    let id=cid;
    if(!id){
      // newly created — fetch
      const sm2=await fetchHandles('smart_collections','smart_collections');
      id=sm2.get(h);
    }
    if(!id){console.log('no id for',h);continue;}
    const gid=`gid://shopify/Collection/${id}`;
    const res=await gql(`mutation($id:ID!,$inp:[PublicationInput!]!){publishablePublish(id:$id,input:$inp){userErrors{message}}}`,{id:gid,inp:pubIds.map(p=>({publicationId:p}))});
    const e=res.data?.publishablePublish?.userErrors||[];
    console.log(' pub',h,e.length?'ERR '+JSON.stringify(e):'✓');
    await sleep(300);
  }
}
