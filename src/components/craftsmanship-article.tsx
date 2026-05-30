import { Link } from "@tanstack/react-router";
import { JournalShopRail } from "@/components/journal-shop-rail";

export type RelatedLink = { to: string; label: string };

export function CraftsmanshipArticle({
  eyebrow,
  title,
  dek,
  readingMinutes,
  body,
  related,
}: {
  eyebrow: string;
  title: string;
  dek: string;
  readingMinutes: number;
  body: React.ReactNode;
  related: RelatedLink[];
}) {
  return (
    <main className="bg-canvas text-ink">
      <article className="mx-auto max-w-3xl px-6 py-10 md:py-20">
        <header className="mb-12 text-center border-b border-ink/10 pb-10">
          <p className="text-eyebrow uppercase text-bronze-deep mb-5">
            {eyebrow} · {readingMinutes} min read
          </p>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05]">{title}</h1>
          <p className="mt-6 text-base md:text-lg text-ink/70 max-w-xl mx-auto leading-relaxed">
            {dek}
          </p>
        </header>

        <div className="prose prose-neutral max-w-none font-serif text-[17px] leading-[1.8] [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_li]:mb-2 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-bronze">
          {body}
        </div>

        {related.length > 0 ? (
          <aside className="mt-16 border-t border-ink/10 pt-10">
            <p className="text-eyebrow uppercase text-bronze-deep mb-4">
              Shop the subject
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    className="block border border-ink/15 px-4 py-4 text-sm hover:border-ink hover:bg-ink/5 transition-colors"
                  >
                    <span className="font-serif">{r.label}</span>
                    <span className="ml-2 text-bronze">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        {related.length > 0 ? <JournalShopRail sources={related} /> : null}

        <nav className="mt-16 text-center">
          <Link
            to="/journal"
            className="text-[10px] uppercase tracking-[0.3em] border-b border-ink/30 pb-1 hover:border-ink"
          >
            ← Return to the Journal
          </Link>
        </nav>
      </article>
    </main>
  );
}
