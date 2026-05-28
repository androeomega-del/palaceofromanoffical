import { createFileRoute, notFound } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { img } from "@/lib/editorial-library";

type ChapterDef = {
  slug: string;
  heroN: number;
  issueLabel: string;
  title: string;
  subtitle: string;
  intro: string;
  manifesto: string;
  chapters: ThemedChapter[];
  productQuery: string;
  shopTitle: string;
  shopEyebrow: string;
  outroCtas: Array<{ label: string; handle: string }>;
  seoTitle: string;
  seoDesc: string;
};

const CHAPTERS: Record<string, ChapterDef> = {
  "boarding-marina": {
    slug: "boarding-marina",
    heroN: 12,
    issueLabel: "Chapter I — Boarding & Marina",
    title: `Walking\nthe gangway.`,
    subtitle: "Men's — Linen Tailoring, Soft Loafers, The Right Bag",
    intro:
      "How you arrive matters. A pressed linen trouser, a cotton-silk shirt, a loafer that looks lived-in — the marina at noon is the most photographed thirty feet of any charter.",
    manifesto: "Boarding is the only outfit on the trip that everyone sees twice — at the dock and in the group photo.",
    chapters: [
      {
        n: 18,
        eyebrow: "The Trouser",
        title: "Linen, ironed, with intent.",
        body:
          "A wide-cut linen trouser in chalk or sand reads cooler than denim and dressier than chino — the only pant that survives both the gangway and the welcome aperitivo.",
        alt: "Wide-cut chalk linen trousers on a sunlit teak deck",
        spots: [{ x: 50, y: 60, label: "The Trouser", match: /trouser|pant|linen/i }],
      },
      {
        n: 27,
        eyebrow: "The Shirt",
        title: "Cotton-silk, soft at the collar.",
        body:
          "A short-sleeve cotton-silk in ivory or pale blue. The collar should fall, not stand. Untucked is correct.",
        alt: "Ivory cotton-silk camp collar shirt against weathered terracotta",
        flip: true,
        spots: [{ x: 50, y: 50, label: "The Shirt", match: /shirt|polo/i }],
      },
      {
        n: 33,
        eyebrow: "The Loafer",
        title: "Suede, unlined, broken in.",
        body:
          "A driving moc or unlined suede loafer in chocolate or stone. No socks — but a no-show liner saves the leather.",
        alt: "Broken-in chocolate suede loafers on bleached deck planks",
        spots: [{ x: 45, y: 65, label: "The Loafer", match: /loafer|driver|moccasin/i }],
      },
    ],
    productQuery:
      'tag:Men AND (title:linen OR title:loafer OR title:polo OR tag:"category:shirts" OR tag:"category:shoes")',
    shopTitle: "Shop the Boarding Look",
    shopEyebrow: "Men's — Linen, Cotton-Silk, Suede",
    outroCtas: [
      { label: "Linen Shirts", handle: "designer-mens-shirts" },
      { label: "Italian Loafers", handle: "italian-leather-loafers" },
      { label: "Belts", handle: "belts" },
    ],
    seoTitle: "Boarding & Marina — Men's Charter Arrival Wardrobe | Palace of Roman",
    seoDesc:
      "Linen tailoring, cotton-silk shirts and unlined suede loafers — the men's wardrobe for boarding day on a Mediterranean charter.",
  },

  "on-deck": {
    slug: "on-deck",
    heroN: 6,
    issueLabel: "Chapter II — On Deck",
    title: `Hours one\nthrough six.`,
    subtitle: "Men's — Swim Shorts, Terry Polos, Sun",
    intro:
      "The bulk of the day. A five-inch swim short, a terry polo for lunch, sunglasses with weight to them. Nothing more — the deck does the work.",
    manifesto: "On deck, the wardrobe is three pieces and the sea.",
    chapters: [
      {
        n: 3,
        eyebrow: "The Swim",
        title: "Five-inch rise, quick-dry weave.",
        body:
          "Bottega Veneta, Canali, Givenchy. A short cut for the afternoon — gold-tipped drawcords, a clean side seam, a colour you'd wear off the boat too.",
        alt: "Navy designer swim short with gold-tipped drawcord on teak",
        spots: [{ x: 50, y: 55, label: "The Short", match: /swim|short/i }],
      },
      {
        n: 9,
        eyebrow: "The Polo",
        title: "Terry for the late lunch.",
        body:
          "When the wet trunks come off, a terry or piqué polo bridges sun-deck and the dining banquette. Open the placket. Untucked.",
        alt: "Cream terry-cotton polo shirt over linen shorts at a deck table",
        flip: true,
        spots: [{ x: 50, y: 50, label: "The Polo", match: /polo/i }],
      },
      {
        n: 24,
        eyebrow: "The Sunglass",
        title: "Tortoiseshell, with weight.",
        body:
          "A keyhole or pilot frame in deep tortoise. Acetate, not metal — the sea will eat the hinges by day three.",
        alt: "Tortoiseshell pilot sunglasses on a folded cream towel",
        spots: [{ x: 50, y: 50, label: "Sunglasses", match: /sunglass|aviator|eyewear/i }],
      },
    ],
    productQuery:
      'tag:Men AND (tag:"category:shorts" OR tag:"category:swimwear" OR title:polo OR title:sunglasses)',
    shopTitle: "Shop the Deck Look",
    shopEyebrow: "Men's — Swim, Polo, Sunglasses",
    outroCtas: [
      { label: "Swimwear", handle: "swimwear-men" },
      { label: "Bermuda Shorts", handle: "bermuda-shorts" },
      { label: "Sunglasses", handle: "designer-sunglasses" },
    ],
    seoTitle: "On Deck — Men's Swim Shorts & Terry Polos for the Yacht | Palace of Roman",
    seoDesc:
      "Five-inch swim shorts, terry polos and tortoiseshell sunglasses — the men's three-piece deck wardrobe for a Mediterranean charter.",
  },

  "tender-to-town": {
    slug: "tender-to-town",
    heroN: 21,
    issueLabel: "Chapter III — Tender to Town",
    title: `Lunch in\nthe port.`,
    subtitle: "Men's — Open Linen, Woven Slides, A Chain",
    intro:
      "The tender ride into the village is the most photographed outfit of the week — open linen, a leather slide, sun-bleached hair. This is the look that ends up on Instagram.",
    manifesto: "Town isn't a costume change. It's the same wardrobe, finished.",
    chapters: [
      {
        n: 14,
        eyebrow: "The Shirt",
        title: "Linen, three buttons open.",
        body:
          "A boxy linen camp-collar in white, ecru or faded indigo. Three buttons open, hem squared, no undershirt.",
        alt: "White linen camp-collar shirt unbuttoned to the chest in a sunlit piazza",
        spots: [{ x: 50, y: 45, label: "The Linen", match: /linen|shirt/i }],
      },
      {
        n: 36,
        eyebrow: "The Slide",
        title: "Woven leather, off the boat.",
        body:
          "A woven leather slide — Bottega intrecciato, a tan calfskin from Brunello. Worn over bare feet. The shoe carries the whole look.",
        alt: "Tan woven leather slides on cobbled village stone",
        flip: true,
        spots: [{ x: 50, y: 60, label: "The Slide", match: /slide|sandal/i }],
      },
      {
        n: 41,
        eyebrow: "The Detail",
        title: "A chain. Nothing else.",
        body:
          "A fine gold chain at the throat — the only jewelry that survives salt water. No watch in town: the sun does the timekeeping.",
        alt: "Fine gold chain at the throat of an open linen shirt",
        spots: [{ x: 50, y: 50, label: "Belt", match: /belt/i }],
      },
    ],
    productQuery:
      'tag:Men AND (title:linen OR tag:"category:sandals" OR tag:"category:belts" OR title:slide)',
    shopTitle: "Shop the Town Look",
    shopEyebrow: "Men's — Linen, Slides, Belts",
    outroCtas: [
      { label: "Linen Shirts", handle: "designer-mens-shirts" },
      { label: "Sandals & Slides", handle: "sandals-slides" },
      { label: "Belts", handle: "belts" },
    ],
    seoTitle: "Tender to Town — Men's Mediterranean Port Village Wardrobe | Palace of Roman",
    seoDesc:
      "Open linen shirts, woven leather slides and the right detail at the throat — the men's wardrobe for the tender ride to the village.",
  },

  "sunset-dinner": {
    slug: "sunset-dinner",
    heroN: 34,
    issueLabel: "Chapter IV — Sunset Dinner",
    title: `The terrace,\nat seven.`,
    subtitle: "Men's — Ivory Trousers, A Light Jacket, A Shirt That Holds",
    intro:
      "Dinner on the terrace at La Sponda, Da Adolfo, or the back deck. Ivory trousers, a soft jacket draped, a shirt cut for the heat. Dressed, but never overdressed.",
    manifesto: "A man at dinner on a Riviera terrace should look like he could have stayed for breakfast.",
    chapters: [
      {
        n: 30,
        eyebrow: "The Trouser",
        title: "Ivory, with a soft break.",
        body:
          "A pleated ivory trouser — wool-silk or fine cotton. The break should kiss the loafer, not crush it. Belt thin, leather warm.",
        alt: "Pleated ivory trousers with a soft break over leather loafers on a tiled terrace",
        spots: [{ x: 50, y: 60, label: "The Trouser", match: /trouser|pant/i }],
      },
      {
        n: 39,
        eyebrow: "The Shirt",
        title: "Silk-cotton, open at one button.",
        body:
          "A silk-cotton shirt in pale blue, butter, or stone. Top button open, second optional. Not tucked in unless the trouser demands it.",
        alt: "Pale blue silk-cotton dress shirt against a bougainvillea-covered wall at dusk",
        flip: true,
        spots: [{ x: 50, y: 45, label: "The Shirt", match: /shirt/i }],
      },
      {
        n: 45,
        eyebrow: "The Jacket",
        title: "Unstructured. Carried, not worn.",
        body:
          "A linen-wool sport coat in navy or sand. Draped over the chair for the first course, on for the walk back to the tender.",
        alt: "An unstructured navy linen-wool sport coat draped over a rattan chair on a terrace at golden hour",
        spots: [{ x: 50, y: 50, label: "The Jacket", match: /jacket|blazer|coat/i }],
      },
    ],
    productQuery:
      'tag:Men AND (title:linen OR title:trouser OR title:shirt OR tag:"category:jackets" OR tag:"category:shirts")',
    shopTitle: "Shop the Terrace Look",
    shopEyebrow: "Men's — Trousers, Shirts, Soft Jackets",
    outroCtas: [
      { label: "Men's Shirts", handle: "designer-mens-shirts" },
      { label: "Italian Loafers", handle: "italian-leather-loafers" },
      { label: "Belts", handle: "belts" },
    ],
    seoTitle: "Sunset Dinner — Men's Riviera Terrace Dress Code | Palace of Roman",
    seoDesc:
      "Ivory trousers, silk-cotton shirts and unstructured jackets — the men's wardrobe for dinner on a Mediterranean terrace.",
  },

  "watch-drawer": {
    slug: "watch-drawer",
    heroN: 47,
    issueLabel: "Chapter V — The Watch Drawer",
    title: `The small\nthings.`,
    subtitle: "Men's — Belts, Leather, Tortoiseshell, Gold",
    intro:
      "What finishes the week. The belt that quietly says everything. The sunglasses that arrived three years ago and still work. The small things, edited.",
    manifesto: "On a charter, accessories aren't decoration — they're the part of the wardrobe that travels with you home.",
    chapters: [
      {
        n: 52,
        eyebrow: "The Belt",
        title: "Calfskin, worn warm.",
        body:
          "A natural calfskin belt — Italian, soft-edge, brass buckle. The one belt that works with linen, denim, and the dinner trouser.",
        alt: "Natural Italian calfskin belt with brass buckle on a folded ivory trouser",
        spots: [{ x: 50, y: 55, label: "The Belt", match: /belt/i }],
      },
      {
        n: 58,
        eyebrow: "The Frame",
        title: "Tortoiseshell that lasts.",
        body:
          "Deep tortoise acetate. Pilot or keyhole. A frame that survives salt, sweat, and three flights home.",
        alt: "Tortoiseshell pilot sunglasses laid on linen next to a leather card case",
        flip: true,
        spots: [{ x: 50, y: 50, label: "Sunglasses", match: /sunglass|aviator|eyewear/i }],
      },
      {
        n: 62,
        eyebrow: "The Carry",
        title: "Leather, no logo.",
        body:
          "A card case or small cross-body in tan or chocolate calf — the kind of leather that gets better through customs, on the beach, in the rain at dinner.",
        alt: "A small tan leather cross-body bag on a teak chair against the sea",
        spots: [{ x: 50, y: 55, label: "The Bag", match: /bag|case|wallet|crossbody/i }],
      },
    ],
    productQuery:
      'tag:Men AND (tag:"category:belts" OR title:sunglasses OR title:wallet OR tag:"category:bags")',
    shopTitle: "Shop the Watch Drawer",
    shopEyebrow: "Men's — Belts, Sunglasses, Small Leather",
    outroCtas: [
      { label: "Belts", handle: "belts" },
      { label: "Sunglasses", handle: "designer-sunglasses" },
      { label: "Wallets", handle: "italian-leather-wallets" },
    ],
    seoTitle: "The Watch Drawer — Men's Resort Accessories | Palace of Roman",
    seoDesc:
      "Italian calfskin belts, tortoiseshell sunglasses and small leather goods — the men's accessory edit for the Mediterranean charter.",
  },
};

export const Route = createFileRoute("/edits/yacht-edit/$chapter")({
  beforeLoad: ({ params }) => {
    if (!CHAPTERS[params.chapter]) throw notFound();
  },
  head: ({ params }) => {
    const c = CHAPTERS[params.chapter];
    if (!c) return { meta: [{ title: "Not Found" }] };
    const path = `/edits/yacht-edit/${c.slug}`;
    const image = img(c.heroN);
    const rh = routeHead({
      path,
      title: c.seoTitle,
      description: c.seoDesc,
      image,
      type: "article",
    });
    return {
      meta: [{ title: c.seoTitle }, { name: "description", content: c.seoDesc }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: c.seoTitle,
            description: c.seoDesc,
            image: absoluteUrl(image),
            url: absoluteUrl(path),
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
            mainEntityOfPage: absoluteUrl(path),
            isPartOf: {
              "@type": "CreativeWorkSeries",
              name: "The Yacht Edit",
              url: absoluteUrl("/edits/yacht-edit"),
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="min-h-[60vh] grid place-items-center text-center px-6 bg-canvas">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">Not in this edit</p>
        <h1 className="font-serif text-3xl md:text-4xl mb-4">Chapter not found</h1>
        <a href="/edits/yacht-edit" className="underline text-sm">Back to The Yacht Edit</a>
      </div>
    </main>
  ),
  errorComponent: ({ error, reset }) => (
    <main className="min-h-[60vh] grid place-items-center text-center px-6 bg-canvas">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">Something went wrong</p>
        <h1 className="font-serif text-3xl md:text-4xl mb-4">{error.message}</h1>
        <button onClick={reset} className="underline text-sm">Try again</button>
      </div>
    </main>
  ),
  component: ChapterPage,
});

function ChapterPage() {
  const { chapter } = Route.useParams();
  const c = CHAPTERS[chapter]!;
  return (
    <ThemedEdit
      issueLabel={c.issueLabel}
      title={c.title}
      subtitle={c.subtitle}
      intro={c.intro}
      heroN={c.heroN}
      heroAlt={c.seoDesc}
      manifesto={c.manifesto}
      chapters={c.chapters}
      productQuery={c.productQuery}
      shopTitle={c.shopTitle}
      shopEyebrow={c.shopEyebrow}
      outroCtas={c.outroCtas}
    />
  );
}
