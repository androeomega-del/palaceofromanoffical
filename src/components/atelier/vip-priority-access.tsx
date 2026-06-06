import { useEffect, useRef, useState } from "react";
import { Crown, Check } from "lucide-react";
import {
  rememberCustomerEmail,
  scheduleAbandonedCartSync,
  getCustomerEmail,
} from "@/lib/abandoned-cart-capture";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * VIP Priority Access — luxury email capture rendered at the top of the cart
 * drawer (above the line items, below the SheetHeader).
 *
 * Compliance notes:
 *  - Backend telemetry uses the existing `rememberCustomerEmail` +
 *    `scheduleAbandonedCartSync` helpers; no checkout URL, cart mutations,
 *    pricing functions, or Zustand cart-store shape are touched.
 *  - Persistent retention is backed by `getCustomerEmail()` (localStorage),
 *    which is the same source the rest of the cart drawer reads from, so the
 *    field re-populates automatically across drawer open/close cycles.
 *  - The outer wrapper enforces `contain: layout` + a fixed `min-height` to
 *    eliminate hydration layout shift (CLS = 0).
 */
export function VipPriorityAccess() {
  const [email, setEmail] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<string | null>(null);

  // Pre-populate from local persistence on mount (client-only)
  useEffect(() => {
    const existing = getCustomerEmail();
    if (existing) {
      setEmail(existing);
      setSaved(true);
      lastSyncedRef.current = existing.toLowerCase();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInput = (value: string) => {
    setEmail(value);
    if (saved && value.trim().toLowerCase() !== lastSyncedRef.current) {
      setSaved(false);
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!EMAIL_RE.test(trimmed)) return;

    // Debounce so we don't fire on every keystroke once the structure becomes valid
    debounceRef.current = window.setTimeout(() => {
      const normalized = trimmed.toLowerCase();
      if (lastSyncedRef.current === normalized) {
        setSaved(true);
        return;
      }
      try {
        rememberCustomerEmail(trimmed);
        scheduleAbandonedCartSync();
        lastSyncedRef.current = normalized;
        setSaved(true);
      } catch {
        // Silent — telemetry is best-effort and must not block the drawer
      }
    }, 450);
  };

  return (
    <section
      aria-label="VIP Priority Access"
      className="px-6 pt-5 pb-4 border-b border-ink/10 bg-canvas"
      style={{ contain: "layout", minHeight: "168px" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Crown className="w-3 h-3 text-bronze" strokeWidth={1.5} aria-hidden />
        <p className="text-[10px] uppercase tracking-[0.3em] text-ink/75 font-medium">
          Priority Access Discovery
        </p>
      </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="relative"
      >
        <label htmlFor="vip-priority-access-email" className="sr-only">
          Email address for VIP Priority Access
        </label>
        <input
          id="vip-priority-access-email"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="your@email.com"
          value={email}
          onChange={(e) => handleInput(e.target.value)}
          onInput={(e) => handleInput(e.currentTarget.value)}
          className="w-full bg-transparent border-b border-ink/25 py-2 pr-16 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-bronze transition-colors"
          aria-describedby="vip-priority-access-status"
        />
        <span
          id="vip-priority-access-status"
          aria-live="polite"
          className={`absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.22em] transition-opacity duration-300 ${
            saved ? "text-bronze opacity-100" : "opacity-0"
          }`}
        >
          <Check className="w-3 h-3" strokeWidth={2} />
          Reserved
        </span>
      </form>
      <p className="text-[11px] leading-relaxed text-ink/70 mt-2">
        Your curation data is handled with absolute discretion. Palace of Roman
        secures your priority access parameters without third-party data
        tracking.
      </p>
    </section>
  );
}
