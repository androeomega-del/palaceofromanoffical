import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsPage } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { COMPARISONS, type Comparison } from "@/lib/comparisons";

const COMPETITORS = Object.values(COMPARISONS);

function WinDot() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle bg-bronze" />;
}

export function ComparisonPage({ data }: { data: Comparison }) {
  const productsQ = useQuery({
    queryKey: ["compare-products", data.slug],
    queryFn: () =>
      fetchProductsPage({ first: 8, query: data.productQuery, sortKey: "BEST_SELLING" }),
    staleTime: 5 * 60 * 1000,
  });

  const products = productsQ.data?.edges ?? [];
  const siblings = COMPETITORS.filter((c) => c.slug !== data.slug);

  return (
    <div className="bg-canvas">
      {/* Breadcrumb */}
      <nav className="px-6 pt-8 max-w-screen-xl mx-auto text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <Link to="/" className="hover:text-ink">Boutique</Link>
        <span className="mx-2 opacity-40">/</span>
        <Link to="/compare" className="hover:text-ink">Compare</Link>
        <span className="mx-2 opacity-40">/</span>
        <span className="text-ink/80">{data.competitor}</span>
      </nav>

      {/* Hero */}
      <header className="px-6 pt-12 pb-16 max-w-screen-xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">An Honest Comparison</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight mb-6">
          {data.h1}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-[60ch] leading-relaxed">
          {data.subhead}
        </p>
      </header>

      {/* Honest take */}
      <section className="px-6 pb-20 max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-[180px_1fr] gap-8 md:gap-16 border-t border-ink/10 pt-12">
          <h2 className="text-[11px] uppercase tracking-[0.3em] font-semibold text-ink/70">
            The Honest Take
          </h2>
          <div className="space-y-5 text-[15px] md:text-base leading-[1.75] text-ink/85 max-w-[68ch]">
            {data.honestTake.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 pb-20 max-w-screen-xl mx-auto">
        <div className="border-t border-ink/10 pt-12">
          <h2 className="font-serif text-3xl md:text-4xl mb-2">Side by side</h2>
          <p className="text-sm text-muted-foreground mb-10 max-w-[60ch]">
            Where {data.competitor} wins, we say so. Where we win, we say so. Where it's a wash, we say that too.
          </p>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/15">
                  <th className="text-left py-4 pr-4 font-medium text-[11px] uppercase tracking-[0.2em] text-muted-foreground w-[28%]">
                    Detail
                  </th>
                  <th className="text-left py-4 px-4 font-serif text-base text-ink/80 w-[36%]">
                    {data.competitor}
                  </th>
                  <th className="text-left py-4 pl-4 font-serif text-base text-ink w-[36%]">
                    Palace of Roman
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-b border-ink/5 align-top">
                    <td className="py-4 pr-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="py-4 px-4 text-ink/80 leading-relaxed">
                      {row.edge === "them" ? <WinDot /> : null}
                      {row.them}
                    </td>
                    <td className="py-4 pl-4 text-ink leading-relaxed">
                      {row.edge === "us" ? <WinDot /> : null}
                      {row.us}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bronze align-middle mr-2" />
            indicates the edge on that row
          </p>
        </div>
      </section>

      {/* Decision guide */}
      <section className="px-6 pb-24 max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 border-t border-ink/10 pt-12">
          <div className="bg-ink/[0.025] p-8 md:p-10 border border-ink/10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Choose</p>
            <h3 className="font-serif text-2xl mb-6">{data.competitor}</h3>
            <ul className="space-y-3 text-[15px] leading-relaxed text-ink/85">
              {data.chooseThem.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-ink/30 mt-1.5">—</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-bronze/5 p-8 md:p-10 border border-bronze/30">
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">Choose</p>
            <h3 className="font-serif text-2xl mb-6">Palace of Roman</h3>
            <ul className="space-y-3 text-[15px] leading-relaxed text-ink/85">
              {data.chooseUs.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-bronze mt-1.5">—</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Shoppable strip */}
      {products.length > 0 ? (
        <section className="px-6 pb-24 max-w-screen-xl mx-auto">
          <div className="border-t border-ink/10 pt-12 mb-10 flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl mb-2">From our edit</h2>
              <p className="text-sm text-muted-foreground max-w-[60ch]">
                A small selection of pieces from the houses we carry — held at or below RRP.
              </p>
            </div>
            <Link to="/brands" className="text-[11px] uppercase tracking-[0.25em] text-ink hover:text-bronze">
              See all designers →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.slice(0, 8).map((p, i) => (
              <ProductCard
                key={p.node.id}
                product={p}
                surface={`rail:compare-${data.slug}`}
                position={i}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="px-6 pb-24 max-w-screen-xl mx-auto">
        <div className="border-t border-ink/10 pt-12">
          <h2 className="font-serif text-3xl md:text-4xl mb-10">Frequently asked</h2>
          <div className="space-y-8 max-w-[68ch]">
            {data.faq.map((item, i) => (
              <div key={i}>
                <h3 className="font-medium text-ink mb-3 text-[17px]">{item.q}</h3>
                <p className="text-[15px] leading-[1.75] text-ink/75">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + siblings */}
      <section className="px-6 pb-32 max-w-screen-xl mx-auto">
        <div className="border-t border-ink/10 pt-12 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-3xl mb-4">Browse the edit</h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6 max-w-[50ch]">
              The full Palace of Roman selection — Italian and European luxury, curated and shipped from authorised partners.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/brands" className="px-6 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors">
                Designers A–Z
              </Link>
              <Link to="/shop" className="px-6 py-3 border border-ink text-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors">
                Shop New In
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Other comparisons</p>
            <ul className="space-y-2">
              {siblings.map((sib) => (
                <li key={sib.slug}>
                  <Link
                    to="/compare/$slug"
                    params={{ slug: sib.slug }}
                    className="text-base text-ink hover:text-bronze underline-offset-4 hover:underline"
                  >
                    Palace of Roman vs {sib.competitor} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
