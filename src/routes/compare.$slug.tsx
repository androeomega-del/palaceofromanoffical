import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ComparisonPage } from "@/components/comparison-page";
import { COMPARISONS, type Comparison } from "@/lib/comparisons";
import { routeHead, pageTitle, absoluteUrl, SITE_NAME } from "@/lib/seo";
import ogFarfetch from "@/assets/og/compare-farfetch.jpg";
import ogMytheresa from "@/assets/og/compare-mytheresa.jpg";
import ogSsense from "@/assets/og/compare-ssense.jpg";
import ogNap from "@/assets/og/compare-net-a-porter.jpg";

const OG_BY_SLUG: Record<Comparison["slug"], string> = {
  farfetch: ogFarfetch,
  mytheresa: ogMytheresa,
  ssense: ogSsense,
  "net-a-porter": ogNap,
};

export const Route = createFileRoute("/compare/$slug")({
  loader: ({ params }) => {
    const data = COMPARISONS[params.slug as Comparison["slug"]];
    if (!data) throw notFound();
    return { data };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {};
    const { data } = loaderData;
    const path = `/compare/${params.slug}`;
    const title = pageTitle(`Palace of Roman vs ${data.competitor}`);
    const description = data.metaDescription;
    const base = routeHead({ path, title, description, image: OG_BY_SLUG[data.slug], type: "article" });
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...base.meta,
      ],
      links: base.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: data.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Compare", item: absoluteUrl("/compare") },
              { "@type": "ListItem", position: 3, name: data.competitor, item: absoluteUrl(path) },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="px-6 py-32 max-w-screen-md mx-auto text-center">
      <h1 className="font-serif text-3xl mb-4">Comparison not found</h1>
      <p className="text-muted-foreground mb-8">
        We don't have a published comparison at this address yet.
      </p>
      <Link to="/compare" className="text-bronze underline">See all comparisons</Link>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="px-6 py-32 max-w-screen-md mx-auto text-center">
      <h1 className="font-serif text-3xl mb-4">Something went wrong</h1>
      <button onClick={reset} className="text-bronze underline">Try again</button>
    </div>
  ),
  component: ComparePage,
});

function ComparePage() {
  const { data } = Route.useLoaderData();
  return <ComparisonPage data={data} />;
}
