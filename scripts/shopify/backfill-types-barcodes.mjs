#!/usr/bin/env node
// Backfill product_type (from tags) and EAN-13 barcodes (where missing/invalid)
// for every product in Shopify, using the client-credentials Admin token.
//
// - Skips variants whose barcode is already a 12-digit UPC or 13-digit EAN.
// - Generated EANs use prefix 200 (in-store/internal range) so they are
//   syntactically valid for Amazon's GTIN field but are NOT GS1-registered.
//   You will still need GS1 GTIN exemption or real GS1 codes for Amazon.
// - Idempotent: re-running only fills gaps.

import fs from "node:fs";

const API = "2025-07";
let DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
DOMAIN = DOMAIN.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
const CID = process.env.SHOPIFY_CLIENT_ID;
const CS = process.env.SHOPIFY_CLIENT_SECRET;
if (!DOMAIN || !CID || !CS) {
  console.error("Missing SHOPIFY_STORE_DOMAIN / CLIENT_ID / CLIENT_SECRET");
  process.exit(1);
}

let TOKEN = null;
let TOKEN_EXP = 0;
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

// --- category derivation ---
const DEPTS = new Set(["Clothing", "Shoes", "Bags", "Accessories"]);
function deriveProductType(tags) {
  // tags is a comma-separated string; look for "X - Y - <Dept>" pattern, return Y.
  const arr = (tags || "").split(",").map((t) => t.trim());
  for (const t of arr) {
    const m = t.match(/^([^-]+)\s*-\s*([^-]+)\s*-\s*([^-]+)$/);
    if (m && DEPTS.has(m[3].trim())) return m[2].trim();
  }
  // fallback: "X - <Dept>" -> X
  for (const t of arr) {
    const m = t.match(/^([^-]+)\s*-\s*([^-]+)$/);
    if (m && DEPTS.has(m[2].trim())) return m[1].trim();
  }
  // fallback: bare dept
  for (const t of arr) if (DEPTS.has(t)) return t;
  return null;
}

// --- EAN-13 generator (deterministic per variant id) ---
function ean13From(seed) {
  // 12-digit base starting with "200" (internal use prefix), then 9 digits
  // derived from a simple hash of the seed, plus mod-10 check digit.
  let h = 0n;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 131n + BigInt(s.charCodeAt(i))) & 0xffffffffffffffffn;
  let nine = (h % 1000000000n).toString().padStart(9, "0");
  const base = "200" + nine; // 12 digits
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = base.charCodeAt(i) - 48;
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return base + String(check);
}

function isValidGTIN(b) {
  if (!b) return false;
  const s = String(b).trim();
  if (!/^\d{12,14}$/.test(s)) return false;
  // accept any 12/13/14 numeric as already-GTIN-shaped
  return true;
}

// --- paginate products ---
const PAGE = `
  query Page($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          tags
          productType
          variants(first: 100) {
            edges { node { id barcode } }
          }
        }
      }
    }
  }
`;

const UPDATE_PRODUCT_TYPE = `
  mutation($input: ProductInput!) {
    productUpdate(input: $input) { product { id } userErrors { field message } }
  }
`;

const UPDATE_VARIANTS = `
  mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors { field message }
    }
  }
`;

const STATE_FILE = "/tmp/backfill-state.json";
const LOG_FILE = "/tmp/backfill-progress.log";
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  process.stdout.write(line);
}

let state = { cursor: null, totalSeen: 0, productsTypeUpdated: 0, variantsBarcoded: 0, errors: 0 };
if (fs.existsSync(STATE_FILE)) {
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch {}
}
function saveState() { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

async function main() {
  log(`Starting. domain=${DOMAIN} resumeCursor=${state.cursor ? "yes" : "no"}`);
  let hasNext = true;
  while (hasNext) {
    const data = await gql(PAGE, { cursor: state.cursor });
    const conn = data.products;
    for (const edge of conn.edges) {
      const p = edge.node;
      state.totalSeen++;
      // product_type
      const desired = deriveProductType(p.tags?.join?.(",") ?? (Array.isArray(p.tags) ? p.tags.join(",") : p.tags));
      if (desired && desired !== p.productType) {
        const u = await gql(UPDATE_PRODUCT_TYPE, { input: { id: p.id, productType: desired } });
        const errs = u.productUpdate?.userErrors ?? [];
        if (errs.length) { state.errors++; log(`type err ${p.id}: ${JSON.stringify(errs)}`); }
        else state.productsTypeUpdated++;
      }
      // variants barcodes
      const updates = [];
      for (const ve of p.variants.edges) {
        const v = ve.node;
        if (!isValidGTIN(v.barcode)) {
          updates.push({ id: v.id, barcode: ean13From(v.id) });
        }
      }
      if (updates.length) {
        // bulk in chunks of 100
        for (let i = 0; i < updates.length; i += 100) {
          const chunk = updates.slice(i, i + 100);
          const u = await gql(UPDATE_VARIANTS, { productId: p.id, variants: chunk });
          const errs = u.productVariantsBulkUpdate?.userErrors ?? [];
          if (errs.length) { state.errors++; log(`var err ${p.id}: ${JSON.stringify(errs)}`); }
          else state.variantsBarcoded += chunk.length;
        }
      }
      if (state.totalSeen % 25 === 0) {
        log(`seen=${state.totalSeen} typeUpd=${state.productsTypeUpdated} varBarcoded=${state.variantsBarcoded} errors=${state.errors}`);
        saveState();
      }
    }
    hasNext = conn.pageInfo.hasNextPage;
    state.cursor = conn.pageInfo.endCursor;
    saveState();
  }
  log(`DONE. seen=${state.totalSeen} typeUpd=${state.productsTypeUpdated} varBarcoded=${state.variantsBarcoded} errors=${state.errors}`);
}

main().catch((e) => { log("FATAL: " + (e?.stack || e?.message || String(e))); process.exit(1); });
