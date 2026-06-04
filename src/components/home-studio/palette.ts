/**
 * Home Studio palette — scoped tokens.
 *
 * Inline-style values consumed by the home-studio components only.
 * Intentionally NOT added to global CSS variables to avoid altering tokens
 * used by the rest of the site (per scoped-redesign rule).
 */
export const palette = {
  obsidian: "#0B0B0C",
  offwhite: "#F4F1EC",
  sand: "#D9CFC1",
  sandSoft: "#E8E0D2",
  muted: "rgba(244,241,236,0.55)",
} as const;

export const fontSerif = "'Cormorant Garamond', 'Times New Roman', serif";
export const fontSans = "'Inter', sans-serif";
