// Zod schema + TS types for the AI-generated homepage layout blueprint.
// Stored in `homepage_daily_layout.layout_json` and consumed by the
// dynamic edition components on the homepage.

import { z } from "zod";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Tight clamps so a bad AI generation can't blow up the layout.
export const HomepageLayoutSchema = z.object({
  edition_name: z.string().min(2).max(60),
  hero: z.object({
    eyebrow: z.string().min(2).max(40),
    headline: z.string().min(4).max(120),
    subcopy: z.string().min(10).max(280),
    cta: z.string().min(2).max(30).default("Shop the edition"),
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
    texture: z.enum(["grain", "gloss", "matte", "none"]).default("none"),
  }),
  sections: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        title: z.string().min(2).max(60),
        blurb: z.string().min(4).max(200),
        handles: z.array(z.string().min(1).max(160)).min(2).max(8),
      }),
    )
    .length(3),
  layout_order: z.array(z.string().min(1).max(40)).min(1).max(8),
});

export type HomepageLayout = z.infer<typeof HomepageLayoutSchema>;
