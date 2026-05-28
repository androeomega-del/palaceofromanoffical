import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapAdminIfFirst } from "@/lib/bootstrap-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/admin/",
  }),
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let accessToken: string | undefined;
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin/" },
        });
        if (signUpError) throw signUpError;
        accessToken = data.session?.access_token;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        accessToken = data.session?.access_token;
      }
      if (!accessToken) {
        // Email-confirmation required (signup) — show a clear message
        // instead of pretending we redirected.
        throw new Error(
          "Check your email to confirm your account before signing in.",
        );
      }
      // Best-effort founder bootstrap (no-op if an admin already exists).
      // Don't fail the redirect on its error — the guard handles non-admins.
      try {
        await bootstrapAdminIfFirst({
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (err) {
        console.warn("[login] bootstrapAdminIfFirst failed", err);
      }
      // Hard navigation guarantees router context, query cache, and
      // auth-attacher all see the freshly-persisted session — eliminates
      // the "signed in but not redirected" race that ate prior fixes.
      window.location.assign(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-serif tracking-tight">Palace of Roman</h1>
          <p className="text-sm text-muted-foreground">Private administration</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
          }}
        >
          {mode === "signin"
            ? "First time? Create the founder account."
            : "Already have an account? Sign in."}
        </button>
      </Card>
    </div>
  );
}
