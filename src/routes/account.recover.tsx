import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { customerRecover } from "@/lib/shopify-customer";

export const Route = createFileRoute("/account/recover")({
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await customerRecover(email);
    setBusy(false);
    if (result.data) setSent(true);
    else setError(result.errors[0]?.message ?? "Could not send reset link.");
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl">Check your inbox.</h1>
        <p className="text-sm text-ink/70">
          We've sent password reset instructions to {email}.
        </p>
        <Link to="/account/login" className="text-[11px] uppercase tracking-[0.3em] underline hover:text-bronze">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze">Password Reset</p>
        <h1 className="font-serif text-3xl">Forgotten password?</h1>
        <p className="text-sm text-ink/60">We'll email you a reset link.</p>
      </header>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-ink/60">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full border border-ink/20 px-3 py-2 text-sm bg-canvas focus:border-bronze outline-none"
          />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-ink text-canvas py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
      <Link to="/account/login" className="text-[11px] uppercase tracking-[0.3em] underline hover:text-bronze">
        Back to sign in
      </Link>
    </div>
  );
}
