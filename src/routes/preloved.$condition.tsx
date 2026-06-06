/**
 * /preloved/$condition — dynamic per-condition preloved page.
 *
 * Slugs: pristine | excellent | new-with-tags. Anything else throws
 * notFound() so search engines see a clean 404 rather than an empty grid.
 * Loader primes a 60s-cached Storefront read scoped to (Preloved AND
 * <condition>), keyed by market for TTFB consistency.
 */
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  prelovedConditionQueryOptions,
  PRELOVED_CONDITIONS,
  PRELOVED_CONDITION_LABEL,
  type PrelovedCondition,
  type PrelovedPage,
} from "@/lib/rails/preloved";
import { PrelovedProductTile } from "@/components/preloved-product-tile";
import { absoluteUrl } from "@/lib/seo";
import { buildPrelovedConditionJsonLd } from "@/lib/preloved-jsonld";

function parseCondition(raw: string): PrelovedCondition {
  const v = raw.toLowerCase() as PrelovedCondition;
  if (!PRELOVED_CONDITIONS.includes(v)) throw notFound();
  return v;
}

function titleFor(condition: PrelovedCondition): string {
  return `Pristine & Excellent Condition Preloved ${PRELOVED_CONDITION_LABEL[condition]} | Palace of Roman`;
}

function descFor(condition: PrelovedCondition): string {
  const label = PRELOVED_CONDITION_LABEL[condition];
  return `Authenticated preloved designer fashion graded ${label} — pre-owned luxury handbags, ready-to-wear and accessories from Gucci, Prada, Saint Laurent and beyond. Every piece passes Palace of Roman's multi-tiered structural and brand authentication pipeline.`;
}

export const Route = createFileRoute("/preloved/$condition")({
  params: {
    parse: (raw) => ({ condition: parseCondition(raw.condition) }),
    stringify: (parsed) => ({ condition: parsed.condition }),
  },
  head: ({
    params,
    loaderData,
  }: {
    params: { condition: PrelovedCondition };
    loaderData?: PrelovedPage;
  }) => {
    const title = titleFor(params.condition);
    const desc = descFor(params.condition);
    const url = absoluteUrl(`/preloved/${params.condition}`);
    const products = (loaderData?.edges ?? []).map((e) => e.node);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: buildPrelovedConditionJsonLd(params.condition, products),
        },
      ],
    };
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      prelovedConditionQueryOptions(params.condition as PrelovedCondition),
    ),
  component: PrelovedConditionPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <main className="mx-auto max-w-screen-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl text-ink">Edit unavailable</h1>
        <p className="mt-3 text-sm text-ink-muted">{error.message}</p>
        <button
          type="button"
          className="mt-6 rounded-sm border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.18em]"
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          Retry
        </button>
      </main>
    );
  },
  notFoundComponent: () => {
    const params = Route.useParams();
    return (
      <main className="mx-auto max-w-screen-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl text-ink">Condition not found</h1>
        <p className="mt-3 text-sm text-ink-muted">
          “{String(params.condition)}” is not a recognised preloved condition.
        </p>
        <Link
          to="/preloved"
          className="mt-6 inline-block rounded-sm border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.22em]"
        >
          Browse all preloved
        </Link>
      </main>
    );
  },
});

function PrelovedConditionPage() {
  const params = Route.useParams();
  const condition = params.condition as PrelovedCondition;
  const label = PRELOVED_CONDITION_LABEL[condition];
  const { data } = useSuspenseQuery(prelovedConditionQueryOptions(condition));
  const products = data?.edges ?? [];

  const h1 = `Pristine & Excellent Condition Preloved ${label} | Palace of Roman`;
  const badge = label.toUpperCase();

  return (
    <main className="bg-canvas text-ink">
      <section className="px-6 pt-20 pb-10 md:pt-28 md:pb-14 border-b border-ink/5">
        <div className="mx-auto max-w-screen-2xl">
          <p className="text-eyebrow uppercase tracking-[0.22em] text-bronze-deep mb-5">
            Preloved — {label}
          </p>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl max-w-4xl text-balance">
            {h1}
          </h1>
          <p className="mt-6 max-w-2xl text-sm md:text-base leading-relaxed text-ink-muted">
            Each {label.toLowerCase()} preloved piece is authenticated through
            our multi-tiered structural and brand pipeline — material grading,
            hardware and serial verification, stitching and finish review, and
            a curatorial condition audit calibrated to enterprise luxury
            standards. Sourced through our global boutique network and shipped
            with full provenance documentation. Browse authenticated pre-owned
            designer pieces from Gucci, Prada, Saint Laurent, Bottega Veneta,
            Loewe and the houses our clients return for.
          </p>

          <ul className="mt-8 flex flex-wrap gap-3" style={{ contain: "layout" }}>
            {PRELOVED_CONDITIONS.map((c) => (
              <li key={c}>
                <Link
                  to="/preloved/$condition"
                  params={{ condition: c }}
                  aria-label={`Browse preloved ${PRELOVED_CONDITION_LABEL[c]} condition designer fashion`}
                  className={`inline-flex items-center rounded-sm border px-4 py-2 text-xs uppercase tracking-[0.22em] ${
                    c === condition
                      ? "border-ink bg-ink text-canvas"
                      : "border-ink/15 text-ink hover:border-ink/40"
                  }`}
                  activeProps={{}}
                >
                  {PRELOVED_CONDITION_LABEL[c]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-24 pt-10">
        <div
          className="mx-auto max-w-screen-2xl"
          style={{ contain: "layout", minHeight: "60vh" }}
        >
          {products.length === 0 ? (
            <p className="py-24 text-center text-sm text-ink-muted">
              No {label.toLowerCase()} preloved pieces available right now.
            </p>
          ) : (
            <ul
              className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4"
              style={{ contain: "layout" }}
            >
              {products.map((edge, i) => (
                <li key={edge.node.handle} style={{ contain: "layout" }}>
                  <PrelovedProductTile
                    product={edge.node}
                    condition={badge}
                    position={i}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
