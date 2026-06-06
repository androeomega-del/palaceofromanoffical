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
import { X, ArrowUp, ArrowUpRight } from "lucide-react";
import {
  conciergeChat,
  type ConciergeChatProduct,
} from "@/lib/ai-concierge.functions";
import { formatPrice } from "@/lib/shopify";
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

const GREETING: ChatTurn = {
  role: "assistant",
  text:
    "Good day. I'm your Palace of Roman concierge — here to advise on collections, fit, and styling. What may I help you find?",
};

const SUGGESTED_PROMPTS = [
  "Curate an understated evening uniform.",
  "What's arriving this week worth considering?",
  "Help me build a quiet capsule for travel.",
];

export function ConciergeDrawer({ open, onClose }: ConciergeDrawerProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    // Compensate for the disappearing scrollbar so the page behind the
    // drawer doesn't reflow on open — zero layout shift.
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      clearTimeout(t);
    };
  }, [open]);

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

  if (!open) return null;

  const showSuggestions = messages.length === 1 && !chat.isPending;

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
