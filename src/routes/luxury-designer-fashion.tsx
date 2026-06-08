import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import {
  LandingCollectionPage,
  faqJsonLd,
  breadcrumbJsonLd,
  type LandingFAQ,
} from "@/components/landing-collection-page";
import { landingCollectionQueryOptions } from "@/lib/landing-collection.functions";
import { routeHead, SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * High-intent SEO/PPC landing page — head term "luxury designer fashion".
 *
 * First of a series of head-term landers (handbags, shoes, sunglasses, etc.)
 * built on the existing <LandingCollectionPage /> shell so they SSR with
 * real product anchors via the 60s `landingCollectionQueryOptions` cache.
 *
 * Compliance:
 *  • No fabricated atelier, flagship boutique, or named editor byline.
 *  • No fabricated reviews — empty UI only per Shopify reviews policy.
 *  • Sourcing framed as "global network of authorised boutiques and
 *    distributors" — never names the sourcing partner.
 *  • Leads with the 5 ICP objections (counterfeit, price, try-on,
 *    delivery, personalisation) per mem://business/audience-icp.
 */

const SHOPIFY_QUERY = "designer";
const LANDING_QO = landingCollectionQueryOptions({ query: SHOPIFY_QUERY, first: 12 });

const PATH = "/luxury-designer-fashion";
const H1 = "Luxury Designer Fashion";
const TITLE = `${H1} — Authenticated, Shipped Worldwide`;
const DESC =
  "Curated luxury designer fashion from Versace, Prada, Gucci, Dolce & Gabbana, Bottega Veneta and Brunello Cucinelli. Authenticated, current-season, express worldwide delivery, 14-day returns.";

const FAQS: LandingFAQ[] = [
  {
    q: "How do I know these pieces are authentic?",
    a: "Every order is current-season, new, and sealed in the maison's own packaging. We source through a global network of authorised European boutiques and distributors, never the grey market. Country-of-origin marks, serial stamps, RFID chips (where the maison uses them) and dust-bags arrive intact, and we share the source paperwork on request.",
  },
  {
    q: "Why is the price what it is?",
    a: "These are full-line designer pieces from authorised European distribution. Pricing reflects the same retail bands you'd see at the maison's own boutique in Milan, Paris or London, minus the on-the-ground markup that US flagships add. Where a piece is on a seasonal markdown, the discount is the maison's — never a faked-up MSRP.",
  },
  {
    q: "What if it doesn't fit?",
    a: "14 days from delivery, unworn, tags attached, original packaging. Our courier collects from your address — no restocking fees, no shipping deductions on EU-origin items. Sizing notes and a fit guide appear on every product page; the concierge will pull measurements for any specific piece on request.",
  },
  {
    q: "How fast is delivery?",
    a: "Most orders ship within 1–3 business days from Europe and arrive in 3–7 business days via tracked, insured express courier. Delivery is complimentary worldwide on orders over $250 and duty-paid in the US, UK, EU, and most major markets. The exact lead time appears on each product page.",
  },
  {
    q: "Can I commission a sourcing request?",
    a: "Yes. Message the concierge with the maison, piece, colourway, and size you're after, and we'll source it through the boutique network. Replies within 24 hours, Monday to Saturday. There's no obligation to buy if we find it.",
  },
  {
    q: "Do you carry men's and women's?",
    a: "Both. The women's edit leans ready-to-wear, handbags, footwear and accessories from Prada, Versace, Bottega Veneta, Dolce & Gabbana and Brunello Cucinelli; the men's edit covers tailoring, knitwear, sneakers, and leather goods from the same houses plus Zegna and Burberry.",
  },
];

export const Route = createFileRoute("/luxury-designer-fashion")({
  head: () => {
    const rh = routeHead({ path: PATH, title: TITLE, description: DESC, type: "website" });
    return {
      meta: [{ title: TITLE }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd(SITE_URL, PATH, H1)) },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(LANDING_QO),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div className="p-12 text-center text-ink/70">Page not found.</div>,
  component: Page,
});

function Page() {
  return (
    <LandingCollectionPage
      eyebrow={SITE_NAME}
      h1={H1}
      intro="Authenticated luxury designer fashion from the maisons that matter — Versace, Prada, Gucci, Dolce & Gabbana, Bottega Veneta, Brunello Cucinelli — shipped worldwide, express, duty-paid, returnable within 14 days."
      body={
        <>
          <p>
            Luxury designer fashion is one of the most counterfeited categories on the internet, and the most
            googled. Search "designer handbag" or "luxury sneakers" and the first page is a wall of marketplaces,
            super-fake aggregators, and grey-market resellers with no clear chain of custody. Palace of Roman exists
            for the buyer who already knows the difference and wants a single, curatorial destination — fewer
            maisons, current-season pieces, authorised provenance, a real courier, and a return policy that doesn't
            punish you for trying the size.
          </p>

          <h2>The evolution of luxury designer fashion</h2>
          <p>
            The category we now call "luxury designer fashion" was built in three waves. The first was the
            mid-twentieth-century European haute-couture houses — Dior, Balenciaga, Givenchy — selling one-off
            atelier garments to a tiny global clientele. The second was the ready-to-wear revolution of the
            1970s and '80s, when Giorgio Armani, Gianni Versace, Miuccia Prada and the Dolce &amp; Gabbana
            partnership translated couture's sensibilities into industrially-produced collections that a much
            larger affluent customer could actually buy. The third — the one we're still in — is the conglomerate
            era: LVMH, Kering and Richemont consolidating most of the historic houses, professionalising the
            supply chain, and turning leather goods into the profit engine of the entire industry. Trade
            publications like <em>Business of Fashion</em> and <em>Vogue Business</em> have documented the shift in
            detail; the practical consequence for the buyer is that "designer" today is a tightly-regulated
            category with consistent retail bands across Europe, and a global secondary market that punishes
            anything that isn't authentic.
          </p>
          <h3>The rise of quiet luxury</h3>
          <p>
            The other shift, accelerated by the post-2022 macro mood, is what the trade press calls "quiet
            luxury" — Brunello Cucinelli cashmere, The Row tailoring, Loro Piana cashmere coats, Hermès
            leather goods worn without monogram. The codes are recognisable to people who know the houses and
            invisible to people who don't. Our edit reflects that dual register: the Versace, Dolce &amp;
            Gabbana, and Gucci pieces for the moments that ask to be seen; the Cucinelli, Bottega Veneta, and
            Zegna pieces for the rest of the week.
          </p>

          <h2>How the Palace of Roman edit is curated</h2>
          <p>
            We carry around 100 maisons, deliberately. The selection criteria are simple — authorised
            distribution only, current-season or archive (clearly labelled), and a piece we'd put in our own
            wardrobe. Sourcing runs through a global network of authorised European boutiques and distributors
            across Italy, France, the Netherlands and Germany. We don't list anything we can't trace to its
            authorised origin, and we don't represent deadstock as new.
          </p>
          <h3>What goes into a season's edit</h3>
          <p>
            Each season we pull the lookbooks the houses send to wholesale, the press images released around
            the Milan, Paris and New York shows, and the trade press post-show analysis from BoF and Vogue
            Business. From that we shortlist the pieces that fit the Palace of Roman point of view: tailored
            shapes over branded streetwear, leather and knitwear over logo-driven seasonal pieces, and the
            occasional Versace or Dolce &amp; Gabbana statement that anchors the rest. Sneakers, sunglasses,
            small leather goods and silk are the four accessory categories we go deepest on — they're the
            highest-frequency entry points to the houses and the easiest to ship reliably worldwide.
          </p>

          <h2>The investment pieces worth understanding</h2>
          <p>
            Designer fashion divides into two economic categories: pieces that depreciate the moment the tag
            comes off (most seasonal ready-to-wear) and pieces that hold value or, in narrow cases,
            appreciate (iconic handbags from the top houses, certain tailoring fabrics, and any rare-leather
            piece in pristine condition). Knowing which is which is the difference between buying fashion
            and buying assets.
          </p>
          <h3>The iconic designer handbag</h3>
          <p>
            A handful of bags hold value better than the watch market: the Hermès Birkin and Kelly in classic
            colours and leathers, the Chanel Classic Flap, the Prada Galleria, the Bottega Veneta Cassette
            and Andiamo, and select archive Gucci and Dior pieces. The mechanics are straightforward — limited
            annual production, decades of consistent design, a global pre-owned market that prices them like
            commodities. Calfskin, box calf and lambskin require care; exotic leathers and grained calf
            (Saffiano, Epsom) tolerate everyday use. See our <Link to="/journal/craftsmanship/caring-for-fine-leather" className="underline">guide to caring for fine leather</Link> for the day-to-day routine.
          </p>
          <h3>Outerwear, tailoring and knitwear</h3>
          <p>
            On the apparel side, the pieces that earn their cost-per-wear are unstructured tailoring (Cucinelli,
            Zegna, Boglioli), a properly-cut overcoat in cashmere or virgin wool, and grade-A Mongolian
            cashmere knitwear with linked seams — not overlocked. Our <Link to="/collections/cashmere-sweaters" className="underline">cashmere sweaters</Link> page covers the maisons that knit their own yarn in Italy.
          </p>

          <h2>Craftsmanship, innovation and sustainable luxury</h2>
          <p>
            The most interesting innovation in luxury right now isn't on the catwalk — it's in the tanneries
            and mills. Italian leather houses have moved aggressively toward chrome-free and metal-free
            tanning over the last decade; Cucinelli, Loro Piana and Zegna publish detailed traceability data
            on their cashmere supply chains; recycled-nylon (ECONYL) and certified-organic cottons appear in
            collections from Prada, Gucci and Stella McCartney. Trade reporting from BoF and the
            <em> Vogue Business</em> sustainability index tracks the progress and the gaps honestly. We
            stock pieces from houses with credible programmes, surface country-of-origin and material content
            on each product page, and link to the maison's own sustainability disclosure where it's
            substantive rather than marketing.
          </p>

          <h2>How to style luxury fashion for the modern era</h2>
          <p>
            The wardrobes our clients actually wear day-to-day mix high-end and contemporary: a Cucinelli
            cardigan over a Sunspel tee and Levi's; a Prada nylon jacket with technical trousers and
            sneakers; a Versace silk shirt with vintage denim. The Palace of Roman edit is built to support
            that — investment pieces that anchor a wardrobe rather than replace it. Three habits matter most:
            buy fewer, larger pieces; treat accessories (a single bag, a single pair of sneakers, a single
            pair of sunglasses) as the items that telegraph the rest of the look; and rotate seasonal
            ready-to-wear sparingly, using outerwear and knitwear to refresh a wardrobe without replacing it.
          </p>

          <h2>The future of luxury e-commerce</h2>
          <p>
            For two decades the trade-off in luxury online was speed versus service — fast pure-play
            marketplaces, or slow, opaque boutique websites. The thing that's changed is logistics. Express
            worldwide delivery with full duty paid, real courier insurance, and 14-day returns are now table
            stakes for any serious luxury retailer; what differentiates is curation, communication and
            sourcing depth. Palace of Roman is built around those three things. Every order is tracked
            end-to-end; every concierge enquiry is answered by a human within 24 hours; and the network we
            source through can pull a specific size or colourway from boutiques across Europe within days,
            not weeks.
          </p>
          <h3>The Palace of Roman concierge</h3>
          <p>
            Our concierge handles sizing, sourcing and styling requests by email and message. There are no
            in-person appointments — we're online — but every enquiry is answered by the founder or by
            someone who knows the catalogue in depth. Sourcing requests for archive or hard-to-find pieces
            are quoted within 24 hours; the courier and timeline are confirmed before any payment is taken.
          </p>

          <h2>Authenticity, delivery, and what to expect</h2>
          <p>
            To restate the practical commitments: every piece is authenticated, current-season or clearly
            labelled archive, sourced through authorised European distribution. Express tracked delivery
            worldwide, complimentary over $250, duty-paid in the US, UK, EU and most major markets. 14-day
            returns, courier collection, no restocking fees. Concierge replies within 24 hours, Monday to
            Saturday. The product, the provenance, and the service should all feel of a single piece — that's
            what a luxury edit is supposed to mean.
          </p>
        </>
      }
      shopifyQuery={SHOPIFY_QUERY}
      queryOptions={LANDING_QO}
      faqs={FAQS}
      relatedGuides={[
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
        { to: "/collections/cashmere-sweaters", label: "Cashmere Sweaters" },
        { to: "/collections/luxury-sneakers", label: "Luxury Sneakers" },
        { to: "/collections/designer-sunglasses", label: "Designer Sunglasses" },
        { to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy", label: "Made in Italy vs Designed in Italy" },
        { to: "/journal/craftsmanship/spot-real-italian-leather", label: "How to Spot Real Italian Leather" },
        { to: "/brands", label: "All Designers A–Z" },
      ]}
    />
  );
}
