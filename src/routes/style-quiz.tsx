import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

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
  imageIndex: number;
  apply: (a: Answers) => Answers;
};

type Question = {
  key: string;
  eyebrow: string;
  prompt: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    key: "gender",
    eyebrow: "01 — The wardrobe",
    prompt: "Who are we curating for?",
    options: [
      { label: "Women", imageIndex: 7, apply: (a) => ({ ...a, gender: "Women" }) },
      { label: "Men", imageIndex: 13, apply: (a) => ({ ...a, gender: "Men" }) },
      { label: "Unisex", imageIndex: 41, apply: (a) => ({ ...a, gender: "Unisex" }) },
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
        imageIndex: 12,
        apply: (a) => ({ ...a, q: "tailoring cashmere wool minimal" }),
      },
      {
        label: "Evening & Occasion",
        caption: "Drama after dark",
        imageIndex: 34,
        apply: (a) => ({ ...a, collection: "dresses", q: "evening silk satin" }),
      },
      {
        label: "Off-Duty Icon",
        caption: "Denim, sneakers, ease",
        imageIndex: 58,
        apply: (a) => ({ ...a, q: "denim sneakers casual" }),
      },
      {
        label: "Statement Pieces",
        caption: "Loud logos, bold colour",
        imageIndex: 71,
        apply: (a) => ({ ...a, q: "logo print colour bold" }),
      },
    ],
  },
  {
    key: "category",
    eyebrow: "03 — The piece",
    prompt: "What are you in the market for?",
    options: [
      { label: "Bags", imageIndex: 19, apply: (a) => ({ ...a, collection: "bags" }) },
      { label: "Shoes", imageIndex: 76, apply: (a) => ({ ...a, collection: "shoes" }) },
      { label: "Ready-to-Wear", imageIndex: 9, apply: (a) => ({ ...a, collection: "dresses" }) },
      { label: "Accessories", imageIndex: 63, apply: (a) => ({ ...a, collection: "sunglasses" }) },
    ],
  },
  {
    key: "budget",
    eyebrow: "04 — The investment",
    prompt: "What's your comfortable range?",
    options: [
      { label: "Under $250", imageIndex: 28, apply: (a) => ({ ...a, max: 250 }) },
      { label: "$250 — $750", imageIndex: 51, apply: (a) => ({ ...a, min: 250, max: 750 }) },
      { label: "$750 — $1,500", imageIndex: 77, apply: (a) => ({ ...a, min: 750, max: 1500 }) },
      { label: "No ceiling", imageIndex: 88, apply: (a) => ({ ...a }) },
    ],
  },
];

function StyleQuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);

  const total = QUESTIONS.length;
  const isLast = step === total - 1;
  const question = QUESTIONS[step];
  const progressPct = ((step + (selectedIdx !== null ? 1 : 0)) / total) * 100;

  function pick(idx: number) {
    setSelectedIdx(idx);
  }

  function next() {
    if (selectedIdx === null) return;
    const merged = question.options[selectedIdx].apply(answers);
    setAnswers(merged);
    setSelectedIdx(null);
    if (!isLast) {
      setStep((s) => s + 1);
    } else {
      setFinishing(true);
      const search: Record<string, unknown> = {};
      if (merged.gender) search.gender = merged.gender;
      if (merged.collection) search.collection = merged.collection;
      if (merged.q) search.q = merged.q;
      if (merged.min !== undefined) search.min = merged.min;
      if (merged.max !== undefined) search.max = merged.max;
      navigate({ to: "/shop", search: search as never });
    }
  }

  function back() {
    if (step === 0) return;
    setStep((s) => s - 1);
    setSelectedIdx(null);
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
            {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-px bg-ink/10 mb-12 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-bronze transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Title block */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">
            {question.eyebrow}
          </p>
          <h1 className="font-serif text-3xl lg:text-5xl text-ink leading-tight">
            {question.prompt}
          </h1>
        </div>

        {/* Options grid */}
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
                  src={img(opt.imageIndex)}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                    selected ? "scale-105" : "group-hover:scale-105"
                  }`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {selected && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bronze flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
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

        {/* Controls */}
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
            disabled={selectedIdx === null || finishing}
            className="flex items-center gap-2 px-7 py-3.5 bg-ink text-background text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            {finishing ? "Curating…" : isLast ? "Reveal My Edit" : "Continue"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Skip */}
        <div className="text-center mt-8">
          <Link
            to="/shop"
            className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink underline-offset-4 hover:underline transition-colors"
          >
            Skip the quiz — browse everything
          </Link>
        </div>
      </div>
    </main>
  );
}
