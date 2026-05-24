import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// The unlock slot is fixed: each edition unlocks 48h after its DB
// `generated_at`, snapped forward to the next 09:00 UTC. The target is
// derived purely from the persisted timestamp — never from `now()` — so the
// countdown cannot drift or reset on re-render/refetch, and DB+client agree
// because both sides reason in UTC.
const CYCLE_MS = 48 * 60 * 60 * 1000;

function nextNineUTCAfter(from: Date): Date {
  const t = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    9, 0, 0, 0,
  ));
  if (t.getTime() <= from.getTime()) {
    t.setUTCDate(t.getUTCDate() + 1);
  }
  return t;
}

function computeUnlockTarget(generatedAt: Date | null): Date {
  if (!generatedAt) return nextNineUTCAfter(new Date());
  const earliest = new Date(generatedAt.getTime() + CYCLE_MS);
  return nextNineUTCAfter(earliest);
}

function formatRemaining(ms: number) {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

interface Props {
  variant?: "hero" | "bar";
  className?: string;
}

export function CurationCountdown({ variant = "hero", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const qc = useQueryClient();

  // Fetch latest active homepage layout timestamp (best-effort).
  const { data: layoutGeneratedAt } = useQuery({
    queryKey: ["homepage-daily-layout", "generated_at"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_daily_layout")
        .select("generated_at")
        .eq("is_active", true)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.generated_at ? new Date(data.generated_at) : null;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Live cache invalidation: when an edition is swapped server-side,
  // every open visitor tab gets pushed and refetches automatically.
  useEffect(() => {
    const channel = supabase
      .channel("homepage-daily-layout-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homepage_daily_layout" },
        () => {
          qc.invalidateQueries({ queryKey: ["homepage-daily-layout"] });
          qc.invalidateQueries({ queryKey: ["home"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Anchor: next 9 AM after the layout was generated (if available),
  // otherwise next 9 AM after now. Always uses local time.
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const anchor = layoutGeneratedAt ?? now;
  let target = nextNineAM(anchor);
  // If anchor was in the past and target has already elapsed, roll forward.
  while (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const { h, m, s } = formatRemaining(target.getTime() - now.getTime());

  const labelBase =
    "font-mono tabular-nums tracking-[0.18em] text-[11px] md:text-xs";

  const content = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={
        variant === "bar"
          ? "group flex items-center justify-center gap-3 md:gap-5 w-full text-canvas/90 hover:text-canvas transition-colors"
          : "group inline-flex items-center gap-3 md:gap-4 text-canvas/90 hover:text-canvas transition-colors"
      }
      aria-label="The current curation expires soon — tap for details"
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
      <span className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] font-light">
        The current curation expires in
      </span>
      <span className={labelBase}>
        <span className="text-bronze">{h}</span>
        <span className="opacity-50 mx-1">:</span>
        <span className="text-bronze">{m}</span>
        <span className="opacity-50 mx-1">:</span>
        <span className="text-bronze">{s}</span>
      </span>
    </button>
  );

  return (
    <>
      <div className={className}>
        {variant === "bar" ? (
          <div className="w-full bg-ink/85 backdrop-blur-sm px-4 py-2.5 border-b border-bronze/30">
            {content}
          </div>
        ) : (
          <div className="inline-flex items-center px-4 py-2 bg-ink/40 backdrop-blur-sm border border-canvas/20">
            {content}
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="bg-canvas text-ink border-l border-ink/10 sm:max-w-md">
          <SheetHeader className="text-left">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-3">
              The 48-Hour Curation
            </p>
            <SheetTitle className="font-serif text-3xl leading-tight">
              A boutique that never stands still.
            </SheetTitle>
            <SheetDescription className="sr-only">
              An explanation of our 48-hour rotating curation cycle.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/80">
            <p>
              Every 48 hours, our edit morphs. Curation is rebuilt from global
              trend signals — what's surging in editorial coverage, what
              stylists are pulling for shoots, what's quietly moving inside
              our boutique.
            </p>
            <p>
              When the countdown reaches zero at <strong>9:00 AM</strong>, a
              new edit is unveiled. Pieces from the previous window are not
              guaranteed to return — many are one-of-a-kind, and once a size
              moves, it moves for good.
            </p>
            <div className="border-t border-ink/10 pt-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
                Why it matters
              </p>
              <ul className="space-y-2 text-sm">
                <li>— Today's edit is curated to today's mood.</li>
                <li>— If a piece speaks to you, secure it in this window.</li>
                <li>— Tomorrow's boutique will look quietly different.</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
