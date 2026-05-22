// SEO-rich heritage copy for the curated 100 luxury houses.
// Used by /brand/$vendor.tsx as a hero header above the product grid —
// captures long-tail Google intent ("buy authentic <Brand> <product>")
// and gives shoppers context before the first scroll.

import { ALL_LUXURY_BRANDS } from "@/lib/luxury-brands";

export type BrandHeritage = {
  /** Short eyebrow (Maison · Country · Founded). */
  meta: string;
  /** ≤120-char tagline shown directly under the hero title. */
  tagline: string;
  /** 2–3 sentence heritage paragraph for SEO body copy. */
  description: string;
  /** Editorial pillars / iconic categories — surfaced as quick-link chips. */
  signatures: string[];
  /** ISO country (used in JSON-LD `Brand.foundingLocation`). */
  country: string;
  /** Year founded (string so non-numeric values like "1854" are fine). */
  founded: string;
};

// Small but high-signal index — the long tail is generated below.
const HERITAGE: Record<string, BrandHeritage> = {
  "Louis Vuitton": {
    meta: "Maison · Paris · Est. 1854",
    tagline: "The original travel house — Monogram canvas, Speedy, Capucines.",
    description:
      "Founded by Louis Vuitton in Paris, the Maison reinvented modern travel with its flat-top trunk and continues to define soft luxury through the iconic Monogram and Damier canvases. Every piece passes through the Asnières atelier traditions — discreet hardware, hand-painted edges, and lifetime serviceable craftsmanship.",
    signatures: ["Monogram Canvas", "Speedy", "Neverfull", "Capucines", "Pochette Métis"],
    country: "France",
    founded: "1854",
  },
  Chanel: {
    meta: "Maison · Paris · Est. 1910",
    tagline: "Codes of modern femininity — tweed, camellia, the 2.55.",
    description:
      "From the rue Cambon, Gabrielle Chanel rewrote the rules of how women dress. The Maison's quilted lambskin Classic Flap, two-tone slingbacks, and tweed jackets remain benchmarks of timeless luxury — every piece a study in the codes Coco set down a century ago.",
    signatures: ["Classic Flap", "Boy Bag", "Tweed Jacket", "Slingbacks", "No.5"],
    country: "France",
    founded: "1910",
  },
  Hermès: {
    meta: "Maison · Paris · Est. 1837",
    tagline: "Saddler-turned-couturier — Birkin, Kelly, Cavale.",
    description:
      "Hermès began as a Parisian harness workshop and remains, six generations on, the gold standard in French leather craftsmanship. Each Birkin and Kelly is built by a single artisan in Pantin — saddle-stitched by hand, with hardware that will outlive trends and owners alike.",
    signatures: ["Birkin", "Kelly", "Constance", "Carré 90", "Oran Sandals"],
    country: "France",
    founded: "1837",
  },
  Gucci: {
    meta: "Maison · Florence · Est. 1921",
    tagline: "Italian craft, eclectic vision — GG Marmont, Horsebit, Dionysus.",
    description:
      "Born from Guccio Gucci's Florentine leather atelier, the house fuses old-world Tuscan saddlery with cinematic Italian glamour. Today Gucci's GG Marmont, Horsebit loafer, and Jackie 1961 sit alongside ready-to-wear that reads as instantly identifiable on every street.",
    signatures: ["GG Marmont", "Horsebit Loafer", "Dionysus", "Jackie 1961", "Bamboo"],
    country: "Italy",
    founded: "1921",
  },
  Prada: {
    meta: "Maison · Milan · Est. 1913",
    tagline: "Intellectual minimalism — Saffiano, Re-Edition, nylon Re-Nylon.",
    description:
      "Established as Fratelli Prada in Milan, the Maison was reshaped by Miuccia Prada into a serious study of restrained luxury. Saffiano leather, Re-Nylon technical fabrics, and the Re-Edition micro-bags have become quiet uniforms for women who prefer cerebral cool over logos.",
    signatures: ["Galleria", "Re-Edition 2005", "Cleo", "Re-Nylon", "Monolith Boot"],
    country: "Italy",
    founded: "1913",
  },
  Dior: {
    meta: "Maison · Paris · Est. 1946",
    tagline: "From the New Look to today — Lady Dior, Saddle, Book Tote.",
    description:
      "Christian Dior's 1947 Bar suit redrew the silhouette of the post-war woman. Eight decades on, the Lady Dior, J'adior slingback and embroidered Book Tote carry that same exacting Parisian polish into the modern wardrobe.",
    signatures: ["Lady Dior", "Saddle Bag", "Book Tote", "J'adior Slingback", "Bobby"],
    country: "France",
    founded: "1946",
  },
  "Saint Laurent": {
    meta: "Maison · Paris · Est. 1961",
    tagline: "Rive Gauche rock-and-roll — Le Smoking, LouLou, Cassandre.",
    description:
      "Yves Saint Laurent democratised luxury when he sent Le Smoking down the runway in 1966. The house's silver YSL Cassandre, sharp tailoring, and Parisian-bourgeoise leather goods are now the uniform of off-duty downtown.",
    signatures: ["LouLou", "Sac de Jour", "Le Smoking", "Tribute Sandals", "Niki"],
    country: "France",
    founded: "1961",
  },
  Rolex: {
    meta: "Manufacture · Geneva · Est. 1905",
    tagline: "The benchmark of mechanical wristwatches — Submariner, Datejust, Daytona.",
    description:
      "Rolex pioneered the waterproof Oyster case in 1926 and the self-winding Perpetual rotor in 1931. From the Submariner diver to the GMT-Master and Cosmograph Daytona, every reference is built in-house in Geneva to chronometer-grade precision.",
    signatures: ["Submariner", "Datejust", "Daytona", "GMT-Master II", "Day-Date"],
    country: "Switzerland",
    founded: "1905",
  },
  Cartier: {
    meta: "Maison · Paris · Est. 1847",
    tagline: "Jeweller of kings — Tank, Love, Panthère, Trinity.",
    description:
      "Cartier's Tank wristwatch (1917), Love bracelet (1969), and Panthère motif have set the codes of fine jewellery for over a century. Each piece carries the Maison's signature Parisian rigour — settings hand-finished in the rue de la Paix workshops.",
    signatures: ["Tank Watch", "Love Bracelet", "Panthère", "Juste un Clou", "Trinity"],
    country: "France",
    founded: "1847",
  },
  "Miu Miu": {
    meta: "Maison · Milan · Est. 1993",
    tagline: "Miuccia's playful mirror to Prada — Wander, Arcadie, Beau.",
    description:
      "Miuccia Prada's younger label captures her most personal, irreverent ideas — schoolgirl tailoring, slouchy denim, and crystal-clasped Wander bags. Lighter than Prada, sharper than fast fashion, with the same Milanese craft.",
    signatures: ["Wander", "Arcadie", "Matelassé", "Beau", "Pleated Skirt"],
    country: "Italy",
    founded: "1993",
  },
  "Bottega Veneta": {
    meta: "Maison · Vicenza · Est. 1966",
    tagline: "Quiet luxury, woven by hand — Intrecciato, Cassette, Andiamo.",
    description:
      "Founded in the Veneto, Bottega Veneta is the discreet signature of those in the know. The house's hand-woven Intrecciato leather appears on the Cassette, Pouch, and Andiamo — supple, unbranded, instantly recognisable to anyone who looks twice.",
    signatures: ["Cassette", "Andiamo", "The Pouch", "Jodie", "Padded Mules"],
    country: "Italy",
    founded: "1966",
  },
  Loewe: {
    meta: "Maison · Madrid · Est. 1846",
    tagline: "Spanish leather, Jonathan Anderson's wit — Puzzle, Hammock, Flamenco.",
    description:
      "Spain's oldest luxury house is now its most subversive. Under Jonathan Anderson, Loewe's geometric Puzzle, slouchy Hammock, and trompe-l'oeil tailoring sit at the intersection of craft, art and humour — produced in the maison's Getafe leather workshops.",
    signatures: ["Puzzle", "Hammock", "Flamenco", "Goya", "Anagram Tee"],
    country: "Spain",
    founded: "1846",
  },
  Celine: {
    meta: "Maison · Paris · Est. 1945",
    tagline: "Parisian bourgeois precision — Triomphe, Luggage, Ava.",
    description:
      "Celine's wardrobe has anchored every off-duty French girl since the Sixties. The reissued Triomphe canvas, Luggage tote, and Ava shoulder bag pair with sharp blazers and high-rise denim — quiet, expensive, eternally on duty.",
    signatures: ["Triomphe", "Luggage", "Ava", "Box Bag", "Romy"],
    country: "France",
    founded: "1945",
  },
  Balenciaga: {
    meta: "Maison · Paris · Est. 1919",
    tagline: "Couture sculpted into streetwear — Hourglass, City, Triple S.",
    description:
      "Cristóbal Balenciaga shaped Sixties couture; Demna's Balenciaga reshaped what luxury could look like in the 2020s. Hourglass bags, oversized Hourglass coats, and chunky Triple-S sneakers carry that double inheritance into every collection.",
    signatures: ["Hourglass", "City", "Triple S", "Speed Sneaker", "Le Cagole"],
    country: "France/Spain",
    founded: "1919",
  },
  "The Row": {
    meta: "Atelier · New York · Est. 2006",
    tagline: "Olsen-built quiet luxury — Margaux, Park, Half Moon.",
    description:
      "Mary-Kate and Ashley Olsen named The Row after Savile Row, and the discipline shows. Cashmere suiting, fluid silk knits, and the unbranded Margaux and Park totes are the wardrobe of the woman who declines to advertise.",
    signatures: ["Margaux 15", "Park Tote", "Half Moon", "Soft Margaux", "Sister"],
    country: "United States",
    founded: "2006",
  },
  "Tom Ford": {
    meta: "Maison · London · Est. 2005",
    tagline: "Sex, tailoring, scent — Whitney, O'Keeffe, Black Orchid.",
    description:
      "Tom Ford's eponymous house carries the same precision sensuality that rebuilt Gucci in the Nineties. Sharply cut tuxedos, the Whitney handbag, and the Private Blend fragrance line are studies in contemporary, unapologetic glamour.",
    signatures: ["Tuxedo", "Whitney", "O'Keeffe", "Black Orchid", "Private Blend"],
    country: "United States/UK",
    founded: "2005",
  },
  Burberry: {
    meta: "House · London · Est. 1856",
    tagline: "British outerwear, redefined — Trench, Lola, Knight.",
    description:
      "Thomas Burberry invented gabardine in 1879 and the world's most-copied trench followed. Today the house's Vintage Check, Lola bag and Heritage trench remain the spine of the British luxury wardrobe.",
    signatures: ["Trench Coat", "Lola", "Knight", "Vintage Check", "Title Bag"],
    country: "United Kingdom",
    founded: "1856",
  },
  "Dolce & Gabbana": {
    meta: "Maison · Milan · Est. 1985",
    tagline: "Mediterranean opulence — Sicily Bag, Devotion, Majolica.",
    description:
      "Domenico Dolce and Stefano Gabbana have spent four decades distilling Italian sensuality into corseted slip dresses, baroque tailoring, and the Sicily handbag. Crystal embroidery, lace, and Majolica prints define the maison's unmistakable Mediterranean voice.",
    signatures: ["Sicily Bag", "Devotion", "Sicily 62", "Majolica Print", "Lace Slip"],
    country: "Italy",
    founded: "1985",
  },
  "Calvin Klein": {
    meta: "House · New York · Est. 1968",
    tagline: "American minimalism, perfected — Slip Dress, CK Logo, Eternity.",
    description:
      "Calvin Klein redefined American sportswear with his stripped-back silhouettes and the now-iconic logo waistband. The house's slip dresses, sharp denim, and Eternity fragrance helped invent the modern, sex-forward minimalism we still wear today.",
    signatures: ["Slip Dress", "Logo Waistband", "Sharp Denim", "Eternity", "CK Tailoring"],
    country: "United States",
    founded: "1968",
  },
  Versace: {
    meta: "Maison · Milan · Est. 1978",
    tagline: "Italian glamour, Medusa-led — La Greca, Virtus, Allover Baroque.",
    description:
      "Gianni Versace fused Italian craftsmanship with rock-and-roll showmanship. Donatella's house carries on with the Medusa head, La Greca pattern, and the chain-mail dresses that defined Nineties supermodel power.",
    signatures: ["La Medusa", "Virtus", "La Greca", "Greca Goddess", "Chain Reaction"],
    country: "Italy",
    founded: "1978",
  },
  Fendi: {
    meta: "Maison · Rome · Est. 1925",
    tagline: "Roman fur, Karl-era reinvention — Baguette, Peekaboo, FF.",
    description:
      "Fendi began as a Roman fur-and-leather atelier and was reshaped by Karl Lagerfeld's 54-year tenure. The Baguette (1997) defined the It-bag era; the Peekaboo and First continue it.",
    signatures: ["Baguette", "Peekaboo", "First", "Way", "FF Logo"],
    country: "Italy",
    founded: "1925",
  },
  Valentino: {
    meta: "Maison · Rome · Est. 1960",
    tagline: "Roman couture in red — Rockstud, Roman Stud, V-Logo.",
    description:
      "Valentino Garavani's Roman couture house gave the world Valentino Red and a wardrobe of show-stopping gowns. Today's Rockstud, Roman Stud and V-Logo accessories carry that Roman bravura into every season.",
    signatures: ["Rockstud", "Roman Stud", "VLogo", "Red Gown", "Lock Bag"],
    country: "Italy",
    founded: "1960",
  },
  "Tiffany & Co.": {
    meta: "Jeweller · New York · Est. 1837",
    tagline: "American fine jewellery — Setting, T, HardWear, Lock.",
    description:
      "Charles Lewis Tiffany invented the Tiffany Setting in 1886 and never let go of New York's jewellery crown. The robin's-egg blue box still arrives carrying the Setting, Tiffany T, HardWear and Lock — the codes of modern American luxury.",
    signatures: ["Tiffany Setting", "Tiffany T", "HardWear", "Lock", "Elsa Peretti"],
    country: "United States",
    founded: "1837",
  },
  Moncler: {
    meta: "Maison · Grenoble/Milan · Est. 1952",
    tagline: "Quilted alpine luxury — Maya, Karakorum, Genius.",
    description:
      "Moncler began outfitting French alpine expeditions in 1952 and is now the benchmark for luxury down. Maya jackets, Genius collaborations, and slim quilted vests carry the maison's mountain DNA from the slopes to the city.",
    signatures: ["Maya", "Karakorum", "Lans", "Genius", "Mont Blanc Vest"],
    country: "Italy/France",
    founded: "1952",
  },
};

// Generic fallback so every one of the 100 brands gets a meaningful page.
function fallbackHeritage(name: string): BrandHeritage {
  return {
    meta: "Curated House",
    tagline: `Shop authentic ${name} at Palace of Roman.`,
    description: `Discover the curated ${name} edit at Palace of Roman — a tightly merchandised selection of ready-to-wear, leather goods and accessories from one of the houses we count among the world's defining luxury makers. Every piece is sourced through the brand or its authorised distributors and shipped worldwide with full tracking and authentication.`,
    signatures: ["Ready-to-Wear", "Leather Goods", "Accessories"],
    country: "—",
    founded: "—",
  };
}

const BY_NAME: Map<string, BrandHeritage> = new Map(
  Object.entries(HERITAGE).map(([k, v]) => [k.toLowerCase(), v]),
);

export function heritageFor(brandName: string): BrandHeritage {
  const hit = BY_NAME.get(brandName.toLowerCase());
  return hit ?? fallbackHeritage(brandName);
}

/** Resolve a `/brand/$vendor` URL slug back to its canonical brand name (or null). */
export function brandFromSlug(slug: string): string | null {
  const norm = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const b of ALL_LUXURY_BRANDS) {
    if (b.name.toLowerCase().replace(/[^a-z0-9]/g, "") === norm) return b.name;
  }
  return null;
}
