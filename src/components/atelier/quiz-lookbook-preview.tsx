/**
 * QuizLookbookPreview — homepage band for returning subscribers who
 * already unlocked the Style Quiz. Reads the email from localStorage,
 * verifies the unlock via a server function (so a manual flag flip can't
 * fake it), and renders a personalised "Your Edit" teaser linking back
 * to /style-quiz and into /shop with the saved facets pre-applied.
 *
 * When there is no verified unlock, the component renders the original
 * Style Quiz CTA (passed via `fallback`) so the homepage layout is
 * unchanged for first-time visitors.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  getQuizUnlock,
  trackQuizFunnel,
  type QuizAnswers,
} from "@/lib/quiz-unlock.functions";
import { getStoredQuizEmail, getStoredQuizToken } from "@/lib/quiz-identity";


// Reuse the same gender-aware imagery the quiz uses, so the homepage
// teaser feels like a continuation of the same edit.
import dgPortrait from "@/assets/dg-campaign-portrait.jpg";
import menSuit from "@/assets/collections/men-suit.jpg";
import knitwear from "@/assets/collections/knitwear.jpg";
import womenBags from "@/assets/marketing-collections/women-bags.jpg";
import menBags from "@/assets/marketing-collections/men-bags.jpg";
import bags from "@/assets/collections/bags.jpg";
import womensShoesAlt from "@/assets/marketing-collections/womens-shoes.jpg";
import mensShoesAlt from "@/assets/marketing-collections/mens-shoes.jpg";
import loafers from "@/assets/marketing-collections/loafers.jpg";
import suits from "@/assets/marketing-collections/suits.jpg";
import womenDress from "@/assets/collections/women-dress.jpg";

const MOOD_TITLES: Record<string, string> = {
  "tailoring cashmere wool minimal": "The Quiet Luxury Edit",
  "evening tuxedo formal": "After Dark",
  "evening silk satin": "After Dark",
  "denim sneakers casual": "The Off-Duty Icon",
  "logo print colour bold": "Statement Edit",
};

function curate(answers: QuizAnswers): {
  title: string;
  hero: string;
  thumbs: string[];
} {
  const g = answers.gender ?? "Women";
  const isMen = g === "Men";
  const isUnisex = g === "Unisex";

  const hero = isMen ? menSuit : isUnisex ? knitwear : dgPortrait;
  const thumbs = [
    isMen ? menBags : isUnisex ? bags : womenBags,
    isMen ? mensShoesAlt : isUnisex ? loafers : womensShoesAlt,
    isMen ? suits : isUnisex ? knitwear : womenDress,
  ];
  const title =
    (answers.q && MOOD_TITLES[answers.q]) ?? `Your ${g} Edit`;

  return { title, hero, thumbs };
}

function buildShopSearch(answers: QuizAnswers): Record<string, unknown> {
  const search: Record<string, unknown> = {};
  if (answers.gender) search.gender = answers.gender;
  if (answers.collection) search.collection = answers.collection;
  if (answers.q) search.q = answers.q;
  if (answers.min !== undefined) search.min = answers.min;
  if (answers.max !== undefined) search.max = answers.max;
  return search;
}

export function QuizLookbookPreview({ fallback }: { fallback: ReactNode }) {
  const navigate = useNavigate();
  const lookupUnlock = useServerFn(getQuizUnlock);
  const track = useServerFn(trackQuizFunnel);

  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const storedEmail = getStoredQuizEmail();
    if (!storedEmail) {
      setChecked(true);
      return;
    }
    void lookupUnlock({ data: { email: storedEmail } })
      .then((res) => {
        if (cancelled) return;
        if (res.unlocked) setAnswers((res.answers ?? {}) as QuizAnswers);
        setChecked(true);
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = useMemo(() => (answers ? curate(answers) : null), [answers]);
  const shopSearch = useMemo(
    () => (answers ? buildShopSearch(answers) : {}),
    [answers],
  );

  if (!checked) return <>{fallback}</>;
  if (!answers || !view) return <>{fallback}</>;

  const fireShopClick = () => {
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    const pagePath =
      typeof window !== "undefined" ? window.location.pathname : undefined;
    void track({
      data: {
        eventType: "quiz_shop_clicked",
        answers,
        pagePath,
        userAgent: ua,
      },
    }).catch(() => undefined);
  };

  return (
    <section
      aria-label="Your curated edit"
      className="bg-canvas border-b border-ink/5"
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-stretch border border-ink/10 bg-canvas-raised overflow-hidden">
          {/* Hero image */}
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-ink/5">
            <img
              src={view.hero}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
                Palace of Roman · {answers.gender ?? "Edit"}
              </p>
              <p className="mt-1 font-serif text-xl md:text-2xl text-white">
                {view.title}
              </p>
            </div>
          </div>

          {/* Copy + actions */}
          <div className="p-6 md:p-10 flex flex-col justify-center gap-6">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
                <Sparkles className="w-3 h-3" /> Welcome back
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
                Your edit is still waiting.
              </h2>
              <p className="mt-3 text-[13px] md:text-sm text-muted-foreground max-w-md">
                We saved your Style Quiz answers. Pick up where you left off —
                browse the curated lookbook or jump straight into the shop with
                your filters pre-applied.
              </p>
            </div>

            {/* Mini thumbnails — quick visual reminder of the edit */}
            <div className="grid grid-cols-3 gap-2 max-w-sm">
              {view.thumbs.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] overflow-hidden bg-ink/5"
                >
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  fireShopClick();
                  navigate({ to: "/shop", search: shopSearch as never });
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors"
              >
                Shop My Edit <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <Link
                to="/style-quiz"
                className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink border-b border-ink/20 hover:border-ink pb-0.5 transition-colors"
              >
                Review the lookbook
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
