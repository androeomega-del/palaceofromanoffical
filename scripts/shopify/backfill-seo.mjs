#!/usr/bin/env node
// Backfill SEO title + meta description on every Shopify product and
// collection. Mirrors the on-site SEO conventions:
//   title:       "{Product Title} — {Vendor} | Palace of Roman"  (≤ 60)
//   description: "Shop authentic {title} by {vendor}. {type}. 100% authentic,
//                 curated by Palace of Roman. Worldwide shipping."  (≤ 158)
//
// Skips items whose seo.title/description are already non-trivially set
// (so manual overrides win). Streams progress to public.backfill_status
// with id="shopify-seo-backfill" so the admin status page can render it.

import fs from "node:fs";

const API = "2025-07";
let DOMAIN = (process.env.SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
const CID = process.env.SHOPIFY_CLIENT_ID;
const CS = process.env.SHOPIFY_CLIENT_SECRET;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DOMAIN || !CID || !CS) {
  console.error("Missing SHOPIFY_STORE_DOMAIN / CLIENT_ID / CLIENT_SECRET");
  process.exit(1);
}

const SUFFIX = " | Palace of Roman";
const MAX_TITLE = 60;
const MAX_DESC = 158;

let TOKEN = null, TOKEN_EXP = 0;
async function getToken() {
  if (TOKEN && Date.now() < TOKEN_EXP - 60_000) return TOKEN;
  const r = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CID, client_secret: CS, grant_type: "client_credentials" }),
  });
  if (!r.ok) throw new Error(`token ${r.status}: ${await r.text()}`);
  const j = await r.json();
  TOKEN = j.access_token;
  TOKEN_EXP = Date.now() + (j.expires_in ?? 3600) * 1000;
  return TOKEN;
}

async function gql(query, variables) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const t = await getToken();
    const r = await fetch(`https://${DOMAIN}/admin/api/${API}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": t },
      body: JSON.stringify({ query, variables }),
    });
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
      continue;
    }
    const j = await r.json();
    if (j.errors) {
      const msg = JSON.stringify(j.errors);
      if (/throttled/i.test(msg)) {
        await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
        continue;
      }
      throw new Error("gql: " + msg);
    }
    return j.data;
  }
  throw new Error("gql: retries exhausted");
}

function truncate(s, max) {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim() + "…";
}

function stripHtml(s) {
  return (s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildProductSeo({ title, vendor, productType, descriptionHtml }) {
  const t = (title || "").trim();
  const v = (vendor || "").trim();
  const pt = (productType || "").trim();
  // Title — keep brand visible, leave room for suffix.
  let head = v && !t.toLowerCase().startsWith(v.toLowerCase()) ? `${t} — ${v}` : t;
  const titleBudget = MAX_TITLE - SUFFIX.length;
  const seoTitle = truncate(head, titleBudget) + SUFFIX;
  // Description — lead with the product, then category, then trust.
  const body = stripHtml(descriptionHtml).slice(0, 220);
  const lead = body
    ? body
    : `Shop authentic ${t}${v ? ` by ${v}` : ""}${pt ? ` — ${pt.toLowerCase()}` : ""}.`;
  const tail = " 100% authentic, curated by Palace of Roman. Worldwide shipping.";
  const seoDesc = truncate(lead + (lead.endsWith(".") ? "" : ".") + tail, MAX_DESC);
  return { title: seoTitle, description: seoDesc };
}

function buildCollectionSeo({ title, descriptionHtml }) {
  const t = (title || "").trim();
  const titleBudget = MAX_TITLE - SUFFIX.length;
  const seoTitle = truncate(t, titleBudget) + SUFFIX;
  const body = stripHtml(descriptionHtml).slice(0, 220);
  const lead = body || `Shop the ${t} edit — designer pieces curated by Palace of Roman.`;
  const tail = " 100% authentic. Worldwide shipping.";
  const seoDesc = truncate(lead + (lead.endsWith(".") ? "" : ".") + tail, MAX_DESC);
  return { title: seoTitle, description: seoDesc };
}

const COUNT_Q = `query { productsCount { count } collectionsCount { count } }`;

const PRODUCTS_PAGE = `
  query Page($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges { node {
        id title vendor productType descriptionHtml
        seo { title description }
      } }
    }
  }
`;

const COLLECTIONS_PAGE = `
  query Page($cursor: String) {
    collections(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges { node {
        id title descriptionHtml
        seo { title description }
      } }
    }
  }
`;

const UPDATE_PRODUCT = `
  mutation($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_COLLECTION = `
  mutation($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id }
      userErrors { field message }
    }
  }
`;

const STATE_FILE = "/tmp/seo-backfill-state.json";
const LOG_FILE = "/tmp/seo-backfill.log";
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
  process.stdout.write(line);
}

let state = {
  phase: "products",
  cursor: null,
  totalProducts: 0,
  totalCollections: 0,
  productsSeen: 0,
  productsUpdated: 0,
  productsSkipped: 0,
  collectionsSeen: 0,
  collectionsUpdated: 0,
  collectionsSkipped: 0,
  errors: 0,
  lastError: null,
  startedAt: new Date().toISOString(),
};
if (fs.existsSync(STATE_FILE)) {
  try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) }; } catch {}
}
function saveLocal() { try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch {} }

let lastPush = 0;
async function pushStatus(status, finished = false) {
  if (!SB_URL || !SB_KEY) return;
  const now = Date.now();
  if (!finished && status === "running" && now - lastPush < 1500) return;
  lastPush = now;
  const body = {
    id: "shopify-seo-backfill",
    cursor: state.cursor,
    total_products: state.totalProducts + state.totalCollections,
    total_seen: state.productsSeen + state.collectionsSeen,
    products_type_updated: state.productsUpdated + state.collectionsUpdated,
    variants_barcoded: state.productsSkipped + state.collectionsSkipped,
    errors: state.errors,
    last_error: state.lastError ? `[${state.phase}] ${state.lastError}` : null,
    status,
    started_at: state.startedAt,
    updated_at: new Date().toISOString(),
    finished_at: finished ? new Date().toISOString() : null,
  };
  try {
    const r = await fetch(`${SB_URL}/rest/v1/backfill_status?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) log(`status push ${r.status}: ${await r.text()}`);
  } catch (e) { log(`status push failed: ${e?.message || e}`); }
}

function hasGoodSeo(seo) {
  return !!(seo?.title && seo.title.trim().length >= 15
    && seo?.description && seo.description.trim().length >= 50);
}

async function runProducts() {
  log(`PRODUCTS phase starting (cursor=${state.cursor ?? "<begin>"})`);
  while (true) {
    let data;
    try {
      data = await gql(PRODUCTS_PAGE, { cursor: state.cursor });
    } catch (e) {
      state.errors++; state.lastError = e?.message || String(e);
      log(`page error: ${state.lastError}`);
      saveLocal(); await pushStatus("running");
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    const page = data.products;
    for (const { node } of page.edges) {
      state.productsSeen++;
      if (hasGoodSeo(node.seo)) {
        state.productsSkipped++;
        continue;
      }
      const seo = buildProductSeo(node);
      try {
        const res = await gql(UPDATE_PRODUCT, {
          input: { id: node.id, seo: { title: seo.title, description: seo.description } },
        });
        const errs = res.productUpdate?.userErrors || [];
        if (errs.length) {
          state.errors++;
          state.lastError = `product ${node.id}: ${errs.map((e) => e.message).join("; ")}`;
          log(state.lastError);
        } else {
          state.productsUpdated++;
        }
      } catch (e) {
        state.errors++;
        state.lastError = `product ${node.id}: ${e?.message || e}`;
        log(state.lastError);
      }
      if (state.productsSeen % 25 === 0) {
        saveLocal();
        await pushStatus("running");
      }
    }
    saveLocal(); await pushStatus("running");
    if (!page.pageInfo.hasNextPage) break;
    state.cursor = page.pageInfo.endCursor;
  }
  log(`PRODUCTS phase complete. updated=${state.productsUpdated} skipped=${state.productsSkipped} errors=${state.errors}`);
  state.phase = "collections";
  state.cursor = null;
  saveLocal();
}

async function runCollections() {
  log(`COLLECTIONS phase starting (cursor=${state.cursor ?? "<begin>"})`);
  while (true) {
    let data;
    try {
      data = await gql(COLLECTIONS_PAGE, { cursor: state.cursor });
    } catch (e) {
      state.errors++; state.lastError = e?.message || String(e);
      log(`page error: ${state.lastError}`);
      saveLocal(); await pushStatus("running");
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    const page = data.collections;
    for (const { node } of page.edges) {
      state.collectionsSeen++;
      if (hasGoodSeo(node.seo)) {
        state.collectionsSkipped++;
        continue;
      }
      const seo = buildCollectionSeo(node);
      try {
        const res = await gql(UPDATE_COLLECTION, {
          input: { id: node.id, seo: { title: seo.title, description: seo.description } },
        });
        const errs = res.collectionUpdate?.userErrors || [];
        if (errs.length) {
          state.errors++;
          state.lastError = `collection ${node.id}: ${errs.map((e) => e.message).join("; ")}`;
          log(state.lastError);
        } else {
          state.collectionsUpdated++;
        }
      } catch (e) {
        state.errors++;
        state.lastError = `collection ${node.id}: ${e?.message || e}`;
        log(state.lastError);
      }
      if (state.collectionsSeen % 25 === 0) {
        saveLocal();
        await pushStatus("running");
      }
    }
    saveLocal(); await pushStatus("running");
    if (!page.pageInfo.hasNextPage) break;
    state.cursor = page.pageInfo.endCursor;
  }
  log(`COLLECTIONS phase complete. updated=${state.collectionsUpdated} skipped=${state.collectionsSkipped} errors=${state.errors}`);
}

(async () => {
  try {
    const counts = await gql(COUNT_Q, {});
    state.totalProducts = counts.productsCount?.count ?? 0;
    state.totalCollections = counts.collectionsCount?.count ?? 0;
    log(`totals: ${state.totalProducts} products, ${state.totalCollections} collections`);
    saveLocal(); await pushStatus("running");

    if (state.phase === "products") await runProducts();
    if (state.phase === "collections") await runCollections();

    saveLocal(); await pushStatus("done", true);
    log(`DONE. products updated=${state.productsUpdated}/${state.totalProducts}, collections updated=${state.collectionsUpdated}/${state.totalCollections}, errors=${state.errors}`);
    process.exit(0);
  } catch (e) {
    state.lastError = e?.message || String(e);
    log(`FATAL: ${state.lastError}`);
    saveLocal(); await pushStatus("error", true);
    process.exit(1);
  }
})();
