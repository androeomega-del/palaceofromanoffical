// Long-form Maison heritage content for /maison/$slug editorial pages.
// Each entry powers a single deep storytelling page that ties into the
// shoppable /brand/$vendor catalog grid. Built as a registry so new
// maisons can be added one-by-one and staged before nav exposure.

export type MaisonSignature = {
  /** Iconic piece / code name (e.g. "Monili Bead Cuff"). */
  name: string;
  /** 2–3 sentence editorial paragraph on why it matters. */
  body: string;
};

export type MaisonFaq = { q: string; a: string };

export type Maison = {
  /** URL slug (must match /brand/$vendor slug to link the shoppable view). */
  slug: string;
  /** Canonical brand name (must match Shopify vendor exactly). */
  brand: string;
  /** Eyebrow line — "Maison · Solomeo · Est. 1978". */
  meta: string;
  /** Short, quotable tagline shown under H1. */
  tagline: string;
  /** SEO description (used in meta + intro). */
  metaDescription: string;
  /** Founder / origin story — 1–2 paragraphs. */
  origin: string;
  /** Atelier or design philosophy — 1–2 paragraphs. */
  philosophy: string;
  /** Three to four signature codes with editorial body copy. */
  signatures: MaisonSignature[];
  /** Three craft pillars surfaced as a grid (icon-less editorial). */
  pillars: { title: string; body: string }[];
  /** FAQs — feed JSON-LD FAQPage + on-page accordion. */
  faqs: MaisonFaq[];
  /** Country (JSON-LD `Brand.foundingLocation`). */
  country: string;
  /** Year founded. */
  founded: string;
};

const MAISONS: Record<string, Maison> = {
  "brunello-cucinelli": {
    slug: "brunello-cucinelli",
    brand: "Brunello Cucinelli",
    meta: "Maison · Solomeo, Umbria · Est. 1978",
    tagline:
      "The philosopher of cashmere — humanistic luxury made slowly in a restored hamlet above the Umbrian valley.",
    metaDescription:
      "Discover Brunello Cucinelli — the Solomeo maison that redefined quiet luxury through cashmere, monili-beaded tailoring and a humanist philosophy of work. Shop the curated edit at Palace of Roman.",
    origin:
      "Brunello Cucinelli was born in 1953 in Castel Rigone, an Umbrian farming village without electricity. The son of a factory worker whose dignity he saw eroded by industrial labour, he set out in 1978 with a single, then-radical idea: dye cashmere in the colours of a Renaissance fresco. With borrowed money and a handful of pieces in pistachio, rose, and pale ochre, he built a women's knitwear company that would within a decade become the global reference for understated Italian luxury.",
    philosophy:
      "In 1985 he purchased the ruined 14th-century hamlet of Solomeo and restored it stone by stone — not as a marketing exercise, but as the seat of a working philosophy he calls 'humanistic capitalism'. The atelier sits inside a medieval village complete with a theatre, library, school of arts and crafts, and vineyards. Artisans work a measured day, lunch together at long tables, and are paid roughly 20% above industry standard. The clothes that emerge — featherweight cashmere, monili-beaded silk, hand-finished tailoring — are the visible product of an invisible ethic.",
    signatures: [
      {
        name: "Cashmere Knitwear",
        body: "The cashmere is sourced from a tightly controlled cooperative of Mongolian herders and spun in Italy to a fineness most houses cannot replicate. A signature crewneck takes a single artisan up to a full working day to finish; the resulting hand feels closer to silk than wool. Look for the unstructured shoulder, the rolled hem, and the discreet Solomeo label woven on the inside.",
      },
      {
        name: "Monili Beading",
        body: "The 'monili' — a fine chain of brass and palladium-tone beads — is the maison's quietest signature. It appears at a neckline, along a cuff, threaded through a lapel, never as a logo. Each strand is hand-applied in Solomeo and reads as jewellery rather than ornament; in person it catches the light the way a single strand of pearls would.",
      },
      {
        name: "Tailoring — The Solomeo Suit",
        body: "Cucinelli's tailoring rebuilt the Italian suit around softness: the canvas is hand-stitched, the shoulder is natural, the trouser is cut high and tapered with an inch of break. Fabric is almost always a low-twist wool, cashmere-flannel, or summer linen in the maison's palette of greiges, biscuit, ivory, and storm. It is a suit designed to be worn, not commanded.",
      },
      {
        name: "The Neutral Palette",
        body: "Sand, oat, plaster, fog, ecru, deep tobacco — the Cucinelli palette is the most copied in luxury and the hardest to copy well. Every season the colour card is built around tones drawn from Umbrian stone, olive bark, and sun-bleached linen, then dyed in small lots so each garment carries a subtle, living variation.",
      },
    ],
    pillars: [
      {
        title: "Made in Solomeo",
        body: "Every collection is cut, knit, beaded and finished in the maison's restored medieval hamlet in Umbria — a vertically integrated atelier rather than an outsourced supply chain.",
      },
      {
        title: "Humanistic Capitalism",
        body: "Cucinelli's working philosophy: fair hours, fair pay, profit reinvested into culture, art, and the village. The garments are the by-product of how the people who make them are treated.",
      },
      {
        title: "Quiet Codes, No Logos",
        body: "There is no monogram, no plaque, no visible branding. Recognition is reserved for those who recognise the silhouette, the cashmere hand, and the monili at the cuff.",
      },
    ],
    faqs: [
      {
        q: "Where is Brunello Cucinelli made?",
        a: "Every piece is produced in and around the hamlet of Solomeo in Umbria, Italy — knit, beaded, cut, and finished inside the maison's own atelier. Cashmere yarn is spun in Italy from raw fibre sourced through a controlled cooperative of Mongolian herders.",
      },
      {
        q: "Why is Brunello Cucinelli so expensive?",
        a: "The pricing reflects three things almost no other house combines: ultra-fine Italian-spun cashmere, hand-finished construction (a signature crewneck can take a full working day), and an above-industry wage paid to every artisan in Solomeo. You are paying for the ethic as much as the garment.",
      },
      {
        q: "What is the monili?",
        a: "The 'monili' is Cucinelli's signature: a fine, hand-applied strand of brass and palladium-tone beads used as discreet jewellery at the neckline, cuff, or lapel of knitwear and tailoring. It is the maison's most quietly recognisable code.",
      },
      {
        q: "How should a Cucinelli sweater fit?",
        a: "Cucinelli cuts knitwear with a relaxed but never oversized shoulder and a slightly longer body, designed to layer over a soft shirt or under a tailored jacket. Most clients take their usual size; size down only if you prefer a closer fit through the body.",
      },
      {
        q: "Is Brunello Cucinelli at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Brunello Cucinelli or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery from Italy.",
      },
    ],
    country: "Italy",
    founded: "1978",
  },
  prada: {
    slug: "prada",
    brand: "Prada",
    meta: "Maison · Milan · Est. 1913",
    tagline:
      "Intellectual minimalism — where Saffiano leather, Re-Nylon and the Re-Edition bag became the uniform of cerebral cool.",
    metaDescription:
      "Discover Prada — the Milanese maison that turned nylon into luxury, Saffiano into iconography, and anti-obvious design into a philosophy. Shop the curated edit at Palace of Roman.",
    origin:
      "Mario Prada opened the first store in 1913 in Milan's Galleria Vuitton Emanuele II, selling leather goods, trunks and handbags to the Italian aristocracy. The business passed to his daughter Luisa, then to her daughter Miuccia in 1978. Miuccia — a PhD in political science, former mime, and committed communist — had no fashion training. She transformed the family luggage house into one of the most intellectually rigorous brands in luxury, proving that ideas could sell as well as ornament.",
    philosophy:
      "Prada's philosophy is built on contradiction: luxury made from industrial nylon; elegance derived from what Miuccia calls 'ugly chic'; handbags that reference the proletarian toolbox. The atelier in Milan's Via Bergamo is less a workshop than a laboratory — fabric innovations arrive before silhouette trends, and every collection reads as a critical essay on the season rather than a celebration of it. The result is clothing and accessories for people who prefer to think before they dress.",
    signatures: [
      {
        name: "Saffiano Leather",
        body: "Invented by Mario Prada and patented in 1913, Saffiano is cross-hatch embossed calfskin that is virtually scratch-proof and water-resistant. The diagonal print and stiff structure give Prada's Galleria bag and wallets their architectural rigour. It is a leather designed for durability, not decoration — and has become the maison's most immediately recognisable surface.",
      },
      {
        name: "Re-Nylon",
        body: "What began in 1984 as a black nylon backpack — an anti-luxury statement so radical it became luxury — has been reissued as Re-Nylon, a regenerated fabric made from ocean plastics and textile waste. The material is identical in hand and sheen to the original, but its provenance is now ecological. It appears on the Re-Edition bags, belt bags, and ready-to-wear with the same utilitarian cool it carried four decades ago.",
      },
      {
        name: "The Re-Edition 2005",
        body: "The Re-Edition 2005 is the return of the small nylon shoulder bag that defined Y2K minimalism. Updated with removable leather straps, a chain detail, and the enamelled metal logo plaque, it carries the same dimensions and proportions as the original but is now produced in Re-Nylon. It is the maison's most democratic piece — worn across generations and price points.",
      },
      {
        name: "The Cleo Bag",
        body: "Introduced in the AW20 collection, the Cleo is a structured hobo bag with a curved, almost aerodynamic silhouette and a distinctive slanted base. Made in brushed calf or Saffiano, it closes with a magnetic flap and carries no external hardware beyond a small enamelled triangle. It is Prada at its most sculptural — a bag that reads as architecture before it reads as accessory.",
      },
    ],
    pillars: [
      {
        title: "Milanese Rationalism",
        body: "Every collection is designed in the Via Bergamo atelier with the same rigour as a Milanese rationalist building — form follows function, ornament is suspect, and proportion is everything.",
      },
      {
        title: "Anti-Obvious Luxury",
        body: "Prada's luxury is intellectual: nylon instead of leather, industrial zips instead of gold clasps, the 'ugly' shoe that becomes the only shoe. The value is in the idea, not the material.",
      },
      {
        title: "Sisterhood with Miu Miu",
        body: "Miuccia's younger label Miu Miu sits in the same Milan atelier, cut from the same cloth but with the seriousness removed. What Prada intellectualises, Miu Miu playfully undermines.",
      },
    ],
    faqs: [
      {
        q: "Is Prada at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Prada or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery.",
      },
      {
        q: "What is the difference between Prada and Prada Re-Edition?",
        a: "Re-Edition is Prada's reissue programme that brings back archival silhouettes in updated materials — most notably Re-Nylon, a regenerated fabric made from ocean plastics. The shapes are identical to the originals; only the provenance has changed.",
      },
      {
        q: "How do I care for Saffiano leather?",
        a: "Saffiano is naturally water-resistant and scratch-resistant due to its cross-hatch embossed finish. Wipe with a soft, dry cloth; avoid leather creams that can fill the embossed texture. Store stuffed to maintain structure.",
      },
      {
        q: "What size Prada Re-Edition should I buy?",
        a: "The Re-Edition 2005 is compact — roughly 18cm wide — designed to carry a phone, card holder and keys. For everyday use, consider the larger Re-Edition 2006 or the Cleo hobo. Most clients take the 2005 as a secondary bag.",
      },
      {
        q: "Where is Prada made?",
        a: "Prada's ready-to-wear, leather goods and footwear are produced in Italy, with the majority coming from the maison's own ateliers in Tuscany and Milan. The Re-Nylon material is produced in Italy from regenerated Econyl yarn.",
      },
    ],
    country: "Italy",
    founded: "1913",
  },
  gucci: {
    slug: "gucci",
    brand: "Gucci",
    meta: "Maison · Florence · Est. 1921",
    tagline:
      "Italian craft, eclectic vision — from the Horsebit loafer to the GG Marmont, a century of Florentine glamour.",
    metaDescription:
      "Discover Gucci — the Florentine house that fused old-world Tuscan saddlery with cinematic Italian glamour. Shop the curated edit of GG Marmont, Horsebit loafers and ready-to-wear at Palace of Roman.",
    origin:
      "Guccio Gucci was born in Florence in 1881 and worked as a porter at the Savoy Hotel in London, where he was mesmerised by the elegance of the guests' luggage. Returning to Italy, he opened a small leather goods and saddlery shop in 1921 on the Via della Vigna Nuova in Florence. The equestrian world — horsebits, stirrups, red and green webbing — became the house's founding vocabulary, and the bamboo-handled bag, invented in 1947 when wartime steel was scarce, became its first global icon.",
    philosophy:
      "Gucci's design language has always been built on opposites: aristocratic equestrian codes reinterpreted for Hollywood; Florentine craft fused with London clubland references; maximalist prints grounded in impeccable hand-finished construction. Under Alessandro Michele the house embraced what he calls 'romantic intellectualism' — a magpie aesthetic that layers vintage, punk, and Renaissance references into collections that read as deeply personal rather than trend-driven. The atelier in Florence's Via delle Caldaie remains the beating heart: leather is still hand-burnished, bamboo is still steam-bent by artisans, and every GG Marmont bag is stitched with the same saddle-stitch technique used in the 1920s.",
    signatures: [
      {
        name: "The GG Marmont",
        body: "Named after Guccio Gucci's monogram and the Los Angeles hotel where he kept an apartment, the Marmont is the house's most recognisable contemporary bag. The matelassé chevron leather is quilted in a precise geometric pattern, the double-G hardware is antique-brushed, and the chain strap can be worn crossbody or doubled for the shoulder. It is the bag that made logomania feel intellectual.",
      },
      {
        name: "The Horsebit Loafer",
        body: "Created in 1953, the Horsebit loafer is arguably the most influential men's shoe of the 20th century. The metal horsebit — a direct reference to Guccio's equestrian origins — sits on a soft moccasin construction with a penny loafer strap. Worn by presidents, actors, and musicians, it is the shoe that made the loafer respectable in boardrooms.",
      },
      {
        name: "The Jackie 1961",
        body: "Originally called the 'Constance' until Jacqueline Kennedy was photographed carrying it in 1961, this hobo-shaped bag with its piston closure and curved half-moon silhouette has been reissued in multiple sizes and materials. The 2021 reissue added an additional, longer strap for crossbody wear while preserving the original's mid-century proportions.",
      },
      {
        name: "The Bamboo Handle",
        body: "Invented in 1947 when post-war steel shortages made traditional bag frames impossible to source, Gucci's artisans discovered that bamboo — steamed, bent and lacquered by hand in Florence — could create a handle of extraordinary strength and warmth. The technique, unchanged in 75 years, requires heating the bamboo to precise temperatures and bending it over an open flame. No two handles are identical.",
      },
    ],
    pillars: [
      {
        title: "Florentine Leather Craft",
        body: "Every leather piece is cut, burnished and finished in the Via delle Caldaie atelier in Florence, where artisans trained in Tuscan saddlery techniques apply wax, dye and polish by hand.",
      },
      {
        title: "Equestrian DNA",
        body: "The horsebit, the green-red-green web, the stirrup hardware — every major Gucci code traces back to the aristocratic riding world that inspired Guccio Gucci in 1921.",
      },
      {
        title: "Magpie Maximalism",
        body: "Gucci's aesthetic is voracious: 1970s disco references sit beside Renaissance embroidery, punk studs beside 1950s couture tailoring. The coherence comes from craft, not theme.",
      },
    ],
    faqs: [
      {
        q: "Is Gucci at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Gucci or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery.",
      },
      {
        q: "How can I tell if a Gucci bag is real?",
        a: "Authentic Gucci leather goods carry a leather patch with a heat-stamped serial number (two rows of 6 digits on modern pieces), antique-brushed hardware that feels weighty, and stitching that is even and tight. The GG Marmont's matelassé pattern is perfectly symmetrical. When in doubt, buy from an authorised retailer like Palace of Roman.",
      },
      {
        q: "What is the difference between the GG Marmont sizes?",
        a: "The Marmont comes in Mini (16.5cm), Small (22cm), Medium (26cm), and Large (31cm). The Mini fits a phone and card holder; the Small is the most versatile daily size; the Medium carries a full wallet and cosmetics; the Large is a travel or work bag. Most women choose the Small or Medium.",
      },
      {
        q: "Are Gucci loafers comfortable?",
        a: "The Horsebit loafer is cut on a soft moccasin last with minimal structure, making it comfortable from the first wear. The leather sole can be slippery initially; many clients add a rubber sole after a few wears. Size down half a size if you have narrow feet.",
      },
      {
        q: "Where is Gucci made?",
        a: "Gucci's leather goods, ready-to-wear and footwear are produced in Italy, primarily in Tuscany and around Florence. The bamboo handles are still hand-bent over open flames in the Florence atelier.",
      },
    ],
    country: "Italy",
    founded: "1921",
  },
  "bottega-veneta": {
    slug: "bottega-veneta",
    brand: "Bottega Veneta",
    meta: "Maison · Vicenza · Est. 1966",
    tagline:
      "When your own initials are enough — the house that built quiet luxury from a single woven strip of leather.",
    metaDescription:
      "Discover Bottega Veneta — the Veneto house of hand-woven Intrecciato leather, the Cassette, the Pouch and the Andiamo. Shop the curated edit at Palace of Roman.",
    origin:
      "Michele Taddei and Renzo Zengiaro founded Bottega Veneta in Vicenza in 1966 with a deliberately anti-logo philosophy. In an era when luxury was becoming increasingly loud, they proposed the opposite: recognition for those who already knew. The name means 'Venetian shop', and the house's early clientele — Agnelli, Hepburn, Onassis — were drawn to the absence of branding. The Intrecciato weave, developed when sewing machines could not handle thick leather, became the maison's only identifier.",
    philosophy:
      "Bottega Veneta's philosophy can be reduced to a single sentence: when your own initials are enough. The house has never used a visible logo; instead, the Intrecciato weave, the soft pillow construction, and the weight of the leather do the communicating. Under Tomas Maier (2001-2018) the house refined this into what the industry now calls 'quiet luxury' — supremely expensive pieces that refuse to announce themselves. Under Matthieu Blazy the house has returned to its craft roots, cutting Intrecciato into tailoring, weaving leather like fabric, and reminding the world that the atelier in Montebello Vicentino is still filled with artisans who learned their trade from their parents.",
    signatures: [
      {
        name: "Intrecciato",
        body: "The signature weave was born from necessity: in 1966, sewing machines in Vicenza could not stitch the thick leather Taddei wanted to use. Artisans began cutting the leather into thin strips and weaving them by hand, creating a surface that was simultaneously supple and strong. Today the technique requires up to two days per bag and is performed by artisans trained for years. The diagonal pattern, the raised texture, and the depth of colour are unmistakable to anyone who has touched the real thing.",
      },
      {
        name: "The Cassette",
        body: "Introduced by Daniel Lee in 2019, the Cassette is a padded, pillow-shaped bag covered entirely in Intrecciato. The construction uses a distinctive 'Maxi Intrecciato' — strips roughly four times the width of the original — giving the bag a graphic, almost architectural presence. The magnetic snap closure, the flat leather strap, and the exaggerated weave have made it the defining bag of the quiet-luxury era.",
      },
      {
        name: "The Pouch",
        body: "Also from Daniel Lee's first collection, the Pouch is an oversized, unstructured clutch in butter-soft calf or Intrecciato leather, gathered at the top like a fabric sack. It contains no hardware, no frame, no internal structure — just a magnetic closure and an impossibly soft leather body that collapses against the hip. It is the most anti-bag bag in luxury.",
      },
      {
        name: "The Andiamo",
        body: "Meaning 'let's go' in Italian, the Andiamo is a structured top-handle bag with a braided leather handle and the house's first discreet metal detail: a small knot of bronze-tone hardware at the closure. Introduced in 2023 under Matthieu Blazy, it represents a return to the maison's craft heritage after the maximalist Lee era — serious, architectural, and quietly expensive.",
      },
    ],
    pillars: [
      {
        title: "No Logos, Ever",
        body: "Bottega Veneta has never applied a visible logo to its leather goods. Recognition comes from the Intrecciato weave, the weight of the leather, and the silhouette — a philosophy unchanged since 1966.",
      },
      {
        title: "Venetian Craft Lineage",
        body: "The Montebello Vicentino atelier employs artisans whose families have worked in leather for generations. The Intrecciato technique is taught over years, not months.",
      },
      {
        title: "Leather as Fabric",
        body: "Under Matthieu Blazy, Bottega Veneta has begun treating leather like textile — weaving it into tailoring, cutting it into fluid dresses, and proving that craft can be as expressive as print.",
      },
    ],
    faqs: [
      {
        q: "Is Bottega Veneta at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Bottega Veneta or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery.",
      },
      {
        q: "Why does Bottega Veneta have no logo?",
        a: "The house's founding philosophy, established in 1966, is that 'when your own initials are enough'. The Intrecciato weave serves as the only identifier — visible to those who know, invisible to those who don't.",
      },
      {
        q: "What is the difference between the Cassette and the Pouch?",
        a: "The Cassette is structured, padded, and graphic, with a flat leather or chain strap. The Pouch is entirely unstructured — a soft leather clutch with no frame, no hardware, and no strap. The Cassette is a day bag; the Pouch is an evening or editorial piece.",
      },
      {
        q: "How do I care for Intrecciato leather?",
        a: "Intrecciato is surprisingly resilient due to the weaving technique, which distributes stress across the surface. Wipe with a soft, damp cloth; avoid leather creams that can darken the weave. Store stuffed to maintain the padded shape of Cassette models.",
      },
      {
        q: "Where is Bottega Veneta made?",
        a: "All leather goods, ready-to-wear and footwear are produced in Italy, primarily in the Veneto region around Vicenza and Montebello Vicentino. The Intrecciato weaving is done entirely by hand in the maison's own ateliers.",
      },
    ],
    country: "Italy",
    founded: "1966",
  },
  "tom-ford": {
    slug: "tom-ford",
    brand: "Tom Ford",
    meta: "Maison · London · Est. 2005",
    tagline:
      "Sex, tailoring, scent — the house that carries the precision sensuality of Nineties Gucci into unapologetic contemporary glamour.",
    metaDescription:
      "Discover Tom Ford — the house of sharply cut tuxedos, the Whitney handbag, and the Private Blend fragrance line. Shop the curated edit at Palace of Roman.",
    origin:
      "Tom Ford was born in Austin, Texas in 1961 and studied architecture at Parsons before turning to fashion. He joined Gucci in 1990 as head of womenswear and, within four years, had rebuilt the struggling house into a $3 billion juggernaut through a cocktail of unapologetic sensuality, precision tailoring, and Hollywood relationships. When Gucci acquired Yves Saint Laurent in 1999, Ford simultaneously directed both houses before departing in 2004. In 2005 he launched Tom Ford — first with eyewear, then beauty, then ready-to-wear — applying the same cinematic, sex-forward aesthetic to a house that bore his own name.",
    philosophy:
      "Tom Ford's design philosophy is one of total control: every image, every store, every button is considered. The ready-to-wear collections are built around what he calls 'sexy glamour' — sharply cut tuxedos with satin lapels, liquid velvet dresses, python boots, and the kind of tailoring that requires a body rather than hiding one. The Whitney bag, named after his mother, is structured and severe; the O'Keeffe, named after Georgia O'Keeffe, is soft and sculptural. Even the fragrances — Black Orchid, Tobacco Vanille, Lost Cherry — are designed to announce presence before sight. It is luxury as theatre, and the wearer is the star.",
    signatures: [
      {
        name: "The Tuxedo",
        body: "Ford's tailoring is the direct descendant of the Gucci suits that defined 1990s red-carpet dressing. The jacket is sharply peaked at the lapel, nipped at the waist, and cut from mohair or midnight wool. The trousers are flat-fronted with a satin side stripe. It is a tuxedo designed to be noticed — worn by the world's most photographed men, from Daniel Craig to Ryan Gosling — and it requires the same confidence from its owner.",
      },
      {
        name: "The Whitney Bag",
        body: "Named after Ford's mother, the Whitney is a structured top-handle bag with a distinctive metal clasp that folds across the front like a architectural bracket. The leather is typically smooth calf or exotic skin, and the interior is lined in suede. It is severe, sculptural, and unapologetically expensive — the bag equivalent of a Ford tuxedo.",
      },
      {
        name: "Private Blend Fragrances",
        body: "Launched in 2007, the Private Blend collection treats perfume like a wine list — each scent is a single, intense ingredient study rather than a traditional composition. Tobacco Vanille is sweet and smoky; Lost Cherry is boozy and almond; Oud Wood is dry and resinous. Bottled in the house's brown apothecary flacons, they are the most approachable entry point into the Tom Ford world.",
      },
      {
        name: "The James Bond Eyewear",
        body: "Ford's eyewear, particularly the squared-off '007' acetate frames worn by Daniel Craig in the Bond films, has become as iconic as his tailoring. The hinges are metal-reinforced, the acetate is hand-polished in Italy, and the weight distribution is calibrated for all-day wear. They are the sunglasses of someone who expects to be looked at.",
      },
    ],
    pillars: [
      {
        title: "Cinematic Glamour",
        body: "Every collection is conceived as a film: lighting, casting, styling and set are as considered as the clothes. Ford shoots his own campaigns with the same precision he applies to a lapel roll.",
      },
      {
        title: "Total-Control Aesthetic",
        body: "From the cut of a trouser to the scent of a store, every detail is authored. There are no accidents in the Tom Ford universe — only decisions that appear effortless.",
      },
      {
        title: "Sensuality as Architecture",
        body: "Ford's clothes are built on the body, not around it. A Tom Ford tuxedo requires a physique; a Tom Ford dress requires posture. The garment and the wearer are collaborators.",
      },
    ],
    faqs: [
      {
        q: "Is Tom Ford at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Tom Ford or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery.",
      },
      {
        q: "How do Tom Ford suits fit?",
        a: "Tom Ford suits are cut with a strong shoulder, a nipped waist, and a flat-front trouser with minimal break. They are designed for a physique — the jacket is structured and the silhouette is assertive. Most men take their usual size, but the cut is more fitted than most Italian houses. If you are between sizes, size up.",
      },
      {
        q: "What is the difference between Tom Ford Private Blend and Signature fragrances?",
        a: "Private Blend scents are single-note compositions — intense, linear, and unapologetic. Signature scents (Black Orchid, Noir) are more traditional multi-layered perfumes. Private Blend bottles are brown apothecary glass; Signature bottles are black. Both are produced in the same Grasse ateliers.",
      },
      {
        q: "Are Tom Ford sunglasses polarised?",
        a: "Most Tom Ford optical and sunglass lenses offer 100% UV protection; select models include polarised lenses marked on the temple. All frames are hand-polished in Italy from Mazzucchelli acetate.",
      },
      {
        q: "Where is Tom Ford made?",
        a: "Tom Ford ready-to-wear and leather goods are produced in Italy; eyewear is hand-finished in Italy from Mazzucchelli acetate; fragrances are composed in Grasse, France, and bottled in Switzerland.",
      },
    ],
    country: "United States / United Kingdom",
    founded: "2005",
  },
  "dolce-gabbana": {
    slug: "dolce-gabbana",
    brand: "Dolce & Gabbana",
    meta: "Maison · Milan · Est. 1985",
    tagline:
      "Sicilian baroque, corseted opulence, and the Dolce Vita — the most sensual vision in Italian luxury.",
    metaDescription:
      "Discover Dolce & Gabbana — the Milanese house built on Sicilian beauty, corseted glamour, and majolica print. Shop the curated edit at Palace of Roman.",
    origin:
      "Domenico Dolce was born in Polizzi Generosa, Sicily, into a family of tailors; Stefano Gabbana was born in Milan and studied graphic design. They met in 1980 while working at the same atelier, fell in love, and in 1985 launched their namesake label with a women's ready-to-wear collection that looked like nothing else in Milan — corseted, black-laced, and unapologetically sexual. Their second collection, 'Real Women', featured Sicilian widows in black lace and established the house's enduring obsession with southern Italian beauty, Catholic iconography, and the female form as sacred architecture.",
    philosophy:
      "Dolce & Gabbana's philosophy is built on excess as authenticity: more lace, more gold, more print, more sensuality. Where Prada intellectualises and Bottega Veneta whispers, D&G shouts in Sicilian dialect. The atelier in Milan produces collections that reference everything from Byzantine mosaics to Italian neorealist cinema, but the craft is always impeccable — corsetry is hand-boned, lace is sourced from Calais and Caudry, and the Majolica print ceramics that inspired the house's most famous collections are still hand-painted in Sicily. It is luxury that refuses to apologise for loving beauty.",
    signatures: [
      {
        name: "The Sicily Bag",
        body: "Introduced in the AW12 collection and named after the island that inspires everything the house does, the Sicily is a structured top-handle bag with a curved frame and a small gold lock clasp. It comes in smooth leather, printed Dauphine, and the house's signature lace-overlay editions. The proportions are deliberately mid-century — it is the bag Sophia Loren might have carried.",
      },
      {
        name: "Majolica Print",
        body: "The Majolica print — inspired by the hand-painted tin-glazed ceramics of Sicily, Amalfi and Capri — has become the house's most recognisable visual signature. It appears on everything from silk dresses to leather bags to swimwear, and each season the palette is redrawn from the original ceramics. The print is never digital; it is screen-printed or woven to preserve the slight irregularities that make the ceramics alive.",
      },
      {
        name: "Lace & Corsetry",
        body: "D&G's lace is sourced from the same French and Italian mills that supply haute couture — Calais for the chantilly, Caudry for the heavier guipure. Corsets are hand-boned with steel and whalebone alternatives, and every collection includes at least one piece that references the Sicilian widow's black lace veil, reinterpreted as cocktail dress, gown, or swimsuit. It is the most technically demanding work the house produces.",
      },
      {
        name: "The Devotion Bag",
        body: "Named for the heart-shaped clasp inspired by Sicilian sacred heart iconography, the Devotion is a quilted crossbody bag that has become the house's most commercially successful accessory. The heart clasp, in gold or pearl, is cast from a hand-carved original and opens with a satisfying mechanical click. It comes in every size from micro to tote, and in leather, velvet, and the house's lace-overlay editions.",
      },
    ],
    pillars: [
      {
        title: "Sicilian Authenticity",
        body: "Every collection begins with research trips to Sicily — the ceramics of Caltagirone, the baroque churches of Noto, the fishermen of Favignana. The references are not borrowed; they are ancestral.",
      },
      {
        title: "Corset as Architecture",
        body: "D&G treats the female body as a structure to be celebrated, not concealed. Corsetry is hand-boned, lace is layered over nude tulle, and the silhouette is always assertive.",
      },
      {
        title: "Print as Culture",
        body: "The Majolica, the leopard, the rose, the lemon — every D&G print carries a specific regional reference and is produced by the same Italian mills that have supplied the house for decades.",
      },
    ],
    faqs: [
      {
        q: "Is Dolce & Gabbana at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Dolce & Gabbana or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery.",
      },
      {
        q: "How do Dolce & Gabbana dresses fit?",
        a: "D&G dresses are typically cut close to the body with a structured bodice and a defined waist. Corseted pieces are designed to be fitted; size up if you prefer more ease through the bust or hips. Lace-overlay dresses have less stretch than printed silk; consult the size guide for each fabric.",
      },
      {
        q: "What is the difference between Dolce & Gabbana and D&G?",
        a: "D&G (the secondary line) was discontinued in 2012. All current production is under the main Dolce & Gabbana label. Vintage D&G pieces are still available on the secondary market but are no longer produced.",
      },
      {
        q: "How do I care for Dolce & Gabbana lace?",
        a: "D&G lace is typically Chantilly or guipure sourced from French mills. Dry clean only; do not spot-treat as water can distort the delicate fibres. Store flat or on a padded hanger to prevent stretching.",
      },
      {
        q: "Where is Dolce & Gabbana made?",
        a: "Dolce & Gabbana's ready-to-wear, leather goods and footwear are produced in Italy. Lace is sourced from France (Calais and Caudry); ceramics and print references are drawn from Sicily.",
      },
    ],
    country: "Italy",
    founded: "1985",
  },
  ferragamo: {
    slug: "ferragamo",
    brand: "Ferragamo",
    meta: "Maison · Florence · Est. 1927",
    tagline:
      "The shoemaker to the stars — where the cage heel, the Vara bow and Italian innovation redefined elegance.",
    metaDescription:
      "Discover Ferragamo — the Florentine house founded by Salvatore Ferragamo, inventor of the cage heel and the Vara bow. Shop the curated edit at Palace of Roman.",
    origin:
      "Salvatore Ferragamo was born in 1898 in Bonito, a village in southern Italy with eleven siblings. He made his first pair of shoes at age nine for his sisters' confirmation. At sixteen he emigrated to the United States, opened a shoe repair shop in Boston, then moved to Hollywood where he became the shoemaker to the stars — designing for Marilyn Monroe, Audrey Hepburn, and Greta Garbo. In 1927 he returned to Italy and established his workshop in Florence, bringing with him the technical innovations he had developed in California: the wedge heel, the cage heel, and the invisible sandal.",
    philosophy:
      "Ferragamo's philosophy is rooted in what Salvatore called the 'perfect shoe' — a marriage of beauty, comfort, and anatomical precision. He studied anatomy at the University of Southern California to understand how the foot bears weight, and his innovations (the steel-shank arch support, the cork wedge, the metal cage heel) were all driven by engineering rather than ornament. Today's house maintains that balance: the Vara pump still features the same low heel and grosgrain bow that made it a 1970s classic; the Tramezza construction still requires 200 hand operations; and the Gancini bit, introduced in the 1960s, remains the house's most discreet identifier.",
    signatures: [
      {
        name: "The Vara Bow",
        body: "Designed in 1978 by Salvatore's daughter Fiamma, the Vara is a low-heeled pump with a grosgrain bow and a gold-tone metal plaque bearing the house's name. It was conceived as a comfortable alternative to the stilettos dominating the era — a shoe that could be worn for twelve hours. The Vara and its ballerina variant, the Varina, have sold millions of pairs and remain the house's most democratic piece.",
      },
      {
        name: "The Cage Heel",
        body: "Invented by Salvatore in the 1950s, the cage heel is a wedge constructed from curved metal or Perspex strips that create a lattice or cage effect under the arch. It is simultaneously structural and decorative — the strips bear the wearer's weight while creating a visual architecture that has been copied by every major house since. The original Ferragamo cage heels are museum pieces; the modern reissues use titanium and carbon fibre.",
      },
      {
        name: "The Tramezza Construction",
        body: "The Tramezza is Ferragamo's highest level of shoemaking — a hand-welted construction that uses a thin leather layer (the 'tramezza') between the insole and the outsole to create a flexible, durable foundation. Each pair requires over 200 operations, 15 days of work, and is built around a hand-carved wooden last. It is the construction method used for the house's formal footwear and represents the continuation of Salvatore's anatomical research.",
      },
      {
        name: "The Gancini",
        body: "The Gancini is a metal bit shaped like a horseshoe or double hook, introduced in the 1960s as a hardware detail on bags and shoes. It references the ironwork of Florence's medieval palazzos and functions as the house's most discreet logo. On the modern Gancini bag it appears as a clasp; on loafers as a plaque; on belts as the buckle. It is never large, never central, always precise.",
      },
    ],
    pillars: [
      {
        title: "Anatomical Innovation",
        body: "Salvatore studied foot anatomy at USC to engineer shoes that were beautiful and comfortable. The steel shank, the cork wedge, and the Tramezza construction are direct descendants of that research.",
      },
      {
        title: "Florentine Leather Heritage",
        body: "The house's leather goods are produced in Florence using the same vegetable-tanned calf and hand-burnished finishing techniques that Salvatore imported from Hollywood in 1927.",
      },
      {
        title: "The Hollywood Lineage",
        body: "From Marilyn Monroe's stilettos to Audrey Hepburn's flats, Ferragamo has dressed more Hollywood icons than any other Italian house. That red-carpet precision still informs every collection.",
      },
    ],
    faqs: [
      {
        q: "Is Ferragamo at Palace of Roman authentic?",
        a: "Yes. Every piece is sourced through Ferragamo or its authorised European distribution partners, shipped with full traceability and tracked worldwide delivery.",
      },
      {
        q: "What is the difference between the Vara and the Varina?",
        a: "The Vara is a low-heeled pump (roughly 3cm) with a grosgrain bow. The Varina is the same design converted into a flat ballerina. Both share the same metal plaque and bow proportions. Most clients own both.",
      },
      {
        q: "How do Ferragamo shoes fit?",
        a: "Ferragamo shoes are typically true to size but cut on an elegant, slightly narrow last. The Vara and Varina are available in C (standard) and D (wide) widths. If you have a high instep, consider going up half a size in the loafers and lace-ups.",
      },
      {
        q: "What is Tramezza construction?",
        a: "Tramezza is Ferragamo's hand-welted shoemaking method, using a leather layer between the insole and outsole for flexibility and durability. Each pair requires over 200 hand operations and 15 days of work. It is reserved for the house's formal footwear and represents its highest level of craft.",
      },
      {
        q: "Where is Ferragamo made?",
        a: "Ferragamo's leather goods, ready-to-wear and footwear are produced in Italy, primarily in Florence and Tuscany. The Tramezza shoes are hand-welted in the house's own Florentine atelier.",
      },
    ],
    country: "Italy",
    founded: "1927",
  },
};


const BY_SLUG = new Map<string, Maison>(Object.entries(MAISONS));

export function maisonFor(slug: string): Maison | null {
  return BY_SLUG.get(slug) ?? null;
}

export function allMaisons(): Maison[] {
  return Array.from(BY_SLUG.values());
}
