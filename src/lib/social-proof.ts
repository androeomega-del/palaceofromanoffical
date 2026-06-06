/**
 * Real-only social proof constants.
 *
 * Per project policy: NEVER fabricate reviews, ratings, or counts.
 * Only verifiable third-party listings are referenced here. If a slug
 * below is wrong, update it once — every badge across the site picks
 * the new URL up automatically.
 */

// TODO: paste the exact Yelp business URL from the verified listing.
// If unsure, open yelp.com, search "Palace of Roman", copy the URL
// from the address bar. Must be the public /biz/<slug> form.
export const YELP_BUSINESS_URL =
  "https://www.yelp.com/biz/palace-of-roman";

// Verified review count as of Yelp verification. Bump when new
// reviews are confirmed live on Yelp. Never invent.
export const YELP_REVIEW_COUNT = 3;

// Google Business Profile — verified listing.
// Link format: the canonical share URL from the verified profile.
export const GBP_BUSINESS_URL =
  "https://share.google/CZeLml2jcRi9MtNqP";

// Verified review count as of GBP verification. Bump when new
// reviews are confirmed live on Google. Never invent.
export const GBP_REVIEW_COUNT = 0;
