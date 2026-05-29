// Server-only HMAC helper for quiz unlock tokens.
// Used to prove that the caller of getQuizUnlock / recordLookbookView is the
// same session that performed the original unlock — closing the email
// enumeration vector where any visitor could probe arbitrary addresses.
import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days, matches typical quiz UX

function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for quiz token signing");
  return s;
}

function sign(email: string, iat: number): string {
  return createHmac("sha256", getSecret())
    .update(`${email}|${iat}`)
    .digest("base64url");
}

export function issueQuizToken(email: string): { token: string; iat: number } {
  const iat = Date.now();
  return { token: sign(email, iat), iat };
}

export function verifyQuizToken(
  email: string,
  iat: number | undefined,
  token: string | undefined,
): boolean {
  if (!iat || !token) return false;
  if (!Number.isFinite(iat)) return false;
  if (Date.now() - iat > TTL_MS) return false;
  const expected = sign(email, iat);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
