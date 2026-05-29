/**
 * Single source of truth for the Style Quiz subscriber identity stored on
 * the client. Centralises:
 *   - storage keys (so the homepage preview and the quiz page can't drift)
 *   - email normalisation (trim + lowercase + strip internal whitespace)
 *   - validation (regex matches the DB CHECK in newsletter_subscribers)
 *   - read/write helpers that auto-heal corrupted or stale values
 *
 * Server functions ALSO re-normalise (`email.trim().toLowerCase()`) before
 * touching `quiz_unlocks`, so the client and server agree on the canonical
 * form regardless of what was originally typed at the gate.
 */

import type { QuizAnswers } from "./quiz-unlock.functions";

export const QUIZ_UNLOCK_KEY = "por_quiz_unlocked_v1";
export const QUIZ_EMAIL_KEY = "por_quiz_email_v1";
export const QUIZ_ANSWERS_KEY = "por_quiz_answers_v1";
export const QUIZ_SESSION_KEY = "por_quiz_session_v1";
export const QUIZ_TOKEN_KEY = "por_quiz_token_v1";


const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Canonicalise an email the same way the server does before any DB write:
 * strip surrounding whitespace, collapse any internal whitespace a paste
 * may have introduced, and lowercase. Returns null when the value can't be
 * a valid address so callers don't accidentally persist garbage.
 */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "").toLowerCase();
  if (cleaned.length < 5 || cleaned.length > 320) return null;
  if (!EMAIL_RE.test(cleaned)) return null;
  return cleaned;
}

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read the saved quiz email. Self-heals: if the stored value is corrupted
 * or no longer a valid email, the bad value is cleared so we don't keep
 * sending lookup requests for an address the server will always reject.
 */
export function getStoredQuizEmail(): string | null {
  const ls = safeLocalStorage();
  if (!ls) return null;
  const raw = ls.getItem(QUIZ_EMAIL_KEY);
  const normalized = normalizeEmail(raw);
  if (raw && !normalized) {
    try {
      ls.removeItem(QUIZ_EMAIL_KEY);
      ls.removeItem(QUIZ_UNLOCK_KEY);
    } catch {}
  }
  return normalized;
}

/**
 * Persist the canonical email + unlock flag together. Always normalises
 * first so the stored value matches what the server keyed the unlock by.
 */
export function setStoredQuizUnlock(email: string, answers: QuizAnswers) {
  const ls = safeLocalStorage();
  if (!ls) return;
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  try {
    ls.setItem(QUIZ_UNLOCK_KEY, "1");
    ls.setItem(QUIZ_EMAIL_KEY, normalized);
    ls.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(answers));
  } catch {}
}

export function getStoredQuizAnswers(): QuizAnswers | null {
  const ls = safeLocalStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(QUIZ_ANSWERS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuizAnswers;
  } catch {
    return null;
  }
}

export function clearStoredQuizUnlock() {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(QUIZ_UNLOCK_KEY);
  } catch {}
}
