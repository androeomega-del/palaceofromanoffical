// Zod schema + TS types for the AI-generated dynamic landing page
// blueprint. Stored in `dynamic_landing_pages.blueprint_json`, rendered
// by `/pages/$slug`.

import { z } from "zod";

const HEX = /^#[0-9a-fA-F]{6}$/;

export const LandingPageBlueprintSchema = z.object({
  page_title: z.string().min(2).max(80),
  meta_description: z.string().min(20).max(180),
  hero: z.object({
    eyebrow: z.string().min(2).max(40),
    headline: z.string().min(4).max(140),
    subcopy: z.string().min(10).max(320),
    cta: z.string().min(2).max(30).default("Shop the edit"),
  }),
  accents: z.object({
    bg: z.string().regex(HEX),
    fg: z.string().regex(HEX),
    accent: z.string().regex(HEX),
    font_pair: z
      .enum([
        "cormorant-karla",
        "instrument-serif-work-sans",
        "dm-serif-display-fira-sans",
        "libre-baskerville-ibm-plex",
        "space-grotesk-dm-sans",
        "syne-plus-jakarta",
      ])
      .default("cormorant-karla"),
  }),
  sections: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        title: z.string().min(2).max(80),
        blurb: z.string().min(4).max(240),
        handles: z.array(z.string().min(1).max(160)).min(2).max(8),
      }),
    )
    .min(1)
    .max(4),
});

export type LandingPageBlueprint = z.infer<typeof LandingPageBlueprintSchema>;
