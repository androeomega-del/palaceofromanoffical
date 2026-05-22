import { useState, useTransition } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { parseAiSearch, type ParsedSearch } from "@/lib/ai-search.functions";

/**
 * AI-assisted search input. Lives inside the existing search overlay.
 * Submits the raw query to a server function (which calls Claude) and
 * navigates the user to /shop with parsed filter params.
 */
export function AiSearchBar({
  onComplete,
  className,
}: {
  onComplete?: () => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<ParsedSearch | null>(null);
  const navigate = useNavigate();

  const examples = [
    "Black evening dress under $3000",
    "Loewe Puzzle bag in tan",
    "Men's Italian leather sneakers",
    "Vintage Celine Triomphe",
  ];

  function run(query: string) {
    if (!query.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const parsed = await parseAiSearch({ data: { query } });
        setLastParsed(parsed);
        const search: Record<string, unknown> = { q: parsed.q };
        if (parsed.gender) search.gender = parsed.gender;
        if (parsed.collection) search.collection = parsed.collection;
        if (parsed.title) search.title = parsed.title;
        if (parsed.min) search.min = parsed.min;
        if (parsed.max) search.max = parsed.max;
        navigate({ to: "/shop", search: search as never });
        onComplete?.();
      } catch (err) {
        console.error("[ai-search] failed:", err);
        setError("The concierge is briefly unavailable — try a direct search.");
      }
    });
  }

  return (
    <div className={className} data-testid="ai-search-bar">
      <div className="flex items-center gap-3 border border-bronze/40 bg-bronze/5 px-4 py-3.5 rounded-sm">
        <Sparkles className="w-4 h-4 text-bronze flex-shrink-0" strokeWidth={1.5} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(q)}
          placeholder="Ask the concierge — e.g. 'black Loewe bag for travel'"
          aria-label="AI search the boutique in natural language"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
          data-testid="ai-search-input"
        />
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-bronze" />
        ) : (
          <button
            onClick={() => run(q)}
            disabled={!q.trim()}
            aria-label="Run AI search"
            data-testid="ai-search-submit"
            className="text-[10px] uppercase tracking-[0.2em] text-bronze hover:text-ink disabled:opacity-30 transition-colors flex items-center gap-1.5"
          >
            Curate <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-1">
          Try:
        </span>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQ(ex);
              run(ex);
            }}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-bronze underline-offset-4 hover:underline"
            data-testid={`ai-search-example-${ex.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {ex}
          </button>
        ))}
      </div>
      {lastParsed && !error && !isPending && (
        <p className="mt-3 text-xs text-muted-foreground italic" data-testid="ai-search-narrative">
          {lastParsed.narrative}
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs text-bronze" role="alert" data-testid="ai-search-error">
          {error}
        </p>
      )}
    </div>
  );
}
