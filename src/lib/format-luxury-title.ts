/**
 * Transforms raw wholesale/B2B product titles into high-end luxury names
 * tailored for the Palace of Roman storefront. Strips brand duplication,
 * scrubs stacked category synonyms ("Polo Shirt T-shirt"), and applies
 * Title Case so display copy reads cleanly across PLP, PDP, search,
 * cart and editorial surfaces.
 */
export function formatLuxuryTitle(rawTitle: string, brandName: string = ""): string {
  if (!rawTitle) return "";

  // 1. Strip duplicated brand name (case-insensitive). Escape regex meta-chars
  //    so vendors like "Dolce & Gabbana" don't blow up the RegExp constructor.
  let cleanTitle = rawTitle;
  if (brandName) {
    const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleanTitle = cleanTitle.replace(new RegExp(escaped, "gi"), "").trim();
  }

  // 2. Editorial replacement dictionary — order matters: longest patterns first.
  const heavyScrubRules: Record<string, string> = {
    "Polo Shirt T-shirt": "Polo",
    "Polo Shirt": "Polo",
    "Shirt T-shirt": "Shirt",
    "Beachwear Men Shorts Swimwear": "Swim Short",
    "Beachwear Shorts Swimwear": "Swim Short",
    "Shorts Swimwear": "Swim Short",
    "Slippers Shoes": "Slipper",
    "Sandals Shoes": "Sandal",
    "Casual Pants": "Tailored Trouser",
    "Casual Pant": "Tailored Trouser",
    Pants: "Trouser",
    Pant: "Trouser",
    "High-Waist Briefs Underwear": "Satin High-Waist Brief",
    "Briefs Underwear": "Brief",
    Underwear: "Brief",
    "T-shirt": "Premium Tee",
    "Shoulder Bag": "Structured Shoulder Bag",
  };

  for (const [dirtyPattern, elegantAlternative] of Object.entries(heavyScrubRules)) {
    const patternRegex = new RegExp(dirtyPattern, "gi");
    if (patternRegex.test(cleanTitle)) {
      cleanTitle = cleanTitle.replace(patternRegex, elegantAlternative);
    }
  }

  // 3. Drop clinical fabric labels that cheapen presentation.
  cleanTitle = cleanTitle.replace(/\bPolyester\b/gi, "").trim();

  // 4. Collapse whitespace and Title Case.
  cleanTitle = cleanTitle
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return cleanTitle;
}
