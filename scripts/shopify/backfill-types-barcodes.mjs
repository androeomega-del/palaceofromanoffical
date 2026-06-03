#!/usr/bin/env node
// Backfill product_type (from tags) and EAN-13 barcodes (where missing/invalid)
// for every product in Shopify, and live-stream progress to Supabase
// (table: public.backfill_status, row id="shopify-backfill") so the admin
// status page can render cursor / totals / ETA in real time.

import fs from "node:fs";

const API = "2025-07";
let DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
DOMAIN = DOMAIN.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
const CID = process.env.SHOPIFY_CLIENT_ID;
const CS = process.env.SHOPIFY_CLIENT_SECRET;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DOMAIN || !CID || !CS) {
  console.error("Missing SHOPIFY_STORE_DOMAIN / CLIENT_ID / CLIENT_SECRET");
  process.exit(1);
}
if (!SB_URL || !SB_KEY) {
  console.warn("[backfill] SUPABASE_URL/SERVICE_ROLE_KEY missing — status page will not update.");
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

const DEPTS = new Set(["Clothing", "Shoes", "Bags", "Accessories"]);
function deriveProductType(tags) {
  const arr = (tags || "").split(",").map((t) => t.trim());
  for (const t of arr) {
    const m = t.match(/^([^-]+)\s*-\s*([^-]+)\s*-\s*([^-]+)$/);
    if (m && DEPTS.has(m[3].trim())) return m[2].trim();
  }
  for (const t of arr) {
    const m = t.match(/^([^-]+)\s*-\s*([^-]+)$/);
    if (m && DEPTS.has(m[2].trim())) return m[1].trim();
  }
  for (const t of arr) if (DEPTS.has(t)) return t;
  return null;
}

function ean13From(seed) {
  let h = 0n;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 131n + BigInt(s.charCodeAt(i))) & 0xffffffffffffffffn;
  let nine = (h % 1000000000n).toString().padStart(9, "0");
  const base = "200" + nine;
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
  return /^\d{12,14}$/.test(s);
}

const COUNT_Q = `query { productsCount { count } }`;

const PAGE = `
  query Page($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          tags
          productType
          variants(first: 100) { edges { node { id barcode } } }
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
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
  process.stdout.write(line);
}

let state = {
  cursor: null,
  totalProducts: 0,
  totalSeen: 0,
  productsTypeUpdated: 0,
  variantsBarcoded: 0,
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
  // Throttle: at least 1.5s between pushes unless finished/error.
  const now = Date.now();
  if (!finished && status === "running" && now - lastPush < 1500) return;
  lastPush = now;
  const body = {
    id: "shopify-backfill",
    cursor: state.cursor,
    total_products: state.totalProducts,
    total_seen: state.totalSeen,
    products_type_updated: state.productsTypeUpdated,
    variants_barcoded: state.variantsBarcoded,
    errors: state.errors,
    last_error: state.lastError,
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
  } catch (e) {
    log(`status push failed: ${e?.message || e}`);
  }
}

// ---- Notifications (webhook + Gmail) -----------------------------------
const NOTIFY_WEBHOOK = process.env.BACKFILL_NOTIFY_WEBHOOK || "";
const NOTIFY_EMAIL = process.env.BACKFILL_NOTIFY_EMAIL || "";
const NOTIFY_FROM = process.env.BACKFILL_NOTIFY_FROM ||
  "Palace of Roman <notify@palaceofromanofficial.com>";
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY || "";
const GOOGLE_MAIL_API_KEY = process.env.GOOGLE_MAIL_API_KEY || "";
const ERROR_RATE_THRESHOLD = Number(process.env.BACKFILL_ERROR_RATE || "0.05"); // 5%
const ERROR_MIN_COUNT = Number(process.env.BACKFILL_ERROR_MIN || "20");
let errorAlertSent = false;

function b64url(s) {
  return Buffer.from(s, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendWebhook(event, payload) {
  if (!NOTIFY_WEBHOOK) return;
  try {
    const r = await fetch(NOTIFY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload }),
    });
    if (!r.ok) log(`webhook ${r.status}: ${(await r.text()).slice(0, 300)}`);
  } catch (e) { log(`webhook failed: ${e?.message || e}`); }
}

async function sendEmail(subject, text) {
  if (!NOTIFY_EMAIL || !LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) return;
  const msg = [
    `From: ${NOTIFY_FROM}`,
    `To: ${NOTIFY_EMAIL}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    text,
  ].join("\r\n");
  try {
    const r = await fetch(
      "https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: b64url(msg) }),
      },
    );
    if (!r.ok) log(`email ${r.status}: ${(await r.text()).slice(0, 300)}`);
    else log(`email sent: ${subject}`);
  } catch (e) { log(`email failed: ${e?.message || e}`); }
}

function summaryText() {
  return [
    `domain=${DOMAIN}`,
    `seen=${state.totalSeen}/${state.totalProducts}`,
    `productsTypeUpdated=${state.productsTypeUpdated}`,
    `variantsBarcoded=${state.variantsBarcoded}`,
    `errors=${state.errors}`,
    state.lastError ? `lastError=${state.lastError.slice(0, 500)}` : "",
  ].filter(Boolean).join("\n");
}

async function notify(event) {
  const payload = {
    domain: DOMAIN,
    totalSeen: state.totalSeen,
    totalProducts: state.totalProducts,
    productsTypeUpdated: state.productsTypeUpdated,
    variantsBarcoded: state.variantsBarcoded,
    errors: state.errors,
    lastError: state.lastError,
    timestamp: new Date().toISOString(),
  };
  const subjects = {
    done: "✅ Shopify backfill complete",
    error_spike: "⚠️ Shopify backfill error-rate spike",
    fatal: "❌ Shopify backfill FAILED",
  };
  await Promise.all([
    sendWebhook(event, payload),
    sendEmail(subjects[event] || `Backfill: ${event}`, summaryText()),
  ]);
}

async function maybeAlertErrorRate() {
  if (errorAlertSent) return;
  if (state.totalSeen < 50) return;
  if (state.errors < ERROR_MIN_COUNT) return;
  if (state.errors / Math.max(1, state.totalSeen) < ERROR_RATE_THRESHOLD) return;
  errorAlertSent = true;
  log(`error-rate spike: ${state.errors}/${state.totalSeen}`);
  await notify("error_spike");
}

async function main() {
  log(`Starting. domain=${DOMAIN} resumeCursor=${state.cursor ? "yes" : "no"}`);
  // Get total once, for ETA.
  try {
    const c = await gql(COUNT_Q, {});
    state.totalProducts = c?.productsCount?.count ?? state.totalProducts;
    log(`total products=${state.totalProducts}`);
  } catch (e) {
    log(`count fetch failed (ignored): ${e?.message || e}`);
  }
  await pushStatus("running", false);

  let hasNext = true;
  while (hasNext) {
    const data = await gql(PAGE, { cursor: state.cursor });
    const conn = data.products;
    for (const edge of conn.edges) {
      const p = edge.node;
      state.totalSeen++;
      const desired = deriveProductType(Array.isArray(p.tags) ? p.tags.join(",") : p.tags);
      if (desired && desired !== p.productType) {
        const u = await gql(UPDATE_PRODUCT_TYPE, { input: { id: p.id, productType: desired } });
        const errs = u.productUpdate?.userErrors ?? [];
        if (errs.length) { state.errors++; state.lastError = JSON.stringify(errs); log(`type err ${p.id}: ${state.lastError}`); }
        else state.productsTypeUpdated++;
      }
      const updates = [];
      for (const ve of p.variants.edges) {
        const v = ve.node;
        if (!isValidGTIN(v.barcode)) updates.push({ id: v.id, barcode: ean13From(v.id) });
      }
      if (updates.length) {
        for (let i = 0; i < updates.length; i += 100) {
          const chunk = updates.slice(i, i + 100);
          const u = await gql(UPDATE_VARIANTS, { productId: p.id, variants: chunk });
          const errs = u.productVariantsBulkUpdate?.userErrors ?? [];
          if (errs.length) { state.errors++; state.lastError = JSON.stringify(errs); log(`var err ${p.id}: ${state.lastError}`); }
          else state.variantsBarcoded += chunk.length;
        }
      }
      if (state.totalSeen % 10 === 0) {
        saveLocal();
        await pushStatus("running", false);
        await maybeAlertErrorRate();
      }
      if (state.totalSeen % 50 === 0) {
        log(`seen=${state.totalSeen}/${state.totalProducts} typeUpd=${state.productsTypeUpdated} varBarcoded=${state.variantsBarcoded} errors=${state.errors}`);
      }
    }
    hasNext = conn.pageInfo.hasNextPage;
    state.cursor = conn.pageInfo.endCursor;
    saveLocal();
    await pushStatus("running", false);
  }
  log(`DONE. seen=${state.totalSeen} typeUpd=${state.productsTypeUpdated} varBarcoded=${state.variantsBarcoded} errors=${state.errors}`);
  await pushStatus("done", true);
  await notify("done");
}

main().catch(async (e) => {
  const msg = e?.stack || e?.message || String(e);
  state.lastError = msg.slice(0, 2000);
  log("FATAL: " + msg);
  await pushStatus("error", true);
  await notify("fatal");
  process.exit(1);
});
