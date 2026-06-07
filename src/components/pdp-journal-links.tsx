import { Link } from "@tanstack/react-router";

type Guide = { to: string; title: string; eyebrow: string };

/**
 * Pick 1–2 journal articles + 0–1 preloved links relevant to a product so
 * the PDP carries outbound internal links to editorial and archive surfaces.
 * The match runs on productType, title, vendor and tag keywords.
 */
function pickGuides(opts: {
  productType?: string | null;
  title?: string | null;
  vendor?: string | null;
  tags?: string[] | null;
}): Guide[] {
  const hay = [opts.productType, opts.title, opts.vendor, ...(opts.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const all: { match: RegExp; guide: Guide }[] = [
    {
      match: /cashmere|sweater|knit|jumper|cardigan/,
      guide: {
        to: "/journal/style/the-cashmere-field-guide",
        title: "The Cashmere Field Guide — Grade, Ply, and the Sweaters Worth Keeping",
        eyebrow: "Material",
      },
    },
    {
      match: /sneaker|trainer/,
      guide: {
        to: "/journal/style/luxury-sneakers-as-modern-tailoring",
        title: "Luxury Sneakers as Modern Tailoring",
        eyebrow: "Style",
      },
    },
    {
      match: /sunglass|eyewear|optical/,
      guide: {
        to: "/journal/style/the-investment-sunglasses-edit",
        title: "The Investment Sunglasses Edit — Frames That Outlast a Trend",
        eyebrow: "Style",
      },
    },
    {
      match: /leather|wallet|loafer|handbag|tote|crossbody|belt|bag/,
      guide: {
        to: "/journal/craftsmanship/spot-real-italian-leather",
        title: "How to Spot Real Italian Leather — A Buyer's Guide",
        eyebrow: "Craftsmanship",
      },
    },
    {
      match: /leather|wallet|loafer|handbag|tote|crossbody|belt|bag/,
      guide: {
        to: "/journal/craftsmanship/caring-for-fine-leather",
        title: "Caring for Fine Leather — A Maison-Level Guide",
        eyebrow: "Craftsmanship",
      },
    },
  ];

  const prelovedAll: { match: RegExp; guide: Guide }[] = [
    {
      match: /cashmere|sweater|knit|jumper|cardigan/,
      guide: {
        to: "/preloved",
        title: "Authenticated Preloved Knitwear — Graded, Provenanced",
        eyebrow: "The Archive",
      },
    },
    {
      match: /sunglass|eyewear|optical|frame/,
      guide: {
        to: "/preloved",
        title: "Preloved Designer Eyewear — Frames with Provenance",
        eyebrow: "The Archive",
      },
    },
    {
      match: /leather|wallet|loafer|handbag|tote|crossbody|belt|bag|briefcase/,
      guide: {
        to: "/preloved",
        title: "Investment-Grade Preloved Leather — Bags, Wallets & Belts",
        eyebrow: "The Archive",
      },
    },
    {
      match: /sneaker|trainer|shoe|boot|loafer|sandal|mule/,
      guide: {
        to: "/preloved",
        title: "Preloved Designer Footwear — Authenticated, Condition-Graded",
        eyebrow: "The Archive",
      },
    },
  ];

  const picked: Guide[] = [];
  for (const row of all) {
    if (row.match.test(hay) && !picked.find((g) => g.to === row.guide.to)) {
      picked.push(row.guide);
      if (picked.length === 2) break;
    }
  }

  // Add one preloved link when relevant (only if the general preloved tag is present,
  // or the product category strongly suggests preloved inventory exists).
  for (const row of prelovedAll) {
    if (row.match.test(hay) && !picked.find((g) => g.to === row.guide.to)) {
      picked.push(row.guide);
      break;
    }
  }

  if (picked.length === 0) {
    picked.push({
      to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy",
      title: "Made in Italy vs Designed in Italy — What the Label Really Means",
      eyebrow: "Craftsmanship",
    });
  }

  return picked;
}

export function PdpJournalLinks(props: {
  productType?: string | null;
  title?: string | null;
  vendor?: string | null;
  tags?: string[] | null;
}) {
  const guides = pickGuides(props);
  if (guides.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]">
      <div className="mb-12 text-center md:text-left">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold mb-3">
          Explore Further
        </p>
        <h2 className="font-serif text-3xl md:text-4xl">Related Reading</h2>
        <p className="mt-3 text-[var(--studio-ink)]/70 max-w-xl">
          Journal essays and authenticated archive pieces related to this item.
        </p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-4 md:gap-6">
        {guides.map((g) => (
          <li key={g.to}>
            <Link
              to={g.to}
              className="group block border border-[var(--studio-rule)] p-6 md:p-8 hover:border-[var(--studio-ink)] transition-colors h-full"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold mb-3">
                {g.eyebrow}
              </p>
              <h3 className="font-serif text-xl md:text-2xl leading-snug">{g.title}</h3>
              <span className="mt-4 inline-block text-[10px] uppercase tracking-[0.25em] border-b border-[var(--studio-ink)]/40 pb-1 group-hover:border-[var(--studio-ink)]">
                {g.to.startsWith("/preloved") ? "Browse the archive →" : "Read the guide →"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
