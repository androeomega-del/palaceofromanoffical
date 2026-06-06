import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead, breadcrumbJsonLd } from "@/lib/seo";
import {
  GBP_BUSINESS_URL,
  GBP_REVIEW_COUNT,
  YELP_BUSINESS_URL,
  YELP_REVIEW_COUNT,
} from "@/lib/social-proof";

const TITLE = "Client Reviews — Palace of Roman";
const DESC =
  "Independent client reviews of Palace of Roman, verified on Google and Yelp. We never publish reviews we cannot verify.";

export const Route = createFileRoute("/reviews")({
  head: () => {
    const rh = routeHead({ path: "/reviews", title: TITLE, description: DESC, image: img(7) });
    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Reviews", path: "/reviews" },
    ]);
    return {
      meta: [{ title: TITLE }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(breadcrumb) }],
    };
  },
  component: ReviewsPage,
});

function ReviewsPage() {
  // Per policy: never fabricate reviews. We surface only what is publicly
  // verifiable on third-party platforms and link out for verification.
  const hasGoogle = GBP_REVIEW_COUNT > 0;
  const hasYelp = YELP_REVIEW_COUNT > 0;
  const hasAny = hasGoogle || hasYelp;

  return (
    <EditorialPageShell
      eyebrow="Client Voices"
      title="Reviews, verified — never invented."
      lede="We publish nothing we cannot verify. All client feedback lives on independent platforms, where it is open, dated, and tied to a real account."
      heroSrc={img(7)}
    >
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <section className="grid sm:grid-cols-2 gap-6">
          <a
            href={GBP_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-ink/15 p-8 hover:border-ink transition-colors"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Google Business Profile</p>
            <p className="text-2xl font-serif mb-2">
              {hasGoogle ? `${GBP_REVIEW_COUNT} verified review${GBP_REVIEW_COUNT === 1 ? "" : "s"}` : "No reviews yet"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Read or leave a review on our verified Google listing →
            </p>
          </a>
          <a
            href={YELP_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-ink/15 p-8 hover:border-ink transition-colors"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Yelp</p>
            <p className="text-2xl font-serif mb-2">
              {hasYelp ? `${YELP_REVIEW_COUNT} verified review${YELP_REVIEW_COUNT === 1 ? "" : "s"}` : "No reviews yet"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Read or leave a review on our verified Yelp listing →
            </p>
          </a>
        </section>

        {!hasAny ? (
          <section className="border-t border-ink/10 pt-12 text-center">
            <h2 className="text-xl font-serif mb-4">Early days.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose mx-auto">
              Palace of Roman is a young house. We would rather show you nothing than show you something we invented. If you have ordered from us, a few honest words on Google or Yelp help future clients more than any banner we could write.
            </p>
          </section>
        ) : null}

        <section className="border-t border-ink/10 pt-12 text-center text-sm text-muted-foreground">
          <p>
            Questions before you buy?{" "}
            <Link to="/contact" className="text-ink underline-offset-4 hover:underline">
              Reach our concierge
            </Link>
            .
          </p>
        </section>
      </div>
    </EditorialPageShell>
  );
}
