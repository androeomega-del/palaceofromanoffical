/**
 * ConciergeDrawer — left-hand obsidian drawer with a live AI chat
 * interface wired to the `conciergeChat` serverFn. Conversation history is
 * held in component state and re-sent on each turn (no DB persistence —
 * one session per drawer open).
 *
 * Visual language: deep obsidian, off-white, soft sand. Premium type scale.
 */
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, X, ArrowUp } from "lucide-react";
import { conciergeChat } from "@/lib/ai-concierge.functions";
import { palette, fontSans, fontSerif } from "./palette";

interface ConciergeDrawerProps {
  open: boolean;
  onClose: () => void;
}

type ChatTurn = { role: "user" | "assistant"; text: string };

const GREETING: ChatTurn = {
  role: "assistant",
  text:
    "Good day. I'm your Palace of Roman concierge — here to advise on collections, fit, and styling. What may I help you find?",
};

export function ConciergeDrawer({ open, onClose }: ConciergeDrawerProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const chat = useMutation({
    mutationFn: async (history: ChatTurn[]) => conciergeChat({ data: { messages: history } }),
    onSuccess: (res) => {
      const text = res.ok ? res.reply : res.error;
      setMessages((prev) => [...prev, { role: "assistant", text }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "The concierge is briefly unavailable. Try again in a moment." },
      ]);
    },
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 200);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || chat.isPending) return;
    const next: ChatTurn[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    chat.mutate(next);
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
          style={{ borderBottom: "1px solid rgba(244,241,236,0.08)", fontFamily: fontSans }}
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
                  color: msg.role === "user" ? palette.offwhite : palette.offwhite,
                }}
              >
                {msg.text}
              </p>
            </div>
          ))}
          {chat.isPending && (
            <div
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em]"
              style={{ color: palette.sand, fontFamily: fontSans }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.25} />
              Composing…
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
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
                  handleSend(e as unknown as React.FormEvent);
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
