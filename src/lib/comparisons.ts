// Comparison page data — Palace of Roman vs major luxury multi-brand retailers.
// All claims are factual (shipping origin, return windows, public-facing
// model). Where a competitor genuinely wins on something, we say so — luxury
// buyers reward honesty far more than puffery.

export type ComparisonRow = {
  label: string;
  them: string;
  us: string;
  /** Optional: who has the edge ("them" | "us" | "even"). Used for subtle styling, not bragging. */
  edge?: "them" | "us" | "even";
};

export type ComparisonFAQ = { q: string; a: string };

export type Comparison = {
  slug: "farfetch" | "mytheresa" | "ssense" | "net-a-porter";
  competitor: string;
  /** Used in nav, breadcrumbs, og:title — kept under 60 with the suffix. */
  shortTitle: string;
  /** H1 on the page. */
  h1: string;
  /** One-line subhead under the H1. */
  subhead: string;
  /** Meta description, under 158 chars. */
  metaDescription: string;
  /** 200–300 word "honest take" intro. Plain text, paragraphs split by \n\n. */
  honestTake: string;
  /** Comparison table rows. */
  rows: ComparisonRow[];
  /** Decision guide. */
  chooseThem: string[];
  chooseUs: string[];
  /** Shopify Storefront search query used to pull the product strip. */
  productQuery: string;
  /** FAQ entries — wired into JSON-LD FAQPage on the route. */
  faq: ComparisonFAQ[];
};

export const COMPARISONS: Record<Comparison["slug"], Comparison> = {
  farfetch: {
    slug: "farfetch",
    competitor: "Farfetch",
    shortTitle: "Palace of Roman vs Farfetch",
    h1: "Palace of Roman vs Farfetch",
    subhead:
      "Two boutique-network models — one with three thousand voices, one with a single editorial point of view.",
    metaDescription:
      "An honest, side-by-side look at Palace of Roman and Farfetch — sourcing, shipping, returns, pricing and curation. No spin.",
    honestTake:
      "Farfetch built the original global boutique marketplace. It connects shoppers to roughly three thousand boutiques and brands across more than a hundred and ninety countries, which means almost any piece you can name is probably listed somewhere on the platform. That scale is genuinely useful — if you already know the exact reference you want, Farfetch will usually find it.\n\nWhat scale costs is a single voice. Every Farfetch order ships from a different boutique, which means different packaging, different lead times, different return policies, and a different person on the other end of the email. The curation is algorithmic by necessity.\n\nPalace of Roman runs the same boutique-network model with a deliberately narrower aperture. We work with a smaller circle of authorised European boutiques and distributors, and we curate the edit ourselves — one editorial point of view, one set of shipping and return terms, one inbox. If you want every release from every house, Farfetch is the better tool. If you want the pieces we think are worth owning this season, with one consistent experience around them, that is what we built.",
    rows: [
      { label: "Model", them: "Marketplace — ~3,000 partner boutiques", us: "Curated boutique network — single editorial voice", edge: "even" },
      { label: "Brand breadth", them: "1,400+ brands across every category", us: "Focused edit of Italian and European luxury houses", edge: "them" },
      { label: "Shipping origin", them: "Varies per boutique (any of ~190 countries)", us: "Consolidated dispatch from authorised European partners", edge: "us" },
      { label: "Delivery to US", them: "2–7 business days, varies by boutique", us: "3–6 business days express, single tracking number", edge: "even" },
      { label: "Duties & taxes", them: "Calculated at checkout per origin country", us: "DDP available on most US orders — no surprise fees", edge: "us" },
      { label: "Return window", them: "14 days from delivery (boutique-dependent)", us: "14 days from delivery, single return address", edge: "even" },
      { label: "Return shipping", them: "Free in most regions", us: "Free in most regions", edge: "even" },
      { label: "Authenticity guarantee", them: "Partner-boutique sourced — authorised stock only", us: "Partner-boutique sourced — authorised stock only", edge: "even" },
      { label: "Price positioning", them: "RRP, occasional markdowns and member offers", us: "RRP or below on most pieces — no platform premium", edge: "us" },
      { label: "Pre-orders & exclusives", them: "Yes — Farfetch-only capsules with some brands", us: "Not yet — we only sell stock we can ship now", edge: "them" },
      { label: "Customer service", them: "24/7 chat — large team, scripted flows", us: "Direct email reply within 24 hours, Mon–Sat", edge: "us" },
      { label: "Loyalty programme", them: "Access by Farfetch (tiered)", us: "Newsletter previews and private access invites", edge: "them" },
    ],
    chooseThem: [
      "You already know the exact reference number you want and need maximum probability it's listed.",
      "You want a tiered loyalty programme with status perks.",
      "You shop pre-orders and capsule exclusives across many brands.",
    ],
    chooseUs: [
      "You'd rather see a curated edit than scroll a marketplace.",
      "You want one shipping origin, one return policy, and one person to email.",
      "You're price-sensitive and want RRP or below without hunting for discount codes.",
    ],
    productQuery: 'vendor:"Prada" OR vendor:"Gucci" OR vendor:"Bottega Veneta"',
    faq: [
      {
        q: "Is Palace of Roman cheaper than Farfetch?",
        a: "On most overlapping pieces, yes — we hold price at or below RRP and pass through partner-boutique pricing without a platform markup. Farfetch can be cheaper during member-only sales, so it's worth checking both for a specific reference.",
      },
      {
        q: "Are the products on Palace of Roman authentic?",
        a: "Yes. Every piece comes from authorised European boutiques and distributors that are themselves stocked directly by the brands. We never source from grey-market or unauthorised channels. The same authorised-stock standard applies to Farfetch's partner boutiques.",
      },
      {
        q: "Does Palace of Roman ship to the US the way Farfetch does?",
        a: "Yes — express to the US in 3–6 business days with a single tracking number. Unlike Farfetch, every order leaves from the same consolidated dispatch, so packaging and lead times are consistent.",
      },
      {
        q: "What about returns?",
        a: "Fourteen days from delivery, items unworn with original tags. We provide a prepaid return label in most regions. Single return address — no per-boutique routing.",
      },
      {
        q: "Why would I shop Palace of Roman over Farfetch?",
        a: "If you want a single editorial point of view rather than a marketplace, consistent service, and pricing held at or below RRP, we're the better fit. If you want the widest possible catalogue and pre-order access, Farfetch wins on that.",
      },
    ],
  },

  mytheresa: {
    slug: "mytheresa",
    competitor: "Mytheresa",
    shortTitle: "Palace of Roman vs Mytheresa",
    h1: "Palace of Roman vs Mytheresa",
    subhead:
      "Munich's elevated department store, compared against our boutique-network edit.",
    metaDescription:
      "Palace of Roman vs Mytheresa — exclusives, pricing, shipping and curation, compared honestly. What each one is genuinely best for.",
    honestTake:
      "Mytheresa grew out of a Munich boutique and now sits among the most respected luxury e-tailers in the world. Their strength is brand partnerships — many houses release Mytheresa-exclusive capsules every season, and their buying team takes real positions on directional pieces other retailers won't carry. The editorial photography and packaging are at the top of the industry.\n\nThe trade-off is price. Because Mytheresa carries inventory risk, prices on most pieces sit at full RRP, sometimes slightly above on exclusives. Sale season is competitive but narrow.\n\nPalace of Roman runs a lighter, boutique-network model — we don't hold deep inventory, which means we can hold price at or below RRP on the majority of overlapping pieces. We don't get exclusive capsules; we don't pretend to. What we offer is a tighter Italian-house focus, consolidated European dispatch, and a single editorial voice rather than a department-store breadth. If you want this season's Mytheresa-exclusive Loewe collaboration, that's Mytheresa's call. If you want a curated edit of in-season pieces from the houses we cover, at RRP or below, that's us.",
    rows: [
      { label: "Model", them: "Inventory-holding e-tailer, owned stock", us: "Curated boutique network — partner-stocked", edge: "even" },
      { label: "Brand breadth", them: "200+ brands, deep across luxury categories", us: "Focused on Italian and European luxury houses", edge: "them" },
      { label: "Exclusives", them: "Frequent brand-collaboration capsules", us: "No exclusives — only in-season stock", edge: "them" },
      { label: "Shipping origin", them: "Munich, Germany", us: "European authorised partners", edge: "even" },
      { label: "Delivery to US", them: "2–4 business days express", us: "3–6 business days express", edge: "them" },
      { label: "Delivery to EU", them: "1–3 business days", us: "1–3 business days", edge: "even" },
      { label: "Duties & taxes", them: "DDP to most regions — included at checkout", us: "DDP available on most US orders", edge: "even" },
      { label: "Return window", them: "30 days from delivery", us: "14 days from delivery", edge: "them" },
      { label: "Price positioning", them: "Full RRP, premium on exclusives", us: "RRP or below on most pieces", edge: "us" },
      { label: "Sale season", them: "Two main sale windows per year", us: "Limited markdowns — pricing held year-round", edge: "even" },
      { label: "Customer service", them: "Phone, chat, email — large team", us: "Direct email reply within 24 hours, Mon–Sat", edge: "them" },
      { label: "Packaging", them: "Signature box, ribbon, branded dust bags", us: "Brand-original packaging from source boutique", edge: "them" },
    ],
    chooseThem: [
      "You want a brand-exclusive capsule that's only available through Mytheresa.",
      "Same-week US delivery and a thirty-day return window matter to you.",
      "You value signature gift packaging on every order.",
    ],
    chooseUs: [
      "You'd rather pay RRP or below than full retail with premium packaging baked in.",
      "Your taste leans Italian houses — Cucinelli, Prada, Gucci, Bottega, Dolce — rather than the full department-store breadth.",
      "You prefer a single curated edit to a buying-team-by-committee selection.",
    ],
    productQuery: 'vendor:"Brunello Cucinelli" OR vendor:"Prada" OR vendor:"Bottega Veneta"',
    faq: [
      {
        q: "Is Mytheresa more expensive than Palace of Roman?",
        a: "On most overlapping pieces, yes — Mytheresa holds full RRP because they carry inventory and pay for that risk in price. We work through partner boutiques and can usually hold RRP or below. On Mytheresa-exclusive capsules there's no comparison — they're only available there.",
      },
      {
        q: "Will I get the same brands on Palace of Roman that I see on Mytheresa?",
        a: "Most of the major houses overlap — Prada, Gucci, Bottega Veneta, Brunello Cucinelli, Tom Ford, Dolce & Gabbana. We don't carry the full Mytheresa breadth across contemporary brands, and we don't carry their exclusive capsules.",
      },
      {
        q: "How does shipping compare?",
        a: "Mytheresa is slightly faster to the US (2–4 days vs our 3–6), shipping from Munich. Both offer DDP to most regions. Inside the EU we're comparable.",
      },
      {
        q: "What about returns?",
        a: "Mytheresa offers a longer return window — thirty days vs our fourteen. If you regularly buy multiple sizes to compare at home, that matters.",
      },
      {
        q: "Why shop Palace of Roman over Mytheresa?",
        a: "Price, focus, and voice. We hold pricing at or below RRP on most pieces, our edit is narrower and more Italian, and you get one curatorial point of view rather than a department-store selection.",
      },
    ],
  },

  ssense: {
    slug: "ssense",
    competitor: "SSENSE",
    shortTitle: "Palace of Roman vs SSENSE",
    h1: "Palace of Roman vs SSENSE",
    subhead:
      "Montréal's contemporary-luxury powerhouse, compared against our Italian-house focus.",
    metaDescription:
      "Palace of Roman vs SSENSE — brand mix, pricing, shipping and editorial. An honest comparison for anyone deciding between the two.",
    honestTake:
      "SSENSE is the reference point for contemporary luxury online. Their brand mix leans heavily into emerging designers, streetwear-adjacent houses, and Antwerp-school avant-garde — Maison Margiela, Acne, Rick Owens, Comme des Garçons. The editorial photography and site design are among the best in the category, and the iOS app is genuinely good.\n\nIf your taste lives there, SSENSE is hard to beat. The trade-off, depending on where you sit, is that the classic Italian luxury houses are present but not the centre of gravity. Prices sit at full RRP, sometimes slightly above on exclusives, and shipping from Montréal to Europe takes longer than European-origin alternatives.\n\nPalace of Roman is the inverse of that taste profile. Our edit is centred on Italian luxury — Cucinelli, Prada, Gucci, Bottega Veneta, Dolce & Gabbana, Tom Ford, Ferragamo — and on consolidated European dispatch. Pricing sits at RRP or below on most pieces. If your wardrobe is built around Italian craft and you ship within Europe, we're the more natural fit. If your taste is contemporary, conceptual, or Antwerp-school, SSENSE is the right tool.",
    rows: [
      { label: "Model", them: "Inventory-holding e-tailer, owned stock", us: "Curated boutique network — partner-stocked", edge: "even" },
      { label: "Brand mix", them: "Contemporary, streetwear, avant-garde lean", us: "Italian and European luxury houses", edge: "even" },
      { label: "Brand breadth", them: "500+ brands", us: "Focused edit, dozens of houses", edge: "them" },
      { label: "Shipping origin", them: "Montréal, Canada", us: "European authorised partners", edge: "even" },
      { label: "Delivery to US", them: "1–3 business days express", us: "3–6 business days express", edge: "them" },
      { label: "Delivery to EU", them: "3–5 business days from Canada", us: "1–3 business days from EU partners", edge: "us" },
      { label: "Duties & taxes", them: "DDP available to most regions", us: "DDP available on most US orders", edge: "even" },
      { label: "Return window", them: "30 days from delivery", us: "14 days from delivery", edge: "them" },
      { label: "Price positioning", them: "Full RRP, occasional sale", us: "RRP or below on most pieces", edge: "us" },
      { label: "Editorial & photography", them: "Industry-leading", us: "House-photographed for select edits", edge: "them" },
      { label: "App experience", them: "Strong iOS and Android apps", us: "Mobile-first web, no native app", edge: "them" },
      { label: "Customer service", them: "Chat, email — multilingual", us: "Direct email reply within 24 hours, Mon–Sat", edge: "even" },
    ],
    chooseThem: [
      "Your taste leans contemporary, conceptual, or streetwear — Margiela, Acne, Rick Owens, Comme.",
      "You ship to North America and want next-day or two-day express.",
      "You shop on mobile and want a native app experience.",
    ],
    chooseUs: [
      "Your wardrobe is built around classic Italian luxury houses.",
      "You ship within the EU and want one to three day delivery.",
      "You'd rather pay RRP or below than full retail.",
    ],
    productQuery: 'vendor:"Brunello Cucinelli" OR vendor:"Tom Ford" OR vendor:"Bottega Veneta"',
    faq: [
      {
        q: "Does Palace of Roman carry the same brands as SSENSE?",
        a: "There's some overlap in the Italian houses — Prada, Gucci, Bottega Veneta — but very little in the contemporary and avant-garde brands SSENSE is known for. If you're shopping Margiela, Acne or Rick Owens, SSENSE is the right place. For Cucinelli, Tom Ford, Dolce, Ferragamo, we're closer to the centre of the taste.",
      },
      {
        q: "Is Palace of Roman cheaper than SSENSE?",
        a: "On most overlapping pieces, yes — we hold pricing at or below RRP, while SSENSE typically sits at full retail outside sale season.",
      },
      {
        q: "Which one ships faster?",
        a: "It depends where you are. SSENSE is faster to North America from Montréal. We're faster within the EU from European partners.",
      },
      {
        q: "How does the return window compare?",
        a: "SSENSE gives you thirty days from delivery; we give you fourteen. Both accept unworn items with original tags.",
      },
      {
        q: "Why would I shop Palace of Roman over SSENSE?",
        a: "If your taste sits in classic Italian luxury rather than contemporary or avant-garde, you'll find the edit more relevant and the pricing more competitive — and shipping within Europe is meaningfully faster.",
      },
    ],
  },

  "net-a-porter": {
    slug: "net-a-porter",
    competitor: "Net-a-Porter",
    shortTitle: "Palace of Roman vs Net-a-Porter",
    h1: "Palace of Roman vs Net-a-Porter",
    subhead:
      "London's white-glove luxury benchmark, compared against our boutique-network edit.",
    metaDescription:
      "Palace of Roman vs Net-a-Porter — packaging, pricing, exclusives and shipping. An honest comparison of where each one wins.",
    honestTake:
      "Net-a-Porter set the standard for online luxury retail. The London-headquartered platform built its reputation on signature black-and-white packaging, same-day delivery in London and Manhattan, and EIP (Extremely Important People) tier service. The buying is conservative but considered, the editorial pages are excellent, and the brand-exclusive capsules are real.\n\nThe trade-off, again, is price. NAP holds full RRP across the catalogue, with member-only access driving the loyalty experience rather than discounts. Sale season is sharp but limited. The white-glove service is genuine but priced into everything.\n\nPalace of Roman doesn't try to compete on packaging theatre. We work through partner boutiques in Europe, hold pricing at or below RRP on most pieces, and put the savings into the product rather than the box it arrives in. We don't offer same-day delivery anywhere, and we don't run a tiered loyalty programme. What we do offer is a tighter founder-curated edit, direct email service within twenty-four hours, and consolidated European dispatch. If white-glove packaging and same-day London are what you're paying for, NAP is the right answer. If you'd rather see that money in the price tag, we're the alternative.",
    rows: [
      { label: "Model", them: "Inventory-holding e-tailer, owned stock", us: "Curated boutique network — partner-stocked", edge: "even" },
      { label: "Brand breadth", them: "800+ brands across luxury categories", us: "Focused edit of Italian and European houses", edge: "them" },
      { label: "Exclusives", them: "Frequent brand-exclusive capsules", us: "No exclusives — only in-season stock", edge: "them" },
      { label: "Shipping origin", them: "London, UK + regional hubs", us: "European authorised partners", edge: "even" },
      { label: "Same-day delivery", them: "London and NYC zones", us: "Not offered", edge: "them" },
      { label: "Delivery to US", them: "2–3 business days express", us: "3–6 business days express", edge: "them" },
      { label: "Delivery to EU", them: "1–3 business days (post-Brexit duties apply)", us: "1–3 business days, no Brexit overhead", edge: "us" },
      { label: "Duties & taxes", them: "DDP to most regions — calculated at checkout", us: "DDP available on most US orders", edge: "even" },
      { label: "Return window", them: "28 days from delivery", us: "14 days from delivery", edge: "them" },
      { label: "Price positioning", them: "Full RRP, occasional member sale", us: "RRP or below on most pieces", edge: "us" },
      { label: "Loyalty programme", them: "EIP — invitation-only top tier", us: "Newsletter previews and private access invites", edge: "them" },
      { label: "Packaging", them: "Signature black box, ribbon, dust bags", us: "Brand-original packaging from source boutique", edge: "them" },
      { label: "Customer service", them: "24/7 phone, chat, personal shopping", us: "Direct email reply within 24 hours, Mon–Sat", edge: "them" },
    ],
    chooseThem: [
      "You're in central London or Manhattan and value same-day delivery.",
      "Signature packaging and a tiered loyalty programme matter to you.",
      "You want brand-exclusive capsules and EIP-tier personal shopping.",
    ],
    chooseUs: [
      "You'd rather pay RRP or below than full retail with packaging premium.",
      "You ship within the EU and want to skip post-Brexit duty overhead.",
      "You prefer a tighter founder-curated edit to a department-store breadth.",
    ],
    productQuery: 'vendor:"Brunello Cucinelli" OR vendor:"Tom Ford" OR vendor:"Gucci"',
    faq: [
      {
        q: "Is Palace of Roman cheaper than Net-a-Porter?",
        a: "On most overlapping pieces, yes — we hold pricing at or below RRP. NAP sits at full RRP outside sale season, with EIP-only access driving the loyalty experience rather than discounts.",
      },
      {
        q: "Are the same brands on both?",
        a: "There's significant overlap on the Italian houses — Cucinelli, Prada, Gucci, Bottega, Tom Ford, Dolce. We don't carry NAP's full breadth across contemporary and beauty, and we don't carry their brand-exclusive capsules.",
      },
      {
        q: "How does shipping compare?",
        a: "NAP is faster to the US and offers same-day in London and NYC zones. We're comparable within the EU and avoid the post-Brexit duty overhead UK-origin shipments now incur for EU customers.",
      },
      {
        q: "What about packaging?",
        a: "NAP wins. Their signature black box and ribbon are part of the experience and they price it in. We ship in brand-original packaging from the source boutique — clean, but not theatrical.",
      },
      {
        q: "Why shop Palace of Roman over Net-a-Porter?",
        a: "If you'd rather see that packaging-and-loyalty premium reflected in the price tag, and you don't need same-day or EIP-tier service, the math works in our favour on most pieces.",
      },
    ],
  },
};

export const COMPARISON_SLUGS = Object.keys(COMPARISONS) as Array<Comparison["slug"]>;
