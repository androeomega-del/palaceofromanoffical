// Shared Gmail send helper via the Lovable connector gateway.
// Sender: notify@palaceofromanofficial.com (the connected Gmail account).

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FROM = "Palace of Roman <notify@palaceofromanofficial.com>";

function b64url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sanitizeHeader(v: string): string {
  // Strip CR/LF to prevent RFC 2822 header injection.
  return v.replace(/[\r\n]+/g, " ").trim();
}

function buildRfc2822(to: string, subject: string, html: string, text: string): string {
  const safeTo = sanitizeHeader(to);
  const safeSubject = sanitizeHeader(subject);
  const boundary = `por_${Date.now().toString(36)}`;
  return [
    `From: ${FROM}`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");
}

export async function sendGmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<unknown> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAIL_API_KEY = process.env.GOOGLE_MAIL_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY is not configured");

  const raw = b64url(buildRfc2822(to, subject, html, text));
  const res = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail send failed [${res.status}]: ${body.slice(0, 500)}`);
  }
  return res.json();
}

export function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
