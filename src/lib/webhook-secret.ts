// Shared helper: validates the SYNC_WEBHOOK_SECRET shared-secret header
// used by internal cron/hook callers.

export function checkWebhookSecret(request: Request): Response | null {
  const expected = process.env.SYNC_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[webhook-secret] SYNC_WEBHOOK_SECRET not configured");
    return new Response("Server not configured", { status: 500 });
  }
  const provided =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  const okLen = a.length === b.length;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  if (!okLen || diff !== 0) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
