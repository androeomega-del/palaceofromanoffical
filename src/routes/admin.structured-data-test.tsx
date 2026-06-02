import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Copy, Check } from "lucide-react";

const ORIGIN = "https://palaceofromanofficial.com";

const RICH_RESULTS_BASE = "https://search.google.com/test/rich-results";
const SCHEMA_VALIDATOR_BASE = "https://validator.schema.org/";

function richResultsUrl(target: string) {
  return `${RICH_RESULTS_BASE}?url=${encodeURIComponent(target)}`;
}
function schemaValidatorUrl(target: string) {
  return `${SCHEMA_VALIDATOR_BASE}#url=${encodeURIComponent(target)}`;
}

type RouteGroup = {
  id: string;
  label: string;
  expected: string[];
  samples: { label: string; path: string }[];
};

const GROUPS: RouteGroup[] = [
  {
    id: "home",
    label: "Homepage",
    expected: ["Organization", "WebSite", "BreadcrumbList"],
    samples: [{ label: "Home", path: "/" }],
  },
  {
    id: "pdp",
    label: "Product (PDP)",
    expected: ["Product", "Offer", "BreadcrumbList"],
    samples: [
      { label: "Beige leather sneakers", path: "/product/beige-calf-leather-bos-taurus-athletic-sneakers-1" },
      { label: "White leather sneakers", path: "/product/white-calf-leather-bos-taurus-athletic-sneakers-1" },
      { label: "Blue cotton cap", path: "/product/blue-cotton-cap-baseball-hat" },
    ],
  },
  {
    id: "collection",
    label: "Collection",
    expected: ["ItemList", "BreadcrumbList"],
    samples: [
      { label: "All collections", path: "/collections" },
      { label: "Italian leather handbags", path: "/collections/italian-leather-handbags" },
      { label: "Designer sunglasses", path: "/collections/designer-sunglasses" },
    ],
  },
  {
    id: "editorial",
    label: "Editorial",
    expected: ["Article", "BreadcrumbList"],
    samples: [
      { label: "The New Evening", path: "/editorial/the-new-evening" },
      { label: "Resort 2026", path: "/editorial/resort-2026" },
      { label: "Versace Now", path: "/editorial/versace-now" },
    ],
  },
];

export const Route = createFileRoute("/admin/structured-data-test")({
  beforeLoad: adminBeforeLoad,
  component: StructuredDataTestPage,
  head: () => ({
    meta: [
      { title: "Structured Data Test — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function StructuredDataTestPage() {
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const customUrl =
    custom.trim().startsWith("http")
      ? custom.trim()
      : custom.trim()
        ? `${ORIGIN}${custom.trim().startsWith("/") ? "" : "/"}${custom.trim()}`
        : "";

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze">House Tools · SEO</p>
        <h1 className="mt-2 font-serif text-4xl">Structured Data Test</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          Validate JSON-LD on the four route types Google rewards with rich results. Each button
          opens Google's Rich Results Test in a new tab with the URL pre-filled — just hit{" "}
          <strong>Test URL</strong> on the Google page. A green “Eligible for rich results” banner
          plus the expected schema types listed below means the page passes.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Seeing <em>“URL is not available to Google”</em>? That usually means the page returned
          non-200 or the bot was rate-limited. Re-run after 30s, and make sure you're testing the
          canonical domain (palaceofromanofficial.com) — not a preview URL.
        </p>
      </div>

      <div className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.id} className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-serif text-2xl">{g.label}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected:{" "}
                  {g.expected.map((t, i) => (
                    <span key={t}>
                      <code className="px-1 py-0.5 bg-muted rounded text-[11px]">{t}</code>
                      {i < g.expected.length - 1 ? " · " : ""}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {g.samples.map((s) => {
                const full = `${ORIGIN}${s.path}`;
                return (
                  <div
                    key={s.path}
                    className="flex flex-wrap items-center gap-2 border-t pt-2 first:border-t-0 first:pt-0"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-[11px] font-mono text-muted-foreground break-all">
                        {full}
                      </div>
                    </div>
                    <Button asChild size="sm" className="h-8 text-xs">
                      <a href={richResultsUrl(full)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        Rich Results Test
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <a href={schemaValidatorUrl(full)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        Schema.org
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => copy(full)}
                      title="Copy URL"
                    >
                      {copied === full ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-1">Test a custom URL</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Paste a full URL or a path like <code>/product/some-handle</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="/product/your-handle  or  https://palaceofromanofficial.com/..."
              className="flex-1 min-w-[260px]"
            />
            <Button
              asChild
              disabled={!customUrl}
              className="h-10"
            >
              <a
                href={customUrl ? richResultsUrl(customUrl) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!customUrl}
                onClick={(e) => {
                  if (!customUrl) e.preventDefault();
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Rich Results Test
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              disabled={!customUrl}
              className="h-10"
            >
              <a
                href={customUrl ? schemaValidatorUrl(customUrl) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!customUrl}
                onClick={(e) => {
                  if (!customUrl) e.preventDefault();
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Schema.org
              </a>
            </Button>
          </div>
          {customUrl ? (
            <p className="mt-2 text-[11px] font-mono text-muted-foreground break-all">
              Will test: {customUrl}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
