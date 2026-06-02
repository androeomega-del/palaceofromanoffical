import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { confirmNewsletter } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/newsletter/confirm")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirm your subscription — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfirmPage,
});

type State =
  | { kind: "loading" }
  | { kind: "ok"; alreadyConfirmed: boolean }
  | { kind: "invalid" }
  | { kind: "error" };

function ConfirmPage() {
  const { token } = Route.useSearch();
  const confirm = useServerFn(confirmNewsletter);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await confirm({ data: { token } });
        if (cancelled) return;
        if (res.ok) {
          setState({ kind: "ok", alreadyConfirmed: res.alreadyConfirmed });
        } else if (res.reason === "invalid") {
          setState({ kind: "invalid" });
        } else {
          setState({ kind: "error" });
        }
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, confirm]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-6">
          Palace of Roman
        </p>

        {state.kind === "loading" && (
          <>
            <h1 className="font-serif text-3xl sm:text-4xl leading-[1.15] mb-4">
              Confirming your subscription…
            </h1>
            <p className="text-sm text-ink/70">One moment, please.</p>
          </>
        )}

        {state.kind === "ok" && (
          <>
            <h1 className="font-serif text-3xl sm:text-4xl leading-[1.15] mb-4">
              {state.alreadyConfirmed
                ? "You're already on the list."
                : "Your subscription is confirmed."}
            </h1>
            <p className="text-sm text-ink/70 leading-relaxed mb-8">
              {state.alreadyConfirmed
                ? "Thank you — no further action is needed."
                : "Welcome to the Palace of Roman dispatch. Exclusive promotions and member-only offers will arrive in your inbox first."}
            </p>
            <a
              href="/"
              className="inline-block text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
            >
              Continue browsing
            </a>
          </>
        )}

        {state.kind === "invalid" && (
          <>
            <h1 className="font-serif text-3xl sm:text-4xl leading-[1.15] mb-4">
              This confirmation link is no longer valid.
            </h1>
            <p className="text-sm text-ink/70 leading-relaxed mb-8">
              The link may have expired or already been used. Please subscribe
              again from the homepage to receive a fresh confirmation email.
            </p>
            <a
              href="/"
              className="inline-block text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
            >
              Return home
            </a>
          </>
        )}

        {state.kind === "error" && (
          <>
            <h1 className="font-serif text-3xl sm:text-4xl leading-[1.15] mb-4">
              Something went wrong.
            </h1>
            <p className="text-sm text-ink/70 leading-relaxed mb-8">
              Please try the link again in a moment. If it still doesn't work,
              contact us and we'll confirm your subscription manually.
            </p>
            <a
              href="/contact"
              className="inline-block text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
            >
              Contact us
            </a>
          </>
        )}
      </div>
    </main>
  );
}
