import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { img } from "@/lib/editorial-library";
import editorialMayHero from "@/assets/editorial/may-2026/1.webp";
import { routeHead } from "@/lib/seo";

type JournalEntry = {
  to: string;
  params?: Record<string, string>;
  issue: string;
  date: string;
  title: string;
  excerpt: string;
  cover: string;
  tag: string;
};

const ENTRIES: JournalEntry[] = [
  {
    to: "/editorial/resort-2026",
    issue: "Issue No. 07",
    date: "August 2026",
    title: "Resort 2026 — Light as Architecture",
    excerpt:
      "A study of cut and shade across the season's most considered resort pieces, photographed in the late Mediterranean light.",
    cover: img(12),
    tag: "Resort",
  },
  {
    to: "/editorial/the-new-evening",
    issue: "Issue No. 06",
    date: "July 2026",
    title: "The New Evening",
    excerpt:
      "Eveningwear, restated. Soft tailoring, fluid surfaces and a quieter relationship with formality.",
    cover: img(34),
    tag: "Eveningwear",
  },
  {
    to: "/editorial/may-2026",
    issue: "Issue No. 05",
    date: "May 2026",
    title: "May 2026 — A study in quiet authority.",
    excerpt:
      "Tailoring, footwear and house codes, photographed in studio light. Shop the look throughout.",
    cover: editorialMayHero,
    tag: "Studio",
  },
];

export const Route = createFileRoute("/journal")({
  head: () => {
    const title = "The Journal — Palace of Roman";
    const desc = "Editorials, house notes and seasonal studies from Palace of Roman — a quiet record of how the season is being worn.";
    const rh = routeHead({ path: "/journal", title, description: desc, image: editorialMayHero });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: JournalPage,
});

function JournalPage() {
  const [featured, ...rest] = ENTRIES;
  return (
    <>
      <SiteHeader />
      <main className="bg-canvas text-ink">
        {/* Masthead */}
        <section className="max-w-screen-2xl mx-auto px-6 pt-20 md:pt-28 pb-12 md:pb-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">The Journal</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight max-w-4xl text-balance">
            Editorials, house notes and seasonal studies.
          </h1>
          <p className="mt-8 max-w-xl text-sm md:text-base text-ink/70 leading-relaxed">
            A slow record of how the season is being worn — and a quieter way to shop the
            pieces we keep returning to.
          </p>
        </section>

        {/* Featured */}
        <section className="px-0 md:px-6 pb-20 md:pb-28">
          <Link
            to={featured.to as any}
            params={featured.params as any}
            className="group block"
          >
            <div className="relative w-full overflow-hidden aspect-[16/10] md:aspect-[21/9] bg-canvas-raised">
              <img
                src={featured.cover}
                alt={featured.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 bg-gradient-to-t from-ink/55 to-transparent">
                <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="text-white">
                    <p className="text-[10px] uppercase tracking-[0.4em] mb-3 opacity-80">
                      {featured.tag} — {featured.issue}
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-tight max-w-2xl text-balance">
                      {featured.title}
                    </h2>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white border-b border-white/60 group-hover:border-white pb-1 self-start md:self-end">
                    Read the editorial →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Archive */}
        <section className="max-w-screen-2xl mx-auto px-6 pb-28 md:pb-40">
          <div className="flex items-end justify-between mb-10 md:mb-16">
            <h2 className="font-serif text-2xl md:text-4xl">Archive</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50">
              {rest.length} {rest.length === 1 ? "issue" : "issues"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            {rest.map((entry) => (
              <Link
                key={entry.to}
                to={entry.to as any}
                params={entry.params as any}
                className="group block"
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-canvas-raised mb-6">
                  <img
                    src={entry.cover}
                    alt={entry.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
                  {entry.tag} — {entry.date}
                </p>
                <h3 className="font-serif text-2xl md:text-3xl leading-tight mb-3 text-balance group-hover:text-bronze transition-colors">
                  {entry.title}
                </h3>
                <p className="text-sm text-ink/70 leading-relaxed max-w-prose text-pretty">
                  {entry.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
