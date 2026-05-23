import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  customerCreate,
  customerAccessTokenCreate,
} from "@/lib/shopify-customer";
import { useCustomerStore } from "@/stores/customer-store";

export const Route = createFileRoute("/account/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const setToken = useCustomerStore((s) => s.setToken);
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const create = await customerCreate({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      acceptsMarketing,
    });
    if (!create.data) {
      setError(create.errors[0]?.message ?? "Could not create account.");
      setBusy(false);
      return;
    }
    const token = await customerAccessTokenCreate({ email, password });
    setBusy(false);
    if (token.data) {
      setToken(token.data);
      navigate({ to: "/account" });
    } else {
      setError(token.errors[0]?.message ?? "Account created — please sign in.");
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze">Create Account</p>
        <h1 className="font-serif text-3xl">Join Palace of Roman.</h1>
      </header>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
          <Field label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
        </div>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" required />
        <label className="flex items-center gap-2 text-xs text-ink/70">
          <input
            type="checkbox"
            checked={acceptsMarketing}
            onChange={(e) => setAcceptsMarketing(e.target.checked)}
          />
          Subscribe to our weekly edit
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-ink text-canvas py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create Account"}
        </button>
      </form>
      <p className="text-[11px] uppercase tracking-[0.3em]">
        Already a member?{" "}
        <Link to="/account/login" className="underline hover:text-bronze">Sign in</Link>
      </p>
    </div>
  );
}

function Field(props: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-[0.3em] text-ink/60">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        className="w-full border border-ink/20 px-3 py-2 text-sm bg-canvas focus:border-bronze outline-none"
      />
    </label>
  );
}
