// Shared helper: validates that a `/api/public/*` route is being called by
// a trusted internal origin (pg_cron, internal hooks, admin scripts) — not
// an arbitrary visitor.
//
// Accepts EITHER:
//   1. `x-webhook-secret` (or `Authorization: Bearer …`) header matching
//      the runtime SYNC_WEBHOOK_SECRET. Use this for highest-trust callers.
//   2. `apikey` header matching the Supabase publishable/anon key. This is
//      the pattern documented for pg_cron + pg_net and is what every
//      schedule in `cron.job` currently sends.
//
// Returns null on success, or a Response (401/500) to short-circuit.
//
// Note on the anon key: it IS bundled in client JS, so it is not a true
// secret. We accept it here because:
//   - These routes are idempotent and bounded (capped batch sizes)
//   - They do not return PII / wholesale data to the caller
//   - The real cost ceiling is the external API (Gmail send quota, AI
//     gateway budget) which is already enforced server-side
//   - Operators can opt INTO stronger auth by setting SYNC_WEBHOOK_SECRET
//     and switching their cron schedules to send `x-webhook-secret`.

function timingSafeEqualStr(a: string, b: string): boolean {
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  const len = Math.max(ae.length, be.length);
  let diff = ae.length ^ be.length;
  for (let i = 0; i < len; i++) diff |= (ae[i] ?? 0) ^ (be[i] ?? 0);
  return diff === 0;
}

export function checkWebhookSecret(request: Request): Response | null {
  const sharedSecret = process.env.SYNC_WEBHOOK_SECRET;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!sharedSecret && !anonKey) {
    console.error("[webhook-secret] Neither SYNC_WEBHOOK_SECRET nor SUPABASE_PUBLISHABLE_KEY is set");
    return new Response("Server not configured", { status: 500 });
  }

  // 1. Strong shared-secret path. When SYNC_WEBHOOK_SECRET is configured,
  //    this is the ONLY accepted credential — we skip the anon-key fallback
  //    entirely so the publicly-bundled anon key can't be used to trigger
  //    cron emails or AI-cost endpoints.
  if (sharedSecret) {
    const provided =
      request.headers.get("x-webhook-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";
    if (provided && timingSafeEqualStr(provided, sharedSecret)) return null;
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Supabase anon-key path (legacy fallback for projects that haven't
  //    yet set SYNC_WEBHOOK_SECRET). Operators should configure the strong
  //    secret to disable this entirely.
  if (anonKey) {
    const apikey = request.headers.get("apikey") || "";
    if (apikey && timingSafeEqualStr(apikey, anonKey)) return null;
  }

  return new Response("Unauthorized", { status: 401 });
}

