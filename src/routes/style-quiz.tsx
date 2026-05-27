import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import { routeHead } from "@/lib/seo";
import {
  unlockQuizLookbook,
  getQuizUnlock,
  trackQuizFunnel,
  recordLookbookView,
} from "@/lib/quiz-unlock.functions";

// Gender-aware imagery — every option uses a real, on-topic marketing asset
// so the picture always matches the answer.
import marketingWomen from "@/assets/marketing-women-summer.jpg";
import marketingMen from "@/assets/marketing-men-summer.jpg";
import accessoriesHero from "@/assets/marketing-accessories-summer.jpg";

import womenDress from "@/assets/collections/women-dress.jpg";
import womenBlouse from "@/assets/collections/women-blouse.jpg";
import womenOuterwear from "@/assets/collections/women-outerwear.jpg";
import womenShoes from "@/assets/collections/women-shoes.jpg";
import menSuit from "@/assets/collections/men-suit.jpg";
import menShirt from "@/assets/collections/men-shirt.jpg";
import menOuterwear from "@/assets/collections/men-outerwear.jpg";
import menShoes from "@/assets/collections/men-shoes.jpg";
import bags from "@/assets/collections/bags.jpg";
import knitwear from "@/assets/collections/knitwear.jpg";
import accessoriesCol from "@/assets/collections/accessories.jpg";

import womenBags from "@/assets/marketing-collections/women-bags.jpg";
import menBags from "@/assets/marketing-collections/men-bags.jpg";
import womensShoesAlt from "@/assets/marketing-collections/womens-shoes.jpg";
import mensShoesAlt from "@/assets/marketing-collections/mens-shoes.jpg";
import womenAccessories from "@/assets/marketing-collections/women-accessories.jpg";
import menAccessories from "@/assets/marketing-collections/men-accessories.jpg";
import suits from "@/assets/marketing-collections/suits.jpg";
import shirts from "@/assets/marketing-collections/shirts.jpg";
import skirts from "@/assets/marketing-collections/skirts.jpg";
import loafers from "@/assets/marketing-collections/loafers.jpg";


import dgPortrait from "@/assets/dg-campaign-portrait.jpg";
import dgDetail1 from "@/assets/dg-campaign-detail-1.jpg";
import dgDetail2 from "@/assets/dg-campaign-detail-2.jpg";
import versace from "@/assets/marketing-versace.jpg";
import ck from "@/assets/marketing-calvin-klein.jpg";
import jewelry from "@/assets/marketing-jewelry-summer.jpg";
import sale from "@/assets/marketing-summer-sale.jpg";

export const Route = createFileRoute("/style-quiz")({
  head: () => {
    const title = "Style Quiz — Find Your Edit | Palace of Roman";
    const desc =
      "Answer four quick questions and we'll curate a tailored selection from the Palace of Roman boutique — by gender, category, mood and budget.";
    const rh = routeHead({ path: "/style-quiz", title, description: desc });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: StyleQuizPage,
});

type Gender = "Women" | "Men" | "Unisex";
type Answers = {
  gender?: Gender;
  collection?: string;
  q?: string;
  min?: number;
  max?: number;
};

type Option = {
  label: string;
  caption?: string;
  image: string;
  apply: (a: Answers) => Answers;
};

type Question = {
  key: string;
  eyebrow: string;
  prompt: string;
  options: Option[];
};

// Build the question set dynamically so that every image after Q1 reflects
// the gender the user selected.
function buildQuestions(answers: Answers): Question[] {
  const g: Gender = answers.gender ?? "Women";
  const isMen = g === "Men";
  const isUnisex = g === "Unisex";

  // ---- Mood imagery, gender-aware ----
  const moodQuiet = isMen ? menSuit : isUnisex ? knitwear : womenOuterwear;
  const moodEvening = isMen ? dgPortrait : dgDetail1;
  const moodOffDuty = isMen ? menShirt : isUnisex ? ck : womenBlouse;
  const moodStatement = isMen ? versace : isUnisex ? dgDetail2 : jewelry;

  // ---- Category imagery, gender-aware ----
  const catBags = isMen ? menBags : isUnisex ? bags : womenBags;
  const catShoes = isMen ? mensShoesAlt : isUnisex ? loafers : womensShoesAlt;
  const catRTW = isMen ? suits : isUnisex ? knitwear : womenDress;
  const catAccessories = isMen ? menAccessories : isUnisex ? accessoriesCol : womenAccessories;

  // ---- Budget tier imagery, also gender-aware where it helps ----
  const budgetLow = isMen ? shirts : sale;
  const budgetMid = isMen ? loafers : skirts;
  const budgetHigh = isMen ? menOuterwear : womenShoes;
  const budgetTop = isMen ? menSuit : dgPortrait;

  return [
    {
      key: "gender",
      eyebrow: "01 — The wardrobe",
      prompt: "Who are we curating for?",
      options: [
        { label: "Women", image: marketingWomen, apply: (a) => ({ ...a, gender: "Women" }) },
        { label: "Men", image: marketingMen, apply: (a) => ({ ...a, gender: "Men" }) },
        { label: "Unisex", image: accessoriesHero, apply: (a) => ({ ...a, gender: "Unisex" }) },
      ],
    },
    {
      key: "mood",
      eyebrow: "02 — The mood",
      prompt: "Which aesthetic speaks to you?",
      options: [
        {
          label: "Quiet Luxury",
          caption: "Tonal neutrals, refined tailoring",
          image: moodQuiet,
          apply: (a) => ({ ...a, q: "tailoring cashmere wool minimal" }),
        },
        {
          label: "Evening & Occasion",
          caption: "Drama after dark",
          image: moodEvening,
          apply: (a) =>
            isMen
              ? { ...a, q: "evening tuxedo formal" }
              : { ...a, collection: "dresses", q: "evening silk satin" },
        },
        {
          label: "Off-Duty Icon",
          caption: "Denim, sneakers, ease",
          image: moodOffDuty,
          apply: (a) => ({ ...a, q: "denim sneakers casual" }),
        },
        {
          label: "Statement Pieces",
          caption: "Loud logos, bold colour",
          image: moodStatement,
          apply: (a) => ({ ...a, q: "logo print colour bold" }),
        },
      ],
    },
    {
      key: "category",
      eyebrow: "03 — The piece",
      prompt: "What are you in the market for?",
      options: [
        { label: "Bags", image: catBags, apply: (a) => ({ ...a, collection: "bags" }) },
        { label: "Shoes", image: catShoes, apply: (a) => ({ ...a, collection: "shoes" }) },
        {
          label: "Ready-to-Wear",
          image: catRTW,
          apply: (a) => ({ ...a, collection: isMen ? "men-clothing" : "dresses" }),
        },
        {
          label: "Accessories",
          image: catAccessories,
          apply: (a) => ({ ...a, collection: "sunglasses" }),
        },
      ],
    },
    {
      key: "budget",
      eyebrow: "04 — The investment",
      prompt: "What's your comfortable range?",
      options: [
        { label: "Under $250", image: budgetLow, apply: (a) => ({ ...a, max: 250 }) },
        { label: "$250 — $750", image: budgetMid, apply: (a) => ({ ...a, min: 250, max: 750 }) },
        { label: "$750 — $1,500", image: budgetHigh, apply: (a) => ({ ...a, min: 750, max: 1500 }) },
        { label: "No ceiling", image: budgetTop, apply: (a) => ({ ...a }) },
      ],
    },
  ];
}

import {
  QUIZ_SESSION_KEY,
  getStoredQuizEmail,
  getStoredQuizAnswers,
  setStoredQuizUnlock,
  clearStoredQuizUnlock,
  normalizeEmail,
} from "@/lib/quiz-identity";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = window.localStorage.getItem(QUIZ_SESSION_KEY);
    if (!s) {
      s =
        (globalThis.crypto?.randomUUID?.() ??
          `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
      window.localStorage.setItem(QUIZ_SESSION_KEY, s);
    }
    return s;
  } catch {
    return "";
  }
}

function buildShopSearch(answers: Answers): Record<string, unknown> {
  const search: Record<string, unknown> = {};
  if (answers.gender) search.gender = answers.gender;
  if (answers.collection) search.collection = answers.collection;
  if (answers.q) search.q = answers.q;
  if (answers.min !== undefined) search.min = answers.min;
  if (answers.max !== undefined) search.max = answers.max;
  return search;
}

function curateLookbook(answers: Answers): {
  title: string;
  intro: string;
  hero: string;
  cards: { src: string; label: string; caption: string }[];
} {
  const g: Gender = answers.gender ?? "Women";
  const isMen = g === "Men";
  const isUnisex = g === "Unisex";

  const moodMap: Record<string, { title: string; intro: string }> = {
    "tailoring cashmere wool minimal": {
      title: "The Quiet Luxury Edit",
      intro:
        "Tonal neutrals, considered tailoring, and the kind of pieces that whisper rather than shout.",
    },
    "evening tuxedo formal": {
      title: "After Dark",
      intro:
        "Sharp tailoring and occasion pieces curated for the evenings that matter.",
    },
    "evening silk satin": {
      title: "After Dark",
      intro:
        "Silk, satin, and the drama of an evening you'll remember — curated to your eye.",
    },
    "denim sneakers casual": {
      title: "The Off-Duty Icon",
      intro:
        "Effortless pieces with provenance — denim, leather sneakers, and weekend-ready layers.",
    },
    "logo print colour bold": {
      title: "Statement Edit",
      intro:
        "Bold colour, signature prints, and the maisons known for being unmistakable.",
    },
  };
  const mood = (answers.q && moodMap[answers.q]) || {
    title: "Your Edit",
    intro: "A tailored selection from the boutique, curated to your answers.",
  };

  const hero = isMen ? menSuit : isUnisex ? knitwear : dgPortrait;

  const cards = [
    {
      src: isMen ? menBags : isUnisex ? bags : womenBags,
      label: "Carry",
      caption: "Bags chosen for shape and craft.",
    },
    {
      src: isMen ? mensShoesAlt : isUnisex ? loafers : womensShoesAlt,
      label: "On Foot",
      caption: "Footwear in your aesthetic.",
    },
    {
      src: isMen ? suits : isUnisex ? knitwear : womenDress,
      label: "Wear",
      caption: "Ready-to-wear with intent.",
    },
    {
      src: isMen
        ? menAccessories
        : isUnisex
          ? accessoriesCol
          : womenAccessories,
      label: "Finish",
      caption: "Accessories to complete it.",
    },
  ];

  return { title: mood.title, intro: mood.intro, hero, cards };
}

function StyleQuizPage() {
  const navigate = useNavigate();
  const unlock = useServerFn(unlockQuizLookbook);
  const lookupUnlock = useServerFn(getQuizUnlock);
  const track = useServerFn(trackQuizFunnel);
  const recordView = useServerFn(recordLookbookView);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<"quiz" | "gate" | "lookbook">("quiz");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false);

  const startedRef = useRef(false);
  const gateViewedRef = useRef(false);
  const lookbookViewedRef = useRef(false);

  // Cross-refresh dedupe for unique funnel events. Server also enforces
  // dedupe by (session_id, event_type), but this avoids the unnecessary
  // round-trip when the user reloads the page mid-quiz.
  const ONCE_KEY = "por:quiz:funnel-once";
  const hasFiredOnce = (eventType: string): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.sessionStorage.getItem(ONCE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, true>) : {};
      return Boolean(map[eventType]);
    } catch {
      return false;
    }
  };
  const markFiredOnce = (eventType: string) => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(ONCE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, true>) : {};
      map[eventType] = true;
      window.sessionStorage.setItem(ONCE_KEY, JSON.stringify(map));
    } catch {}
  };

  const UNIQUE_EVENTS = new Set([
    "quiz_started",
    "quiz_gate_viewed",
    "quiz_gate_submitted",
  ]);

  const fireTrack = (
    eventType:
      | "quiz_started"
      | "quiz_step"
      | "quiz_gate_viewed"
      | "quiz_gate_submitted"
      | "quiz_lookbook_viewed"
      | "quiz_shop_clicked"
      | "quiz_unlock_resumed",
    extra: { step?: number; email?: string; answers?: Answers } = {},
  ) => {
    if (UNIQUE_EVENTS.has(eventType) && hasFiredOnce(eventType)) return;
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    const sessionId =
      typeof window !== "undefined" ? getOrCreateSessionId() : undefined;
    const pagePath =
      typeof window !== "undefined" ? window.location.pathname : undefined;
    if (UNIQUE_EVENTS.has(eventType)) markFiredOnce(eventType);
    // Fire and forget — never block UI on analytics.
    void track({
      data: {
        eventType,
        email: extra.email,
        step: extra.step,
        answers: extra.answers,
        sessionId,
        pagePath,
        userAgent: ua,
      },
    }).catch(() => undefined);
  };

  // On mount: hydrate from localStorage, then VERIFY against the server so
  // a cleared cookie / new device cannot fake an unlock. Also fire the
  // "quiz_started" funnel event exactly once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (startedRef.current) return;
    startedRef.current = true;

    fireTrack("quiz_started", { step: 0 });

    const storedEmail = getStoredQuizEmail();
    const storedAnswers = getStoredQuizAnswers();
    if (storedEmail) setEmail(storedEmail);

    if (!storedEmail) return;

    void lookupUnlock({ data: { email: storedEmail } })
      .then((res) => {
        if (!res.unlocked) {
          // localStorage flag was stale — clear it.
          clearStoredQuizUnlock();
          return;
        }
        setAlreadyUnlocked(true);
        // Prefer the server's saved answers; fall back to local copy.
        const merged = (res.answers && Object.keys(res.answers).length
          ? res.answers
          : storedAnswers) as Answers | null;
        if (merged) {
          setAnswers(merged);
          // Re-persist with the canonical email so any older record that
          // used a non-normalised value is replaced in place.
          setStoredQuizUnlock(storedEmail, merged);
        }
        fireTrack("quiz_unlock_resumed", { email: storedEmail });
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questions = buildQuestions(answers);
  const total = questions.length;
  const isLast = step === total - 1;
  const question = questions[step];
  const progressPct =
    phase === "lookbook"
      ? 100
      : ((step + (selectedIdx !== null ? 1 : 0)) / (total + 1)) * 100;

  const lookbook = useMemo(() => curateLookbook(answers), [answers]);
  const shopSearch = useMemo(() => buildShopSearch(answers), [answers]);

  // Fire gate/lookbook view events exactly once per phase entry.
  useEffect(() => {
    if (phase === "gate" && !gateViewedRef.current) {
      gateViewedRef.current = true;
      fireTrack("quiz_gate_viewed", { step: total, answers });
    }
    if (phase === "lookbook" && !lookbookViewedRef.current) {
      lookbookViewedRef.current = true;
      const ua =
        typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const sessionId =
        typeof window !== "undefined" ? getOrCreateSessionId() : undefined;
      const pagePath =
        typeof window !== "undefined" ? window.location.pathname : undefined;
      const storedEmail = getStoredQuizEmail();
      // Record server-side with unlock verification so the event is tied
      // to the subscriber record, not just a client-side fire-and-forget.
      void recordView({
        data: {
          email: storedEmail ?? "",
          answers,
          sessionId,
          pagePath,
          userAgent: ua,
        },
      }).catch(() => undefined);
    }
    if (phase === "quiz") {
      gateViewedRef.current = false;
      lookbookViewedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function pick(idx: number) {
    setSelectedIdx(idx);
  }

  function next() {
    if (selectedIdx === null) return;
    const merged = question.options[selectedIdx].apply(answers);
    setAnswers(merged);
    setSelectedIdx(null);
    fireTrack("quiz_step", { step: step + 1, answers: merged });
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setPhase(alreadyUnlocked ? "lookbook" : "gate");
  }

  function back() {
    if (phase === "lookbook") {
      setPhase(alreadyUnlocked ? "quiz" : "gate");
      return;
    }
    if (phase === "gate") {
      setPhase("quiz");
      return;
    }
    if (step === 0) return;
    setStep((s) => s - 1);
    setSelectedIdx(null);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr(null);
    const clean = normalizeEmail(email);
    if (!clean) {
      setEmailErr("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const ua =
        typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const res = await unlock({
        data: {
          email: clean,
          answers,
          source: "style-quiz",
          userAgent: ua,
        },
      });
      if (!res.ok) {
        setEmailErr(res.error ?? "Could not unlock. Please try again.");
        return;
      }
      // Persist canonical email + answers; resume flows on this device
      // (and the homepage preview) will read the exact same value the
      // server keyed the unlock by.
      setStoredQuizUnlock(clean, answers);
      setEmail(clean);
      setAlreadyUnlocked(true);
      fireTrack("quiz_gate_submitted", { step: total, email: clean, answers });
      setPhase("lookbook");
    } catch (err) {
      setEmailErr(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink transition-colors"
          >
            ← Palace of Roman
          </Link>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {phase === "lookbook"
              ? "Your edit"
              : phase === "gate"
                ? "Almost there"
                : `${String(step + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-px bg-ink/10 mb-12 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-bronze transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {phase === "quiz" && (
          <>
            <div className="text-center mb-12 lg:mb-16">
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
                {question.eyebrow}
              </p>
              <h1 className="font-serif text-3xl lg:text-5xl text-ink leading-tight">
                {question.prompt}
              </h1>
            </div>

            <div
              className={`grid gap-4 lg:gap-6 ${
                question.options.length === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : "grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {question.options.map((opt, idx) => {
                const selected = selectedIdx === idx;
                return (
                  <button
                    key={opt.label}
                    onClick={() => pick(idx)}
                    className={`group relative aspect-[3/4] overflow-hidden bg-ink/5 transition-all duration-300 ${
                      selected
                        ? "ring-2 ring-bronze ring-offset-4 ring-offset-background"
                        : "hover:ring-1 hover:ring-ink/20 hover:ring-offset-2 hover:ring-offset-background"
                    }`}
                    aria-pressed={selected}
                  >
                    <img
                      src={opt.image}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                        selected ? "scale-105" : "group-hover:scale-105"
                      }`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    {selected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bronze flex items-center justify-center">
                        <Check
                          className="w-4 h-4 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5 text-left">
                      <p className="font-serif text-lg lg:text-xl text-white leading-tight">
                        {opt.label}
                      </p>
                      {opt.caption && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/75">
                          {opt.caption}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-12 lg:mt-16">
              <button
                onClick={back}
                disabled={step === 0}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                onClick={next}
                disabled={selectedIdx === null}
                className="flex items-center gap-2 px-7 py-3.5 bg-ink text-background text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                {isLast
                  ? alreadyUnlocked
                    ? "Reveal My Edit"
                    : "Unlock My Edit"
                  : "Continue"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/shop"
                className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink underline-offset-4 hover:underline transition-colors"
              >
                Skip the quiz — browse everything
              </Link>
            </div>
          </>
        )}

        {phase === "gate" && (
          <div className="max-w-xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
              <Lock className="w-3 h-3" /> One last step
            </div>
            <h1 className="font-serif text-3xl lg:text-5xl text-ink leading-tight">
              Your edit is ready.
            </h1>
            <p className="mt-4 text-sm lg:text-base text-muted-foreground">
              Drop your email to unlock the curated lookbook — and we'll keep
              you on the Atelier List for new arrivals matched to your eye.
            </p>

            <form onSubmit={submitEmail} className="mt-10 space-y-4 text-left">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="mt-2 w-full bg-transparent border-b border-ink/20 focus:border-bronze outline-none py-3 text-base placeholder:text-muted-foreground/60"
                />
              </label>
              {emailErr && <p className="text-xs text-red-700">{emailErr}</p>}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit answers
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-7 py-3.5 bg-ink text-background text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors disabled:opacity-50"
                >
                  {submitting ? "Unlocking…" : "Reveal My Edit"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground pt-2">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>
        )}

        {phase === "lookbook" && (
          <div>
            <div className="text-center mb-10 lg:mb-14">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
                <Sparkles className="w-3 h-3" /> Curated for you
              </div>
              <h1 className="font-serif text-3xl lg:text-5xl text-ink leading-tight">
                {lookbook.title}
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-sm lg:text-base text-muted-foreground">
                {lookbook.intro}
              </p>
            </div>

            <div className="relative aspect-[16/9] overflow-hidden bg-ink/5 mb-10 lg:mb-14">
              <img
                src={lookbook.hero}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
                  Palace of Roman · {answers.gender ?? "Edit"}
                </p>
                <p className="mt-1 font-serif text-xl lg:text-3xl text-white max-w-xl">
                  {lookbook.title}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {lookbook.cards.map((c) => (
                <Link
                  key={c.label}
                  to="/shop"
                  search={shopSearch as never}
                  onClick={() =>
                    fireTrack("quiz_shop_clicked", {
                      answers,
                      email: getStoredQuizEmail() ?? undefined,
                    })
                  }
                  className="group block"
                >

                  <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
                    <img
                      src={c.src}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-3 font-serif text-base lg:text-lg text-ink">
                    {c.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.caption}</p>
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 lg:mt-16">
              <button
                onClick={() => {
                  fireTrack("quiz_shop_clicked", {
                    answers,
                    email:
                      (typeof window !== "undefined" &&
                        window.localStorage.getItem(EMAIL_KEY)) ||
                      undefined,
                  });
                  navigate({ to: "/shop", search: shopSearch as never });
                }}
                className="flex items-center gap-2 px-8 py-4 bg-ink text-background text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors"
              >
                Shop My Edit <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setPhase("quiz");
                  setStep(0);
                  setAnswers({});
                  setSelectedIdx(null);
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
              >
                Retake the quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
