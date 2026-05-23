## What's going wrong

Your screenshot is on **palaceofromanofficial.com** (custom domain) and every admin tool toasts `Unauthorized: No authorization header provided`. That message comes from the server middleware `requireSupabaseAuth` — it fired because the browser sent the serverFn RPC with **no `Authorization` header**.

The middleware that attaches the token (`attachSupabaseAuth` in `src/integrations/supabase/auth-attacher.ts`) is correctly registered in `src/start.ts`. So why is the header missing?

Two real causes, both plausible from your screenshot:

1. **Race on hydration.** `adminBeforeLoad` skips during SSR and runs only after client hydration. The admin panels (Active Audit, Studio, Urgency, UGC Ideas, Cart Analytics) immediately fire serverFn queries on mount. If those queries race the Supabase session restore from `localStorage`, `getSession()` returns `null`, the fallback `getUser()` also returns `null` momentarily, and the attacher sends no header → server rejects → toast.
2. **Per-origin session storage.** Supabase keeps the session in `localStorage`, which is scoped per origin. If you originally signed in on `palaceofroman.lovable.app` or `palaceofromanofficial.com`, the session does **not** carry to `palaceofromanofficial.com` or vice-versa. The guard's `getUser()` succeeded (so something is there), but the token may be expired and refresh is failing silently.

This is also why "all jobs stuck loading / no progress" earlier — the kick-off RPCs were silently 401'd and the UI just sits waiting.

## Fix

### 1. Harden `src/integrations/supabase/auth-attacher.ts`
Add a short bounded wait so we don't lose the race on first paint:
- Try `getSession()`.
- If no token → `await getUser()` then re-`getSession()` (already there).
- If still no token → wait up to ~1.2s for `onAuthStateChange` to fire with a session (poll every 150ms), then read once more.
- If still nothing → send no header (today's behavior), so the server returns the same 401 only when the user really is signed out.

### 2. Make admin query failures legible instead of silent
In the admin panels that fire queries on mount (Active Audit, Studio, Urgency, UGC Ideas, Cart Analytics, Growth OS dashboard), do two small things:
- Set `retry: 1` and `staleTime: 0` on the `useQuery` calls so a transient hydration miss self-heals on the second attempt.
- When the error message starts with `Unauthorized`, show an inline "Your admin session expired — sign in again" CTA that links to `/login?next=/admin/...`, instead of the generic toast that the user can't act on.

### 3. Tighten `adminBeforeLoad` so children don't render before the check passes
Today the guard early-returns during SSR and the page hydrates immediately. Switch it so the admin route components don't render until the client-side admin check has resolved (resolved promise on success, redirect on failure). This eliminates the race entirely — the queries won't fire until we know the session is real.

### 4. Custom domain sanity
After the above ships, if you're still seeing the toast on `palaceofromanofficial.com`, the cause is #2 from the diagnosis: your session lives on a different origin. The fix on your end is to sign out and sign back in on `palaceofromanofficial.com` directly so the session lands in the right `localStorage`. No code change needed for that.

## Files I'll touch

- `src/integrations/supabase/auth-attacher.ts` — bounded wait for session.
- `src/lib/admin-route-guard.ts` — block render until client check resolves.
- Admin panel components that fetch on mount (Active Audit, Urgency, Studio/UGC, Cart Analytics, Growth OS index) — add `retry: 1` and a friendly auth-expired CTA.

## Out of scope

- The phantom "Dresses 47" chip on `/collections/mens-clothing` is still visible in your second screenshot. The regex fix from last turn is correct; the count is cached server-side for 5 min. If it's still there after ~10 min, I'll bust the cache key directly. Tell me if you want me to roll that into this same patch.
