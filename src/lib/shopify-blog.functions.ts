// Server-fn wrapper for Shopify Storefront blogs + articles.
// Pulls every blog and merges their articles into one chronological feed
// so the Journal page renders whatever the team publishes in Shopify Admin.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { storefrontApiRequest } from "@/lib/shopify";

const handleSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9-]+$/i);
const articleInputSchema = z.object({
  blogHandle: handleSchema,
  articleHandle: handleSchema,
});

/**
 * Sanitize Shopify-authored article HTML before sending it to the browser.
 * Defends against a compromised Shopify admin or supply-chain injection.
 * Allowlist mirrors the editorial markup actually used in Journal posts.
 */
function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "u", "s", "small", "sub", "sup",
      "a", "br", "hr",
      "blockquote", "cite", "q",
      "img", "figure", "figcaption", "picture", "source",
      "table", "thead", "tbody", "tr", "td", "th",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "srcset", "alt", "width", "height", "loading", "sizes"],
      source: ["src", "srcset", "type", "media", "sizes"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}

export type ShopifyArticle = {
  id: string;
  handle: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  publishedAt: string;
  authorName: string | null;
  image: { url: string; altText: string | null } | null;
  tags: string[];
  blog: { handle: string; title: string };
};

const QUERY = `
  query JournalArticles($first: Int!, $articlesPerBlog: Int!) {
    blogs(first: $first) {
      edges {
        node {
          handle
          title
          articles(first: $articlesPerBlog, sortKey: PUBLISHED_AT, reverse: true) {
            edges {
              node {
                id
                handle
                title
                excerpt
                contentHtml
                publishedAt
                tags
                authorV2 { name }
                image { url altText }
              }
            }
          }
        }
      }
    }
  }
`;

type Raw = {
  blogs: {
    edges: Array<{
      node: {
        handle: string;
        title: string;
        articles: {
          edges: Array<{
            node: {
              id: string;
              handle: string;
              title: string;
              excerpt: string | null;
              contentHtml: string;
              publishedAt: string;
              tags: string[];
              authorV2: { name: string } | null;
              image: { url: string; altText: string | null } | null;
            };
          }>;
        };
      };
    }>;
  };
};

export const getJournalArticles = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: boolean; articles: ShopifyArticle[] }> => {
    const res = await storefrontApiRequest<Raw>(QUERY, {
      first: 20,
      articlesPerBlog: 50,
    });
    if (!res?.data?.blogs) return { ok: false, articles: [] };

    const all: ShopifyArticle[] = [];
    for (const b of res.data.blogs.edges) {
      for (const a of b.node.articles.edges) {
        all.push({
          id: a.node.id,
          handle: a.node.handle,
          title: a.node.title,
          excerpt: a.node.excerpt,
          contentHtml: sanitizeArticleHtml(a.node.contentHtml),
          publishedAt: a.node.publishedAt,
          authorName: a.node.authorV2?.name ?? null,
          image: a.node.image,
          tags: a.node.tags ?? [],
          blog: { handle: b.node.handle, title: b.node.title },
        });
      }
    }
    all.sort((x, y) => +new Date(y.publishedAt) - +new Date(x.publishedAt));
    return { ok: true, articles: all };
  },
);

export const getJournalArticleByHandle = createServerFn({ method: "GET" })
  .inputValidator((d: { blogHandle: string; articleHandle: string }) => d)
  .handler(async ({ data }): Promise<ShopifyArticle | null> => {
    const Q = `
      query ArticleByHandle($blogHandle: String!, $articleHandle: String!) {
        blog(handle: $blogHandle) {
          handle
          title
          articleByHandle(handle: $articleHandle) {
            id
            handle
            title
            excerpt
            contentHtml
            publishedAt
            tags
            authorV2 { name }
            image { url altText }
          }
        }
      }
    `;
    const res = await storefrontApiRequest<{
      blog: {
        handle: string;
        title: string;
        articleByHandle: Raw["blogs"]["edges"][number]["node"]["articles"]["edges"][number]["node"] | null;
      } | null;
    }>(Q, data);
    const a = res?.data?.blog?.articleByHandle;
    const b = res?.data?.blog;
    if (!a || !b) return null;
    return {
      id: a.id,
      handle: a.handle,
      title: a.title,
      excerpt: a.excerpt,
      contentHtml: sanitizeArticleHtml(a.contentHtml),
      publishedAt: a.publishedAt,
      authorName: a.authorV2?.name ?? null,
      image: a.image,
      tags: a.tags ?? [],
      blog: { handle: b.handle, title: b.title },
    };
  });
