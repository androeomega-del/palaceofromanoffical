/**
 * ConciergeDrawer — left-hand obsidian drawer with a live AI chat
 * interface wired to the `conciergeChat` serverFn. Each assistant turn may
 * include inline product cards resolved from verified Shopify handles
 * (server-side filtered to in-stock only — never fabricated).
 *
 * Empty state shows three curated suggested prompts.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { X, ArrowUp, ArrowUpRight, Check } from "lucide-react";
import {
  conciergeChat,
  type ConciergeChatProduct,
} from "@/lib/ai-concierge.functions";
import { formatPrice } from "@/lib/shopify";
import {
  rememberCustomerEmail,
  rememberMarketingOptIn,
  getCustomerEmail,
} from "@/lib/abandoned-cart-capture";
import { palette, fontSans, fontSerif } from "./palette";

interface ConciergeDrawerProps {
  open: boolean;
  onClose: () => void;
}

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
  products?: ConciergeChatProduct[];
};

type Dept = "women" | "men";
type Step = "dept" | "email" | "preferences" | "chat";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VIBE_OPTIONS = [
  "Quiet luxury",
  "Statement & bold",
  "Tailored & polished",
  "Relaxed weekend",
  "Evening & occasion",
  "Resort & travel",
] as const;

const CATEGORY_OPTIONS = [
  "Outerwear",
  "Tailoring",
  "Knitwear",
  "Dresses",
  "Denim",
  "Footwear",
  "Bags",
  "Accessories",
] as const;

const PRICE_OPTIONS = [
  "Under $500",
  "$500 – $1,500",
  "$1,500 – $5,000",
  "No ceiling",
] as const;

const GREETING_FOR = (dept: Dept, name?: string): ChatTurn => ({
  role: "assistant",
  text:
    `${name ? `${name}, welcome` : "Welcome"} — I'll be curating ${
      dept === "women" ? "womenswear" : "menswear"
    } selections tailored to your taste. Tell me about an upcoming occasion, a piece you're chasing, or a brand you love — and I'll respond with pieces from the boutique.`,
});


const INTAKE_DONE_KEY = "por-concierge-intake-v1";

type IntakePayload = {
  dept: Dept;
  email: string;
  vibes: string[];
  categories: string[];
  priceBand: string;
};

export function ConciergeDrawer({ open, onClose }: ConciergeDrawerProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Intake wizard state — drives the gated flow before the chat.
  const [step, setStep] = useState<Step>("dept");
  const [dept, setDept] = useState<Dept | null>(null);
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [vibes, setVibes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState<string>("");

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const chat = useMutation({
    mutationFn: async (history: ChatTurn[]) =>
      conciergeChat({
        data: { messages: history.map((m) => ({ role: m.role, text: m.text })) },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: res.reply, products: res.products },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: res.error }]);
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "The concierge is briefly unavailable. Try again in a moment.",
        },
      ]);
    },
  });

  // On open: restore prior intake if completed this session, else start wizard.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(INTAKE_DONE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as IntakePayload;
        if (saved.dept && saved.email) {
          setDept(saved.dept);
          setEmail(saved.email);
          setStep("chat");
          if (messages.length === 0) {
            const name = saved.email.split("@")[0]?.split(/[._-]/)[0];
            const niceName = name
              ? name.charAt(0).toUpperCase() + name.slice(1)
              : undefined;
            setMessages([GREETING_FOR(saved.dept, niceName)]);
          }
          return;
        }
      }
      const savedEmail = getCustomerEmail();
      if (savedEmail) setEmail(savedEmail);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    const t = setTimeout(() => {
      if (step === "chat") inputRef.current?.focus();
    }, 200);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      clearTimeout(t);
    };
  }, [open, step]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    const next: ChatTurn[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    chat.mutate(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendText(input);
  };

  const submitIntakeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError(null);
    setEmail(trimmed);
    rememberCustomerEmail(trimmed);
    rememberMarketingOptIn(optIn);
    setStep("preferences");
  };

  const finishIntake = () => {
    if (!dept) return;
    try {
      sessionStorage.setItem(
        INTAKE_DONE_KEY,
        JSON.stringify({ dept, email, vibes, categories, priceBand } satisfies IntakePayload),
      );
    } catch {
      /* ignore */
    }
    const name = email.split("@")[0]?.split(/[._-]/)[0];
    const niceName = name ? name.charAt(0).toUpperCase() + name.slice(1) : undefined;
    const greeting = GREETING_FOR(dept, niceName);

    // Synthesize an opening user message that gives the model the full
    // intake context, so the first assistant reply already returns curated
    // picks aligned with the shopper's taste.
    const summaryBits: string[] = [];
    summaryBits.push(`I'm shopping ${dept === "women" ? "womenswear" : "menswear"}.`);
    if (vibes.length) summaryBits.push(`Aesthetic: ${vibes.join(", ")}.`);
    if (categories.length) summaryBits.push(`Most interested in: ${categories.join(", ")}.`);
    if (priceBand) summaryBits.push(`Budget: ${priceBand}.`);
    summaryBits.push(
      "Please suggest a curated starter selection of 3–4 pieces from the boutique that match.",
    );
    const kickoff = summaryBits.join(" ");

    setMessages([greeting, { role: "user", text: kickoff }]);
    setStep("chat");
    chat.mutate([greeting, { role: "user", text: kickoff }]);
  };

  if (!open) return null;


  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Personal styling concierge">
      <div
        className="absolute inset-0 animate-[studioFade_.4s_ease-out_both]"
        style={{ background: "rgba(11,11,12,0.72)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute left-0 top-0 bottom-0 w-full sm:w-[480px] flex flex-col"
        style={{
          background: "#0B0B0C",
          color: palette.offwhite,
          borderRight: "1px solid rgba(244,241,236,0.08)",
          animation: "studioDrawerIn .55s cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-7 py-6"
          style={{
            borderBottom: "1px solid rgba(244,241,236,0.08)",
            fontFamily: fontSans,
          }}
        >
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.45em]"
              style={{ color: palette.sand }}
            >
              Live
            </p>
            <h2
              className="text-2xl mt-1.5"
              style={{ fontFamily: fontSerif, fontWeight: 300, letterSpacing: "-0.01em" }}
            >
              Concierge
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close concierge"
            className="p-1.5 transition-opacity hover:opacity-60"
          >
            <X className="w-5 h-5" strokeWidth={1.25} />
          </button>
        </header>

        {/* Quick navigation */}
        <nav
          aria-label="Concierge quick navigation"
          className="flex items-center gap-6 px-7 py-3"
          style={{
            borderBottom: "1px solid rgba(244,241,236,0.08)",
            fontFamily: fontSans,
          }}
        >
          {[
            { to: "/", label: "Home" },
            { to: "/women", label: "Women" },
            { to: "/men", label: "Men" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="text-[10px] uppercase tracking-[0.4em] pb-0.5 border-b transition-opacity hover:opacity-70"
              style={{
                color: palette.offwhite,
                borderColor: "rgba(217,207,193,0.3)",
                fontWeight: 300,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-7 py-7 space-y-7">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <p
                className="text-[9px] uppercase tracking-[0.4em] mb-2"
                style={{
                  color: msg.role === "user" ? "rgba(244,241,236,0.45)" : palette.sand,
                  fontFamily: fontSans,
                }}
              >
                {msg.role === "user" ? "Client" : "Concierge"}
              </p>
              <p
                className="text-[15px] leading-relaxed whitespace-pre-wrap"
                style={{
                  fontFamily: msg.role === "user" ? fontSans : fontSerif,
                  fontWeight: msg.role === "user" ? 300 : 400,
                  color: palette.offwhite,
                }}
              >
                {msg.text}
              </p>

              {/* Inline product cards (verified handles only, server-resolved) */}
              {msg.products && msg.products.length > 0 && (
                <ul className="mt-5 space-y-3">
                  {msg.products.map((p) => (
                    <li key={p.handle}>
                      <Link
                        to="/product/$handle"
                        params={{ handle: p.handle }}
                        onClick={onClose}
                        className="group grid grid-cols-[88px_1fr] gap-4 transition-opacity hover:opacity-90"
                      >
                        <div
                          className="aspect-[4/5] overflow-hidden"
                          style={{ background: "rgba(244,241,236,0.04)" }}
                        >
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl}
                              alt={p.imageAlt ?? p.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                            />
                          )}
                        </div>
                        <div style={{ fontFamily: fontSans }}>
                          <p
                            className="text-[9px] uppercase tracking-[0.3em]"
                            style={{ color: palette.sand }}
                          >
                            {p.vendor}
                          </p>
                          <p
                            className="text-[13px] leading-snug mt-1.5 line-clamp-2"
                            style={{ fontWeight: 300, color: palette.offwhite }}
                          >
                            {p.title}
                          </p>
                          <p
                            className="text-[11px] mt-1.5"
                            style={{ color: "rgba(244,241,236,0.7)" }}
                          >
                            {formatPrice(p.price)}
                          </p>
                          <span
                            className="mt-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.32em] pb-0.5 border-b"
                            style={{
                              color: palette.sand,
                              borderColor: "rgba(217,207,193,0.4)",
                            }}
                          >
                            View piece
                            <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={1.5} />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Suggested prompts (only on the initial greeting) */}
          {showSuggestions && (
            <div className="pt-2">
              <p
                className="text-[9px] uppercase tracking-[0.4em] mb-3"
                style={{ color: "rgba(244,241,236,0.45)", fontFamily: fontSans }}
              >
                Suggested inquiries
              </p>
              <div className="space-y-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={prompt}
                    onClick={() => sendText(prompt)}
                    className="w-full text-left text-[13px] py-3 px-4 transition-all duration-300 animate-[studioFade_.5s_ease-out_both]"
                    style={{
                      background: "#121214",
                      border: "1px solid rgba(244,241,236,0.1)",
                      color: palette.offwhite,
                      fontFamily: fontSans,
                      fontWeight: 300,
                      animationDelay: `${120 + i * 90}ms`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = palette.sand;
                      e.currentTarget.style.background = "#16161A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(244,241,236,0.1)";
                      e.currentTarget.style.background = "#121214";
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.isPending && (
            <div
              className="flex items-center gap-3 animate-[studioFade_.3s_ease-out_both]"
              aria-live="polite"
              aria-label="Concierge is composing a reply"
            >
              <p
                className="text-[9px] uppercase tracking-[0.4em]"
                style={{ color: palette.sand, fontFamily: fontSans }}
              >
                Concierge
              </p>
              <span className="flex items-end gap-1.5 h-3" aria-hidden="true">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-[conciergeDot_1.2s_ease-in-out_infinite]"
                  style={{ background: palette.sand, animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full animate-[conciergeDot_1.2s_ease-in-out_infinite]"
                  style={{ background: palette.sand, animationDelay: "180ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full animate-[conciergeDot_1.2s_ease-in-out_infinite]"
                  style={{ background: palette.sand, animationDelay: "360ms" }}
                />
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="px-7 py-5"
          style={{ borderTop: "1px solid rgba(244,241,236,0.08)" }}
        >
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendText(input);
                }
              }}
              rows={2}
              placeholder="Inquire about collections, fits, or styling…"
              disabled={chat.isPending}
              className="w-full resize-none text-sm py-3.5 pl-4 pr-12 outline-none transition-colors duration-300 disabled:opacity-60"
              style={{
                background: "#121214",
                border: "1px solid rgba(244,241,236,0.1)",
                color: palette.offwhite,
                fontFamily: fontSans,
                fontWeight: 300,
                letterSpacing: "0.005em",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = palette.sand)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(244,241,236,0.1)")}
            />
            <button
              type="submit"
              disabled={!input.trim() || chat.isPending}
              aria-label="Send message"
              className="absolute right-2.5 bottom-2.5 p-2 transition-all duration-300 disabled:opacity-30 hover:opacity-80"
              style={{ color: palette.obsidian, background: palette.sand }}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          <p
            className="mt-3 text-[9px] uppercase tracking-[0.35em]"
            style={{ color: "rgba(244,241,236,0.4)", fontFamily: fontSans }}
          >
            Curated live · Palace of Roman
          </p>
        </form>
      </aside>
    </div>
  );
}
