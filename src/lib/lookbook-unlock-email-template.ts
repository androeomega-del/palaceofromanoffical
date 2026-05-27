// Confirmation email sent after a subscriber unlocks the Style Quiz lookbook.
// Matches editorial Palace of Roman aesthetic and lists curated shop links
// derived from the visitor's saved answers.

import type { QuizAnswers } from "./quiz-unlock.functions";

const SITE = "https://palaceofromanofficial.com";

type Rec = { label: string; href: string; caption: string };

function shopUrl(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return `${SITE}/shop${s ? `?${s}` : ""}`;
}

function buildRecommendations(answers: QuizAnswers): Rec[] {
  const g = answers.gender ?? "Women";
  const recs: Rec[] = [];

  // 1) Primary edit — all facets applied
  recs.push({
    label: "Shop Your Edit",
    href: shopUrl({
      gender: g,
      collection: answers.collection,
      q: answers.q,
      min: answers.min,
      max: answers.max,
    }),
    caption: `Your full ${g} edit, filters pre-applied.`,
  });

  // 2) Collection or mood-driven cut
  if (answers.collection) {
    recs.push({
      label: `Browse ${answers.collection}`,
      href: shopUrl({ gender: g, collection: answers.collection }),
      caption: `Hand-picked ${answers.collection.toLowerCase()} for ${g.toLowerCase()}.`,
    });
  } else if (answers.q) {
    recs.push({
      label: "Pieces matching your mood",
      href: shopUrl({ gender: g, q: answers.q }),
      caption: "A tighter cut, tuned to the aesthetic you chose.",
    });
  }

  // 3) Gender-wide entry point
  recs.push({
    label: `The ${g} Atelier`,
    href: shopUrl({ gender: g }),
    caption: "Explore the wider collection at your own pace.",
  });

  return recs.slice(0, 3);
}

export function renderLookbookUnlockEmail(answers: QuizAnswers): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Your Palace of Roman edit is unlocked";
  const recs = buildRecommendations(answers);

  const recsHtml = recs
    .map(
      (r) => `
        <tr><td style="padding:0 0 18px;">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;line-height:1.3;color:#1a1a1a;padding-bottom:4px;">${r.label}</div>
          <div style="font-family:Karla,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#5a5040;padding-bottom:10px;">${r.caption}</div>
          <a href="${r.href}" style="display:inline-block;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;border-bottom:1px solid #1a1a1a;padding-bottom:2px;">Open in shop</a>
        </td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:56px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:40px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;line-height:1.2;color:#1a1a1a;padding-bottom:20px;">Your edit is unlocked.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3a3328;padding-bottom:28px;">
          Thank you for sharing your style. We've saved your answers and curated a small selection from the atelier to begin with &mdash; pick up where you left off, any time.
        </td></tr>
        <tr><td align="center" style="padding:0 0 32px;">
          <a href="${SITE}/style-quiz" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Open the lookbook</a>
        </td></tr>
        <tr><td style="border-top:1px solid #ece3d3;padding-top:28px;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6a55;padding-bottom:18px;">Recommended for you</td></tr>
        ${recsHtml}
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:40px 0 0;line-height:1.6;">
          <a href="${SITE}/privacy" style="color:#7a6a55;text-decoration:none;">Privacy Notice</a> &mdash; you may unsubscribe at any time.
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:8px 0 0;line-height:1.6;">
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const textRecs = recs.map((r) => `- ${r.label}: ${r.href}\n  ${r.caption}`).join("\n\n");
  const text = `Your Palace of Roman edit is unlocked.

Thank you for sharing your style. We've saved your answers and curated a small selection from the atelier to begin with.

Open the lookbook: ${SITE}/style-quiz

Recommended for you:

${textRecs}

Palace of Roman — ${SITE}
`;

  return { subject, html, text };
}
