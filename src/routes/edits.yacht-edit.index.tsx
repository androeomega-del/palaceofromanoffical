import { createFileRoute, Link } from "@tanstack/react-router";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { img } from "@/lib/editorial-library";

type Sub = {
  slug: string;
  eyebrow: string;
  title: string;
  blurb: string;
  n: number;
};

const SUBS: Sub[] = [
  {
    slug: "boarding-marina",
    eyebrow: "01",
    title: "Boarding & Marina",
    blurb: "Linen tailoring, soft loafers, the right bag for the gangway. What you wear walking down the dock.",
    n: 12,
  },
  {
    slug: "on-deck",
    eyebrow: "02",
    title: "On Deck",
    blurb: "Swim shorts, terry polos, a hat that holds in the wind. Hours one through six.",
    n: 6,
  },
  {
    slug: "tender-to-town",
    eyebrow: "03",
    title: "Tender to Town",
    blurb: "Open-collar linen, woven slides, a chain at the throat. The lunch in the port village.",
    n: 21,
  },
  {
    slug: "sunset-dinner",
    eyebrow: "04",
    title: "Sunset Dinner",
    blurb: "Ivory trousers, a light jacket, a shirt cut for the heat. The dress code that lands well on a terrace.",
    n: 34,
  },
  {
    slug: "watch-drawer",
    eyebrow: "05",
    title: "The Watch Drawer",
    blurb: "Belts, leather, tortoiseshell, gold. The small things that finish the week.",
    n: 47,
  },
];

const HERO = img(28);
const TITLE = "The Yacht Edit — Men's Mediterranean Charter Wardrobe | Palace of Roman";
const DESC =
  "Five chapters of men's resort dressing for the Mediterranean charter — from the marina at boarding to the terrace at sunset. Curated by Palace of Roman.";

export const Route = createFileRoute("/edits/yacht-edit/")({
  head: () => {
    const path = "/edits/yacht-edit";
    const rh = routeHead({ path, title: TITLE, description: DESC, image: HERO, type: "website" });
    return {
      meta: [{ title: TITLE }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: TITLE,
            description: DESC,
            url: absoluteUrl(path),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
            hasPart: SUBS.map((s) => ({
              "@type": "WebPage",
              name: s.title,
              url: absoluteUrl(`${path}/${s.slug}`),
            })),
          }),
        },
      ],
    };
  },
  component: YachtEditIndex,
});

function YachtEditIndex() {
  return (
    <main className="bg-canvas text-ink">
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[600px] overflow-hidden bg-ink">
        <img
          src={HERO}
          alt="A men's resort wardrobe shot from the deck of a Mediterranean charter at golden hour"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-ink/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent pointer-events-none" />
        <div className="relative h-full flex items-end">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-16 md:pb-24 w-full">
            <span className="block text-[10px] md:text-xs uppercase tracking-[0.5em] text-bronze mb-5">
              The Yacht Edit
            </span>
            <h1 className="font-serif text-canvas text-5xl md:text-7xl lg:text-[8rem] leading-[0.92] max-w-5xl text-balance">
              Seven days
              <br />
              on the Med.
            </h1>
            <p className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.4em] text-canvas/80">
              Men's — A Charter Wardrobe, In Five Chapters
            </p>
            <p className="mt-7 max-w-xl text-canvas/85 text-sm md:text-base leading-relaxed italic">
              From the marina at boarding to the terrace at sunset — the men's resort wardrobe, edited for the charter week. Portofino, Capri, St. Tropez, Porto Cervo.
            </p>
            <div className="mt-8">
              <a
                href="#chapters"
                className="px-9 py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-bronze hover:text-canvas transition-colors"
              >
                Enter the Edit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-canvas">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-6 block">
            The Manifesto
          </span>
          <p className="font-serif text-2xl md:text-4xl leading-[1.25] text-ink mb-8 text-balance">
            “A man's charter wardrobe is the same eight pieces, worn the right way, in the right order, in the right port.”
          </p>
          <p className="text-sm md:text-base text-muted-foreground italic">
            From the Palace of Roman edit.
          </p>
        </div>
      </section>

      {/* CHAPTER GRID */}
      <section id="chapters" className="px-6 md:px-10 pb-24 md:pb-32 bg-canvas scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-12 md:mb-16">
            <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3 block">
              Five Chapters
            </span>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] max-w-2xl">
              From boarding to the last terrace dinner.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {SUBS.map((s) => (
              <Link
                key={s.slug}
                to="/edits/yacht-edit/$chapter"
                params={{ chapter: s.slug }}
                className="group block"
              >
                <div className="aspect-[4/5] overflow-hidden bg-canvas-raised mb-5">
                  <img
                    src={img(s.n)}
                    alt={s.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-2 block">
                  Chapter {s.eyebrow}
                </span>
                <h3 className="font-serif text-2xl md:text-3xl leading-[1.1] mb-3 group-hover:text-bronze transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-ink/75 leading-relaxed max-w-md">{s.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* OUTRO */}
      <section className="border-t border-ink/10 py-20 md:py-28 text-center px-6 bg-canvas">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
          The destinations
        </p>
        <h2 className="font-serif text-3xl md:text-5xl mb-8">Dress the port</h2>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-ink/75 leading-relaxed">
          Coming next — the Palace of Roman destination journals. Portofino, Capri, St. Tropez Charter Week. Dress codes, where to eat, what to wear, who to know.
        </p>
      </section>
    </main>
  );
}
