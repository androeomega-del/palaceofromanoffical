import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { customerAccessTokenCreate } from "@/lib/shopify-customer";
import { useCustomerStore } from "@/stores/customer-store";

export const Route = createFileRoute("/account/login")({
  component: LoginPage,
});

function LoginPage() {
  const setToken = useCustomerStore((s) => s.setToken);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await customerAccessTokenCreate({ email, password });
    setBusy(false);
    if (result.data) {
      setToken(result.data);
      navigate({ to: "/account" });
    } else {
      setError(result.errors[0]?.message ?? "Could not sign in.");
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze">Sign In</p>
        <h1 className="font-serif text-3xl">Welcome back.</h1>
      </header>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-ink text-canvas py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.3em]">
        <Link to="/account/recover" className="underline hover:text-bronze">Forgot password?</Link>
        <Link to="/account/register" className="underline hover:text-bronze">Create account</Link>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-[0.3em] text-ink/60">{props.label}</span>
      <input
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        className="w-full border border-ink/20 px-3 py-2 text-sm bg-canvas focus:border-bronze outline-none"
      />
    </label>
  );
}
