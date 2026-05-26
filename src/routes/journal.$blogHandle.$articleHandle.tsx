import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getJournalArticleByHandle,
  type ShopifyArticle,
} from "@/lib/shopify-blog.functions";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/journal/$blogHandle/$articleHandle")({
  loader: async ({ params }) => {
    const article = await getJournalArticleByHandle({
      data: { blogHandle: params.blogHandle, articleHandle: params.articleHandle },
    });
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article as ShopifyArticle | undefined;
    if (!a) return { meta: [{ title: "Article — Palace of Roman" }] };
    const title = `${a.title} — Palace of Roman`;
    const desc = (a.excerpt || a.title).slice(0, 158);
    const path = `/journal/${a.blog.handle}/${a.handle}`;
    const image = a.image?.url;
    const rh = routeHead({ path, title, description: desc, image, type: "article" });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: a.title,
            description: desc,
            image: image ? absoluteUrl(image) : undefined,
            url: absoluteUrl(path),
            datePublished: a.publishedAt,
            author: a.authorName ? { "@type": "Person", name: a.authorName } : undefined,
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
            mainEntityOfPage: absoluteUrl(path),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="bg-canvas text-ink min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">404</p>
      <h1 className="font-serif text-3xl md:text-5xl mb-6">Article not found</h1>
      <Link
        to="/journal"
        className="text-[10px] uppercase tracking-[0.3em] border-b border-ink/30 pb-1 hover:border-ink"
      >
        Return to the Journal →
      </Link>
    </main>
  ),
  errorComponent: ({ error, reset }) => (
    <main className="bg-canvas text-ink min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-2xl md:text-3xl mb-4">Something went wrong</h1>
      <p className="text-sm text-ink/60 mb-6">{error?.message}</p>
      <button onClick={reset} className="text-[10px] uppercase tracking-[0.3em] border-b border-ink/30 pb-1 hover:border-ink">
        Try again
      </button>
    </main>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article: initial } = Route.useLoaderData();
  const params = Route.useParams();
  const fetchArticle = useServerFn(getJournalArticleByHandle);
  const { data } = useQuery({
    queryKey: ["journal-article", params.blogHandle, params.articleHandle],
    queryFn: () =>
      fetchArticle({
        data: { blogHandle: params.blogHandle, articleHandle: params.articleHandle },
      }),
    initialData: initial,
    staleTime: 5 * 60 * 1000,
  });

  const a = data ?? initial;
  const date = new Date(a.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="bg-canvas text-ink">
      <section className="max-w-screen-md mx-auto px-6 pt-20 md:pt-28 pb-10 md:pb-14">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
          {a.blog.title} — {date}
        </p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.02] tracking-tight text-balance">
          {a.title}
        </h1>
        {a.authorName && (
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-ink/60">
            By {a.authorName}
          </p>
        )}
      </section>

      {a.image && (
        <section className="px-0 md:px-6 pb-12 md:pb-16">
          <div className="relative w-full overflow-hidden aspect-[16/9] bg-canvas-raised flex items-center justify-center">
            <img
              src={a.image.url}
              alt={a.image.altText || a.title}
              loading="eager"
              fetchPriority="high"
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>
        </section>
      )}

      <article
        className="max-w-screen-md mx-auto px-6 pb-24 md:pb-32 prose prose-neutral max-w-none font-serif text-lg leading-relaxed text-ink/85
          prose-headings:font-serif prose-headings:text-ink prose-a:text-bronze prose-a:no-underline hover:prose-a:underline
          prose-img:w-full prose-img:rounded-none"
        dangerouslySetInnerHTML={{ __html: a.contentHtml }}
      />

      <section className="border-t border-ink/10 py-16 text-center px-6">
        <Link
          to="/journal"
          className="text-[10px] uppercase tracking-[0.3em] border-b border-ink/30 pb-1 hover:border-ink"
        >
          Return to the Journal →
        </Link>
      </section>
    </main>
  );
}
