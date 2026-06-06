/**
 * /preloved — Preloved Master Hub.
 *
 * Server-rendered authority page for our pre-owned luxury edit. Loader
 * primes a 60s-cached Storefront read covering the full preloved tag
 * matrix (Preloved / Pristine / Excellent / New with tags) so cold loads
 * stream real /product/$handle anchors with a flawless CLS profile.
 */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  prelovedHubQueryOptions,
  PRELOVED_CONDITIONS,
  PRELOVED_CONDITION_LABEL,
  type PrelovedCondition,
} from "@/lib/rails/preloved";
import { PrelovedProductTile } from "@/components/preloved-product-tile";
import { absoluteUrl } from "@/lib/seo";

const HUB_TITLE = "Authentic Preloved Luxury Designer Fashion | Palace of Roman Official";
const HUB_DESC =
  "Curated pre-owned designer fashion from Gucci, Prada, Saint Laurent and beyond. Every piece authenticated and condition-graded by Palace of Roman's pre-owned atelier — Pristine, Excellent, and New with Tags.";

export const Route = createFileRoute("/preloved/")({
  head: () => ({
    meta: [
      { title: HUB_TITLE },
      { name: "description", content: HUB_DESC },
      { property: "og:title", content: HUB_TITLE },
      { property: "og:description", content: HUB_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/preloved") },
      { name: "twitter:card", content: "summary_large_image" },
      { rel: "canonical", href: absoluteUrl("/preloved") },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(prelovedHubQueryOptions()),
  component: PrelovedHubPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <main className="mx-auto max-w-screen-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl text-ink">Preloved edit unavailable</h1>
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
  notFoundComponent: () => (
    <main className="mx-auto max-w-screen-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl text-ink">No preloved pieces yet</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Our pre-owned atelier is curating its next intake.
      </p>
    </main>
  ),
});

/** Best-effort condition badge inferred from the product title/vendor for
 * the master hub view. Per-condition pages use the route slug directly. */
function inferConditionLabel(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("new with tag") || t.includes("nwt")) return "New with Tags";
  if (t.includes("pristine")) return "Pristine";
  if (t.includes("excellent")) return "Excellent";
  return "Preloved";
}

function PrelovedHubPage() {
  const { data } = useSuspenseQuery(prelovedHubQueryOptions());
  const products = data?.edges ?? [];

  return (
    <main className="bg-canvas text-ink">
      <section className="px-6 pt-20 pb-10 md:pt-28 md:pb-14 border-b border-ink/5">
        <div className="mx-auto max-w-screen-2xl">
          <p className="text-eyebrow uppercase tracking-[0.22em] text-bronze-deep mb-5">
            The Preloved Edit
          </p>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl max-w-4xl text-balance">
            {HUB_TITLE.split(" | ")[0]}
          </h1>
          <p className="mt-6 max-w-2xl text-sm md:text-base leading-relaxed text-ink-muted">
            Every preloved piece at Palace of Roman moves through a multi-tiered
            authentication and condition pipeline — material verification,
            hardware and stitching review, serial and date-code audit, and a
            curatorial condition grade calibrated to enterprise luxury
            standards. We list only pieces that meet the same craftsmanship
            bar as our new-season edit: authenticated pre-owned designer
            handbags, ready-to-wear, footwear, and accessories from Gucci,
            Prada, Saint Laurent, Bottega Veneta, Loewe and the houses our
            clients return for. Each item is graded Pristine, Excellent, or
            New with Tags, photographed in natural light, and shipped with
            full provenance documentation through our global boutique network.
          </p>
        </div>
      </section>

      <section className="px-6 pt-10 pb-6">
        <div className="mx-auto max-w-screen-2xl">
          <h2 className="sr-only">Browse Preloved by Condition</h2>
          <ul className="flex flex-wrap gap-3" style={{ contain: "layout" }}>
            {PRELOVED_CONDITIONS.map((c: PrelovedCondition) => (
              <li key={c}>
                <Link
                  to="/preloved/$condition"
                  params={{ condition: c }}
                  aria-label={`Browse preloved ${PRELOVED_CONDITION_LABEL[c]} condition designer fashion`}
                  className="inline-flex items-center rounded-sm border border-ink/15 px-4 py-2 text-xs uppercase tracking-[0.22em] text-ink hover:border-ink/40"
                >
                  {PRELOVED_CONDITION_LABEL[c]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div
          className="mx-auto max-w-screen-2xl"
          style={{ contain: "layout", minHeight: "60vh" }}
        >
          {products.length === 0 ? (
            <p className="py-24 text-center text-sm text-ink-muted">
              No preloved pieces available right now. Please check back soon.
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
                    condition={inferConditionLabel(edge.node.title)}
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
